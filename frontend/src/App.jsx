import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import Sidebar             from './components/Sidebar'
import Header              from './components/Header'
import Dashboard           from './components/Dashboard'
import InvestigationPanel  from './components/InvestigationPanel'
import { services as mockServices, systemStatus as mockStatus } from './data/mockData'
import { api } from './api/client'
import { InvestigationFocusProvider } from './store/InvestigationFocusStore'

/**
 * App — single source of truth for all runtime state.
 *
 * Owns:
 *   services, systemStatus, anomalies  — live polling data
 *   incidentActive                      — whether incident is running
 *   playbackPhase                       — null = live, 0–4 = timeline replay
 *   playbackServices/Status             — frozen state for playback mode
 *
 * Playback mode overrides live data so the whole dashboard
 * reflects a specific point in the incident timeline.
 */
export default function App() {
  // ── Live state ────────────────────────────────────────────────────────────
  const [services,       setServices]       = useState(mockServices)
  const [systemStatus,   setSystemStatus]   = useState(mockStatus)
  const [anomalies,      setAnomalies]      = useState([])
  const [incidentActive, setIncidentActive] = useState(false)
  const [incidentPhase,  setIncidentPhase]  = useState(0)   // 0–4; tracks backend's live phase

  // ── Playback state ────────────────────────────────────────────────────────
  const [playbackPhase,        setPlaybackPhase]        = useState(null)
  const [playbackServices,     setPlaybackServices]     = useState(null)
  const [playbackSystemStatus, setPlaybackSystemStatus] = useState(null)

  // ── Investigation state (Phase 4) ─────────────────────────────────────────
  const [investigationOpen,    setInvestigationOpen]    = useState(false)
  const [investigatingAnomaly, setInvestigatingAnomaly] = useState(null)
  const [investigatingEventId, setInvestigatingEventId] = useState(null)
  const [investigationPath,    setInvestigationPath]    = useState([])

  // ── Initial load — also re-hydrates incident state after a page refresh ──
  useEffect(() => {
    Promise.all([api.getServices(), api.getSystemStatus(), api.getIncidentStatus()])
      .then(([svcs, status, incStatus]) => {
        setServices(svcs)
        setSystemStatus(status)
        // If the backend already has a running incident (e.g. after a browser refresh),
        // restore incidentActive + phase so polling, timeline, and anomaly feed all wake up.
        if (incStatus?.active) {
          setIncidentActive(true)
          setIncidentPhase(incStatus.phaseIndex ?? 0)
          api.getAnomalies().then(anoms => setAnomalies(anoms)).catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  // ── Live polling — services + status + incident phase (pauses during playback) ──
  useEffect(() => {
    if (!incidentActive || playbackPhase !== null) return
    const id = setInterval(async () => {
      try {
        const [svcs, status, incStatus] = await Promise.all([
          api.getServices(), api.getSystemStatus(), api.getIncidentStatus(),
        ])
        setServices(svcs)
        setSystemStatus(status)
        setIncidentPhase(incStatus.phaseIndex ?? 0)
      } catch {}
    }, 3000)
    return () => clearInterval(id)
  }, [incidentActive, playbackPhase])

  // ── Anomaly polling — always runs when incident active (playback doesn't pause it) ──
  useEffect(() => {
    if (!incidentActive) return
    const id = setInterval(async () => {
      try {
        const anoms = await api.getAnomalies()
        setAnomalies(anoms)
      } catch {}
    }, 3000)
    return () => clearInterval(id)
  }, [incidentActive])

  // ── Incident controls ─────────────────────────────────────────────────────
  const handleTrigger = useCallback(async () => {
    try {
      await api.triggerIncident()
      setIncidentActive(true)
      setPlaybackPhase(null); setPlaybackServices(null); setPlaybackSystemStatus(null)
      const [svcs, status, anoms] = await Promise.all([
        api.getServices(), api.getSystemStatus(), api.getAnomalies(),
      ])
      setServices(svcs); setSystemStatus(status); setAnomalies(anoms)
    } catch {}
  }, [])

  const handleAdvance = useCallback(async () => {
    try {
      await api.advanceIncident()
      const [svcs, status, incStatus] = await Promise.all([
        api.getServices(), api.getSystemStatus(), api.getIncidentStatus(),
      ])
      setServices(svcs); setSystemStatus(status)
      setIncidentPhase(incStatus.phaseIndex ?? 0)
    } catch {}
  }, [])

  const handleReset = useCallback(async () => {
    try {
      await api.resetIncident()
      setIncidentActive(false)
      setAnomalies([])
      setIncidentPhase(0)
      setPlaybackPhase(null); setPlaybackServices(null); setPlaybackSystemStatus(null)
      // Close investigation panel if open — incident is gone, RCA is stale
      setInvestigationOpen(false); setInvestigatingAnomaly(null)
      setInvestigatingEventId(null); setInvestigationPath([])
      const [svcs, status] = await Promise.all([api.getServices(), api.getSystemStatus()])
      setServices(svcs); setSystemStatus(status)
    } catch {}
  }, [])

  // ── Investigation controls (Phase 4) ─────────────────────────────────────
  const handleInvestigate = useCallback((anomaly, timelineEventId) => {
    setInvestigatingAnomaly(anomaly ?? null)
    setInvestigatingEventId(timelineEventId ?? null)
    setInvestigationPath([])
    setInvestigationOpen(true)
  }, [])

  const handleCloseInvestigation = useCallback(() => {
    setInvestigationOpen(false)
    setInvestigatingAnomaly(null)
    setInvestigatingEventId(null)
    setInvestigationPath([])
  }, [])

  const handleRcaReady = useCallback((propagationPath) => {
    setInvestigationPath(propagationPath ?? [])
  }, [])

  // ── Playback controls ─────────────────────────────────────────────────────
  const handlePlaybackPhaseChange = useCallback(async (phase) => {
    if (phase === null) {
      // Exit playback → return to live
      setPlaybackPhase(null); setPlaybackServices(null); setPlaybackSystemStatus(null)
      return
    }
    try {
      const state = await api.getPlaybackState(phase)
      setPlaybackPhase(phase)
      setPlaybackServices(state.services)
      setPlaybackSystemStatus(state.systemStatus)
    } catch {}
  }, [])

  // ── Resolved display values ───────────────────────────────────────────────
  const displayServices     = playbackServices     ?? services
  const displaySystemStatus = playbackSystemStatus ?? systemStatus

  // ── Active dashboard view (controlled by Sidebar) ────────────────────────
  const [activeView, setActiveView] = useState('dashboard')

  return (
    <InvestigationFocusProvider>
      <div
        className="flex"
        style={{ height: '100vh', overflow: 'hidden', background: '#020817' }}
      >
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header systemStatus={displaySystemStatus} />
          <Dashboard
            services={displayServices}
            systemStatus={displaySystemStatus}
            anomalies={anomalies}
            incidentActive={incidentActive}
            incidentPhase={incidentPhase}
            playbackPhase={playbackPhase}
            onTrigger={handleTrigger}
            onReset={handleReset}
            onAdvance={handleAdvance}
            onPlaybackPhaseChange={handlePlaybackPhaseChange}
            onInvestigate={handleInvestigate}
            investigationPath={investigationPath}
            investigatingId={investigatingAnomaly?.id ?? null}
            investigationActive={investigationOpen}
            activeView={activeView}
          />
        </div>

        {/* Investigation Panel — right-side drawer */}
        <AnimatePresence>
          {investigationOpen && (
            <InvestigationPanel
              key={investigatingAnomaly?.id ?? investigatingEventId}
              anomaly={investigatingAnomaly}
              eventId={investigatingEventId}
              onClose={handleCloseInvestigation}
              onRcaReady={handleRcaReady}
            />
          )}
        </AnimatePresence>
      </div>
    </InvestigationFocusProvider>
  )
}
