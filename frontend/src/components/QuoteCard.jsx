import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function QuoteCard({ symbol, onAdd }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prevSymbol, setPrevSymbol] = useState(null);
  const [flash, setFlash] = useState(null); // 'up' | 'down'

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/quote?symbol=${symbol}`)
      .then(r => r.json())
      .then(data => {
        if (prevSymbol === symbol && quote) {
          setFlash(data.c > quote.c ? 'up' : 'down');
          setTimeout(() => setFlash(null), 800);
        }
        setQuote(data);
        setPrevSymbol(symbol);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load quote');
        setLoading(false);
      });
  }, [symbol]);

  if (loading) return <Card><Skeleton /></Card>;
  if (error) return <Card><p style={{ color: 'var(--red)' }}>{error}</p></Card>;
  if (!quote || quote.c === 0) return <Card><p style={{ color: 'var(--muted)' }}>No data for {symbol}</p></Card>;

  const change = quote.d ?? 0;
  const changePct = quote.dp ?? 0;
  const isUp = change >= 0;
  const color = isUp ? 'var(--green)' : 'var(--red)';

  const flashBg = flash === 'up'
    ? 'rgba(0,212,160,0.07)'
    : flash === 'down'
    ? 'rgba(240,82,82,0.07)'
    : 'transparent';

  return (
    <Card>
      <div style={{ ...styles.inner, background: flashBg, transition: 'background 0.4s' }}>
        {/* Top row */}
        <div style={styles.topRow}>
          <div>
            <span style={styles.symbolLabel}>{symbol}</span>
            <span style={styles.exchangeTag}>NASDAQ</span>
          </div>
          <button style={styles.addBtn} onClick={onAdd}>+ Watchlist</button>
        </div>

        {/* Price */}
        <div style={styles.priceRow}>
          <span style={styles.price}>${quote.c?.toFixed(2)}</span>
          <div style={{ ...styles.changeChip, borderColor: color }}>
            <span style={{ color, fontWeight: 600 }}>
              {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}
            </span>
            <span style={{ color, opacity: 0.75 }}>
              &nbsp;({isUp ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Metrics grid */}
        <div style={styles.grid}>
          {[
            ['Open',       `$${quote.o?.toFixed(2)}`],
            ['Prev close', `$${quote.pc?.toFixed(2)}`],
            ['High',       `$${quote.h?.toFixed(2)}`],
            ['Low',        `$${quote.l?.toFixed(2)}`],
          ].map(([label, val]) => (
            <div key={label} style={styles.metric}>
              <span style={styles.metricLabel}>{label}</span>
              <span style={styles.metricVal}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={skeletonBar(120, 20)} />
      <div style={{ ...skeletonBar(200, 44), marginTop: 16 }} />
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        {[1,2,3,4].map(i => <div key={i} style={skeletonBar(80, 40)} />)}
      </div>
    </div>
  );
}

function skeletonBar(w, h) {
  return {
    width: w,
    height: h,
    borderRadius: 6,
    background: 'linear-gradient(90deg, var(--surface2) 25%, var(--border2) 50%, var(--surface2) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
  };
}

const styles = {
  inner: {
    padding: '1.5rem',
    borderRadius: 'var(--radius-lg)',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  },
  symbolLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1rem',
    fontWeight: 500,
    color: 'var(--text)',
    marginRight: '0.5rem',
  },
  exchangeTag: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--muted)',
    background: 'var(--surface2)',
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid var(--border)',
  },
  addBtn: {
    background: 'none',
    border: '1px solid var(--border2)',
    color: 'var(--text2)',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: '0.78rem',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  price: {
    fontFamily: 'var(--font-mono)',
    fontSize: '2.6rem',
    fontWeight: 500,
    color: 'var(--text)',
    letterSpacing: '-0.02em',
  },
  changeChip: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.95rem',
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid',
    background: 'rgba(255,255,255,0.03)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1px',
    background: 'var(--border)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  metric: {
    background: 'var(--surface2)',
    padding: '0.65rem 0.9rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  metricLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--muted)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.92rem',
    color: 'var(--text)',
    fontWeight: 500,
  },
};
