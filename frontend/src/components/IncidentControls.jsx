import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, RotateCcw, ChevronRight } from 'lucide-react'

const PHASE_LABELS = {
  1: 'auth degraded',
  2: 'payment degraded',
  3: 'order degraded',
  4: 'full cascade',
}

/**
 * Trigger Incident + Advance Phase + Reset buttons.
 * Lives in the Dashboard heading area.
 *
 * Props:
 *   incidentActive  — boolean
 *   incidentPhase   — 0–4 (current phase from backend)
 *   onTrigger       — () => Promise
 *   onReset         — () => Promise
 *   onAdvance       — () => Promise
 */
export default function IncidentControls({
  incidentActive,
  incidentPhase = 1,
  onTrigger,
  onReset,
  onAdvance,
}) {
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

  const handleAdvance = async () => {
    setLoading(true)
    await onAdvance()
    setLoading(false)
  }

  const atMaxPhase = incidentPhase >= 4

  return (
    <div className="flex items-center gap-2" style={{ opacity: 0 }}>
      <AnimatePresence mode="wait">
        {!incidentActive ? (
          // ── Trigger button ─────────────────────────────────────────────
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
              border:     '1px solid rgba(239,68,68,0.45)',
              color:      '#ef4444',
              boxShadow:  '0 0 18px rgba(239,68,68,0.15)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.22)'
              e.currentTarget.style.boxShadow  = '0 0 28px rgba(239,68,68,0.35)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
              e.currentTarget.style.boxShadow  = '0 0 18px rgba(239,68,68,0.15)'
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
          // ── Active incident: phase badge + advance + reset ───────────────
          <motion.div
            key="active-controls"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {/* Phase indicator pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border:     '1px solid rgba(239,68,68,0.2)',
                color:      '#64748b',
              }}
            >
              <span style={{ color: '#ef4444', fontWeight: 700 }}>
                P{incidentPhase}
              </span>
              <span className="uppercase tracking-wider" style={{ fontSize: 10 }}>
                {PHASE_LABELS[incidentPhase] ?? 'unknown'}
              </span>
            </div>

            {/* Next Phase button — disabled at Phase 4 */}
            <motion.button
              whileHover={!atMaxPhase ? { scale: 1.04 } : {}}
              whileTap={!atMaxPhase ? { scale: 0.97 } : {}}
              onClick={!atMaxPhase ? handleAdvance : undefined}
              disabled={loading || atMaxPhase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200"
              style={{
                background: atMaxPhase ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.14)',
                border:     `1px solid ${atMaxPhase ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.5)'}`,
                color:      atMaxPhase ? '#4a2020' : '#ef4444',
                boxShadow:  atMaxPhase ? 'none' : '0 0 14px rgba(239,68,68,0.18)',
                cursor:     atMaxPhase ? 'not-allowed' : 'pointer',
                opacity:    loading ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!atMaxPhase) {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.24)'
                  e.currentTarget.style.boxShadow  = '0 0 24px rgba(239,68,68,0.35)'
                }
              }}
              onMouseLeave={e => {
                if (!atMaxPhase) {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.14)'
                  e.currentTarget.style.boxShadow  = '0 0 14px rgba(239,68,68,0.18)'
                }
              }}
            >
              {loading ? (
                '…'
              ) : atMaxPhase ? (
                'Max Phase'
              ) : (
                <>
                  Next Phase
                  <ChevronRight size={12} />
                </>
              )}
            </motion.button>

            {/* Reset button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleReset}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'rgba(56,189,248,0.08)',
                border:     '1px solid rgba(56,189,248,0.3)',
                color:      '#38bdf8',
                boxShadow:  '0 0 10px rgba(56,189,248,0.1)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(56,189,248,0.16)'
                e.currentTarget.style.boxShadow  = '0 0 20px rgba(56,189,248,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(56,189,248,0.08)'
                e.currentTarget.style.boxShadow  = '0 0 10px rgba(56,189,248,0.1)'
              }}
            >
              <RotateCcw size={12} />
              Reset
            </motion.button>
          </motion.div>
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
