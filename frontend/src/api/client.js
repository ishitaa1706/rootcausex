/**
 * RootCauseX API Client
 *
 * Thin fetch wrapper around the Spring Boot backend (localhost:8080).
 * All functions return Promises that resolve to parsed JSON.
 *
 * Components should call these instead of importing from mockData.js.
 * If the backend is unavailable, callers can fall back to mockData gracefully.
 */

const BASE_URL = 'http://localhost:8080'

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`[RootCauseX API] ${res.status} ${path}`)
  return res.json()
}

export const api = {
  // Services
  getServices:     ()   => get('/services'),
  getService:      (id) => get(`/services/${id}`),
  getDependencies: ()   => get('/services/dependencies'),

  // Metrics
  getAllMetrics:           () => get('/metrics'),
  getMetricsByService: (svcId) => get(`/metrics/${svcId}`),

  // Deployments
  getDeployments:            () => get('/deployments'),
  getDeploymentsByService:   (svcId) => get(`/deployments/${svcId}`),

  // Commits
  getCommits:                () => get('/commits'),
  getCommitsByService:       (svcId) => get(`/commits/${svcId}`),

  // System
  getSystemStatus: () => get('/system/status'),
}
