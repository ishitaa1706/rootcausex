import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, XCircle, ChevronRight } from 'lucide-react'

const SEVERITY = {
  critical: {
    icon: XCircle,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
    badge: 'rgba(239,68,68,0.15)',
    label: 'CRITICAL',
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.22)',
    badge: 'rgba(245,158,11,0.12)',
    label: 'WARNING',
  },
}

const TYPE_LABEL = {
  LATENCY_DRIFT:          'Latency Drift',
  RETRY_AMPLIFICATION:    'Retry Amplification',
  ERROR_SPIKE:            'Error Spike',
  THROUGHPUT_COLLAPSE:    'Throughput Collapse',
  DEPENDENCY_INSTABILITY: 'Dependency Instability',
}

function AnomalyRow({ anomaly, index }) {
  const cfg  = SEVERITY[anomaly.severity] ?? SEVERITY.warning
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex items-start gap-3 px-4 py-3 rounded-lg"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {/* Severity icon */}
      <Icon size={14} color={cfg.color} className="shrink-0 mt-0.5" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {/* Severity badge */}
          <span
            className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wider"
            style={{ background: cfg.badge, color: cfg.color }}
          >
            {cfg.label}
          </span>

          {/* Anomaly type */}
          <span className="text-xs font-semibold font-mono" style={{ color: '#94a3b8' }}>
            {TYPE_LABEL[anomaly.anomalyType] ?? anomaly.anomalyType}
          </span>

          <ChevronRight size={10} color="#334155" />

          {/* Service name */}
          <span className="text-xs font-mono" style={{ color: cfg.color, opacity: 0.8 }}>
            {anomaly.serviceName}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs font-mono leading-relaxed" style={{ color: '#64748b' }}>
          {anomaly.description}
        </p>
      </div>

      {/* Timestamp */}
      <span className="text-[10px] font-mono shrink-0 mt-0.5" style={{ color: '#334155' }}>
        {anomaly.timestamp}
      </span>
    </motion.div>
  )
}

export default function AnomalyFeed({ anomalies }) {
  if (!anomalies || anomalies.length === 0) return null

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-5 rounded-xl overflow-hidden"
      style={{
        background: 'rgba(3, 9, 22, 0.85)',
        border: '1px solid rgba(239,68,68,0.2)',
        boxShadow: '0 0 30px rgba(239,68,68,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(239,68,68,0.12)' }}
      >
        <div className="flex items-center gap-2">
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ background: '#ef4444', boxShadow: '0 0 5px #ef4444', display: 'inline-block' }}
          />
          <span className="text-xs font-bold uppercase tracking-widest font-mono" style={{ color: '#64748b' }}>
            Anomaly Feed
          </span>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              {criticalCount} critical
            </span>
          )}
          <span className="text-[10px] font-mono" style={{ color: '#334155' }}>
            {anomalies.length} anomalies detected
          </span>
        </div>
      </div>

      {/* Anomaly list */}
      <div className="flex flex-col gap-2 p-3">
        <AnimatePresence>
          {anomalies.map((anomaly, i) => (
            <AnomalyRow key={anomaly.id} anomaly={anomaly} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
