const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'fptp_token';

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.message || 'Dispute API request failed');
  return data;
}

export const disputeApi = {
  list: async () => (await request('/disputes')).disputes || [],
  detail: async (id) => (await request(`/disputes/${id}`)).dispute,
  create: async (payload) => (await request('/disputes', { method: 'POST', body: JSON.stringify(payload) })).dispute,
  addEvidence: async (id, payload) => (await request(`/disputes/${id}/evidence`, { method: 'POST', body: JSON.stringify(payload) })).evidence,
  addResponse: async (id, payload) => request(`/disputes/${id}/responses`, { method: 'POST', body: JSON.stringify(payload) }),
  updateStatus: async (id, payload) => (await request(`/disputes/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) })).dispute,
  byContract: async (contractId) => (await request(`/disputes/contracts/${contractId}`)).disputes || [],
};

export function getStoredUser() {
  return JSON.parse(localStorage.getItem('fptp_user') || '{}');
}
