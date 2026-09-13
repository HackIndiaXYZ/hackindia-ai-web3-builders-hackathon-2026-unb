const PRODUCTION_API_BASE_URL = 'https://hackindia-ai-web3-builders-hackathon-i3ff.onrender.com/api/v1';
const configuredApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE_URL = (/^https?:\/\/[^/\s]+\/api\/v1$/i.test(configuredApiBaseUrl)
  ? configuredApiBaseUrl
  : PRODUCTION_API_BASE_URL).replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || body.message || `Request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

export function logMilkDeposit(payload) {
  return request('/milk/log', { method: 'POST', body: JSON.stringify(payload) });
}

export function submitGrievance(payload) {
  return request('/grievances', { method: 'POST', body: JSON.stringify(payload) });
}

export function submitNdlmRegistration(payload) {
  return request('/ndlm/registrations', { method: 'POST', body: JSON.stringify(payload) });
}

export function fetchMilkLogs() {
  return request('/milk/logs', { method: 'GET' });
}

export function fetchGrievances() {
  return request('/grievances', { method: 'GET' });
}

export function fetchWorkflowSync() {
  return request('/sync', { method: 'GET' });
}

export function createCollectionRequest(payload) {
  return request('/collection-requests', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateCollectionApproval(requestId, approval, approvedBy) {
  return request(`/collection-requests/${encodeURIComponent(requestId)}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ approval, approvedBy })
  });
}

export function recordCollectionMeasurements(requestId, measurements) {
  return request(`/collection-requests/${encodeURIComponent(requestId)}/measurements`, {
    method: 'PATCH',
    body: JSON.stringify(measurements)
  });
}

export function transferCollectionToChilling(requestId, transfer) {
  return request(`/collection-requests/${encodeURIComponent(requestId)}/transfer`, {
    method: 'PATCH',
    body: JSON.stringify(transfer)
  });
}

export function updateNdlmRegistration(verificationId, updates) {
  return request(`/ndlm/registrations/${encodeURIComponent(verificationId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export function fetchRiskAnomalies(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/risk/anomalies${query ? `?${query}` : ''}`, { method: 'GET' });
}

export function fetchRiskAggregates(level = 'district', filters = {}) {
  const query = new URLSearchParams({ level, ...filters }).toString();
  return request(`/admin/risk/aggregates?${query}`, { method: 'GET' });
}

export function fetchRaidRecommendations() {
  return request('/admin/risk/raid-recommendations', { method: 'GET' });
}

export function reviewRiskAnomaly(anomalyId, decision, reason, officerId) {
  return request(`/admin/risk/anomalies/${encodeURIComponent(anomalyId)}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ decision, reason, officerId })
  });
}

export function approveRaidRecommendation(recommendationId, approval, reason, officerId) {
  return request(`/admin/risk/raid-recommendations/${encodeURIComponent(recommendationId)}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ approval, reason, officerId })
  });
}

export function fetchOfficers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/officers${query ? `?${query}` : ''}`, { method: 'GET' });
}

export function fetchAssignments(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/assignments${query ? `?${query}` : ''}`, { method: 'GET' });
}

export function assignOfficer(payload) {
  return request('/admin/assignments', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateAssignment(assignmentId, updates) {
  return request(`/admin/assignments/${encodeURIComponent(assignmentId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export function seedRiskDemo() {
  return request('/admin/risk/demo/seed', { method: 'POST', body: JSON.stringify({}) });
}

export { API_BASE_URL };
