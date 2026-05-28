import { motion } from 'framer-motion'
import MetricsCard      from './MetricsCard'
import DependencyGraph  from './DependencyGraph'
import SystemStatus     from './SystemStatus'
import IncidentControls from './IncidentControls'
import AnomalyFeed      from './AnomalyFeed'
import TimelinePanel    from './TimelinePanel'

function SectionLabel({ text }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="text-xs font-bold uppercase tracking-[0.15em] font-mono"
        style={{ color: '#475569' }}
      >
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
  onPlaybackPhaseChange,
  onInvestigate,
  investigationPath,
  investigatingId,
  investigationActive,   // ← Phase 5: true when investigation panel is open
}) {
  return (
    <div
      className="flex-1 overflow-auto px-6 py-5 relative"
      style={{ scrollbarWidth: 'thin' }}
    >
      {/* ── AI Cognition scan line — subtle horizontal sweep during investigation ── */}
      {investigationActive && (
        <motion.div
          style={{
            position:   'fixed',
            left:        60,   // after sidebar
            right:       480,  // before investigation panel
            height:      1,
            background:  'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 20%, rgba(168,85,247,0.45) 50%, rgba(168,85,247,0.2) 80%, transparent 100%)',
            zIndex:       5,
            pointerEvents: 'none',
          }}
          initial={{ top: '64px' }}
          animate={{ top: ['64px', '100vh'] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Page heading + incident controls */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0  }}
        transition={{ duration: 0.38 }}
        className="flex items-center justify-between mb-5"
      >
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: '#e2e8f0' }}>
            Runtime Dashboard
          </h1>
          <p className="text-sm font-mono" style={{ color: '#475569' }}>
            Live production environment&nbsp;·&nbsp;5 services monitored&nbsp;·&nbsp;
            {investigationActive
              ? <span style={{ color: '#a855f7' }}>AI cognition active — investigating</span>
              : playbackPhase !== null
                ? `timeline replay — phase ${playbackPhase}`
                : incidentActive
                  ? 'incident simulation active'
                  : 'connected to backend'}
          </p>
        </div>

        <IncidentControls
          incidentActive={incidentActive}
          onTrigger={onTrigger}
          onReset={onReset}
        />
      </motion.div>

      {/* System status banner */}
      <SystemStatus systemStatus={systemStatus} />

      {/* Anomaly feed — visible during incident or playback (phase > 0) */}
      {(incidentActive || playbackPhase > 0) && anomalies.length > 0 && (
        <AnomalyFeed
          anomalies={anomalies}
          onInvestigate={onInvestigate}
          investigatingId={investigatingId}
        />
      )}

      {/* Service health cards */}
      <section className="mb-6">
        <SectionLabel text="Service Health" />
        <div className="grid grid-cols-5 gap-3">
          {services.map((svc, i) => (
            <MetricsCard key={svc.id} service={svc} index={i} />
          ))}
        </div>
      </section>

      {/* Dependency graph */}
      <section className="mb-6">
        <SectionLabel text="Service Topology" />
        <DependencyGraph
          services={services}
          investigationPath={investigationPath}
        />
      </section>

      {/* Incident Timeline */}
      <section>
        <SectionLabel text="Incident Timeline" />
        <TimelinePanel
          playbackPhase={playbackPhase}
          incidentActive={incidentActive}
          livePhase={incidentPhase}
          onPlaybackPhaseChange={onPlaybackPhaseChange}
          onInvestigate={onInvestigate}
          investigationPath={investigationPath}
        />
      </section>
    </div>
  )
}
