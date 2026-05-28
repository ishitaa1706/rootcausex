import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader } from 'lucide-react'

/**
 * 8-stage forensic reasoning sequence.
 * Each stage has a label (what the AI is doing) and a detail line
 * (which specific data it's touching) — makes the investigation feel
 * like it's reading real runtime data, not just loading.
 */
const STAGES = [
  {
    label:  'Detecting instability patterns...',
    detail: 'scanning 5 services for anomalous drift signals',
  },
  {
    label:  'Correlating anomaly clusters...',
    detail: 'mapping anomaly events across incident phases',
  },
  {
    label:  'Inspecting deployment chronology...',
    detail: 'cross-referencing commit history with onset delta',
  },
  {
    label:  'Mapping dependency propagation...',
    detail: 'auth → payment → order topology',
  },
  {
    label:  'Comparing historical baselines...',
    detail: 'latency · retry_rate · error_rate signal deltas',
  },
  {
    label:  'Reconstructing causal chain...',
    detail: 'tracing failure origin through dependency graph',
  },
  {
    label:  'Verifying supporting evidence...',
    detail: 'cross-referencing metrics with deployment delta',
  },
  {
    label:  'Generating root cause analysis...',
    detail: 'assembling forensic report',
  },
]

const STAGE_DELAY_MS = 680

/**
 * AIReasoningStream — multi-stage AI cognition visualization.
 *
 * Renders each reasoning stage sequentially with staggered delays,
 * showing completed (✓), active (⟳), and pending (·) states.
 * Each stage also shows a detail line with the specific data it touched.
 *
 * Props:
 *   isActive      — start the animation sequence when true
 *   onComplete    — called after all stages finish + brief settle delay
 *   onStageChange — (stageIndex: number) => void, called as each stage becomes active
 */
export default function AIReasoningStream({ isActive, onComplete, onStageChange }) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!isActive) return
    setVisibleCount(0)

    const timers = STAGES.map((_, i) =>
      setTimeout(() => {
        setVisibleCount(i + 1)
        if (onStageChange) onStageChange(i)
        if (i === STAGES.length - 1 && onComplete) {
          setTimeout(onComplete, 420)
        }
      }, (i + 1) * STAGE_DELAY_MS)
    )

    return () => timers.forEach(clearTimeout)
  }, [isActive])

  return (
    <div className="flex flex-col py-2">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <motion.div
          animate={{
            opacity:   [1, 0.3, 1],
            boxShadow: ['0 0 5px #38bdf8', '0 0 14px #38bdf8', '0 0 5px #38bdf8'],
          }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="w-2 h-2 rounded-full"
          style={{ background: '#38bdf8', display: 'inline-block' }}
        />
        <span className="text-xs font-bold uppercase tracking-[0.18em] font-mono" style={{ color: '#38bdf8' }}>
          AI Cognition Active
        </span>
        <span className="text-[10px] font-mono" style={{ color: '#1e3a5f' }}>
          runtime forensics
        </span>
      </div>

      {/* Stage list */}
      <div className="flex flex-col gap-0.5">
        {STAGES.map((stage, i) => {
          const isDone    = i < visibleCount - 1
          const isCurrent = i === visibleCount - 1
          const isFuture  = i >= visibleCount

          /* ── Future stages — placeholder row ── */
          if (isFuture) {
            return (
              <div
                key={stage.label}
                className="flex items-center gap-3 px-1 py-1.5"
                style={{ opacity: 0.1 }}
              >
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border:     '1px solid rgba(255,255,255,0.07)',
                  }}
                />
                <span className="text-[11px] font-mono" style={{ color: '#334155' }}>
                  {stage.label}
                </span>
              </div>
            )
          }

          /* ── Done / active stages ── */
          return (
            <motion.div
              key={stage.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28 }}
              className="px-1 py-1"
            >
              {/* Stage row */}
              <div className="flex items-center gap-3">
                {/* Icon circle */}
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isDone ? 'rgba(34,197,94,0.12)' : 'rgba(56,189,248,0.14)',
                    border:     `1px solid ${isDone ? 'rgba(34,197,94,0.32)' : 'rgba(56,189,248,0.38)'}`,
                  }}
                >
                  {isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader size={8} color="#38bdf8" />
                    </motion.div>
                  ) : (
                    <Check size={8} color="#22c55e" />
                  )}
                </div>

                {/* Label */}
                <span
                  className="text-[11px] font-mono"
                  style={{ color: isCurrent ? '#e2e8f0' : '#475569' }}
                >
                  {stage.label}
                </span>

                {/* Pulsing dots for active stage */}
                {isCurrent && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.75, repeat: Infinity }}
                    className="text-[10px] font-mono tracking-widest"
                    style={{ color: '#38bdf8' }}
                  >
                    ···
                  </motion.span>
                )}
              </div>

              {/* Detail sub-text — shown for all visible stages */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.12 }}
                className="flex items-center gap-3 mt-0.5"
              >
                <div style={{ width: 28, flexShrink: 0 }} /> {/* icon spacer */}
                <span
                  className="text-[9px] font-mono"
                  style={{ color: isCurrent ? '#334155' : '#1e3a5f' }}
                >
                  └─ {stage.detail}
                </span>
              </motion.div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
