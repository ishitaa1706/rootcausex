import { motion } from 'framer-motion'
import { useInvestigationFocus } from '../store/InvestigationFocusStore'

// ── Contextual query sets ─────────────────────────────────────────────────────

const HEALTHY_QUERIES = [
  'Why are password reset logins failing?',
  'What changed recently?',
  'Which services depend on auth?',
  'Any auth deployments today?',
]

const INCIDENT_QUERIES = [
  'Which deployment triggered this?',
  'Which service propagated first?',
  'Has this incident occurred before?',
  'How did auth failure spread downstream?',
]

const INVESTIGATION_QUERIES = (service) => [
  `Why is ${service}-service unstable?`,
  `How is ${service} affecting downstream services?`,
  'Did deployment timing correlate with retry spikes?',
  'What are the recommended actions?',
]

/**
 * SuggestedRuntimeQueries — contextual quick-prompt chips.
 *
 * Adapts to runtime state:
 *   - Healthy system    → general operational queries
 *   - Incident active   → incident-specific queries
 *   - Investigation active → investigation-aware queries
 *
 * Props:
 *   incidentActive — boolean
 *   onSelect       — (query: string) => void
 */
export default function SuggestedRuntimeQueries({ incidentActive, onSelect }) {
  const { state } = useInvestigationFocus()

  let queries
  if (state.isActive && state.propagationPath?.length > 0) {
    // Use the root service (first in propagation path)
    queries = INVESTIGATION_QUERIES(state.propagationPath[0])
  } else if (incidentActive) {
    queries = INCIDENT_QUERIES
  } else {
    queries = HEALTHY_QUERIES
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {queries.map((q, i) => (
        <motion.button
          key={q}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: i * 0.04 }}
          onClick={() => onSelect(q)}
          className="text-[10px] font-mono px-2.5 py-1 rounded-full transition-all duration-150"
          style={{
            background: state.isActive ? 'rgba(168,85,247,0.07)' : 'rgba(56,189,248,0.06)',
            border:     state.isActive ? '1px solid rgba(168,85,247,0.2)' : '1px solid rgba(56,189,248,0.14)',
            color:      state.isActive ? '#a855f7' : '#475569',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = state.isActive ? 'rgba(168,85,247,0.14)' : 'rgba(56,189,248,0.12)'
            e.currentTarget.style.color      = state.isActive ? '#c084fc' : '#64748b'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = state.isActive ? 'rgba(168,85,247,0.07)' : 'rgba(56,189,248,0.06)'
            e.currentTarget.style.color      = state.isActive ? '#a855f7' : '#475569'
          }}
        >
          {q}
        </motion.button>
      ))}
    </div>
  )
}
