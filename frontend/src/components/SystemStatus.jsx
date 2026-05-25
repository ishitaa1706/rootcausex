import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle, Activity, Zap, AlertCircle, Cpu } from 'lucide-react'
import { systemStatus } from '../data/mockData'

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
    border: 'rgba(245,158,11,0.2)',
    bg: 'rgba(245,158,11,0.05)',
    label: 'System Degraded',
  },
  incident: {
    icon: XCircle,
    color: '#ef4444',
    border: 'rgba(239,68,68,0.2)',
    bg: 'rgba(239,68,68,0.05)',
    label: 'Active Incident Detected',
  },
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} color="#475569" />
      <span className="text-sm font-mono" style={{ color: '#64748b' }}>{label}:</span>
      <span className="text-sm font-mono font-semibold" style={{ color: '#94a3b8' }}>{value}</span>
    </div>
  )
}

export default function SystemStatus() {
  const cfg = bannerConfig[systemStatus.status] ?? bannerConfig.healthy
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex items-center gap-5 px-5 py-3 rounded-xl mb-5"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {/* Status label */}
      <div className="flex items-center gap-2 shrink-0">
        <Icon size={16} color={cfg.color} />
        <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.07)' }} />

      {/* Stats */}
      <div className="flex items-center gap-6 flex-1">
        <Stat icon={Activity}     label="p99 latency" value={`${systemStatus.p99Latency}ms`}                         />
        <Stat icon={AlertCircle}  label="error rate"  value={`${systemStatus.errorRate}%`}                           />
        <Stat icon={Zap}          label="throughput"  value={`${systemStatus.totalThroughput.toLocaleString()} req/s`}/>
        <Stat icon={Cpu}          label="services"    value={`${systemStatus.servicesHealthy}/${systemStatus.servicesTotal} healthy`} />
      </div>

      <span className="text-xs font-mono shrink-0" style={{ color: '#334155' }}>
        updated just now
      </span>
    </motion.div>
  )
}
