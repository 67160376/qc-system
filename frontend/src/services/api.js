const configuredApiUrl = import.meta.env.VITE_API_URL;

// Use the deployed API in production. This prevents the production website
// from trying to call localhost on the visitor's own computer.
const API_URL = configuredApiUrl && !/localhost|127\.0\.0\.1/i.test(configuredApiUrl)
  ? configuredApiUrl.replace(/\/$/, '')
  : 'https://qc-system-api.onrender.com/api/v1';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('qc_token');
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (response.status === 401) {
    localStorage.removeItem('qc_token');
    localStorage.removeItem('qc_user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(typeof data === 'object' ? data.error || 'Request failed' : data || 'Request failed');
  }

  return data;
}

export default {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  del: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};
