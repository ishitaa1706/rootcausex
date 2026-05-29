import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Send, ChevronRight, ChevronDown } from 'lucide-react'
import SuggestedRuntimeQueries from './SuggestedRuntimeQueries'
import { api }                  from '../api/client'
import { useInvestigationFocus } from '../store/InvestigationFocusStore'

// ── Service color palette ─────────────────────────────────────────────────────
const SERVICE_COLOR = {
  auth:         '#38bdf8',
  payment:      '#a855f7',
  order:        '#22c55e',
  inventory:    '#f59e0b',
  notification: '#f43f5e',
}

function ServiceChip({ id }) {
  const color = SERVICE_COLOR[id] ?? '#64748b'
  return (
    <span
      className="text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase"
      style={{ background: `${color}18`, color, border: `1px solid ${color}28` }}
    >
      {id}
    </span>
  )
}

function ConfidenceBar({ value }) {
  const pct   = Math.round(value * 100)
  const color = pct >= 88 ? '#22c55e' : pct >= 72 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#334155' }}>
        confidence
      </span>
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ width: 56, background: 'rgba(255,255,255,0.05)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 9999 }}
        />
      </div>
      <span className="text-[10px] font-bold font-mono" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}

/**
 * AskRuntimePanel — Runtime Diagnosis panel, compact contextual querying layer.
 *
 * Features:
 *   - Free-form operational query input
 *   - Contextual suggested prompts (adapts to incident/investigation state)
 *   - Typewriter-style streaming response reveal
 *   - Investigation-context badge when AI investigation is active
 *   - prefill prop: auto-fills + submits when set (e.g. from anomaly card click)
 *
 * Props:
 *   incidentActive   — boolean (controls suggested queries)
 *   prefill          — string | null — auto-fill + submit when set
 *   onPrefillConsumed — () => void — called after prefill is consumed
 */
export default function AskRuntimePanel({ incidentActive, prefill, onPrefillConsumed }) {
  const [isOpen,        setIsOpen]        = useState(true)
  const [query,         setQuery]         = useState('')
  const [isLoading,     setIsLoading]     = useState(false)
  const [response,      setResponse]      = useState(null)
  const [typeText,      setTypeText]      = useState('')
  const [typeDone,      setTypeDone]      = useState(false)
  const [lastQuery,     setLastQuery]     = useState('')

  const inputRef    = useRef(null)
  const typeTimerRef = useRef(null)

  const { state: focusState } = useInvestigationFocus()
  const isInvestigating = focusState.isActive

  // ── Typewriter effect ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!response?.summary) return
    setTypeText('')
    setTypeDone(false)

    clearInterval(typeTimerRef.current)
    let i = 0
    const text = response.summary
    typeTimerRef.current = setInterval(() => {
      i++
      setTypeText(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(typeTimerRef.current)
        setTypeDone(true)
      }
    }, 11)
    return () => clearInterval(typeTimerRef.current)
  }, [response?.summary])

  // ── Prefill: auto-open, fill, and submit ──────────────────────────────────
  useEffect(() => {
    if (!prefill) return
    setIsOpen(true)
    setQuery(prefill)
    const timer = setTimeout(() => {
      handleSubmit(prefill)
      onPrefillConsumed?.()
    }, 80)
    return () => clearTimeout(timer)
  }, [prefill])

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (overrideQuery) => {
    const q = (overrideQuery ?? query).trim()
    if (!q || isLoading) return
    setQuery('')
    setLastQuery(q)
    setResponse(null)
    setTypeText('')
    setTypeDone(false)
    setIsLoading(true)

    // Build investigation context string for backend if active
    let investigationContext = null
    if (isInvestigating && focusState.propagationPath?.length > 0) {
      investigationContext =
        `AI investigation active — propagation path: ${focusState.propagationPath.join(' → ')}`
      if (focusState.affectedServices?.length > 0) {
        investigationContext += ` — affected: ${focusState.affectedServices.join(', ')}`
      }
    }

    try {
      const res = await api.runtimeQuery(q, investigationContext)
      setResponse(res)
    } catch {
      setResponse({
        summary:            'Failed to reach the runtime query service. Ensure the backend is running.',
        evidence:           [],
        services:           [],
        relatedDeployments: [],
        confidence:         0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSelectSuggestion = (q) => {
    setQuery(q)
    handleSubmit(q)
  }

  const handleClear = () => {
    setResponse(null)
    setTypeText('')
    setTypeDone(false)
    setLastQuery('')
    setQuery('')
    inputRef.current?.focus()
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const borderColor = isInvestigating ? 'rgba(168,85,247,0.2)' : 'rgba(56,189,248,0.1)'
  const dotColor    = isInvestigating ? '#a855f7'               : '#38bdf8'
  const accentColor = isInvestigating ? 'rgba(168,85,247,0.12)' : 'rgba(56,189,248,0.08)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: 0.1 }}
      className="mb-6 rounded-xl overflow-hidden"
      style={{
        background:     'rgba(3, 9, 22, 0.85)',
        border:         `1px solid ${borderColor}`,
        backdropFilter: 'blur(8px)',
        transition:     'border-color 0.4s',
      }}
    >
      {/* ── Header — click anywhere to collapse/expand ────────────────────── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 transition-colors duration-150"
        style={{
          borderBottom: isOpen ? `1px solid ${borderColor}` : 'none',
          cursor: 'pointer',
          background: 'transparent',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div className="flex items-center gap-2">
          <motion.span
            animate={isInvestigating ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: dotColor, boxShadow: `0 0 5px ${dotColor}`, display: 'inline-block' }}
          />
          <Terminal size={11} color="#475569" />
          <span className="text-xs font-bold uppercase tracking-[0.14em] font-mono" style={{ color: '#475569' }}>
            Runtime Diagnosis
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Investigation context badge */}
          <AnimatePresence>
            {isInvestigating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex items-center gap-1.5 text-[9px] font-bold font-mono px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(168,85,247,0.08)',
                  color:      '#a855f7',
                  border:     '1px solid rgba(168,85,247,0.22)',
                }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ●
                </motion.span>
                INVESTIGATION CONTEXT
              </motion.div>
            )}
          </AnimatePresence>

          {/* Response count pill when collapsed */}
          {!isOpen && response && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: `${dotColor}18`, color: dotColor, border: `1px solid ${dotColor}28` }}
            >
              1 result
            </span>
          )}

          {isOpen && response && (
            <button
              onClick={e => { e.stopPropagation(); handleClear() }}
              className="text-[10px] font-mono transition-colors duration-150"
              style={{ color: '#334155' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
              onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
            >
              clear
            </button>
          )}

          {!isInvestigating && (
            <span className="text-[10px] font-mono" style={{ color: '#1e3a5f' }}>
              runtime-aware
            </span>
          )}

          {/* Chevron — rotates on open/close */}
          <motion.div
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <ChevronDown size={13} color="#334155" />
          </motion.div>
        </div>
      </button>

      {/* ── Collapsible body ──────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {/* ── Input bar ─────────────────────────────────────────────── */}
            <div className="px-4 pt-3 pb-2">
              <div
                className="flex items-center gap-2 rounded-lg overflow-hidden transition-all duration-200"
                style={{
                  background: accentColor,
                  border:     `1px solid ${isInvestigating ? 'rgba(168,85,247,0.18)' : 'rgba(56,189,248,0.12)'}`,
                }}
              >
                <span className="pl-3 shrink-0 font-mono text-xs" style={{ color: '#334155' }}>
                  {'›'}
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isInvestigating
                      ? 'Ask about the active investigation…'
                      : 'Ask a runtime question — What changed recently?'
                  }
                  disabled={isLoading}
                  className="flex-1 py-2.5 text-xs font-mono bg-transparent outline-none disabled:opacity-50"
                  style={{ color: '#e2e8f0' }}
                />
                <button
                  onClick={() => handleSubmit()}
                  disabled={!query.trim() || isLoading}
                  className="mr-1.5 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 shrink-0"
                  style={{
                    background: query.trim() && !isLoading ? accentColor : 'transparent',
                    border:     `1px solid ${query.trim() && !isLoading
                      ? (isInvestigating ? 'rgba(168,85,247,0.35)' : 'rgba(56,189,248,0.28)')
                      : 'rgba(255,255,255,0.05)'}`,
                    color: query.trim() && !isLoading ? dotColor : '#1e3a5f',
                  }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                      className="w-3 h-3 rounded-full border border-t-transparent"
                      style={{ borderColor: dotColor, borderTopColor: 'transparent' }}
                    />
                  ) : (
                    <Send size={11} />
                  )}
                </button>
              </div>

              {/* Suggested queries — shown when no response */}
              <AnimatePresence>
                {!response && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2.5"
                  >
                    <SuggestedRuntimeQueries
                      incidentActive={incidentActive}
                      onSelect={handleSelectSuggestion}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Response area ──────────────────────────────────────────── */}
            <AnimatePresence>
              {(isLoading || response) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div
                    className="mx-4 mb-4 rounded-lg p-3.5"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border:     `1px solid ${isInvestigating ? 'rgba(168,85,247,0.12)' : 'rgba(56,189,248,0.08)'}`,
                    }}
                  >
                    {/* Query echo */}
                    {lastQuery && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <ChevronRight size={10} color="#334155" />
                        <span className="text-[10px] font-mono italic" style={{ color: '#334155' }}>
                          {lastQuery}
                        </span>
                      </div>
                    )}

                    {/* Loading state */}
                    {isLoading && (
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="flex items-center gap-2 text-xs font-mono"
                        style={{ color: '#334155' }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-3 h-3 rounded-full border border-t-transparent shrink-0"
                          style={{ borderColor: dotColor, borderTopColor: 'transparent' }}
                        />
                        Querying runtime context…
                      </motion.div>
                    )}

                    {/* Typewriter summary */}
                    {!isLoading && response && (
                      <>
                        <div className="mb-3">
                          <p className="text-xs font-mono leading-relaxed" style={{ color: '#94a3b8' }}>
                            {typeText}
                            {!typeDone && (
                              <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                style={{ color: dotColor }}
                              >
                                ▋
                              </motion.span>
                            )}
                          </p>
                        </div>

                        {/* Evidence */}
                        <AnimatePresence>
                          {typeDone && response.evidence?.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mb-3"
                            >
                              <div
                                className="text-[9px] font-bold font-mono uppercase tracking-[0.14em] mb-1.5"
                                style={{ color: '#334155' }}
                              >
                                Evidence
                              </div>
                              <ul className="flex flex-col gap-1.5">
                                {response.evidence.map((item, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.07, duration: 0.2 }}
                                    className="flex gap-2"
                                  >
                                    <span className="shrink-0 mt-0.5" style={{ color: '#334155' }}>·</span>
                                    <span className="text-[11px] font-mono leading-relaxed" style={{ color: '#475569' }}>
                                      {item}
                                    </span>
                                  </motion.li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Services + confidence */}
                        <AnimatePresence>
                          {typeDone && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: (response.evidence?.length ?? 0) * 0.07 + 0.1 }}
                              className="flex items-center justify-between gap-3 flex-wrap pt-2"
                              style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {response.services?.map(svc => (
                                  <ServiceChip key={svc} id={svc} />
                                ))}
                              </div>
                              {response.confidence > 0 && (
                                <ConfidenceBar value={response.confidence} />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Related deployments */}
                        <AnimatePresence>
                          {typeDone && response.relatedDeployments?.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="mt-2.5 pt-2"
                              style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                            >
                              <div
                                className="text-[9px] font-bold font-mono uppercase tracking-[0.14em] mb-1.5"
                                style={{ color: '#334155' }}
                              >
                                Related Deployments
                              </div>
                              {response.relatedDeployments.map((dep, i) => {
                                const isHigh = dep.includes('[HIGH')
                                const isMed  = dep.includes('[MEDIUM') || dep.includes('[MONITOR')
                                const color  = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#334155'
                                return (
                                  <div key={i} className="flex gap-2 mb-1">
                                    <span className="shrink-0 mt-0.5 text-[10px]" style={{ color }}>›</span>
                                    <span className="text-[11px] font-mono leading-relaxed" style={{ color: isHigh ? '#64748b' : '#475569' }}>
                                      {dep}
                                    </span>
                                  </div>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
