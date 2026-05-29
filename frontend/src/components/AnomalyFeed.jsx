import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, XCircle, ChevronRight, Search, Terminal } from 'lucide-react'

const SEVERITY = {
  critical: {
    icon:   XCircle,
    color:  '#ef4444',
    bg:     'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
    badge:  'rgba(239,68,68,0.15)',
    label:  'CRITICAL',
  },
  warning: {
    icon:   AlertTriangle,
    color:  '#f59e0b',
    bg:     'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.22)',
    badge:  'rgba(245,158,11,0.12)',
    label:  'WARNING',
  },
}

const TYPE_LABEL = {
  LATENCY_DRIFT:          'Latency Drift',
  RETRY_AMPLIFICATION:    'Retry Amplification',
  ERROR_SPIKE:            'Error Spike',
  THROUGHPUT_COLLAPSE:    'Throughput Collapse',
  DEPENDENCY_INSTABILITY: 'Dependency Instability',
}

/**
 * AnomalyRow — single anomaly card.
 *
 * Props:
 *   anomaly         — the anomaly object
 *   index           — stagger animation index
 *   onInvestigate   — called with the anomaly when "Investigate" is clicked
 *   onRuntimeQuery  — called with a pre-filled query string (optional)
 *   isActive        — true when this anomaly is currently open in InvestigationPanel
 */
function AnomalyRow({ anomaly, index, onInvestigate, onRuntimeQuery, isActive }) {
  const cfg  = SEVERITY[anomaly.severity] ?? SEVERITY.warning
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex items-start gap-3 px-4 py-3 rounded-lg relative"
      style={{
        background:  isActive ? 'rgba(56,189,248,0.07)' : cfg.bg,
        border:      isActive ? '1px solid rgba(56,189,248,0.4)' : `1px solid ${cfg.border}`,
        boxShadow:   isActive ? '0 0 12px rgba(56,189,248,0.12)' : 'none',
        transition:  'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Active investigation indicator — pulsing cyan left bar */}
      {isActive && (
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{
            position:    'absolute',
            left:        0,
            top:         6,
            bottom:      6,
            width:       3,
            borderRadius: 2,
            background:  '#38bdf8',
            boxShadow:   '0 0 8px #38bdf8',
          }}
        />
      )}

      {/* Severity icon */}
      <Icon size={14} color={isActive ? '#38bdf8' : cfg.color} className="shrink-0 mt-0.5" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {/* Severity badge */}
          <span
            className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wider"
            style={{ background: isActive ? 'rgba(56,189,248,0.15)' : cfg.badge, color: isActive ? '#38bdf8' : cfg.color }}
          >
            {cfg.label}
          </span>

          {/* Anomaly type */}
          <span className="text-xs font-semibold font-mono" style={{ color: '#94a3b8' }}>
            {TYPE_LABEL[anomaly.anomalyType] ?? anomaly.anomalyType}
          </span>

          <ChevronRight size={10} color="#334155" />

          {/* Service name */}
          <span className="text-xs font-mono" style={{ color: isActive ? '#38bdf8' : cfg.color, opacity: 0.8 }}>
            {anomaly.serviceName}
          </span>

          {/* "Investigating" pill */}
          {isActive && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' }}
            >
              investigating
            </motion.span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs font-mono leading-relaxed" style={{ color: '#64748b' }}>
          {anomaly.description}
        </p>
      </div>

      {/* Right side: timestamp + action buttons */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-[10px] font-mono" style={{ color: '#334155' }}>
          {anomaly.timestamp}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Runtime Diagnosis shortcut */}
          {onRuntimeQuery && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => {
                const typeLabel = TYPE_LABEL[anomaly.anomalyType] ?? anomaly.anomalyType
                onRuntimeQuery(`Why is ${anomaly.serviceName} showing ${typeLabel}?`)
              }}
              title="Run Runtime Diagnosis on this anomaly"
              className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-1 rounded transition-all duration-150"
              style={{
                background: 'rgba(56,189,248,0.04)',
                border:     '1px solid rgba(56,189,248,0.12)',
                color:      '#334155',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(56,189,248,0.1)'
                e.currentTarget.style.color      = '#38bdf8'
                e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = 'rgba(56,189,248,0.04)'
                e.currentTarget.style.color       = '#334155'
                e.currentTarget.style.borderColor = 'rgba(56,189,248,0.12)'
              }}
            >
              <Terminal size={9} />
            </motion.button>
          )}

          {/* Investigate button */}
          {onInvestigate && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => onInvestigate(anomaly)}
              className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-1 rounded transition-all duration-150"
              style={{
                background:  isActive ? 'rgba(56,189,248,0.18)' : 'rgba(56,189,248,0.08)',
                border:      isActive ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(56,189,248,0.2)',
                color:       '#38bdf8',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background  = 'rgba(56,189,248,0.2)'
                e.currentTarget.style.borderColor = 'rgba(56,189,248,0.5)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = isActive ? 'rgba(56,189,248,0.18)' : 'rgba(56,189,248,0.08)'
                e.currentTarget.style.borderColor = isActive ? 'rgba(56,189,248,0.5)' : 'rgba(56,189,248,0.2)'
              }}
            >
              <Search size={9} />
              {isActive ? 'Open' : 'Investigate'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * AnomalyFeed — anomaly alert list.
 *
 * Props:
 *   anomalies           — list of Anomaly objects
 *   onInvestigate       — (anomaly) => void, called when "Investigate" is clicked
 *   onRuntimeQuery      — (query: string) => void, pre-fills Runtime Diagnosis panel (optional)
 *   investigatingId     — id of anomaly currently open in InvestigationPanel (or null)
 */
export default function AnomalyFeed({ anomalies, onInvestigate, onRuntimeQuery, investigatingId }) {
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
        border:     '1px solid rgba(239,68,68,0.2)',
        boxShadow:  '0 0 30px rgba(239,68,68,0.08)',
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
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
            >
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
            <AnomalyRow
              key={anomaly.id}
              anomaly={anomaly}
              index={i}
              onInvestigate={onInvestigate}
              onRuntimeQuery={onRuntimeQuery}
              isActive={anomaly.id === investigatingId}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
