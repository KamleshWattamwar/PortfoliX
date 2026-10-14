import React, { useState, useMemo } from 'react';
import {
  HelpCircle, ChevronDown, ChevronUp, Search, X,
  Activity, TrendingDown, Grid, Wallet, AlertTriangle, Info, BookOpen
} from 'lucide-react';

// ─── FAQ Data ──────────────────────────────────────────────────────────────────

const FAQ_CATEGORIES = [
  {
    id: 'portfolio-basics',
    label: 'Portfolio Basics',
    icon: Wallet,
    color: 'var(--accent-indigo)',
    items: [
      {
        id: 'invested-capital',
        q: 'What is Invested Capital (Total Invested)?',
        sections: [
          { type: 'text', content: 'Invested Capital is the total amount of money you have spent purchasing your current holdings — the sum of (buy price x quantity) across all positions.' },
          { type: 'heading', content: 'Formula' },
          { type: 'code', content: 'Total Invested = Sum of (buy_price x quantity) for each holding' },
          { type: 'heading', content: 'Example' },
          { type: 'text', content: 'You bought 50 shares of RELIANCE at Rs.2,400 and 100 shares of TCS at Rs.3,500. Invested Capital = (50 x Rs.2,400) + (100 x Rs.3,500) = Rs.1,20,000 + Rs.3,50,000 = Rs.4,70,000' },
          { type: 'heading', content: 'Why it matters' },
          { type: 'text', content: 'This is your cost basis — the benchmark against which all profit/loss is measured. It never changes unless you add or remove positions.' },
          { type: 'heading', content: 'Caveat' },
          { type: 'text', content: 'When you hold multiple buy lots for the same ticker (e.g., bought TCS in three separate transactions), PortfoliX blends those into a single weighted-average buy price per ticker.' },
        ],
      },
      {
        id: 'current-value',
        q: 'What is Current Market Value?',
        sections: [
          { type: 'text', content: 'Current Market Value is what your portfolio is worth right now, based on the latest available market prices.' },
          { type: 'heading', content: 'Formula' },
          { type: 'code', content: 'Current Value = Sum of (current_price x quantity) for each holding' },
          { type: 'heading', content: 'Live Updates' },
          { type: 'text', content: 'PortfoliX connects to a live WebSocket feed for real-time price updates during market hours. The green LIVE badge in the top-right of the Portfolio page confirms a live connection. If disconnected, it shows CONNECTING in yellow and falls back to the last-known REST price.' },
          { type: 'heading', content: 'Example' },
          { type: 'text', content: 'If your 50 RELIANCE shares are now trading at Rs.2,600, they contribute Rs.1,30,000 to your current value, regardless of what you paid.' },
          { type: 'heading', content: 'Caveat' },
          { type: 'text', content: 'Current value reflects the last traded price, which may lag by seconds to minutes depending on market activity and WebSocket latency. It is not the same as the price at which you would actually sell (bid/ask spread and liquidity affect real execution prices).' },
        ],
      },
      {
        id: 'pnl',
        q: 'What is Unrealized P&L and how is it calculated?',
        sections: [
          { type: 'text', content: 'Unrealized P&L (Profit & Loss) is the gain or loss on your open positions that you have not yet locked in by selling.' },
          { type: 'heading', content: 'Formula' },
          { type: 'code', content: 'P&L = Current Value - Invested Capital\nP&L % = (P&L / Invested Capital) x 100' },
          { type: 'heading', content: 'Example' },
          { type: 'text', content: 'Invested Capital = Rs.4,70,000 | Current Value = Rs.5,10,000 => P&L = +Rs.40,000 (+8.51%)' },
          { type: 'heading', content: 'Why "Unrealized"?' },
          { type: 'text', content: 'The profit exists only on paper. It becomes "realized" (and potentially taxable) only when you sell. Until then, market movements can turn a gain into a loss.' },
          { type: 'heading', content: 'Color coding' },
          { type: 'text', content: 'PortfoliX shows P&L in green for gains and red for losses across both the summary cards and the individual holdings table.' },
          { type: 'heading', content: 'Caveat' },
          { type: 'text', content: 'This does not account for taxes (short-term or long-term capital gains tax applicable in India), transaction costs, or currency risk. It is gross, pre-tax unrealized return only.' },
        ],
      },
      {
        id: 'portfolio-weights',
        q: 'What are Portfolio Weights and how are they calculated?',
        sections: [
          { type: 'text', content: "A portfolio weight is each holding's share of your total portfolio value, expressed as a percentage." },
          { type: 'heading', content: 'Formula' },
          { type: 'code', content: 'Weight of Holding X = (Current Value of X) / (Total Current Portfolio Value)' },
          { type: 'heading', content: 'Example' },
          { type: 'text', content: 'Total portfolio = Rs.5,00,000. HDFC Bank position = Rs.1,25,000. Weight = Rs.1,25,000 / Rs.5,00,000 = 25%' },
          { type: 'heading', content: 'Why it matters' },
          { type: 'text', content: 'Weights drive everything else — risk calculations, correlation analysis, and concentration alerts are all weight-based. A 40% weight in one stock means that stock\'s individual swings have an outsized impact on your entire portfolio.' },
          { type: 'heading', content: 'Live recalculation' },
          { type: 'text', content: 'Weights update in real time as prices move via WebSocket. If one stock surges, its weight rises automatically, which may trigger a concentration warning even without any trades.' },
          { type: 'heading', content: 'Caveat' },
          { type: 'text', content: 'Weights reflect current market value, not the amount you originally invested. This means your effective exposure drifts over time as prices change — a concept called "portfolio drift."' },
        ],
      },
    ],
  },
  {
    id: 'risk-metrics',
    label: 'Risk Metrics',
    icon: Activity,
    color: 'var(--accent-violet)',
    items: [
      {
        id: 'volatility',
        q: 'What is Annualized Volatility (\u03c3)?',
        sections: [
          { type: 'text', content: "Annualized Volatility measures how much your portfolio's returns fluctuate over time. It is expressed as a percentage — the higher the number, the more unpredictable (and potentially risky) the portfolio." },
          { type: 'heading', content: 'Formula (from risk_engine.py)' },
          { type: 'code', content: 'Daily Volatility = std(daily_returns, ddof=1)  [sample std dev over 252-day lookback]\nAnnualized Volatility (\u03c3) = Daily Volatility x sqrt(252)' },
          { type: 'heading', content: 'Example' },
          { type: 'text', content: 'If daily returns have a standard deviation of 1.2%, the annualized volatility = 1.2% x sqrt(252) \u2248 19.0%' },
          { type: 'heading', content: 'How to interpret' },
          { type: 'bullets', content: ['< 15% — Low volatility (typical for large-cap defensive stocks)', '15\u201325% — Moderate (typical for NIFTY 50 index-like portfolios)', '> 30% — High volatility (small-caps, thematic stocks)'] },
          { type: 'heading', content: 'Why it matters' },
          { type: 'text', content: 'Volatility is the most common measure of investment risk. Two portfolios with the same return but different volatility are NOT equally good — the more volatile one required more stomach (and luck) to achieve the same outcome.' },
          { type: 'heading', content: 'Caveat' },
          { type: 'text', content: 'Volatility is backward-looking (based on the past year of data). High past volatility does not guarantee high future volatility, and vice versa. It also treats upside and downside movements equally, which understates the real pain of large losses.' },
        ],
      },
      {
        id: 'beta',
        q: 'What is Portfolio Beta vs NIFTY 50?',
        sections: [
          { type: 'text', content: 'Beta measures how much your portfolio\'s value tends to move relative to the NIFTY 50 benchmark index (^NSEI). It quantifies systematic (market-wide) risk.' },
          { type: 'heading', content: 'Formula (from risk_engine.py)' },
          { type: 'code', content: '\u03b2 = Covariance(Portfolio Returns, NIFTY 50 Returns) / Variance(NIFTY 50 Returns)' },
          { type: 'heading', content: 'Interpreting Beta' },
          { type: 'bullets', content: ['\u03b2 = 1.0 \u2192 Your portfolio moves exactly with the NIFTY 50 (Market Neutral)', '\u03b2 > 1.1 \u2192 Aggressive \u2014 amplifies market moves (PortfoliX labels this "High Sensitivity")', '\u03b2 < 0.9 \u2192 Defensive \u2014 dampens market moves (PortfoliX labels this "Defensive")', '\u03b2 < 0 \u2192 Counter-cyclical \u2014 tends to rise when the market falls (rare in equity portfolios)'] },
          { type: 'heading', content: 'Example' },
          { type: 'text', content: '\u03b2 = 1.3 means if NIFTY 50 rises 10%, your portfolio is expected to rise ~13%. If NIFTY 50 falls 10%, your portfolio is expected to fall ~13%.' },
          { type: 'heading', content: 'Why it matters' },
          { type: 'text', content: 'Beta tells you whether you are taking more or less market risk than a simple NIFTY 50 index fund. A high-beta portfolio can produce superior gains in bull markets but amplifies losses in bear markets.' },
          { type: 'heading', content: 'Caveat' },
          { type: 'text', content: 'Beta is calculated over a 1-year historical window using daily closing prices. It can be unstable for portfolios with few holdings or low-liquidity stocks. Beta measures only systematic risk — it cannot capture company-specific risks like fraud or regulatory action.' },
        ],
      },
      {
        id: 'sharpe',
        q: 'What is the Annualized Sharpe Ratio?',
        sections: [
          { type: 'text', content: 'The Sharpe Ratio measures how much excess return you earn per unit of risk (volatility). It answers: "Was the risk worth it?"' },
          { type: 'heading', content: 'Formula (from risk_engine.py)' },
          { type: 'code', content: 'Annualized Return = mean(daily_returns) x 252\nSharpe Ratio = (Annualized Return \u2212 Risk-Free Rate) / Annualized Volatility\nRisk-Free Rate = 7.0% (Indian 10-year G-Sec yield)' },
          { type: 'heading', content: 'Interpreting Sharpe Ratio' },
          { type: 'bullets', content: ['> 2.0 \u2192 Excellent \u2014 exceptional risk-adjusted return', '1.0\u20132.0 \u2192 Good \u2014 above-average compensation for risk', '0.5\u20131.0 \u2192 Acceptable \u2014 modest risk-adjusted return', '0\u20130.5 \u2192 Poor \u2014 barely compensating for risk taken', '< 0 \u2192 Negative \u2014 your portfolio underperformed a risk-free G-Sec deposit'] },
          { type: 'heading', content: 'Example' },
          { type: 'code', content: 'Annualized Return = 15%, Volatility = 20%, Risk-Free Rate = 7%\nSharpe = (15% \u2212 7%) / 20% = 0.40' },
          { type: 'heading', content: 'Why it matters' },
          { type: 'text', content: 'Raw returns alone are misleading. A portfolio returning 25% with 50% volatility is riskier than one returning 18% with 15% volatility. The Sharpe Ratio normalizes for risk so you can make fair comparisons.' },
          { type: 'heading', content: 'Caveat' },
          { type: 'text', content: 'The Sharpe Ratio assumes returns are normally distributed, which is often violated in real markets (fat tails, skewness). It also penalizes upside volatility equally with downside volatility, which some consider unfair.' },
        ],
      },
    ],
  },
  {
    id: 'drawdown',
    label: 'Drawdown',
    icon: TrendingDown,
    color: 'var(--accent-rose)',
    items: [
      {
        id: 'max-drawdown',
        q: 'What is Maximum Drawdown (MDD)?',
        sections: [
          { type: 'text', content: 'Maximum Drawdown (MDD) measures the largest percentage decline your portfolio experienced from any peak to the subsequent trough, before recovering to a new peak. It captures the worst real downside pain an investor would have endured.' },
          { type: 'heading', content: 'Formula (from risk_engine.py)' },
          { type: 'code', content: '1. Cumulative Returns(t) = product(1 + daily_return) over time\n2. Running Peak(t) = max(CumReturns from start to t)\n3. Drawdown(t) = (CumReturns(t) \u2212 Peak(t)) / Peak(t)\n4. MDD = min(Drawdown series)  [most negative value]' },
          { type: 'heading', content: 'Example' },
          { type: 'text', content: 'Your portfolio grows from Rs.1,00,000 to Rs.1,50,000 (peak), then falls to Rs.1,05,000 (trough). MDD = (Rs.1,05,000 \u2212 Rs.1,50,000) / Rs.1,50,000 = -30%' },
          { type: 'heading', content: 'Interpreting MDD' },
          { type: 'bullets', content: ['< 10% \u2014 Conservative: very stable portfolio', '10\u201320% \u2014 Moderate: typical for diversified equity', '20\u201335% \u2014 Significant: expect sharp declines during crises', '> 35% \u2014 High: concentrated or high-beta portfolio at serious risk'] },
          { type: 'heading', content: 'Capital recovery insight' },
          { type: 'text', content: 'A 30% loss requires a 42.9% gain just to break even. This asymmetry makes drawdown management critical for long-term wealth building.' },
          { type: 'heading', content: 'Caveat' },
          { type: 'text', content: 'MDD is backward-looking. Future drawdowns may be larger or smaller. It also says nothing about how long the recovery took (recovery time = "drawdown duration," which PortfoliX does not currently compute).' },
        ],
      },
      {
        id: 'drawdown-chart',
        q: 'How do I read the Drawdown Chart?',
        sections: [
          { type: 'text', content: "The drawdown chart on the Drawdown page shows the portfolio's decline (in %) from its running historical peak at each point in time." },
          { type: 'heading', content: 'Reading the chart' },
          { type: 'bullets', content: ['The y-axis always starts at 0% (portfolio at its peak) and extends downward into negative territory', 'Each point on the x-axis shows how far below the most recent peak the portfolio was on that date', 'A flat line at 0% means the portfolio was at or above all-time highs during that period', 'Deep troughs (lowest points) represent the worst losses before a recovery'] },
          { type: 'heading', content: 'Example reading' },
          { type: 'text', content: 'If the chart shows -22% in March 2020, it means the portfolio had fallen 22% below its previous peak by that date — consistent with the COVID-19 crash.' },
          { type: 'heading', content: 'Technical details' },
          { type: 'text', content: "PortfoliX reconstructs the portfolio's daily value history using your current holdings' historical prices and quantities, then applies the drawdown formula. The 1-year lookback means up to 252 trading days of data are shown." },
        ],
      },
    ],
  },
  {
    id: 'correlation',
    label: 'Correlation & Diversification',
    icon: Grid,
    color: 'var(--accent-cyan)',
    items: [
      {
        id: 'correlation-matrix',
        q: 'What does the Correlation Matrix show?',
        sections: [
          { type: 'text', content: 'The Correlation Matrix shows the statistical relationship (co-movement) between every pair of stocks in your portfolio, using daily return data over the past year.' },
          { type: 'heading', content: 'Formula' },
          { type: 'code', content: 'Correlation(A, B) = Covariance(Returns_A, Returns_B) / (\u03c3_A x \u03c3_B)\nPearson correlation coefficient: always between \u22121 and +1' },
          { type: 'heading', content: 'How to read the heatmap' },
          { type: 'bullets', content: ['+1.0 (diagonal) \u2014 every stock is perfectly correlated with itself', '> 0.75 (red) \u2014 very high co-movement: adding both adds little diversification', '0.5\u20130.75 (amber) \u2014 moderate positive correlation', '0.2\u20130.5 (purple) \u2014 low positive correlation: modest diversification benefit', '0\u20130.2 (cyan) \u2014 weak correlation: good diversification', '< 0 (green) \u2014 negative correlation: excellent for reducing volatility'] },
          { type: 'heading', content: 'Example' },
          { type: 'text', content: 'TCS vs INFOSYS often shows correlation > 0.80 (both are large-cap IT exporters with similar revenue profiles). Adding both provides minimal sector diversification.' },
          { type: 'heading', content: 'Why it matters' },
          { type: 'text', content: 'Modern Portfolio Theory (Markowitz, 1952) shows that combining assets with low or negative correlation reduces overall portfolio volatility without sacrificing expected return. This is the mathematical foundation for diversification.' },
          { type: 'heading', content: 'Caveat' },
          { type: 'text', content: 'Correlations are unstable — they tend to spike toward 1.0 during market crashes (when everything falls together), precisely when diversification is most needed. Historical correlation is not a reliable predictor of future correlation.' },
        ],
      },
      {
        id: 'concentration-risk',
        q: 'What is Concentration Risk and why does the 30% alert fire?',
        sections: [
          { type: 'text', content: 'Concentration risk is the danger of having too large a portion of your portfolio in a single stock. If that stock suffers a major adverse event, it can cause outsized damage to your overall wealth.' },
          { type: 'heading', content: 'How the PortfoliX alert works' },
          { type: 'text', content: 'The system checks every holding\'s weight after every recalculation. If any single ticker\'s weight exceeds 30% of total portfolio value, a yellow Concentration Alert banner appears on the Risk Metrics page.' },
          { type: 'code', content: 'From risk_engine.py:\nCONCENTRATION_THRESHOLD = 0.30  # 30% single-holding weight limit' },
          { type: 'heading', content: 'Example' },
          { type: 'text', content: 'Portfolio value = Rs.5,00,000. Reliance Industries = Rs.1,80,000 (36%). Alert fires: "RELIANCE represents 36.0% of your total portfolio value."' },
          { type: 'heading', content: 'Why 30%?' },
          { type: 'text', content: 'While no universal rule exists, portfolio managers commonly recommend that no single position exceed 10\u201325% for well-diversified retail portfolios. PortfoliX uses 30% as a pragmatic threshold \u2014 a strong signal of over-concentration without being overly restrictive.' },
          { type: 'heading', content: 'Caveat' },
          { type: 'text', content: 'The 30% threshold is a guideline, not a rule. Highly experienced investors intentionally run concentrated portfolios. Your tolerance depends on your investment horizon, income stability, and emotional resilience to drawdowns.' },
        ],
      },
    ],
  },
];

// ─── Render helpers ─────────────────────────────────────────────────────────────

function renderSection(sec, i, searchQuery) {
  const hl = (text) => {
    if (!searchQuery || !text) return text;
    const parts = text.split(new RegExp('(' + searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'));
    return parts.map((p, j) =>
      p.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={j} style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '3px', padding: '0 3px', fontWeight: '600' }}>{p}</mark>
        : p
    );
  };

  switch (sec.type) {
    case 'heading':
      return (
        <div key={i} style={{ fontSize: '0.82rem', fontWeight: '800', color: '#2563eb', marginTop: '1.1rem', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {hl(sec.content)}
        </div>
      );
    case 'code':
      return (
        <pre key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.9rem 1.25rem', fontSize: '0.9rem', color: '#0f172a', fontFamily: 'var(--font-mono)', overflowX: 'auto', margin: '0.65rem 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.65' }}>
          {hl(sec.content)}
        </pre>
      );
    case 'bullets':
      return (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: '0.5rem 0 0.5rem 0.35rem' }}>
          {sec.content.map((b, j) => (
            <div key={j} style={{ display: 'flex', gap: '0.6rem' }}>
              <span style={{ color: '#2563eb', flexShrink: 0, lineHeight: '1.7', fontWeight: '800' }}>•</span>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{hl(b)}</span>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <p key={i} style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: '1.75', margin: '0.4rem 0' }}>
          {hl(sec.content)}
        </p>
      );
  }
}

// ─── Accordion Item ─────────────────────────────────────────────────────────────

function AccordionItem({ item, isOpen, onToggle, searchQuery }) {
  return (
    <div
      style={{
        borderRadius: '12px',
        border: `1px solid ${isOpen ? '#bfdbfe' : 'var(--border-subtle)'}`,
        background: isOpen ? '#f8fafc' : '#ffffff',
        boxShadow: isOpen ? '0 1px 3px rgba(37,99,235,0.06)' : 'none',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)', gap: '1.25rem' }}
        aria-expanded={isOpen}
        id={'faq-btn-' + item.id}
        aria-controls={'faq-panel-' + item.id}
      >
        <span style={{ fontSize: '1.05rem', fontWeight: isOpen ? '800' : '700', lineHeight: '1.45', flex: 1, color: isOpen ? '#1d4ed8' : '#0f172a' }}>
          {item.q}
        </span>
        <span style={{ color: '#2563eb', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      {isOpen && (
        <div id={'faq-panel-' + item.id} role="region" aria-labelledby={'faq-btn-' + item.id} style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ paddingTop: '1rem' }}>
            {item.sections.map((sec, i) => renderSection(sec, i, searchQuery))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category Section ───────────────────────────────────────────────────────────

function CategorySection({ category, openItems, onToggle, searchQuery }) {
  const Icon = category.icon;

  const filteredItems = useMemo(() => {
    if (!searchQuery) return category.items;
    const q = searchQuery.toLowerCase();
    return category.items.filter(item =>
      item.q.toLowerCase().includes(q) ||
      item.sections.some(s => (Array.isArray(s.content) ? s.content.join(' ') : (s.content || '')).toLowerCase().includes(q))
    );
  }, [category, searchQuery]);

  if (filteredItems.length === 0) return null;

  return (
    <section style={{ marginBottom: '0.75rem' }} aria-labelledby={'cat-' + category.id}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
          <Icon size={18} />
        </div>
        <h2 id={'cat-' + category.id} style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
          {category.label}
        </h2>
        <span style={{ fontSize: '0.78rem', color: '#1d4ed8', background: '#eff6ff', padding: '0.2rem 0.65rem', borderRadius: '20px', border: '1px solid #bfdbfe', fontWeight: '700' }}>
          {filteredItems.length} {filteredItems.length === 1 ? 'topic' : 'topics'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {filteredItems.map(item => (
          <AccordionItem
            key={item.id}
            item={item}
            isOpen={openItems.has(item.id)}
            onToggle={() => onToggle(item.id)}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function FAQPage() {
  const [openItems, setOpenItems] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (id) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setOpenItems(new Set(FAQ_CATEGORIES.flatMap(c => c.items.map(i => i.id))));
  };

  const collapseAll = () => setOpenItems(new Set());

  const hasResults = useMemo(() => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return FAQ_CATEGORIES.some(cat =>
      cat.items.some(item =>
        item.q.toLowerCase().includes(q) ||
        item.sections.some(s => (Array.isArray(s.content) ? s.content.join(' ') : (s.content || '')).toLowerCase().includes(q))
      )
    );
  }, [searchQuery]);

  const totalTopics = FAQ_CATEGORIES.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="page-container">

      {/* Hero */}
      <div className="glass-panel" style={{ padding: '2.25rem 2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={26} color="#2563eb" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.45rem', color: '#0f172a' }}>
              Understanding Portfolio Risk Metrics
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.65', margin: 0, maxWidth: '750px' }}>
              Plain-English explanations of every metric in PortfoliX — formulas matched to the actual implementation, worked examples, and interpretation guides. {totalTopics} topics across {FAQ_CATEGORIES.length} categories.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem 1.35rem', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '3px' }} />
          <p style={{ fontSize: '0.88rem', color: '#92400e', margin: 0, lineHeight: '1.65' }}>
            <strong>Disclaimer:</strong> All risk metrics are computed from historical market data. Past performance does not guarantee future results. PortfoliX does not provide personalized investment advice. Consult a SEBI-registered investment adviser before making investment decisions.
          </p>
        </div>
      </div>

      {/* Search + Controls */}
      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search topics — Sharpe, drawdown, beta, correlation…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.8rem', paddingRight: searchQuery ? '2.8rem' : '1.25rem', fontSize: '1.02rem', padding: '0.85rem 1.25rem 0.85rem 2.8rem' }}
            aria-label="Search FAQ topics"
            id="faq-search"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
        <button className="btn btn-secondary" onClick={expandAll} id="faq-expand-all" style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}>Expand All</button>
        <button className="btn btn-secondary" onClick={collapseAll} id="faq-collapse-all" style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}>Collapse All</button>
      </div>

      {/* No results */}
      {!hasResults && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <HelpCircle size={32} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No topics found for &quot;<strong style={{ color: 'var(--text-secondary)' }}>{searchQuery}</strong>&quot;
          </p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => setSearchQuery('')}>Clear Search</button>
        </div>
      )}

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {FAQ_CATEGORIES.map(cat => (
          <CategorySection
            key={cat.id}
            category={cat}
            openItems={openItems}
            onToggle={toggleItem}
            searchQuery={searchQuery}
          />
        ))}
      </div>

      {/* Methodology footer */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Info size={16} color="#2563eb" />
        </div>
        <div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.25rem', color: '#0f172a' }}>Methodology Reference</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.65', margin: 0 }}>
            All formulas correspond to <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: '#f1f5f9', color: '#0f172a', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>backend/services/risk_engine.py</code>.
            Metrics use a <strong>1-year (252 trading-day) lookback</strong> of daily closing prices from Yahoo Finance.
            Beta is benchmarked against <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: '#f1f5f9', color: '#0f172a', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>^NSEI</code> (NIFTY 50).
            Sharpe uses <strong>7.0% risk-free rate</strong> (Indian 10-yr G-Sec).
            Concentration alert threshold: <strong>30%</strong> single-ticker weight.
          </p>
        </div>
      </div>

    </div>
  );
}
