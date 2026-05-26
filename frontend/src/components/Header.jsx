import { motion } from 'framer-motion'
import { Bell, Settings, Wifi, ChevronRight } from 'lucide-react'

const statusMeta = {
  healthy:  { color: '#22c55e', label: 'ALL SYSTEMS NOMINAL' },
  degraded: { color: '#f59e0b', label: 'DEGRADED'           },
  incident: { color: '#ef4444', label: 'ACTIVE INCIDENT'    },
}

export default function Header({ systemStatus }) {
  const meta = statusMeta[systemStatus?.status] ?? statusMeta.healthy
  const ss   = systemStatus ?? { servicesHealthy: 5, servicesTotal: 5, p99Latency: 120 }

  return (
    <motion.header
      initial={{ y: -36, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex items-center justify-between px-6 py-4 shrink-0"
      style={{
        background: 'rgba(3, 9, 22, 0.9)',
        borderBottom: '1px solid rgba(56,189,248,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left — brand */}
      <div className="flex items-center gap-2">
        <span className="text-base font-bold tracking-[0.15em] text-[#38bdf8] uppercase">
          RootCause<span className="text-white">X</span>
        </span>
        <ChevronRight size={14} color="#1e3a5f" />
        <span className="text-sm text-[#334155] font-mono">runtime intelligence</span>
      </div>

      {/* Center — live system status */}
      <div className="flex items-center gap-3">
        <motion.div
          key={ss.status}
          animate={{ opacity: [0.6, 1] }}
          transition={{ duration: 0.4 }}
          className="w-2 h-2 rounded-full pulse-dot"
          style={{ background: meta.color, boxShadow: `0 0 7px ${meta.color}` }}
        />
        <motion.span
          key={`label-${ss.status}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-bold tracking-widest font-mono"
          style={{ color: meta.color }}
        >
          {meta.label}
        </motion.span>
        <span className="text-[#1e3a5f] mx-1">·</span>
        <span className="text-sm text-[#475569] font-mono">
          {ss.servicesHealthy}/{ss.servicesTotal} services
        </span>
        <span className="text-[#1e3a5f] mx-1">·</span>
        <span className="text-sm text-[#475569] font-mono">
          p99 {ss.p99Latency}ms
        </span>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-mono mr-1"
          style={{ color: ss.status === 'healthy' ? '#22c55e' : '#ef4444' }}>
          <Wifi size={13} />
          {ss.status === 'healthy' ? 'LIVE' : 'INCIDENT'}
        </span>
        {[Bell, Settings].map((Icon, i) => (
          <button
            key={i}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: '#334155' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </motion.header>
  )
}
