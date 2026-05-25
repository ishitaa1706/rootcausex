import { motion } from 'framer-motion'
import MetricsCard from './MetricsCard'
import DependencyGraph from './DependencyGraph'
import SystemStatus from './SystemStatus'
import { services } from '../data/mockData'

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

export default function Dashboard() {
  return (
    <div
      className="flex-1 overflow-auto px-6 py-5"
      style={{ scrollbarWidth: 'thin' }}
    >
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0  }}
        transition={{ duration: 0.38 }}
        className="mb-5"
      >
        <h1 className="text-xl font-bold mb-1" style={{ color: '#e2e8f0' }}>
          Runtime Dashboard
        </h1>
        <p className="text-sm font-mono" style={{ color: '#475569' }}>
          Live production environment&nbsp;·&nbsp;5 services monitored&nbsp;·&nbsp;mock runtime data
        </p>
      </motion.div>

      {/* System status banner */}
      <SystemStatus />

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
      <section>
        <SectionLabel text="Service Topology" />
        <DependencyGraph />
      </section>
    </div>
  )
}
