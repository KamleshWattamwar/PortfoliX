import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Activity,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const { user, login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/portfolio';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setRegisteredSuccess(false);
  };

  const handleFillDemo = () => {
    setEmail('demo.investor@portfolix.io');
    setPassword('demopass123');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        navigate(from, { replace: true });
      } else {
        await register(email, password);
        setRegisteredSuccess(true);
        navigate(from, { replace: true });
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg || d.message).join(', '));
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Dynamic Background Glows */}
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-card-container">

        {/* Brand Header */}
        <div className="auth-brand-section">
          <img
            src="/portfolix-logo.png"
            alt="PortfoliX"
            className="auth-logo-img"
            style={{ height: '62px', width: 'auto', maxWidth: '280px', objectFit: 'contain', marginBottom: '0.85rem' }}
          />
          <p className="auth-subtitle">Quantitative Portfolio Risk & Analytics Engine</p>
          <div className="auth-badge">
            <span className="live-dot" />
            <span>NSE / BSE Real-Time Analytics</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="glass-panel auth-card">

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('register')}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="badge badge-negative auth-alert">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success message */}
          {registeredSuccess && (
            <div className="badge badge-positive auth-alert">
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>Account created successfully! Logging you in...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="auth-email"
                  type="email"
                  className="form-input auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="auth-password">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="auth-quick-fill-btn"
                    onClick={handleFillDemo}
                    title="Fill test account credentials"
                  >
                    <Sparkles size={12} />
                    Fill Demo
                  </button>
                )}
              </div>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input auth-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'register' && (
                <span className="auth-field-hint">Minimum 6 characters</span>
              )}
            </div>

            {/* Confirm Password Field (Register Only) */}
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-confirm-password">
                  Confirm Password
                </label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input auth-input"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spin-anim" style={{ display: 'inline-block' }}>⟳</span>
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Create Free Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Features List */}
          <div className="auth-features">
            <div className="auth-feature-item">
              <ShieldCheck size={14} className="feature-icon" />
              <span>NIFTY 50 Beta & Volatility</span>
            </div>
            <div className="auth-feature-item">
              <BarChart3 size={14} className="feature-icon" />
              <span>Cross-Asset Correlation</span>
            </div>
            <div className="auth-feature-item">
              <Activity size={14} className="feature-icon" />
              <span>Historical Max Drawdown</span>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <p className="auth-footer-text">
          {mode === 'login' ? (
            <>
              Don't have an account yet?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => handleModeSwitch('register')}
              >
                Sign up free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => handleModeSwitch('login')}
              >
                Sign in
              </button>
            </>
          )}
        </p>

      </div>
    </div>
  );
}
