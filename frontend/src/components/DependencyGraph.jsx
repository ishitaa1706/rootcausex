import { useCallback } from 'react'
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
import { services, dependencies } from '../data/mockData'

// ─── Status → colour map ─────────────────────────────────────────────────────
const STATUS_COLOR = {
  healthy:  '#22c55e',
  degraded: '#f59e0b',
  critical: '#ef4444',
}

// ─── Custom node ─────────────────────────────────────────────────────────────
function ServiceNode({ data }) {
  const c = STATUS_COLOR[data.status] ?? '#22c55e'

  return (
    <div
      className="px-4 py-3 rounded-xl text-center select-none"
      style={{
        minWidth: 130,
        background: 'rgba(8, 16, 36, 0.96)',
        border: `1px solid ${c}35`,
        boxShadow: `0 0 18px ${c}18, inset 0 0 18px rgba(0,0,0,0.25)`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: c, border: 'none', width: 7, height: 7, left: -4 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: c, border: 'none', width: 7, height: 7, right: -4 }}
      />

      {/* Status dot + short name */}
      <div className="flex items-center justify-center gap-2 mb-1.5">
        <span
          className="w-2 h-2 rounded-full pulse-dot"
          style={{ background: c, boxShadow: `0 0 6px ${c}`, display: 'inline-block' }}
        />
        <span
          className="text-sm font-bold tracking-widest font-mono uppercase"
          style={{ color: '#e2e8f0' }}
        >
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
        style={{ background: `${c}18`, color: c }}
      >
        {data.metrics.latency.current}ms
      </div>
    </div>
  )
}

const nodeTypes = { service: ServiceNode }

// ─── Static layout positions ─────────────────────────────────────────────────
const POSITIONS = {
  auth:         { x: 20,  y: 120 },
  payment:      { x: 240, y: 120 },
  order:        { x: 460, y: 120 },
  inventory:    { x: 240, y: 290 },
  notification: { x: 20,  y: 290 },
}

const buildNodes = () =>
  services.map(s => ({
    id: s.id,
    type: 'service',
    position: POSITIONS[s.id] ?? { x: 0, y: 0 },
    data: { ...s },
    draggable: true,
  }))

const buildEdges = () =>
  dependencies.map(dep => ({
    id: dep.id,
    source: dep.source,
    target: dep.target,
    type: 'smoothstep',
    label: dep.label,
    labelStyle: { fill: '#334155', fontSize: 10, fontFamily: 'monospace' },
    labelBgStyle: { fill: 'rgba(3,9,22,0.85)', rx: 4 },
    labelBgPadding: [4, 6],
    style: { stroke: 'rgba(56,189,248,0.35)', strokeWidth: 1.5 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'rgba(56,189,248,0.45)',
      width: 14,
      height: 14,
    },
    animated: true,
  }))

// ─── Component ───────────────────────────────────────────────────────────────
export default function DependencyGraph() {
  const [nodes, , onNodesChange] = useNodesState(buildNodes())
  const [edges, , onEdgesChange] = useEdgesState(buildEdges())

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.35 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(3, 9, 22, 0.85)',
        border: '1px solid rgba(56,189,248,0.1)',
        height: 420,
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#38bdf8', boxShadow: '0 0 6px #38bdf8', display: 'inline-block' }}
          />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
            Service Topology
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: '#334155' }}>
          5 services · 4 edges · live
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
          <Controls
            showInteractive={false}
            position="bottom-right"
          />
        </ReactFlow>
      </div>
    </motion.div>
  )
}
