import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
