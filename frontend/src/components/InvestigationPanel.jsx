import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Search, AlertTriangle, XCircle, ChevronRight,
  Send, GitCommit, Users, Zap, Shield, Activity, GitMerge,
} from 'lucide-react'
import AIReasoningStream  from './AIReasoningStream'
import RCAInsightCard     from './RCAInsightCard'
import SuggestedQuestions from './SuggestedQuestions'
import { api }            from '../api/client'
import { useInvestigationFocus } from '../store/InvestigationFocusStore'

// ── Service colour map ────────────────────────────────────────────────────────
const SERVICE_TAG = {
  auth:         { color: '#38bdf8', label: 'AUTH'  },
  payment:      { color: '#a855f7', label: 'PAY'   },
  order:        { color: '#22c55e', label: 'ORD'   },
  inventory:    { color: '#f59e0b', label: 'INV'   },
  notification: { color: '#f43f5e', label: 'NOTIF' },
}

// ── Severity badge config ─────────────────────────────────────────────────────
const SEVERITY_CFG = {
  P0: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)',  label: 'P0 — Critical' },
  P1: { color: '#f97316', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.28)', label: 'P1 — Major'    },
  P2: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.24)', label: 'P2 — Minor'    },
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

/**
 * Animated confidence counter — counts up from a lower value to the real score.
 * Gives the feeling that the AI is calculating confidence in real-time.
 */
function useConfidenceAnimation(targetScore, active) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (!active || !targetScore) return
    const start    = Math.max(targetScore - 32, 50)
    const duration = 1600
    const t0       = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - t0) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayed(Math.round(start + (targetScore - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [active, targetScore])

  return displayed
}

/**
 * InvestigationPanel — right-side AI investigation drawer.
 *
 * Phase 5 upgrades:
 *   - Syncs with InvestigationFocusStore to drive graph propagation animation
 *   - Animated confidence counter
 *   - RCAInsightCard sections (polished card layout)
 *   - SuggestedQuestions for follow-up UX
 *   - onStageChange wired into AIReasoningStream → store
 *
 * Props:
 *   anomaly    — anomaly that triggered investigation (null if timeline event)
 *   eventId    — timeline event id (null if anomaly)
 *   onClose    — callback to close the panel
 *   onRcaReady — callback(propagationPath) when RCA loads (for graph highlight in App)
 */
export default function InvestigationPanel({ anomaly, eventId, onClose, onRcaReady }) {
  // 'reasoning' | 'complete' | 'error'
  const [status,          setStatus]          = useState('reasoning')
  const [rca,             setRca]             = useState(null)
  const [animationDone,   setAnimationDone]   = useState(false)
  const [followUpInput,   setFollowUpInput]   = useState('')
  const [followUpMsgs,    setFollowUpMsgs]    = useState([])
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const chatEndRef = useRef(null)

  // ── Cognition store ────────────────────────────────────────────────────────
  const { startInvestigation, setStage, rcaReady: storeRcaReady, closeInvestigation } = useInvestigationFocus()

  // Animated confidence counter
  const displayConfidence = useConfidenceAnimation(rca?.confidenceScore ?? 0, status === 'complete')

  // ── Fetch RCA on mount ────────────────────────────────────────────────────
  useEffect(() => {
    setStatus('reasoning')
    setRca(null)
    setAnimationDone(false)
    setFollowUpMsgs([])

    let cancelled = false
    const triggerId = anomaly?.id ?? eventId ?? 'unknown'
    startInvestigation(triggerId)

    api.postInvestigate(anomaly?.id ?? null, eventId ?? null)
      .then(data => {
        if (cancelled) return
        setRca(data)
        // Notify app to update investigationPath → highlights graph
        if (onRcaReady) onRcaReady(data.propagationPath ?? [])
        // Drive the store → triggers step-by-step graph animation
        storeRcaReady(data)
      })
      .catch(() => { if (!cancelled) setStatus('error') })

    return () => {
      cancelled = true
      closeInvestigation()
    }
  }, [anomaly?.id, eventId])

  // Show RCA content only when BOTH animation done AND data ready
  useEffect(() => {
    if (animationDone && rca) setStatus('complete')
  }, [animationDone, rca])

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [followUpMsgs])

  // ── Follow-up ─────────────────────────────────────────────────────────────
  const handleFollowUp = async (questionOverride) => {
    const question = (questionOverride ?? followUpInput).trim()
    if (!question || !rca?.id || followUpLoading) return
    setFollowUpInput('')
    setFollowUpMsgs(prev => [...prev, { role: 'user', content: question }])
    setFollowUpLoading(true)
    try {
      const res = await api.postFollowUp(rca.id, question)
      setFollowUpMsgs(prev => [...prev, { role: 'ai', content: res.answer }])
    } catch {
      setFollowUpMsgs(prev => [...prev, { role: 'ai', content: 'Failed to get a response — please try again.' }])
    } finally {
      setFollowUpLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFollowUp() }
  }

  // ── Derived display values ────────────────────────────────────────────────
  const triggerLabel = anomaly
    ? `${anomaly.anomalyType?.replace(/_/g, ' ')} · ${anomaly.serviceName}`
    : `Timeline Event · ${eventId}`

  const rcaSeverity = rca?.severity ?? 'P1'
  const sevCfg      = SEVERITY_CFG[rcaSeverity] ?? SEVERITY_CFG.P1

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0,      opacity: 1 }}
      exit={{    x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed top-0 right-0 bottom-0 flex flex-col overflow-hidden z-50"
      style={{
        width:          480,
        background:     'rgba(3, 9, 22, 0.97)',
        borderLeft:     '1px solid rgba(56,189,248,0.15)',
        boxShadow:      '-20px 0 60px rgba(0,0,0,0.6), -4px 0 20px rgba(56,189,248,0.05)',
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
            <motion.div
              animate={status === 'reasoning'
                ? { opacity: [1, 0.3, 1] }
                : {}}
              transition={{ duration: 1.1, repeat: Infinity }}
            >
              <Search size={13} color="#38bdf8" />
            </motion.div>
            <span className="text-xs font-bold uppercase tracking-widest font-mono" style={{ color: '#38bdf8' }}>
              AI Investigation
            </span>
            {status === 'reasoning' && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-[9px] font-mono uppercase tracking-widest"
                style={{ color: '#1e3a5f' }}
              >
                cognition active
              </motion.span>
            )}
          </div>
          <p className="text-xs font-mono truncate" style={{ color: '#475569' }}>
            {triggerLabel}
          </p>
        </div>

        {/* Confidence + P-level badge — animated in when complete */}
        {status === 'complete' && rca && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mx-3 flex items-center gap-2 shrink-0"
          >
            <span
              className="text-[11px] font-bold font-mono px-2 py-1 rounded"
              style={{ background: sevCfg.bg, color: sevCfg.color, border: `1px solid ${sevCfg.border}` }}
            >
              {rcaSeverity}
            </span>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono uppercase tracking-widest mb-0" style={{ color: '#334155' }}>
                conf
              </span>
              <motion.span
                className="text-sm font-bold font-mono"
                style={{ color: (rca.confidenceScore ?? 0) >= 85 ? '#22c55e' : '#f59e0b' }}
              >
                {displayConfidence}%
              </motion.span>
            </div>
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

        {/* AI reasoning animation (while loading) */}
        <AnimatePresence>
          {status === 'reasoning' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AIReasoningStream
                isActive
                onComplete={() => setAnimationDone(true)}
                onStageChange={(i) => setStage(i)}
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
            <div className="rounded-lg p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs font-mono leading-relaxed" style={{ color: '#94a3b8' }}>
                Failed to run investigation. Check that the backend is running and reachable.
              </p>
              <p className="text-xs font-mono leading-relaxed mt-2" style={{ color: '#475569' }}>
                To enable live Claude analysis, set{' '}
                <span style={{ color: '#38bdf8' }}>ANTHROPIC_API_KEY</span> before starting the backend.
                Without it, MOCK mode is used automatically.
              </p>
            </div>
          </div>
        )}

        {/* ── RCA sections ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {status === 'complete' && rca && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38 }}
              className="flex flex-col gap-3"
            >
              {/* Title */}
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="text-sm font-bold leading-snug"
                style={{ color: '#e2e8f0' }}
              >
                {rca.title}
              </motion.h2>

              {/* ── End User Impact ─────────────────────────────────────────── */}
              {rca.endUserImpact && (
                <RCAInsightCard icon={Users} label={`${rcaSeverity} · End User Impact`} color={sevCfg.color} delay={0.06}>
                  <p className="text-xs font-mono leading-relaxed" style={{ color: '#e2e8f0' }}>
                    {rca.endUserImpact}
                  </p>
                </RCAInsightCard>
              )}

              {/* ── Probable Root Cause ─────────────────────────────────────── */}
              <RCAInsightCard icon={Zap} label="Probable Root Cause" color="#38bdf8" delay={0.1}>
                <ul className="flex flex-col gap-2">
                  {rca.probableRootCause
                    .split(/(?<=\.)\s+/)
                    .filter(s => s.trim().length > 0)
                    .map((sentence, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="shrink-0 mt-0.5" style={{ color: '#38bdf8' }}>·</span>
                        <span className="text-xs font-mono leading-relaxed" style={{ color: '#94a3b8' }}>
                          {sentence.trim()}
                        </span>
                      </li>
                    ))
                  }
                </ul>
              </RCAInsightCard>

              {/* ── Propagation Path ───────────────────────────────────────── */}
              {rca.propagationPath?.length > 0 && (
                <RCAInsightCard icon={GitMerge} label="Propagation Path" color="#a855f7" delay={0.14}>
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
                </RCAInsightCard>
              )}

              {/* ── Affected Services ──────────────────────────────────────── */}
              {rca.affectedServices?.length > 0 && (
                <RCAInsightCard icon={Activity} label="Affected Services" color="#f59e0b" delay={0.18}>
                  <div className="flex flex-wrap gap-1.5">
                    {rca.affectedServices.map(svc => (
                      <ServiceChip key={svc} serviceId={svc} />
                    ))}
                  </div>
                </RCAInsightCard>
              )}

              {/* ── Correlated Deployments ────────────────────────────────── */}
              {rca.correlatedDeployments?.length > 0 && (
                <RCAInsightCard icon={GitCommit} label="Correlated Deployments" color="#f97316" delay={0.22}>
                  <ul className="flex flex-col gap-2">
                    {rca.correlatedDeployments.map((item, i) => {
                      const isHigh = item.includes('[HIGH SIGNAL]')
                      const isMed  = item.includes('[MEDIUM SIGNAL]')
                      const dotColor = isHigh ? '#ef4444' : isMed ? '#f97316' : '#334155'
                      return (
                        <li key={i} className="flex gap-2">
                          <GitCommit size={11} color={dotColor} className="shrink-0 mt-0.5" />
                          <span className="text-xs font-mono leading-relaxed" style={{ color: isHigh ? '#94a3b8' : '#475569' }}>
                            {item}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </RCAInsightCard>
              )}

              {/* ── Supporting Evidence ───────────────────────────────────── */}
              {rca.supportingEvidence?.length > 0 && (
                <RCAInsightCard icon={Shield} label="Supporting Evidence" color="#64748b" delay={0.26}>
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
                </RCAInsightCard>
              )}

              {/* ── Recommended Actions ──────────────────────────────────── */}
              {rca.recommendedActions?.length > 0 && (
                <RCAInsightCard icon={AlertTriangle} label="Recommended Actions" color="#22c55e" delay={0.3}>
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
                </RCAInsightCard>
              )}

              {/* ── Suggested follow-up questions ────────────────────────── */}
              {followUpMsgs.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="pt-2"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <SuggestedQuestions
                    rca={rca}
                    onSelect={(q) => {
                      setFollowUpInput(q)
                      handleFollowUp(q)
                    }}
                  />
                </motion.div>
              )}

              {/* ── Follow-up message thread ─────────────────────────────── */}
              {followUpMsgs.length > 0 && (
                <div className="flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div
                    className="text-[10px] font-mono uppercase tracking-[0.14em] mb-0"
                    style={{ color: '#334155' }}
                  >
                    Follow-up Investigation
                  </div>

                  {followUpMsgs.map((msg, i) => (
                    <div
                      key={i}
                      className="rounded-lg p-3"
                      style={{
                        background: msg.role === 'user' ? 'rgba(56,189,248,0.06)' : 'rgba(168,85,247,0.05)',
                        border:     `1px solid ${msg.role === 'user' ? 'rgba(56,189,248,0.12)' : 'rgba(168,85,247,0.12)'}`,
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
                      className="flex items-center gap-2 text-xs font-mono"
                      style={{ color: '#334155' }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-3 h-3 border border-t-transparent rounded-full"
                        style={{ borderColor: '#1e3a5f', borderTopColor: 'transparent' }}
                      />
                      AI is reasoning…
                    </motion.div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Follow-up input (sticky footer) ──────────────────────────────────── */}
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
                placeholder="Ask a follow-up question…"
                value={followUpInput}
                onChange={e => setFollowUpInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-3 py-2.5 text-xs font-mono resize-none outline-none bg-transparent"
                style={{ color: '#e2e8f0', lineHeight: 1.5, minHeight: 38, maxHeight: 100 }}
              />
              <button
                onClick={() => handleFollowUp()}
                disabled={!followUpInput.trim() || followUpLoading}
                className="m-1.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                style={{
                  background: followUpInput.trim() ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
                  border:     `1px solid ${followUpInput.trim() ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color:      followUpInput.trim() ? '#38bdf8' : '#334155',
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
