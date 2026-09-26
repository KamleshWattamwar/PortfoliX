import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PortfolioProvider } from './context/PortfolioContext';
import DashboardLayout from './layouts/DashboardLayout';

import PortfolioPage from './pages/PortfolioPage';
import RiskPage from './pages/RiskPage';
import CorrelationPage from './pages/CorrelationPage';
import DrawdownPage from './pages/DrawdownPage';

export default function App() {
  return (
    <PortfolioProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/portfolio" replace />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="risk" element={<RiskPage />} />
            <Route path="correlation" element={<CorrelationPage />} />
            <Route path="drawdown" element={<DrawdownPage />} />
            <Route path="*" element={<Navigate to="/portfolio" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PortfolioProvider>
  );
}
