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
import StockFilter from './components/StockFilter.jsx';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function App() {
  const [symbol,      setSymbol]      = useState('AAPL');
  const [companyName, setCompanyName] = useState('Apple Inc');

  useEffect(() => {
    fetch(`${API}/api/profile?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { if (d.name) setCompanyName(d.name); })
      .catch(() => {});
  }, [symbol]);

  function handleSelect(sym) {
    setSymbol(sym.toUpperCase());
  }

  return (
    <div style={styles.shell}>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.brandName}>Stock<em style={styles.brandEm}>Pulse</em></span>
          <span style={styles.brandSub}>Market Intelligence</span>
        </div>
        <div style={styles.headerSearch}>
          <SearchBar onSelect={handleSelect} />
        </div>
      </header>

      {/* ── Main layout — no sidebar ── */}
      <main style={styles.main}>

        {/* Filter strip — country + industry pills + stock grid */}
        <StockFilter selected={symbol} onSelect={handleSelect} />

        {/* Dashboard cards */}
        <QuoteCard        symbol={symbol} onAdd={() => {}} />
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
  );
}

const styles = {
  shell: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    padding: '1.25rem 2rem',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.6rem',
    flexShrink: 0,
  },
  brandName: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.4rem',
    fontWeight: 400,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
  },
  brandEm: {
    fontStyle: 'italic',
    color: 'var(--accent)',
  },
  brandSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    color: 'var(--muted)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  headerSearch: {
    flex: 1,
    maxWidth: 480,
  },
  main: {
    flex: 1,
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    maxWidth: 1000,
    width: '100%',
    margin: '0 auto',
  },
};
