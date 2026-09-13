const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://hackindia-ai-web3-builders-hackathon-i3ff.onrender.com/api/v1').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || `Request failed with ${response.status}`);
  return body;
}

export function logMilkDeposit(payload) {
  return request('/milk/log', { method: 'POST', body: JSON.stringify(payload) });
}

export function submitGrievance(payload) {
  return request('/grievances', { method: 'POST', body: JSON.stringify(payload) });
}

export function fetchMilkLogs() {
  return request('/milk/logs', { method: 'GET' });
}

export function fetchGrievances() {
  return request('/grievances', { method: 'GET' });
}

export { API_BASE_URL };
