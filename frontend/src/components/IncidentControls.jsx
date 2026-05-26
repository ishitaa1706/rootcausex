import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, RotateCcw } from 'lucide-react'

/**
 * Trigger Incident + Reset buttons.
 * Lives in the Dashboard heading area.
 */
export default function IncidentControls({ incidentActive, onTrigger, onReset }) {
  const [loading, setLoading] = useState(false)

  const handleTrigger = async () => {
    setLoading(true)
    await onTrigger()
    setLoading(false)
  }

  const handleReset = async () => {
    setLoading(true)
    await onReset()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {!incidentActive ? (
          // ── Trigger button ───────────────────────────────────────────────
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleTrigger}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-50"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.45)',
              color: '#ef4444',
              boxShadow: '0 0 18px rgba(239,68,68,0.15)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.22)'
              e.currentTarget.style.boxShadow = '0 0 28px rgba(239,68,68,0.35)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
              e.currentTarget.style.boxShadow = '0 0 18px rgba(239,68,68,0.15)'
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap size={13} />
            </motion.div>
            {loading ? 'Triggering…' : 'Trigger Incident'}
          </motion.button>
        ) : (
          // ── Reset button ─────────────────────────────────────────────────
          <motion.button
            key="reset"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-50"
            style={{
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.35)',
              color: '#38bdf8',
              boxShadow: '0 0 14px rgba(56,189,248,0.12)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(56,189,248,0.18)'
              e.currentTarget.style.boxShadow = '0 0 22px rgba(56,189,248,0.28)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(56,189,248,0.1)'
              e.currentTarget.style.boxShadow = '0 0 14px rgba(56,189,248,0.12)'
            }}
          >
            <RotateCcw size={13} />
            {loading ? 'Resetting…' : 'Reset System'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Active pulse indicator */}
      <AnimatePresence>
        {incidentActive && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5"
          >
            <motion.span
              className="w-2 h-2 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444', display: 'inline-block' }}
            />
            <span className="text-xs font-mono" style={{ color: '#ef4444' }}>
              incident live
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
