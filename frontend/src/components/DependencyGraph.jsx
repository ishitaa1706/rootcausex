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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { dependencies } from '../data/mockData'

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

// ─── Custom node ──────────────────────────────────────────────────────────────
function ServiceNode({ data }) {
  const c        = NODE_COLOR[data.status] ?? NODE_COLOR.healthy
  const isBad    = data.status === 'degraded' || data.status === 'critical'

  return (
    <div
      className={`px-4 py-3 rounded-xl text-center select-none ${isBad ? `node-${data.status}` : ''}`}
      style={{
        minWidth: 130,
        background: 'rgba(8, 16, 36, 0.96)',
        border: `1px solid ${c}40`,
        boxShadow: `0 0 ${isBad ? 28 : 18}px ${c}${isBad ? '28' : '18'}, inset 0 0 18px rgba(0,0,0,0.25)`,
        backdropFilter: 'blur(8px)',
        transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
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

      {/* Latency badge — colour-coded when anomalous */}
      <div
        className="inline-block text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full"
        style={{
          background: `${c}18`,
          color: c,
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
    </div>
  )
}

const nodeTypes = { service: ServiceNode }

// ─── Positions ────────────────────────────────────────────────────────────────
const POSITIONS = {
  auth:         { x: 20,  y: 120 },
  payment:      { x: 240, y: 120 },
  order:        { x: 460, y: 120 },
  inventory:    { x: 240, y: 290 },
  notification: { x: 20,  y: 290 },
}

// ─── Builders ─────────────────────────────────────────────────────────────────
const buildNodes = (services) =>
  services.map(s => ({
    id:       s.id,
    type:     'service',
    position: POSITIONS[s.id] ?? { x: 0, y: 0 },
    data:     { ...s },
    draggable: true,
  }))

const buildEdges = (services) => {
  const statusMap = Object.fromEntries(services.map(s => [s.id, s.status]))

  return dependencies.map(dep => {
    const srcStatus = statusMap[dep.source] ?? 'healthy'
    const tgtStatus = statusMap[dep.target] ?? 'healthy'
    // Edge reflects the worse of the two connected services
    const worstStatus =
      (srcStatus === 'critical' || tgtStatus === 'critical') ? 'critical' :
      (srcStatus === 'degraded' || tgtStatus === 'degraded') ? 'degraded' : 'healthy'

    const { color, width } = EDGE_STROKE[worstStatus]

    return {
      id:     dep.id,
      source: dep.source,
      target: dep.target,
      type:   'smoothstep',
      label:  dep.label,
      labelStyle:   { fill: '#334155', fontSize: 10, fontFamily: 'monospace' },
      labelBgStyle: { fill: 'rgba(3,9,22,0.85)', rx: 4 },
      labelBgPadding: [4, 6],
      style:    { stroke: color, strokeWidth: width, transition: 'stroke 0.5s, stroke-width 0.5s' },
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
export default function DependencyGraph({ services }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(services))
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges(services))

  // Re-build nodes/edges whenever service states change
  useEffect(() => {
    setNodes(prev =>
      buildNodes(services).map(n => ({
        ...n,
        // Preserve user-dragged position if available
        position: prev.find(p => p.id === n.id)?.position ?? n.position,
      }))
    )
    setEdges(buildEdges(services))
  }, [services])

  const hasIncident = services.some(s => s.status !== 'healthy')

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.35 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(3, 9, 22, 0.85)',
        border: `1px solid ${hasIncident ? 'rgba(239,68,68,0.18)' : 'rgba(56,189,248,0.1)'}`,
        height: 420,
        transition: 'border-color 0.5s',
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${hasIncident ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.08)'}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: hasIncident ? '#ef4444' : '#38bdf8',
              boxShadow: `0 0 6px ${hasIncident ? '#ef4444' : '#38bdf8'}`,
              display: 'inline-block',
              transition: 'background 0.4s',
            }}
          />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
            Service Topology
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: '#334155' }}>
          5 services · 4 edges · {hasIncident ? 'instability detected' : 'live'}
        </span>
      </div>

      {/* React Flow canvas */}
      <div style={{ height: 'calc(100% - 44px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          style={{ background: 'transparent' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1}
            color="rgba(56,189,248,0.06)"
          />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
    </motion.div>
  )
}
