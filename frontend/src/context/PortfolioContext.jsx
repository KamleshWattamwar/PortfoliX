import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  getHoldings, 
  addHolding as apiAddHolding, 
  deleteHolding as apiDeleteHolding, 
  clearAllHoldings as apiClearAll, 
  loadDemoPortfolio as apiLoadDemo, 
  importCsv as apiImportCsv 
} from '../api/client';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [holdings, setHoldings] = useState([]);
  const [holdingsLoading, setHoldingsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchHoldings = useCallback(async () => {
    setHoldingsLoading(true);
    try {
      const data = await getHoldings();
      setHoldings(data);
    } catch {
      setHoldings([]);
    } finally {
      setHoldingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings, refreshTrigger]);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const addHolding = async (data) => {
    setActionLoading(true);
    try {
      const res = await apiAddHolding(data);
      triggerRefresh();
      return res;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteHolding = async (id) => {
    setActionLoading(true);
    try {
      const res = await apiDeleteHolding(id);
      triggerRefresh();
      return res;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteHoldingByTicker = async (ticker) => {
    setActionLoading(true);
    try {
      const res = await apiDeleteHoldingByTicker(ticker);
      triggerRefresh();
      return res;
    } finally {
      setActionLoading(false);
    }
  };

  const clearAll = async () => {
    setActionLoading(true);
    try {
      const res = await apiClearAll();
      triggerRefresh();
      return res;
    } finally {
      setActionLoading(false);
    }
  };

  const loadDemo = async () => {
    setActionLoading(true);
    try {
      const res = await apiLoadDemo();
      triggerRefresh();
      return res;
    } finally {
      setActionLoading(false);
    }
  };

  const importCsv = async (file) => {
    setActionLoading(true);
    try {
      const res = await apiImportCsv(file);
      triggerRefresh();
      return res;
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
        holdings,
        hasHoldings: holdings.length > 0,
        holdingsLoading,
        actionLoading,
        refreshTrigger,
        triggerRefresh,
        addHolding,
        deleteHolding,
        deleteHoldingByTicker,
        clearAll,
        loadDemo,
        importCsv,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
