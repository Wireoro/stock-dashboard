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
import ROEChart from './components/ROEChart.jsx';
import StockFilter from './components/StockFilter.jsx';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function App() {
  const [symbol,      setSymbol]      = useState('NVDA');
  const [companyName, setCompanyName] = useState('NVIDIA Corporation');

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
          <span style={styles.brandName}>Investable</span>
          <span style={styles.brandEm}> Knowledge</span>
        </div>
        <div style={styles.headerSearch}>
          <SearchBar onSelect={handleSelect} />
        </div>
      </header>

      {/* ── Main — no sidebar, full width ── */}
      <main style={styles.main}>

        {/* Country + Industry filter strip — US shown by default */}
        <StockFilter selected={symbol} onSelect={handleSelect} />

        {/* Dashboard */}
        <QuoteCard        symbol={symbol} onAdd={() => {}} />
        <CompanyProfile   symbol={symbol} />
        <Metrics          symbol={symbol} />
        <StockChart       symbol={symbol} />
        <ROEChart         symbol={symbol} />
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
    padding: '1rem 2rem',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    display: 'flex',
    alignItems: 'baseline',
    flexShrink: 0,
  },
  brandName: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.35rem',
    fontWeight: 400,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
  },
  brandEm: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.35rem',
    fontWeight: 400,
    fontStyle: 'italic',
    color: 'var(--accent)',
    letterSpacing: '-0.01em',
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
    maxWidth: 1100,
    width: '100%',
    margin: '0 auto',
  },
};
