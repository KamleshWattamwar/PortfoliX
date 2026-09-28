import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  PieChart, 
  Activity, 
  Grid, 
  TrendingDown, 
  Plus, 
  Upload, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  ShieldCheck,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';
import HoldingsFormModal from '../components/HoldingsFormModal';
import CsvUploadModal from '../components/CsvUploadModal';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { 
    holdings, 
    hasHoldings, 
    actionLoading, 
    triggerRefresh, 
    addHolding, 
    deleteHolding, 
    clearAll, 
    loadDemo, 
    importCsv 
  } = usePortfolio();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const location = useLocation();

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to remove all positions from your portfolio?')) {
      await clearAll();
    }
  };

  const navItems = [
    {
      to: '/portfolio',
      label: 'Portfolio',
      icon: <PieChart size={18} />,
      desc: 'Holdings & Allocation'
    },
    {
      to: '/risk',
      label: 'Risk Metrics',
      icon: <Activity size={18} />,
      desc: 'Volatility, Beta & Sharpe'
    },
    {
      to: '/correlation',
      label: 'Correlation',
      icon: <Grid size={18} />,
      desc: 'Asset Co-movement'
    },
    {
      to: '/drawdown',
      label: 'Drawdown',
      icon: <TrendingDown size={18} />,
      desc: 'Historical Peak Falls'
    },
  ];

  return (
    <div className="layout-container">
      
      {/* 1. Persistent Sidebar */}
      <aside className="sidebar">
        
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-box">
            <TrendingUp size={22} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-title">
              Portfoli<span>X</span>
            </div>
            <div className="brand-subtitle">Risk Analytics Engine</div>
          </div>
        </div>

        {/* Market Badge */}
        <div className="sidebar-market-badge">
          <span className="live-dot"></span>
          <span>NSE / BSE • NIFTY 50</span>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <div className="sidebar-link-icon">{item.icon}</div>
              <div className="sidebar-link-text">
                <span className="sidebar-link-title">{item.label}</span>
                <span className="sidebar-link-desc">{item.desc}</span>
              </div>
              <ChevronRight size={14} className="sidebar-link-arrow" />
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer / Portfolio Stats & User Account */}
        <div className="sidebar-footer">
          {/* User Account Info */}
          {user && (
            <div className="sidebar-user" title={`Logged in as ${user.email}`}>
              <div className="sidebar-user-avatar">
                {user.email ? user.email.charAt(0).toUpperCase() : <User size={16} />}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.email || 'Authenticated User'}</span>
                <span className="sidebar-user-badge">PRO Session</span>
              </div>
              <button
                type="button"
                className="btn-icon-logout"
                onClick={logout}
                title="Sign out of PortfoliX"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}

          <div className="portfolio-counter">
            <span className="counter-label">Active Positions</span>
            <span className="counter-value">{holdings.length}</span>
          </div>
          {!hasHoldings ? (
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#a5b4fc', marginTop: '0.6rem' }}
              onClick={loadDemo}
              disabled={actionLoading}
            >
              <Sparkles size={13} />
              Load NIFTY Demo
            </button>
          ) : (
            <button
              className="btn btn-danger btn-sm"
              style={{ width: '100%', marginTop: '0.6rem' }}
              onClick={handleClearAll}
              disabled={actionLoading}
            >
              <Trash2 size={13} />
              Reset Portfolio
            </button>
          )}
        </div>

      </aside>

      {/* 2. Main Area */}
      <div className="main-wrapper">
        
        {/* Top Header / Action Bar */}
        <header className="topbar">
          <div className="topbar-title-area">
            <h2 className="topbar-page-title">
              {location.pathname === '/risk' && 'Quantitative Risk Metrics'}
              {location.pathname === '/correlation' && 'Cross-Asset Correlation Matrix'}
              {location.pathname === '/drawdown' && 'Historical Portfolio Drawdown'}
              {(location.pathname === '/portfolio' || location.pathname === '/') && 'Portfolio Holdings & Allocation'}
            </h2>
          </div>

          <div className="topbar-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={triggerRefresh}
              disabled={actionLoading}
              title="Refresh quotes and calculations"
            >
              <RefreshCw size={14} className={actionLoading ? 'spin-anim' : ''} />
              Refresh
            </button>

            {!hasHoldings && (
              <button 
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#a5b4fc' }}
                onClick={loadDemo}
                disabled={actionLoading}
              >
                <Sparkles size={14} />
                Load Demo
              </button>
            )}

            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setIsCsvModalOpen(true)}
              disabled={actionLoading}
            >
              <Upload size={14} />
              Import CSV
            </button>

            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setIsAddModalOpen(true)}
              disabled={actionLoading}
            >
              <Plus size={15} strokeWidth={2.5} />
              Add Position
            </button>
          </div>
        </header>

        {/* Page Content Rendered via Outlet */}
        <main className="content-area">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="dashboard-footer">
          <p>PortfoliX Quantitative Risk Dashboard • Built with FastAPI & React • Powered by Yahoo Finance</p>
        </footer>

      </div>

      {/* Global Modals */}
      <HoldingsFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddHolding={addHolding}
        loading={actionLoading}
      />

      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportCsv={importCsv}
        loading={actionLoading}
      />

    </div>
  );
}
