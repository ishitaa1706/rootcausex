import { useState, useEffect, useCallback } from 'react'
import Sidebar   from './components/Sidebar'
import Header    from './components/Header'
import Dashboard from './components/Dashboard'
import { services as mockServices, systemStatus as mockStatus } from './data/mockData'
import { api } from './api/client'

/**
 * App is the single source of truth for live runtime state.
 *
 * It owns: services, systemStatus, anomalies, incidentActive
 * and passes them down to Header and Dashboard as props.
 *
 * Polling: starts when an incident is triggered (every 3s),
 * stops on reset. No polling during healthy baseline.
 */
export default function App() {
  const [services,       setServices]       = useState(mockServices)
  const [systemStatus,   setSystemStatus]   = useState(mockStatus)
  const [anomalies,      setAnomalies]      = useState([])
  const [incidentActive, setIncidentActive] = useState(false)

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.getServices(), api.getSystemStatus()])
      .then(([svcs, status]) => { setServices(svcs); setSystemStatus(status) })
      .catch(() => { /* backend offline — mock data stays */ })
  }, [])

  // ── Polling during incident (3s interval) ─────────────────────────────────
  useEffect(() => {
    if (!incidentActive) return
    const id = setInterval(async () => {
      try {
        const [svcs, status, anoms] = await Promise.all([
          api.getServices(),
          api.getSystemStatus(),
          api.getAnomalies(),
        ])
        setServices(svcs)
        setSystemStatus(status)
        setAnomalies(anoms)
      } catch { /* ignore network errors during poll */ }
    }, 3000)
    return () => clearInterval(id)
  }, [incidentActive])

  // ── Incident controls ─────────────────────────────────────────────────────
  const handleTrigger = useCallback(async () => {
    try {
      await api.triggerIncident()
      setIncidentActive(true)
      // Immediate fetch — don't wait for the first poll interval
      const [svcs, status, anoms] = await Promise.all([
        api.getServices(),
        api.getSystemStatus(),
        api.getAnomalies(),
      ])
      setServices(svcs)
      setSystemStatus(status)
      setAnomalies(anoms)
    } catch { /* backend offline */ }
  }, [])

  const handleReset = useCallback(async () => {
    try {
      await api.resetIncident()
      setIncidentActive(false)
      setAnomalies([])
      const [svcs, status] = await Promise.all([
        api.getServices(),
        api.getSystemStatus(),
      ])
      setServices(svcs)
      setSystemStatus(status)
    } catch { /* backend offline */ }
  }, [])

  return (
    <div
      className="flex"
      style={{ height: '100vh', overflow: 'hidden', background: '#020817' }}
    >
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header systemStatus={systemStatus} />
        <Dashboard
          services={services}
          systemStatus={systemStatus}
          anomalies={anomalies}
          incidentActive={incidentActive}
          onTrigger={handleTrigger}
          onReset={handleReset}
        />
      </div>
    </div>
  )
}
