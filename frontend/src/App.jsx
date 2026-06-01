import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar.jsx';
import QuoteCard from './components/QuoteCard.jsx';
import StockChart from './components/StockChart.jsx';
import CompanyProfile from './components/CompanyProfile.jsx';
import Metrics from './components/Metrics.jsx';
import Earnings from './components/Earnings.jsx';
import Peers from './components/Peers.jsx';
import InsiderSentiment from './components/InsiderSentiment.jsx';
import GovSpending from './components/GovSpending.jsx';
import NewsSentiment from './components/NewsSentiment.jsx';
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
        <div style={styles.brand}>
          <span style={styles.brandName}>Stock<em style={styles.brandEm}>Pulse</em></span>
          <span style={styles.brandSub}>Market Intelligence</span>
        </div>
        <div style={styles.headerSearch}>
          <SearchBar onSelect={handleSelect} />
        </div>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <p style={styles.sidebarLabel}>Watchlist</p>
          {watchlist.map(sym => (
            <WatchlistItem
              key={sym}
              symbol={sym}
              active={sym === symbol}
              onSelect={() => setSymbol(sym)}
              onRemove={() => removeFromWatchlist(sym)}
            />
          ))}
          <button
            style={styles.addBtn}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--muted)'; }}
            onClick={() => {
              const s = prompt('Add ticker:');
              if (s) handleSelect(s.toUpperCase().trim());
            }}
          >
            + Add ticker
          </button>
        </aside>

        <main style={styles.main}>
          <QuoteCard        symbol={symbol} onAdd={() => addToWatchlist(symbol)} />
          <CompanyProfile   symbol={symbol} />
          <Metrics          symbol={symbol} />
          <StockChart       symbol={symbol} />
          <NewsSentiment    symbol={symbol} />
          <SocialSentiment  symbol={symbol} />
          <InsiderSentiment symbol={symbol} />
          <ESGScore         symbol={symbol} />
          <GovSpending      symbol={symbol} companyName={companyName} />
          <Earnings         symbol={symbol} />
          <Peers            symbol={symbol} onSelect={handleSelect} />
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
        background: active ? 'rgba(196,101,74,0.07)' : hovered ? 'rgba(196,101,74,0.03)' : 'transparent',
        borderColor: active ? 'rgba(196,101,74,0.3)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button style={styles.watchBtn} onClick={onSelect}>
        <span style={{
          color: active ? 'var(--accent)' : 'var(--text)',
          fontWeight: active ? 600 : 400,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82rem',
        }}>
          {symbol}
        </span>
      </button>
      {hovered && (
        <button style={styles.removeBtn} onClick={onRemove}>✕</button>
      )}
    </div>
  );
}

const styles = {
  shell: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' },
  header: {
    display: 'flex', alignItems: 'center', gap: '2rem',
    padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)',
    background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100,
  },
  brand:    { display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexShrink: 0 },
  brandName:{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.01em' },
  brandEm:  { fontStyle: 'italic', color: 'var(--accent)' },
  brandSub: { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  headerSearch: { flex: 1, maxWidth: 480 },
  layout: { display: 'flex', flex: 1, minHeight: 0 },
  sidebar: {
    width: 168, flexShrink: 0, borderRight: '1px solid var(--border)',
    padding: '1.5rem 0 1rem', background: 'var(--surface)',
    display: 'flex', flexDirection: 'column', gap: '1px',
  },
  sidebarLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--muted)', padding: '0 1rem 0.75rem',
  },
  watchItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 0.5rem 0 1rem', borderRadius: 6,
    border: '1px solid transparent',
    transition: 'background 0.15s, border-color 0.15s', margin: '0 0.5rem',
  },
  watchBtn: { flex: 1, background: 'none', border: 'none', padding: '0.5rem 0', textAlign: 'left', cursor: 'pointer' },
  removeBtn: { background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.65rem', padding: '2px 4px', cursor: 'pointer', borderRadius: 4 },
  addBtn: {
    marginTop: '0.75rem', marginLeft: '1rem', marginRight: '1rem',
    background: 'none', border: '1px dashed var(--border2)', borderRadius: 6,
    padding: '0.4rem 0.75rem', fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem', color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.15s',
  },
  main: {
    flex: 1, padding: '2rem', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 960,
  },
};
