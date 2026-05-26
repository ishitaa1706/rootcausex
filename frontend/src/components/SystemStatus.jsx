import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle, Activity, Zap, AlertCircle, Cpu } from 'lucide-react'

const bannerConfig = {
  healthy:  {
    icon: CheckCircle,
    color: '#22c55e',
    border: 'rgba(34,197,94,0.2)',
    bg: 'rgba(34,197,94,0.05)',
    label: 'All Systems Operational',
  },
  degraded: {
    icon: AlertTriangle,
    color: '#f59e0b',
    border: 'rgba(245,158,11,0.25)',
    bg: 'rgba(245,158,11,0.07)',
    label: 'System Degraded — Anomaly Detected',
  },
  incident: {
    icon: XCircle,
    color: '#ef4444',
    border: 'rgba(239,68,68,0.3)',
    bg: 'rgba(239,68,68,0.08)',
    label: 'Active Incident — Cascading Failure',
  },
}

function Stat({ icon: Icon, label, value, alert }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} color={alert ? '#ef4444' : '#475569'} />
      <span className="text-sm font-mono" style={{ color: '#64748b' }}>{label}:</span>
      <span className="text-sm font-mono font-semibold"
        style={{ color: alert ? '#ef4444' : '#94a3b8' }}>
        {value}
      </span>
    </div>
  )
}

export default function SystemStatus({ systemStatus }) {
  const ss  = systemStatus ?? { status: 'healthy', p99Latency: 120, errorRate: 0.09, totalThroughput: 5020, servicesHealthy: 5, servicesTotal: 5 }
  const cfg = bannerConfig[ss.status] ?? bannerConfig.healthy
  const Icon = cfg.icon
  const isUnhealthy = ss.status !== 'healthy'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={ss.status}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-5 px-5 py-3 rounded-xl mb-5"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        {/* Status label */}
        <div className="flex items-center gap-2 shrink-0">
          <Icon size={16} color={cfg.color} />
          <span className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.07)' }} />

        {/* Stats */}
        <div className="flex items-center gap-6 flex-1">
          <Stat icon={Activity}    label="p99 latency" value={`${ss.p99Latency}ms`}
            alert={ss.p99Latency > 500} />
          <Stat icon={AlertCircle} label="error rate"  value={`${ss.errorRate}%`}
            alert={ss.errorRate > 5} />
          <Stat icon={Zap}         label="throughput"  value={`${Number(ss.totalThroughput).toLocaleString()} req/s`} />
          <Stat icon={Cpu}         label="services"
            value={`${ss.servicesHealthy}/${ss.servicesTotal} healthy`}
            alert={ss.servicesHealthy < ss.servicesTotal} />
        </div>

        <span className="text-xs font-mono shrink-0" style={{ color: isUnhealthy ? cfg.color : '#334155', opacity: isUnhealthy ? 0.7 : 1 }}>
          {isUnhealthy ? '⚠ live incident data' : 'updated just now'}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
