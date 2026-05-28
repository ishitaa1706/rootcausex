import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import MetricsCard      from './MetricsCard'
import DependencyGraph  from './DependencyGraph'
import SystemStatus     from './SystemStatus'
import IncidentControls from './IncidentControls'
import AnomalyFeed      from './AnomalyFeed'
import TimelinePanel    from './TimelinePanel'

function SectionLabel({ text }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-bold uppercase tracking-[0.15em] font-mono" style={{ color: '#475569' }}>
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(56,189,248,0.07)' }} />
    </div>
  )
}


export default function Dashboard({
  services,
  systemStatus,
  anomalies,
  incidentActive,
  incidentPhase,
  playbackPhase,
  onTrigger,
  onReset,
  onAdvance,
  onPlaybackPhaseChange,
  onInvestigate,
  investigationPath,
  investigatingId,
  investigationActive,
  activeView = 'dashboard',
}) {
  const showAll      = activeView === 'dashboard'
  const showMetrics  = activeView === 'metrics'   || showAll
  const showTopology = activeView === 'topology'  || showAll
  const showTimeline = activeView === 'timeline'  || showAll
  const showAnomaly  = activeView === 'investigate' || showAll

  // View label shown in the subtitle bar
  const viewLabel = {
    dashboard:   null,
    metrics:     'Service Health',
    topology:    'Service Topology',
    timeline:    'Incident Timeline',
    investigate: 'Anomaly Investigation',
  }[activeView]

  return (
    <div
      className="flex-1 overflow-auto px-6 py-5 relative"
      style={{ scrollbarWidth: 'thin' }}
    >
      {/* ── AI Cognition scan line ── */}
      {investigationActive && (
        <motion.div
          style={{
            position:      'fixed',
            left:           60,
            right:          480,
            height:         1,
            background:     'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 20%, rgba(168,85,247,0.45) 50%, rgba(168,85,247,0.2) 80%, transparent 100%)',
            zIndex:          5,
            pointerEvents:  'none',
          }}
          initial={{ top: '64px' }}
          animate={{ top: ['64px', '100vh'] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* ── Page heading + controls ── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0  }}
        transition={{ duration: 0.38 }}
        className="flex items-center justify-between mb-5"
      >
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: '#e2e8f0' }}>
            {viewLabel ? viewLabel : 'Runtime Dashboard'}
          </h1>
          <p className="text-sm font-mono" style={{ color: '#475569' }}>
            {investigationActive
              ? <span style={{ color: '#a855f7' }}>AI cognition active — investigating</span>
              : viewLabel
                ? <span>
                    <span
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ color: '#334155' }}
                    >
                      Runtime Dashboard
                    </span>
                    <span style={{ color: '#1e3a5f' }}>&nbsp;›&nbsp;</span>
                    <span style={{ color: '#38bdf8' }}>{viewLabel}</span>
                  </span>
                : playbackPhase !== null
                  ? `timeline replay — phase ${playbackPhase}`
                  : incidentActive
                    ? 'incident simulation active'
                    : 'connected to backend'}
          </p>
        </div>

        <IncidentControls
          incidentActive={incidentActive}
          incidentPhase={incidentPhase}
          onTrigger={onTrigger}
          onReset={onReset}
          onAdvance={onAdvance}
        />
      </motion.div>

      {/* System status — always visible */}
      <SystemStatus systemStatus={systemStatus} />

      {/* ── Anomaly feed (Investigate view + Dashboard) ── */}
      <AnimatePresence>
        {showAnomaly && (incidentActive || playbackPhase > 0) && anomalies.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AnomalyFeed
              anomalies={anomalies}
              onInvestigate={onInvestigate}
              investigatingId={investigatingId}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Investigate view with no anomalies yet */}
      {activeView === 'investigate' && (!incidentActive || anomalies.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-5 rounded-xl flex flex-col items-center justify-center py-12 gap-3"
          style={{ background: 'rgba(3,9,22,0.7)', border: '1px solid rgba(56,189,248,0.08)' }}
        >
          <Search size={22} color="#334155" />
          <p className="text-sm font-mono" style={{ color: '#334155' }}>
            {incidentActive ? 'No anomalies detected yet — check back as the incident evolves.' : 'Trigger an incident to start investigation mode.'}
          </p>
        </motion.div>
      )}

      {/* ── Service health (Metrics view + Dashboard) ── */}
      <AnimatePresence>
        {showMetrics && (
          <motion.section
            key="metrics"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="mb-6"
          >
            <SectionLabel text="Service Health" />
            <div className="grid grid-cols-5 gap-3">
              {services.map((svc, i) => (
                <MetricsCard key={svc.id} service={svc} index={i} />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Dependency graph (Topology view + Dashboard) ── */}
      <AnimatePresence>
        {showTopology && (
          <motion.section
            key="topology"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, delay: showAll ? 0 : 0 }}
            className="mb-6"
          >
            <SectionLabel text="Service Topology" />
            <DependencyGraph services={services} investigationPath={investigationPath} />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Incident timeline (Timeline view + Dashboard) ── */}
      <AnimatePresence>
        {showTimeline && (
          <motion.section
            key="timeline"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <SectionLabel text="Incident Timeline" />
            <TimelinePanel
              playbackPhase={playbackPhase}
              incidentActive={incidentActive}
              livePhase={incidentPhase}
              onPlaybackPhaseChange={onPlaybackPhaseChange}
              onInvestigate={onInvestigate}
              investigationPath={investigationPath}
            />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

