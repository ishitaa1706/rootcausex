import { motion } from 'framer-motion'

/**
 * RCAInsightCard — styled intelligence card for RCA output sections.
 *
 * Each RCA section (Root Cause, Propagation, Evidence, etc.) renders inside
 * one of these cards. The card header carries the section label + icon with
 * the section's accent color, giving each section a distinct identity.
 *
 * Props:
 *   icon     — Lucide icon component (optional)
 *   label    — section heading (UPPER CASE)
 *   color    — hex accent color (e.g. '#38bdf8')
 *   delay    — framer-motion entrance stagger delay (seconds)
 *   children — card body content
 */
export default function RCAInsightCard({ icon: Icon, label, color, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl overflow-hidden"
      style={{
        background: `${color}05`,
        border:     `1px solid ${color}1a`,
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{
          background:   `${color}09`,
          borderBottom: `1px solid ${color}14`,
        }}
      >
        {Icon && <Icon size={11} color={color} />}
        <span
          className="text-[10px] font-bold uppercase tracking-[0.16em] font-mono"
          style={{ color }}
        >
          {label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {children}
      </div>
    </motion.div>
  )
}
