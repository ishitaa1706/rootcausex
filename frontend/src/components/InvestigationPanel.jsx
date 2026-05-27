import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, AlertTriangle, XCircle, ChevronRight, Send, Shield } from 'lucide-react'
import AIReasoningStream from './AIReasoningStream'
import { api } from '../api/client'

const SERVICE_TAG = {
  auth:         { color: '#38bdf8', label: 'AUTH'  },
  payment:      { color: '#a855f7', label: 'PAY'   },
  order:        { color: '#22c55e', label: 'ORD'   },
  inventory:    { color: '#f59e0b', label: 'INV'   },
  notification: { color: '#f43f5e', label: 'NOTIF' },
}

function ServiceChip({ serviceId }) {
  const t = SERVICE_TAG[serviceId] ?? { color: '#94a3b8', label: serviceId?.toUpperCase() }
  return (
    <span
      className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
      style={{ background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30` }}
    >
      {t.label}
    </span>
  )
}

function SectionHeading({ label, color = '#475569' }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span
        className="text-[10px] font-bold uppercase tracking-[0.15em] font-mono"
        style={{ color }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: `${color}20` }} />
    </div>
  )
}

/**
 * InvestigationPanel — right-side investigation drawer.
 *
 * Props:
 *   anomaly       — the anomaly that triggered investigation (or null if timeline event)
 *   eventId       — timeline event id (or null if anomaly)
 *   onClose       — callback to close the panel
 *   onRcaReady    — callback(propagationPath) when RCA is loaded, used to highlight graph
 */
export default function InvestigationPanel({ anomaly, eventId, onClose, onRcaReady }) {
  const [status,          setStatus]          = useState('reasoning')  // reasoning | complete | error
  const [rca,             setRca]             = useState(null)
  const [animationDone,   setAnimationDone]   = useState(false)
  const [followUpInput,   setFollowUpInput]   = useState('')
  const [followUpMsgs,    setFollowUpMsgs]    = useState([])
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const chatEndRef = useRef(null)

  // Fetch RCA on mount
  useEffect(() => {
    const anomalyId       = anomaly?.id   ?? null
    const timelineEventId = eventId       ?? null

    api.postInvestigate(anomalyId, timelineEventId)
      .then(data => {
        setRca(data)
        if (onRcaReady) onRcaReady(data.propagationPath ?? [])
      })
      .catch(() => setStatus('error'))
  }, [])

  // Show RCA only when both animation done AND data ready
  useEffect(() => {
    if (animationDone && rca) setStatus('complete')
  }, [animationDone, rca])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [followUpMsgs])

  const handleFollowUp = async () => {
    if (!followUpInput.trim() || !rca?.id) return
    const question = followUpInput.trim()
    setFollowUpInput('')
    setFollowUpMsgs(prev => [...prev, { role: 'user', content: question }])
    setFollowUpLoading(true)

    try {
      const res = await api.postFollowUp(rca.id, question)
      setFollowUpMsgs(prev => [...prev, { role: 'ai', content: res.answer }])
    } catch {
      setFollowUpMsgs(prev => [...prev, { role: 'ai', content: 'Failed to get a response. Please try again.' }])
    } finally {
      setFollowUpLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleFollowUp()
    }
  }

  const triggerLabel = anomaly
    ? `${anomaly.anomalyType?.replace(/_/g, ' ')} · ${anomaly.serviceName}`
    : `Timeline Event · ${eventId}`

  const severityColor = anomaly?.severity === 'critical' ? '#ef4444' : '#f59e0b'

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0,      opacity: 1 }}
      exit={{    x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed top-0 right-0 bottom-0 flex flex-col overflow-hidden z-50"
      style={{
        width: 480,
        background: 'rgba(3, 9, 22, 0.97)',
        borderLeft: '1px solid rgba(56,189,248,0.15)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.6), -4px 0 20px rgba(56,189,248,0.05)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-start justify-between px-5 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Search size={13} color="#38bdf8" />
            <span className="text-xs font-bold uppercase tracking-widest font-mono" style={{ color: '#38bdf8' }}>
              AI Investigation
            </span>
          </div>
          <p className="text-xs font-mono truncate" style={{ color: '#475569' }}>
            {triggerLabel}
          </p>
        </div>

        {/* Confidence badge — shown when complete */}
        {status === 'complete' && rca && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-3 flex flex-col items-center shrink-0"
          >
            <span className="text-[10px] font-mono uppercase tracking-widest mb-0.5" style={{ color: '#334155' }}>
              Confidence
            </span>
            <span
              className="text-lg font-bold font-mono"
              style={{ color: rca.confidenceScore >= 80 ? '#22c55e' : '#f59e0b' }}
            >
              {rca.confidenceScore}%
            </span>
          </motion.div>
        )}

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          <X size={13} />
        </button>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin' }}>

        {/* Reasoning animation */}
        <AnimatePresence>
          {status === 'reasoning' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AIReasoningStream
                isActive={status === 'reasoning'}
                onComplete={() => setAnimationDone(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {status === 'error' && (
          <div className="flex flex-col gap-4 py-6">
            <div className="flex items-center gap-2">
              <XCircle size={14} color="#ef4444" />
              <span className="text-xs font-bold uppercase tracking-widest font-mono" style={{ color: '#ef4444' }}>
                Investigation Failed
              </span>
            </div>
            <div
              className="rounded-lg p-4"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <p className="text-xs font-mono leading-relaxed" style={{ color: '#94a3b8' }}>
                Claude API is not configured.
              </p>
              <p className="text-xs font-mono leading-relaxed mt-2" style={{ color: '#475569' }}>
                Set <span style={{ color: '#38bdf8' }}>ANTHROPIC_API_KEY</span> as an environment
                variable before starting the backend, then restart.
              </p>
              <pre
                className="text-[11px] font-mono mt-3 p-2 rounded"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#64748b' }}
              >
                {`export ANTHROPIC_API_KEY=sk-ant-...\ncd backend && mvn spring-boot:run`}
              </pre>
            </div>
          </div>
        )}

        {/* RCA sections */}
        <AnimatePresence>
          {status === 'complete' && rca && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-5"
            >
              {/* Title */}
              <div>
                <h2 className="text-sm font-bold leading-snug mb-1" style={{ color: '#e2e8f0' }}>
                  {rca.title}
                </h2>
              </div>

              {/* 1. Probable Root Cause */}
              <div
                className="rounded-lg p-3"
                style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)' }}
              >
                <SectionHeading label="Probable Root Cause" color="#38bdf8" />
                <p className="text-xs font-mono leading-relaxed" style={{ color: '#94a3b8' }}>
                  {rca.probableRootCause}
                </p>
              </div>

              {/* 2. Propagation Path */}
              {rca.propagationPath?.length > 0 && (
                <div>
                  <SectionHeading label="Propagation Path" color="#a855f7" />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {rca.propagationPath.map((svc, i) => (
                      <div key={svc} className="flex items-center gap-1.5">
                        <ServiceChip serviceId={svc} />
                        {i < rca.propagationPath.length - 1 && (
                          <ChevronRight size={11} color="#334155" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Affected Services */}
              {rca.affectedServices?.length > 0 && (
                <div>
                  <SectionHeading label="Affected Services" color="#f59e0b" />
                  <div className="flex flex-wrap gap-1.5">
                    {rca.affectedServices.map(svc => (
                      <ServiceChip key={svc} serviceId={svc} />
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Supporting Evidence */}
              {rca.supportingEvidence?.length > 0 && (
                <div>
                  <SectionHeading label="Supporting Evidence" color="#64748b" />
                  <ul className="flex flex-col gap-2">
                    {rca.supportingEvidence.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="shrink-0 mt-0.5" style={{ color: '#334155' }}>·</span>
                        <span className="text-xs font-mono leading-relaxed" style={{ color: '#64748b' }}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 5. Recommended Actions */}
              {rca.recommendedActions?.length > 0 && (
                <div>
                  <SectionHeading label="Recommended Actions" color="#22c55e" />
                  <ul className="flex flex-col gap-2">
                    {rca.recommendedActions.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span
                          className="text-[10px] font-bold font-mono shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-xs font-mono leading-relaxed" style={{ color: '#64748b' }}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up message thread */}
              {followUpMsgs.length > 0 && (
                <div
                  className="flex flex-col gap-3 pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <SectionHeading label="Follow-up Investigation" color="#475569" />
                  {followUpMsgs.map((msg, i) => (
                    <div
                      key={i}
                      className="rounded-lg p-3"
                      style={{
                        background: msg.role === 'user'
                          ? 'rgba(56,189,248,0.06)'
                          : 'rgba(168,85,247,0.05)',
                        border: `1px solid ${msg.role === 'user' ? 'rgba(56,189,248,0.12)' : 'rgba(168,85,247,0.12)'}`,
                      }}
                    >
                      <span
                        className="text-[10px] font-bold font-mono uppercase tracking-widest block mb-1"
                        style={{ color: msg.role === 'user' ? '#38bdf8' : '#a855f7' }}
                      >
                        {msg.role === 'user' ? 'You' : 'AI'}
                      </span>
                      <p className="text-xs font-mono leading-relaxed" style={{ color: '#94a3b8' }}>
                        {msg.content}
                      </p>
                    </div>
                  ))}
                  {followUpLoading && (
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="text-xs font-mono"
                      style={{ color: '#334155' }}
                    >
                      AI is reasoning...
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Follow-up input ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {status === 'complete' && rca && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="shrink-0 px-4 py-3"
            style={{ borderTop: '1px solid rgba(56,189,248,0.08)' }}
          >
            <div
              className="flex items-end gap-2 rounded-lg overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.1)' }}
            >
              <textarea
                rows={1}
                placeholder="Ask a follow-up question..."
                value={followUpInput}
                onChange={e => setFollowUpInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-3 py-2.5 text-xs font-mono resize-none outline-none bg-transparent"
                style={{
                  color: '#e2e8f0',
                  lineHeight: 1.5,
                  minHeight: 38,
                  maxHeight: 100,
                }}
              />
              <button
                onClick={handleFollowUp}
                disabled={!followUpInput.trim() || followUpLoading}
                className="m-1.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                style={{
                  background: followUpInput.trim()
                    ? 'rgba(56,189,248,0.15)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${followUpInput.trim()
                    ? 'rgba(56,189,248,0.3)'
                    : 'rgba(255,255,255,0.06)'}`,
                  color: followUpInput.trim() ? '#38bdf8' : '#334155',
                }}
              >
                <Send size={11} />
              </button>
            </div>
            <p className="text-[10px] font-mono mt-1.5" style={{ color: '#1e3a5f' }}>
              AI answers from the original investigation context · Enter to send
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
