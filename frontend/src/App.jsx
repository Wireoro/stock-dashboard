import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar.jsx';
import QuoteCard from './components/QuoteCard.jsx';
import StockChart from './components/StockChart.jsx';
import CompanyProfile from './components/CompanyProfile.jsx';
import Metrics from './components/Metrics.jsx';
import Earnings from './components/Earnings.jsx';
import InsiderSentiment from './components/InsiderSentiment.jsx';
import GovSpending from './components/GovSpending.jsx';
import SocialSentiment from './components/SocialSentiment.jsx';
import ESGScore from './components/ESGScore.jsx';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const WATCHLIST_DEFAULTS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA'];

export default function App() {
  const [symbol, setSymbol]           = useState('AAPL');
  const [watchlist, setWatchlist]     = useState(WATCHLIST_DEFAULTS);
  const [companyName, setCompanyName] = useState('Apple Inc');

  useEffect(() => {
    fetch(`${API}/api/profile?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { if (d.name) setCompanyName(d.name); })
      .catch(() => {});
  }, [symbol]);

  function addToWatchlist(sym) {
    if (!watchlist.includes(sym)) setWatchlist(w => [...w, sym]);
  }

  function removeFromWatchlist(sym) {
    setWatchlist(w => w.filter(s => s !== sym));
  }

  function handleSelect(sym) {
    setSymbol(sym);
    addToWatchlist(sym);
  }

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoMark}>▸</span>
          <span style={styles.logoText}>STOCKPULSE</span>
        </div>
        <div style={styles.headerSearch}>
          <SearchBar onSelect={handleSelect} />
        </div>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <p style={styles.sidebarLabel}>WATCHLIST</p>
          {watchlist.map(sym => (
            <WatchlistItem
              key={sym}
              symbol={sym}
              active={sym === symbol}
              onSelect={() => setSymbol(sym)}
              onRemove={() => removeFromWatchlist(sym)}
            />
          ))}
        </aside>

        <main style={styles.main}>
          <QuoteCard        symbol={symbol} onAdd={() => addToWatchlist(symbol)} />
          <CompanyProfile   symbol={symbol} />
          <Metrics          symbol={symbol} />
          <StockChart       symbol={symbol} />
          <SocialSentiment  symbol={symbol} />
          <InsiderSentiment symbol={symbol} />
          <ESGScore         symbol={symbol} />
          <GovSpending      symbol={symbol} companyName={companyName} />
          <Earnings         symbol={symbol} />
        </main>
      </div>
    </div>
  );
}

function WatchlistItem({ symbol, active, onSelect, onRemove }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...styles.watchItem,
        background: active ? 'rgba(0,212,160,0.08)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderColor: active ? 'rgba(0,212,160,0.3)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button style={styles.watchBtn} onClick={onSelect}>
        <span style={{ color: active ? 'var(--accent)' : 'var(--text)', fontWeight: active ? 600 : 400 }}>
          {symbol}
        </span>
      </button>
      {hovered && (
        <button style={styles.removeBtn} onClick={onRemove} title="Remove">✕</button>
      )}
    </div>
  );
}

const styles = {
  shell: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', alignItems: 'center', gap: '2rem',
    padding: '1rem 2rem', borderBottom: '1px solid var(--border)',
    background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 },
  logoMark: { color: 'var(--accent)', fontSize: '1.4rem' },
  logoText: {
    fontFamily: 'var(--font-sans)', fontWeight: 700,
    fontSize: '1.05rem', letterSpacing: '0.15em', color: 'var(--text)',
  },
  headerSearch: { flex: 1, maxWidth: 480 },
  layout: { display: 'flex', flex: 1, minHeight: 0 },
  sidebar: {
    width: 160, flexShrink: 0, borderRight: '1px solid var(--border)',
    padding: '1.5rem 0', background: 'var(--surface)',
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  sidebarLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
    letterSpacing: '0.12em', color: 'var(--muted)', padding: '0 1rem 0.75rem',
  },
  watchItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 0.5rem 0 1rem', borderRadius: 6,
    border: '1px solid transparent',
    transition: 'background 0.15s, border-color 0.15s', margin: '0 0.5rem',
  },
  watchBtn: {
    flex: 1, background: 'none', border: 'none', padding: '0.55rem 0',
    textAlign: 'left', fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem', color: 'var(--text2)', cursor: 'pointer',
  },
  removeBtn: {
    background: 'none', border: 'none', color: 'var(--muted)',
    fontSize: '0.7rem', padding: '2px 4px', cursor: 'pointer', borderRadius: 4,
  },
  main: {
    flex: 1, padding: '2rem', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 960,
  },
};
