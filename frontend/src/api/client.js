/**
 * RootCauseX API Client
 *
 * Thin fetch wrapper around the Spring Boot backend (localhost:8080).
 * All functions return Promises that resolve to parsed JSON.
 */

const BASE_URL = 'http://localhost:8080'

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`[RootCauseX API] ${res.status} ${path}`)
  return res.json()
}

async function post(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST' })
  if (!res.ok) throw new Error(`[RootCauseX API] ${res.status} ${path}`)
  return res.json()
}

async function postJson(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`[RootCauseX API] ${res.status} ${path}`)
  return res.json()
}

export const api = {
  // Services
  getServices:     ()      => get('/services'),
  getService:      (id)    => get(`/services/${id}`),
  getDependencies: ()      => get('/services/dependencies'),

  // Metrics
  getAllMetrics:            ()       => get('/metrics'),
  getMetricsByService:     (svcId)  => get(`/metrics/${svcId}`),

  // Deployments
  getDeployments:          ()       => get('/deployments'),
  getDeploymentsByService: (svcId)  => get(`/deployments/${svcId}`),

  // Commits
  getCommits:              ()       => get('/commits'),
  getCommitsByService:     (svcId)  => get(`/commits/${svcId}`),

  // System
  getSystemStatus:         ()       => get('/system/status'),

  // Incident — Phase 2
  triggerIncident:         ()       => post('/incident/trigger'),
  resetIncident:           ()       => post('/incident/reset'),
  getIncidentStatus:       ()       => get('/incident/status'),

  // Anomalies — Phase 2
  getAnomalies:            ()       => get('/anomalies'),

  // Timeline — Phase 3
  getTimelineEvents:       ()       => get('/timeline/events'),
  getPlaybackState:        (phase)  => get(`/timeline/playback-state/${phase}`),
  getCorrelation:          (deplId) => get(`/timeline/correlation/${deplId}`),

  // Investigation — Phase 4
  postInvestigate: (anomalyId, timelineEventId) =>
    postJson('/investigate', { anomalyId, timelineEventId }),
  postFollowUp: (investigationId, question) =>
    postJson('/investigate/follow-up', { investigationId, question }),
}
