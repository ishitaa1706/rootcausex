import { motion } from 'framer-motion'

/**
 * Generates contextually-appropriate follow-up questions from the RCA.
 * Questions reference the actual service names and propagation path.
 */
function getQuestions(rca) {
  const path = rca?.propagationPath ?? []
  const root = path[0]
  const tail = path[path.length - 1]

  return [
    root
      ? `What specifically in ${root}-service triggered this cascade?`
      : 'What triggered the initial instability?',
    'Which deployment commit introduced this failure mode?',
    path.length > 1 && tail !== root
      ? `How severely was ${tail}-service impacted downstream?`
      : 'Which downstream service was most affected?',
    'How can we prevent this failure pattern in the future?',
  ]
}

/**
 * SuggestedQuestions — contextual follow-up question chips.
 *
 * Clicking a chip pre-fills the follow-up input (via onSelect).
 * Questions are dynamically generated from the RCA's propagation path.
 *
 * Props:
 *   rca      — the InvestigationResponse object
 *   onSelect — (question: string) => void
 */
export default function SuggestedQuestions({ rca, onSelect }) {
  const questions = getQuestions(rca)

  return (
    <div>
      <div
        className="text-[10px] font-mono uppercase tracking-[0.14em] mb-2"
        style={{ color: '#1e3a5f' }}
      >
        Suggested questions
      </div>

      <div className="flex flex-col gap-1.5">
        {questions.map((q, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, delay: i * 0.06 }}
            onClick={() => onSelect(q)}
            className="text-left text-xs font-mono px-3 py-2 rounded-lg transition-all duration-150 flex items-start gap-2 w-full"
            style={{
              background: 'rgba(56,189,248,0.03)',
              border:     '1px solid rgba(56,189,248,0.07)',
              color:      '#475569',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background   = 'rgba(56,189,248,0.08)'
              e.currentTarget.style.borderColor  = 'rgba(56,189,248,0.18)'
              e.currentTarget.style.color        = '#94a3b8'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background   = 'rgba(56,189,248,0.03)'
              e.currentTarget.style.borderColor  = 'rgba(56,189,248,0.07)'
              e.currentTarget.style.color        = '#475569'
            }}
          >
            <span style={{ color: '#334155', flexShrink: 0 }}>›</span>
            <span className="leading-relaxed">{q}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
