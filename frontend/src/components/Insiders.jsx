import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function fmtShares(n) {
  if (!n) return '—';
  return Math.abs(n).toLocaleString();
}

function fmtValue(shares, price) {
  if (!shares || !price) return '—';
  const val = Math.abs(shares * price);
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
  return `$${val.toFixed(2)}`;
}

export default function Insiders({ symbol }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/insiders?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading || data.length === 0) return null;

  return (
    <div style={styles.card}>
      <p style={styles.label}>INSIDER TRANSACTIONS</p>
      <div style={styles.table}>
        <div style={styles.headerRow}>
          <span style={styles.th}>Name</span>
          <span style={styles.th}>Title</span>
          <span style={{ ...styles.th, textAlign: 'center' }}>Action</span>
          <span style={{ ...styles.th, textAlign: 'right' }}>Shares</span>
          <span style={{ ...styles.th, textAlign: 'right' }}>Value</span>
          <span style={{ ...styles.th, textAlign: 'right' }}>Date</span>
        </div>

        {data.map((t, i) => {
          const isBuy = t.change > 0;
          return (
            <div key={i} style={{
              ...styles.row,
              background: i % 2 === 0 ? 'var(--surface2)' : 'var(--surface)',
            }}>
              <span style={styles.td}>{t.name || '—'}</span>
              <span style={{ ...styles.td, color: 'var(--text2)', fontSize: '0.75rem' }}>
                {t.officerTitle || '—'}
              </span>
              <span style={{ ...styles.td, textAlign: 'center' }}>
                <span style={{
                  ...styles.badge,
                  background: isBuy ? 'rgba(0,212,160,0.12)' : 'rgba(240,82,82,0.12)',
                  color: isBuy ? 'var(--green)' : 'var(--red)',
                  border: `1px solid ${isBuy ? 'rgba(0,212,160,0.3)' : 'rgba(240,82,82,0.3)'}`,
                }}>
                  {isBuy ? '▲ Buy' : '▼ Sell'}
                </span>
              </span>
              <span style={{ ...styles.td, textAlign: 'right' }}>
                {fmtShares(t.change)}
              </span>
              <span style={{ ...styles.td, textAlign: 'right' }}>
                {fmtValue(t.change, t.transactionPrice)}
              </span>
              <span style={{ ...styles.td, textAlign: 'right', color: 'var(--muted)' }}>
                {t.transactionDate || '—'}
              </span>
            </div>
          );
        })}
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
    overflowX: 'auto',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    color: 'var(--muted)',
    marginBottom: '1rem',
  },
  table: {
    border: '1px solid var(--border)',
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 600,
  },
  headerRow: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1.2fr 0.8fr 1fr 1fr 1fr',
    background: 'var(--surface2)',
    borderBottom: '1px solid var(--border)',
    padding: '0.5rem 0.9rem',
  },
  th: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1.2fr 0.8fr 1fr 1fr 1fr',
    padding: '0.6rem 0.9rem',
    borderBottom: '1px solid var(--border)',
    alignItems: 'center',
  },
  td: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: {
    display: 'inline-block',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    padding: '2px 8px',
    borderRadius: 4,
    fontWeight: 500,
  },
};
