import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, AlertTriangle, XCircle, GitBranch,
  GitMerge, Play, Pause, SkipBack, SkipForward, Radio, Search
} from 'lucide-react'
import { api } from '../api/client'

// ─── Config ───────────────────────────────────────────────────────────────────

const EVENT_TYPE = {
  DEPLOYMENT: {
    icon: Rocket, color: '#38bdf8',
    bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.25)',
    badge: 'rgba(56,189,248,0.15)', label: 'DEPLOY',
  },
  DRIFT_DETECTED: {
    icon: AlertTriangle, color: '#eab308',
    bg: 'rgba(234,179,8,0.07)', border: 'rgba(234,179,8,0.22)',
    badge: 'rgba(234,179,8,0.13)', label: 'DRIFT',
  },
  ANOMALY: {
    icon: AlertTriangle, color: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.22)',
    badge: 'rgba(245,158,11,0.13)', label: 'ANOMALY',
  },
  SERVICE_DEGRADED: {
    icon: AlertTriangle, color: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)',
    badge: 'rgba(245,158,11,0.13)', label: 'DEGRADED',
  },
  SERVICE_CRITICAL: {
    icon: XCircle, color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.28)',
    badge: 'rgba(239,68,68,0.14)', label: 'CRITICAL',
  },
  CASCADE_PROPAGATION: {
    icon: GitMerge, color: '#a855f7',
    bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.28)',
    badge: 'rgba(168,85,247,0.14)', label: 'CASCADE',
  },
}

const PHASE_LABELS = ['Healthy', 'Initial Drift', 'Partial Cascade', 'Escalation', 'Full Cascade']
const PHASE_COLORS = ['#22c55e', '#eab308', '#f59e0b', '#ef4444', '#ef4444']

const SERVICE_TAG = {
  auth:         { color: '#38bdf8', label: 'AUTH' },
  payment:      { color: '#a855f7', label: 'PAY'  },
  order:        { color: '#22c55e', label: 'ORD'  },
  inventory:    { color: '#f59e0b', label: 'INV'  },
  notification: { color: '#f43f5e', label: 'NOTIF'},
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ServiceBadge({ serviceId }) {
  const t = SERVICE_TAG[serviceId] ?? { color: '#475569', label: serviceId.toUpperCase() }
  return (
    <span
      className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded"
      style={{ background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30` }}
    >
      {t.label}
    </span>
  )
}

function TimelineEventRow({ event, isActive, isPast, isUsedInRca, onClick, onInvestigate }) {
  const cfg  = EVENT_TYPE[event.eventType] ?? EVENT_TYPE.ANOMALY
  const Icon = cfg.icon

  const opacity = isActive ? 1 : isPast ? 0.7 : 0.25

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 group cursor-pointer"
      onClick={onClick}
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 32 }}>
        <motion.div
          animate={isActive ? {
            boxShadow: [`0 0 0px ${cfg.color}`, `0 0 14px ${cfg.color}80`, `0 0 0px ${cfg.color}`]
          } : {}}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: isActive ? cfg.bg : 'rgba(15,23,42,0.8)',
            border: `1px solid ${isActive ? cfg.color : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          <Icon size={12} color={isActive ? cfg.color : '#334155'} />
        </motion.div>
        <div style={{ flex: 1, width: 1, background: 'rgba(255,255,255,0.04)', minHeight: 10 }} />
      </div>

      {/* Event card */}
      <motion.div
        whileHover={isActive || isPast ? { x: 3, transition: { duration: 0.15 } } : {}}
        className="flex-1 pb-4 rounded-lg px-3 py-2.5 mb-1"
        style={{
          background: isActive ? cfg.bg : 'transparent',
          border: `1px solid ${isActive ? cfg.border : 'transparent'}`,
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] font-mono" style={{ color: '#334155' }}>
            {event.timestamp}
          </span>
          <span
            className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded tracking-wider"
            style={{ background: isActive ? cfg.badge : 'rgba(255,255,255,0.04)', color: isActive ? cfg.color : '#334155' }}
          >
            {cfg.label}
          </span>
          {event.affectedServices?.map(s => (
            <ServiceBadge key={s} serviceId={s} />
          ))}
          {/* USED IN RCA badge — shown when this event's services are in the RCA propagation path */}
          {isUsedInRca && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full tracking-wider"
              style={{
                background: 'rgba(168,85,247,0.12)',
                color:      '#a855f7',
                border:     '1px solid rgba(168,85,247,0.28)',
              }}
            >
              USED IN RCA
            </motion.span>
          )}
        </div>

        {/* Title */}
        <div className="text-xs font-semibold mb-0.5"
          style={{ color: isActive ? '#e2e8f0' : isPast ? '#64748b' : '#334155' }}>
          {event.title}
        </div>

        {/* Description + Investigate button — only for active events */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-[11px] font-mono leading-relaxed mt-1" style={{ color: '#64748b' }}>
                {event.description}
              </p>
              {onInvestigate && event.eventType !== 'DEPLOYMENT' && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={e => { e.stopPropagation(); onInvestigate(null, event.id) }}
                  className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-1 rounded mt-2 transition-all duration-150"
                  style={{
                    background:  'rgba(56,189,248,0.08)',
                    border:      '1px solid rgba(56,189,248,0.2)',
                    color:       '#38bdf8',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background  = 'rgba(56,189,248,0.15)'
                    e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background  = 'rgba(56,189,248,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(56,189,248,0.2)'
                  }}
                >
                  <Search size={9} />
                  Investigate
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TimelinePanel({ playbackPhase, incidentActive, livePhase = 0, onPlaybackPhaseChange, onInvestigate, investigationPath = [] }) {
  const [events,       setEvents]       = useState([])
  const [phase,        setPhase]        = useState(playbackPhase ?? 0)
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [isLive,       setIsLive]       = useState(playbackPhase === null)
  const playIntervalRef = useRef(null)

  // Load timeline events once
  useEffect(() => {
    api.getTimelineEvents().catch(() => {}).then(data => data && setEvents(data))
  }, [])

  // Sync external playbackPhase → local phase
  useEffect(() => {
    if (playbackPhase === null) {
      setIsLive(true)
    } else {
      setIsLive(false)
      setPhase(playbackPhase)
    }
  }, [playbackPhase])

  // When incident resets → return to phase 0 live view
  // When incident starts → stay in LIVE mode so polling continues;
  //   the timeline highlights events via livePhase from App.jsx polling
  useEffect(() => {
    if (!incidentActive) { setPhase(0); setIsLive(true); setIsPlaying(false) }
  }, [incidentActive])

  // Auto-play loop
  useEffect(() => {
    if (!isPlaying) { clearInterval(playIntervalRef.current); return }
    playIntervalRef.current = setInterval(() => {
      setPhase(prev => {
        const next = prev >= 4 ? 0 : prev + 1
        onPlaybackPhaseChange(next)
        return next
      })
    }, 3000)
    return () => clearInterval(playIntervalRef.current)
  }, [isPlaying])

  const goToPhase = useCallback((p) => {
    if (!incidentActive) return          // locked — no incident running
    const clamped = Math.max(0, Math.min(4, p))
    setPhase(clamped)
    setIsLive(false)
    onPlaybackPhaseChange(clamped)
  }, [incidentActive, onPlaybackPhaseChange])

  const goLive = useCallback(() => {
    setIsPlaying(false)
    setIsLive(true)
    onPlaybackPhaseChange(null)
  }, [onPlaybackPhaseChange])

  const togglePlay = () => setIsPlaying(p => !p)

  const phaseColor = PHASE_COLORS[phase] ?? '#22c55e'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(3, 9, 22, 0.85)',
        border: '1px solid rgba(56,189,248,0.1)',
      }}
    >
      {/* ── Panel header ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#38bdf8', boxShadow: '0 0 6px #38bdf8', display: 'inline-block' }}
          />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
            Incident Timeline
          </span>
          <span className="text-xs font-mono" style={{ color: '#334155' }}>
            · {events.length} events
          </span>
        </div>

        {/* Live badge */}
        {isLive ? (
          <motion.button
            onClick={goLive}
            className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              color: '#22c55e',
            }}
          >
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: '#22c55e' }} />
            LIVE
          </motion.button>
        ) : (
          <button
            onClick={goLive}
            className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full transition-all duration-200"
            style={{
              background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
              color: '#38bdf8',
            }}
          >
            <Radio size={10} />
            Return to Live
          </button>
        )}
      </div>

      {/* ── Locked state — no incident active ────────────────────────────── */}
      {!incidentActive && (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16"
          style={{ borderTop: '1px solid rgba(56,189,248,0.08)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)' }}
          >
            <GitBranch size={18} color="#334155" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold font-mono mb-1" style={{ color: '#475569' }}>
              No active incident
            </p>
            <p className="text-xs font-mono" style={{ color: '#334155' }}>
              Trigger an incident to enable timeline playback
            </p>
          </div>
          <div
            className="text-[10px] font-mono px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.1)', color: '#334155' }}
          >
            Use the Trigger Incident button above ↑
          </div>
        </div>
      )}

      {/* ── Body: events + playback controls ─────────────────────────────── */}
      {incidentActive && <div className="flex" style={{ minHeight: 340 }}>

        {/* Left — timeline events (scrollable) */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ scrollbarWidth: 'thin', borderRight: '1px solid rgba(56,189,248,0.06)' }}
        >
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <span className="text-xs font-mono" style={{ color: '#334155' }}>
                Loading timeline events…
              </span>
            </div>
          ) : (
            events.map(evt => (
              <TimelineEventRow
                key={evt.id}
                event={evt}
                isActive={
                  isLive
                    ? (incidentActive && livePhase > 0 && evt.phase === livePhase)
                    : evt.phase === phase
                }
                isPast={
                  isLive
                    ? (incidentActive ? evt.phase < livePhase : false)
                    : evt.phase < phase
                }
                isUsedInRca={
                  investigationPath.length > 0 &&
                  evt.affectedServices?.some(s => investigationPath.includes(s))
                }
                onClick={() => goToPhase(evt.phase)}
                onInvestigate={onInvestigate}
              />
            ))
          )}
        </div>

        {/* Right — playback controls + phase info */}
        <div className="flex flex-col px-5 py-4 shrink-0" style={{ width: 240 }}>

          {/* Phase label */}
          <div className="mb-4">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-1"
              style={{ color: '#334155' }}>
              {isLive
                ? (incidentActive && livePhase > 0 ? `Phase ${livePhase} of 4 — LIVE` : 'Current State')
                : `Phase ${phase} of 4`}
            </div>
            <motion.div
              key={isLive ? `live-${livePhase}` : phase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-bold font-mono"
              style={{ color: isLive ? (livePhase > 0 ? PHASE_COLORS[livePhase] : '#22c55e') : phaseColor }}
            >
              {isLive
                ? (incidentActive && livePhase > 0 ? PHASE_LABELS[livePhase] : 'All Systems Normal')
                : PHASE_LABELS[phase]}
            </motion.div>
          </div>

          {/* Slider */}
          <div className="mb-4">
            <input
              type="range"
              min={0} max={4} step={1}
              value={isLive ? 0 : phase}
              onChange={e => goToPhase(Number(e.target.value))}
              className="w-full timeline-slider"
              style={{ accentColor: phaseColor }}
            />
            <div className="flex justify-between mt-1">
              {PHASE_LABELS.map((l, i) => (
                <span
                  key={i}
                  className="text-[8px] font-mono"
                  style={{ color: (!isLive && phase === i) ? PHASE_COLORS[i] : '#1e3a5f' }}
                >
                  {i}
                </span>
              ))}
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2 mb-5">
            <button onClick={() => goToPhase(phase - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              <SkipBack size={13} />
            </button>

            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={togglePlay}
              className="flex-1 h-8 rounded-lg flex items-center justify-center gap-2 font-mono text-xs font-bold transition-all duration-150"
              style={{
                background: isPlaying ? 'rgba(239,68,68,0.12)' : 'rgba(56,189,248,0.12)',
                border: `1px solid ${isPlaying ? 'rgba(239,68,68,0.3)' : 'rgba(56,189,248,0.3)'}`,
                color: isPlaying ? '#ef4444' : '#38bdf8',
              }}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </motion.button>

            <button onClick={() => goToPhase(phase + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              <SkipForward size={13} />
            </button>
          </div>

          {/* Phase description */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isLive ? 'live-desc' : phase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] font-mono leading-relaxed"
              style={{ color: '#475569' }}
            >
              {isLive
                ? 'Dashboard showing live runtime state. Click any event or use the scrubber to replay the incident.'
                : events.find(e => e.phase === phase)?.description ?? ''}
            </motion.div>
          </AnimatePresence>

          {/* Affected services — playback uses scrubbed phase; live uses livePhase */}
          {((!isLive && phase > 0) || (isLive && incidentActive && livePhase > 0)) && (() => {
            const p = isLive ? livePhase : phase
            return (
              <motion.div
                key={`affected-${isLive ? 'live' : ''}-${p}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2"
                  style={{ color: '#334155' }}>
                  Affected Services
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(p >= 1 ? ['auth'] : [])
                    .concat(p >= 2 ? ['payment'] : [])
                    .concat(p >= 3 ? ['order'] : [])
                    .map(s => <ServiceBadge key={s} serviceId={s} />)
                  }
                </div>
              </motion.div>
            )
          })()}
        </div>
      </div>}
    </motion.div>
  )
}
