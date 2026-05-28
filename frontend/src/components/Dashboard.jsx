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
  playbackPhase,
  onTrigger,
  onReset,
  onPlaybackPhaseChange,
  onInvestigate,
  investigationPath,
  investigatingId,
}) {
  return (
    <div
      className="flex-1 overflow-auto px-6 py-5"
      style={{ scrollbarWidth: 'thin' }}
    >
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
            {playbackPhase !== null
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
        <DependencyGraph services={services} investigationPath={investigationPath} />
      </section>

      {/* Incident Timeline — Phase 3 */}
      <section>
        <SectionLabel text="Incident Timeline" />
        <TimelinePanel
          playbackPhase={playbackPhase}
          incidentActive={incidentActive}
          onPlaybackPhaseChange={onPlaybackPhaseChange}
          onInvestigate={onInvestigate}
        />
      </section>
    </div>
  )
}
