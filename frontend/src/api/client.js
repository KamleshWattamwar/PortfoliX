import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const TOKEN_KEY = 'portfolix_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is missing, expired or invalid, clear it and tell the app to log out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// --- Auth ---

export const registerUser = async (email, password) => {
  const response = await api.post('/auth/register', { email, password });
  return response.data;
};

export const loginUser = async (email, password) => {
  // The backend login uses the OAuth2 form format, so the email goes in "username"
  const body = new URLSearchParams({ username: email, password });
  const response = await api.post('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data; // { access_token, token_type }
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data; // { id, email }
};


// --- Holdings ---

export const searchTickers = async (query) => {
  if (!query || !query.trim()) return [];
  const response = await api.get(`/holdings/search-ticker`, {
    params: { q: query.trim() },
  });
  return response.data;
};

export const getHoldings = async () => {
  const response = await api.get('/holdings');
  return response.data;
};

export const addHolding = async (holdingData) => {
  const response = await api.post('/holdings', holdingData);
  return response.data;
};

export const deleteHolding = async (id) => {
  const response = await api.delete(`/holdings/${id}`);
  return response.data;
};

export const deleteHoldingByTicker = async (ticker) => {
  const response = await api.delete(`/holdings/by-ticker/${encodeURIComponent(ticker)}`);
  return response.data;
};

export const clearAllHoldings = async () => {
  const response = await api.delete('/holdings/action/clear-all');
  return response.data;
};

export const importCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/holdings/import-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const loadDemoPortfolio = async () => {
  const response = await api.post('/holdings/demo');
  return response.data;
};

// --- Portfolio analytics ---

export const getPortfolioSummary = async () => {
  const response = await api.get('/portfolio/summary');
  return response.data;
};

export const getPortfolioRisk = async () => {
  const response = await api.get('/portfolio/risk');
  return response.data;
};

export const getPortfolioCorrelation = async () => {
  const response = await api.get('/portfolio/correlation');
  return response.data;
};

export const getPortfolioDrawdown = async () => {
  const response = await api.get('/portfolio/drawdown');
  return response.data;
};

export default api;