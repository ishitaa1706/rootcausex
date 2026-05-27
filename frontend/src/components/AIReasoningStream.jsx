import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader } from 'lucide-react'

const STEPS = [
  "Correlating anomalies across services...",
  "Inspecting recent deployment history...",
  "Mapping dependency propagation paths...",
  "Comparing metrics against historical baselines...",
  "Building causal evidence chain...",
  "Generating root cause analysis...",
]

const STEP_DELAY_MS = 800

/**
 * AIReasoningStream — animated AI reasoning steps.
 *
 * Shows each step appearing sequentially with a delay,
 * simulating the AI working through the evidence.
 * Calls onComplete when all steps are shown.
 *
 * Props:
 *   isActive   — start the animation when true
 *   onComplete — called after all steps are shown
 */
export default function AIReasoningStream({ isActive, onComplete }) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!isActive) return
    setVisibleCount(0)

    const timers = STEPS.map((_, i) =>
      setTimeout(() => {
        setVisibleCount(i + 1)
        if (i === STEPS.length - 1 && onComplete) {
          setTimeout(onComplete, 300)
        }
      }, (i + 1) * STEP_DELAY_MS)
    )

    return () => timers.forEach(clearTimeout)
  }, [isActive])

  return (
    <div className="flex flex-col gap-3 py-2">
      {/* Heading */}
      <div className="flex items-center gap-2 mb-1">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: '#38bdf8', boxShadow: '0 0 6px #38bdf8', display: 'inline-block' }}
        />
        <span className="text-xs font-bold uppercase tracking-widest font-mono" style={{ color: '#38bdf8' }}>
          AI Reasoning
        </span>
      </div>

      {/* Steps */}
      <AnimatePresence>
        {STEPS.slice(0, visibleCount).map((step, i) => {
          const isLast = i === visibleCount - 1
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {/* Icon */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: isLast ? 'rgba(56,189,248,0.1)' : 'rgba(34,197,94,0.1)',
                  border: `1px solid ${isLast ? 'rgba(56,189,248,0.3)' : 'rgba(34,197,94,0.3)'}`,
                }}
              >
                {isLast ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader size={10} color="#38bdf8" />
                  </motion.div>
                ) : (
                  <Check size={10} color="#22c55e" />
                )}
              </div>

              {/* Text */}
              <span
                className="text-xs font-mono"
                style={{ color: isLast ? '#94a3b8' : '#475569' }}
              >
                {step}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Empty placeholder steps (not yet visible) */}
      {STEPS.slice(visibleCount).map((step, i) => (
        <div key={step} className="flex items-center gap-3" style={{ opacity: 0.12 }}>
          <div
            className="w-5 h-5 rounded-full shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          />
          <span className="text-xs font-mono" style={{ color: '#334155' }}>{step}</span>
        </div>
      ))}
    </div>
  )
}
