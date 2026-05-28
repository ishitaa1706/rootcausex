import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { dependencies } from '../data/mockData'
import { useInvestigationFocus } from '../store/InvestigationFocusStore'

// ─── Status colour maps ────────────────────────────────────────────────────────
const NODE_COLOR = {
  healthy:  '#22c55e',
  degraded: '#f59e0b',
  critical: '#ef4444',
}

const EDGE_STROKE = {
  healthy:  { color: 'rgba(56,189,248,0.35)',  width: 1.5 },
  degraded: { color: 'rgba(245,158,11,0.65)',  width: 2   },
  critical: { color: 'rgba(239,68,68,0.85)',   width: 2.5 },
}

// ─── Custom edge — label sits consistently 14 px BELOW every edge midpoint ───
// All labels on the top rail (auth→payment, payment→order) share the same Y
// offset, giving horizontal alignment. Bottom-rail edges (inv/notif→order) also
// appear below their respective midpoints at a natural diagonal position.
function LabeledEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })
  const onPath      = data?.onPath ?? false
  const edgeLabel   = data?.label  ?? ''
  const labelColor  = onPath ? '#c084fc'               : '#64748b'
  const labelBorder = onPath ? 'rgba(168,85,247,0.45)' : 'rgba(56,189,248,0.22)'

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />

      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position:      'absolute',
              // -50% centres horizontally; +14px drops consistently below the line
              transform:     `translate(-50%, 14px) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                display:      'inline-block',
                background:   'rgba(2,8,23,0.92)',
                border:       `1px solid ${labelBorder}`,
                borderRadius: 4,
                padding:      '2px 8px',
                fontSize:     11,
                fontFamily:   'monospace',
                fontWeight:   600,
                color:        labelColor,
                whiteSpace:   'nowrap',
                lineHeight:   1.5,
              }}
            >
              {edgeLabel}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

// ─── Custom node ──────────────────────────────────────────────────────────────
function ServiceNode({ data }) {
  const c              = NODE_COLOR[data.status] ?? NODE_COLOR.healthy
  const isBad          = data.status === 'degraded' || data.status === 'critical'
  const isInvestigated = data.isInvestigated === true
  const isAnimatingIn  = data.isAnimatingIn  === true   // just appeared in propagation

  const borderColor = isInvestigated
    ? 'rgba(168,85,247,0.75)'
    : `${c}40`

  const baseShadow = `0 0 ${isBad ? 28 : 18}px ${c}${isBad ? '28' : '18'}, inset 0 0 18px rgba(0,0,0,0.25)`
  const investigatedShadow = ', 0 0 0 2px rgba(168,85,247,0.22), 0 0 28px rgba(168,85,247,0.38)'

  return (
    <motion.div
      // Pulse-in when this node first appears in the propagation animation
      animate={isAnimatingIn ? {
        boxShadow: [
          `0 0 0px rgba(168,85,247,0)`,
          `0 0 40px rgba(168,85,247,1), 0 0 60px rgba(168,85,247,0.5)`,
          `0 0 18px rgba(168,85,247,0.45)`,
        ],
      } : {}}
      transition={{ duration: 0.75, ease: 'easeOut' }}
      className={`px-4 py-3 rounded-xl text-center select-none ${isBad ? `node-${data.status}` : ''}`}
      style={{
        minWidth:       130,
        background:     'rgba(8, 16, 36, 0.96)',
        border:         `1px solid ${borderColor}`,
        boxShadow:      `${baseShadow}${isInvestigated ? investigatedShadow : ''}`,
        backdropFilter: 'blur(8px)',
        transition:     'box-shadow 0.4s ease, border-color 0.4s ease',
      }}
    >
      <Handle type="target" position={Position.Left}
        style={{ background: c, border: 'none', width: 7, height: 7, left: -4 }} />
      <Handle type="source" position={Position.Right}
        style={{ background: c, border: 'none', width: 7, height: 7, right: -4 }} />

      {/* Status dot + short name */}
      <div className="flex items-center justify-center gap-2 mb-1.5">
        <span
          className="w-2 h-2 rounded-full pulse-dot"
          style={{ background: c, boxShadow: `0 0 6px ${c}`, display: 'inline-block' }}
        />
        <span className="text-sm font-bold tracking-widest font-mono uppercase" style={{ color: '#e2e8f0' }}>
          {data.shortName}
        </span>
      </div>

      {/* Full name */}
      <div className="text-xs font-mono mb-1.5" style={{ color: '#64748b' }}>
        {data.name}
      </div>

      {/* Latency badge */}
      <div
        className="inline-block text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full"
        style={{
          background: `${c}18`,
          color:      c,
          transition: 'color 0.4s, background 0.4s',
        }}
      >
        {data.metrics.latency.current}ms
      </div>

      {/* Status label for degraded/critical */}
      {isBad && (
        <div className="mt-1.5">
          <span
            className="text-[9px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: `${c}20`, color: c }}
          >
            {data.status}
          </span>
        </div>
      )}

      {/* Investigated marker — small purple pill */}
      {isInvestigated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-1.5"
        >
          <span
            className="text-[8px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}
          >
            ● RCA
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}

const nodeTypes = { service: ServiceNode }
const edgeTypes = { labeled: LabeledEdge }

// ─── Positions ────────────────────────────────────────────────────────────────
// Top rail: auth / payment / order on the same Y → "JWT validate" and
// "process order" labels both land at identical Y (rail + 14px), giving
// clean horizontal alignment for the primary flow.
// Bottom rail: inventory and notification connect diagonally upward to order.
const POSITIONS = {
  auth:         { x: 20,  y: 120 },
  payment:      { x: 260, y: 120 },
  order:        { x: 500, y: 120 },
  inventory:    { x: 300, y: 295 },
  notification: { x: 20,  y: 295 },
}

// ─── Builders — now take focusState so propagationStep drives animation ───────

function buildNodes(services, investigationPath, focusState) {
  const { isActive, propagationStep } = focusState

  return services.map(s => {
    const pathIdx = investigationPath.indexOf(s.id)

    // Is this node currently revealed in the step-by-step animation?
    const isInvestigated = isActive && pathIdx !== -1 && (
      propagationStep === -1 || pathIdx <= propagationStep
    )

    // Is this the node that JUST appeared in the animation? (triggers pulse)
    const isAnimatingIn = isActive && propagationStep !== -1 && pathIdx === propagationStep

    return {
      id:        s.id,
      type:      'service',
      position:  POSITIONS[s.id] ?? { x: 0, y: 0 },
      data:      { ...s, isInvestigated, isAnimatingIn },
      draggable: true,
    }
  })
}

function buildEdges(services, investigationPath, focusState) {
  const { isActive, propagationStep } = focusState
  const statusMap = Object.fromEntries(services.map(s => [s.id, s.status]))

  const isInvestigationEdge = (dep) => {
    if (!isActive || !investigationPath || investigationPath.length < 2) return false
    const srcIdx = investigationPath.indexOf(dep.source)
    const tgtIdx = investigationPath.indexOf(dep.target)
    if (srcIdx === -1 || tgtIdx === -1 || srcIdx >= tgtIdx) return false
    // Edge is visible only when BOTH endpoints are revealed
    if (propagationStep === -1) return true
    return srcIdx <= propagationStep && tgtIdx <= propagationStep
  }

  return dependencies.map(dep => {
    const onPath     = isInvestigationEdge(dep)
    const srcStatus  = statusMap[dep.source] ?? 'healthy'
    const tgtStatus  = statusMap[dep.target] ?? 'healthy'
    const worstStatus =
      (srcStatus === 'critical' || tgtStatus === 'critical') ? 'critical' :
      (srcStatus === 'degraded' || tgtStatus === 'degraded') ? 'degraded' : 'healthy'

    const color = onPath ? 'rgba(168,85,247,0.95)' : EDGE_STROKE[worstStatus].color
    const width = onPath ? 3.5                      : EDGE_STROKE[worstStatus].width

    return {
      id:     dep.id,
      source: dep.source,
      target: dep.target,
      type:   'labeled',          // ← custom edge: label floats above the line
      data:   { label: dep.label, onPath },
      style:  { stroke: color, strokeWidth: width, transition: 'stroke 0.45s, stroke-width 0.45s' },
      markerEnd: {
        type:   MarkerType.ArrowClosed,
        color,
        width:  14,
        height: 14,
      },
      animated: true,
    }
  })
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DependencyGraph({ services, investigationPath = [] }) {
  const { state: focusState } = useInvestigationFocus()
  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(services, investigationPath, focusState))
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges(services, investigationPath, focusState))

  // Re-build on service state, investigation path, or propagation step changes
  useEffect(() => {
    setNodes(prev =>
      buildNodes(services, investigationPath, focusState).map(n => ({
        ...n,
        position: prev.find(p => p.id === n.id)?.position ?? n.position,
      }))
    )
    setEdges(buildEdges(services, investigationPath, focusState))
  }, [services, investigationPath, focusState.isActive, focusState.propagationStep])

  const hasIncident      = services.some(s => s.status !== 'healthy')
  const isInvestigating  = focusState.isActive

  // Border: purple tint during investigation, red tint during incident, default cyan
  const panelBorderColor = isInvestigating
    ? 'rgba(168,85,247,0.22)'
    : hasIncident
      ? 'rgba(239,68,68,0.18)'
      : 'rgba(56,189,248,0.1)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.35 }}
      className="rounded-xl overflow-hidden"
      style={{
        background:  'rgba(3, 9, 22, 0.85)',
        border:      `1px solid ${panelBorderColor}`,
        height:       420,
        transition:  'border-color 0.5s, box-shadow 0.5s',
        boxShadow:   isInvestigating ? '0 0 0 1px rgba(168,85,247,0.08), 0 0 30px rgba(168,85,247,0.06)' : 'none',
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${isInvestigating ? 'rgba(168,85,247,0.1)' : hasIncident ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.08)'}` }}
      >
        <div className="flex items-center gap-2">
          <motion.span
            animate={isInvestigating
              ? { opacity: [1, 0.3, 1], boxShadow: ['0 0 5px #a855f7', '0 0 12px #a855f7', '0 0 5px #a855f7'] }
              : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: isInvestigating ? '#a855f7' : hasIncident ? '#ef4444' : '#38bdf8',
              boxShadow:  `0 0 6px ${isInvestigating ? '#a855f7' : hasIncident ? '#ef4444' : '#38bdf8'}`,
              display:    'inline-block',
              transition: 'background 0.4s',
            }}
          />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
            Service Topology
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Investigation Mode badge */}
          {isInvestigating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="flex items-center gap-1.5 text-[9px] font-bold font-mono px-2 py-1 rounded-full"
              style={{
                background: 'rgba(168,85,247,0.1)',
                color:      '#a855f7',
                border:     '1px solid rgba(168,85,247,0.25)',
              }}
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ●
              </motion.span>
              AI INVESTIGATION
            </motion.div>
          )}

          <span className="text-xs font-mono" style={{ color: '#334155' }}>
            5 services · 4 edges · {isInvestigating ? 'tracing propagation' : hasIncident ? 'instability detected' : 'live'}
          </span>
        </div>
      </div>

      {/* React Flow canvas */}
      <div style={{ height: 'calc(100% - 44px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          style={{ background: 'transparent' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1}
            color={isInvestigating ? 'rgba(168,85,247,0.07)' : 'rgba(56,189,248,0.06)'}
          />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
    </motion.div>
  )
}
