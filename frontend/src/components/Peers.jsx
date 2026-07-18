import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function PeerQuote({ symbol, onSelect }) {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/quote?symbol=${symbol}`)
      .then(r => r.json())
      .then(setQuote)
      .catch(() => {});
  }, [symbol]);

  const isUp = quote && quote.dp >= 0;
  const color = isUp ? 'var(--green)' : 'var(--red)';

  return (
    <div
      style={styles.peerCard}
      onClick={() => onSelect(symbol)}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <span style={styles.peerSymbol}>{symbol}</span>
      {quote && quote.c ? (
        <>
          <span style={styles.peerPrice}>${quote.c.toFixed(2)}</span>
          <span style={{ ...styles.peerChange, color }}>
            {isUp ? '▲' : '▼'} {Math.abs(quote.dp || 0).toFixed(2)}%
          </span>
        </>
      ) : (
        <span style={styles.peerLoading}>—</span>
      )}
    </div>
  );
}

export default function Peers({ symbol, onSelect }) {
  const [peers, setPeers]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/peers?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => {
        // Filter out the current symbol and limit to 8
        const filtered = (Array.isArray(d) ? d : [])
          .filter(s => s !== symbol)
          .slice(0, 8);
        setPeers(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading || peers.length === 0) return null;

  return (
    <div style={styles.card}>
      <p style={styles.label}>SIMILAR COMPANIES</p>
      <div style={styles.grid}>
        {peers.map(peer => (
          <PeerQuote
            key={peer}
            symbol={peer}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.5rem',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    color: 'var(--muted)',
    marginBottom: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '0.5rem',
  },
  peerCard: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '0.75rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    transition: 'border-color 0.15s',
  },
  peerSymbol: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--accent)',
  },
  peerPrice: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.92rem',
    color: 'var(--text)',
    fontWeight: 500,
  },
  peerChange: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
  },
  peerLoading: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
    color: 'var(--muted)',
  },
};
