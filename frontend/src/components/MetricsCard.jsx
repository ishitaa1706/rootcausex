import { motion } from 'framer-motion'
import { Clock, AlertCircle, RefreshCw, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ─── Config ──────────────────────────────────────────────────────────────────
const STATUS = {
  healthy:  { color: '#22c55e', border: 'rgba(34,197,94,0.25)',   bg: 'rgba(34,197,94,0.07)',   label: 'HEALTHY'  },
  degraded: { color: '#f59e0b', border: 'rgba(245,158,11,0.4)',   bg: 'rgba(245,158,11,0.09)',  label: 'DEGRADED' },
  critical: { color: '#ef4444', border: 'rgba(239,68,68,0.5)',    bg: 'rgba(239,68,68,0.1)',    label: 'CRITICAL' },
}

function TrendIcon({ trend }) {
  if (trend === 'up')   return <TrendingUp   size={13} color="#ef4444" />
  if (trend === 'down') return <TrendingDown size={13} color="#22c55e" />
  return                       <Minus        size={13} color="#334155" />
}

function MetricRow({ icon: Icon, label, value, unit, trend, alert }) {
  return (
    <div className="flex items-center justify-between py-[6px]">
      <div className="flex items-center gap-2" style={{ color: alert ? '#f59e0b' : '#64748b' }}>
        <Icon size={13} />
        <span className="text-xs font-mono">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold font-mono"
          style={{ color: alert ? '#fbbf24' : '#cbd5e1' }}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono" style={{ color: '#475569' }}>
            {unit}
          </span>
        )}
        <TrendIcon trend={trend} />
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export default function MetricsCard({ service, index }) {
  const s          = STATUS[service.status] ?? STATUS.healthy
  const isCritical = service.status === 'critical'
  const isDegraded = service.status === 'degraded'
  const isUnhealthy = isCritical || isDegraded

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: 'easeOut' }}
      whileHover={{ scale: 1.025, transition: { duration: 0.18 } }}
      className={`rounded-xl p-4 cursor-pointer select-none relative ${
        isCritical ? 'card-critical' :
        isDegraded ? 'card-degraded' : ''
      }`}
      style={{
        background: 'rgba(10, 18, 38, 0.9)',
        backdropFilter: 'blur(14px)',
        border: `1px solid ${s.border}`,
        // Static shadow for healthy; animation handles unhealthy via CSS
        ...(!isUnhealthy && { boxShadow: '0 0 22px rgba(34,197,94,0.1)' }),
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full pulse-dot"
              style={{ background: s.color, boxShadow: `0 0 5px ${s.color}`, display: 'inline-block' }}
            />
            <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
              {service.name}
            </span>
          </div>
          <span className="text-xs font-mono ml-[18px]" style={{ color: '#475569' }}>
            {service.version}
          </span>
        </div>

        <motion.span
          key={service.status}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="text-[10px] font-bold tracking-[0.1em] px-2 py-0.5 rounded-full font-mono mt-0.5"
          style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
        >
          {s.label}
        </motion.span>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: 6 }} />

      {/* Metrics */}
      <div>
        <MetricRow
          icon={Clock}
          label="latency"
          value={service.metrics.latency.current}
          unit={service.metrics.latency.unit}
          trend={service.metrics.latency.trend}
          alert={service.metrics.latency.current > 200}
        />
        <MetricRow
          icon={AlertCircle}
          label="error rate"
          value={`${service.metrics.errorRate.current}%`}
          unit=""
          trend={service.metrics.errorRate.trend}
          alert={service.metrics.errorRate.current > 2}
        />
        <MetricRow
          icon={RefreshCw}
          label="retries"
          value={service.metrics.retries.current}
          unit={service.metrics.retries.unit}
          trend={service.metrics.retries.trend}
          alert={service.metrics.retries.current > 30}
        />
        <MetricRow
          icon={Zap}
          label="throughput"
          value={service.metrics.throughput.current}
          unit={service.metrics.throughput.unit}
          trend={service.metrics.throughput.trend}
        />
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between mt-2 pt-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="text-xs font-mono" style={{ color: '#334155' }}>
          {service.deployedBy}
        </span>
        <span className="text-xs font-mono" style={{ color: '#334155' }}>
          {service.lastDeploy}
        </span>
      </div>
    </motion.div>
  )
}
