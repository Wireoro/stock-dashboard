import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function Earnings({ symbol }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/earnings?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading || data.length === 0) return null;

  return (
    <div style={styles.card}>
      <p style={styles.label}>EARNINGS HISTORY</p>
      <div style={styles.table}>
        {/* Header */}
        <div style={styles.headerRow}>
          <span style={styles.th}>Quarter</span>
          <span style={styles.th}>Date</span>
          <span style={{ ...styles.th, textAlign: 'right' }}>Estimate</span>
          <span style={{ ...styles.th, textAlign: 'right' }}>Actual</span>
          <span style={{ ...styles.th, textAlign: 'right' }}>Surprise</span>
        </div>

        {data.map((e, i) => {
          const surprise = e.actual !== null && e.estimate !== null
            ? e.actual - e.estimate
            : null;
          const surprisePct = surprise !== null && e.estimate
            ? (surprise / Math.abs(e.estimate)) * 100
            : null;
          const isPositive = surprise !== null && surprise >= 0;

          return (
            <div key={i} style={{
              ...styles.row,
              background: i % 2 === 0 ? 'var(--surface2)' : 'var(--surface)',
            }}>
              <span style={styles.td}>{e.period || '—'}</span>
              <span style={styles.td}>{e.date || '—'}</span>
              <span style={{ ...styles.td, textAlign: 'right' }}>
                {e.estimate != null ? `$${e.estimate.toFixed(2)}` : '—'}
              </span>
              <span style={{ ...styles.td, textAlign: 'right' }}>
                {e.actual != null ? `$${e.actual.toFixed(2)}` : '—'}
              </span>
              <span style={{
                ...styles.td,
                textAlign: 'right',
                color: surprise === null ? 'var(--muted)'
                  : isPositive ? 'var(--green)' : 'var(--red)',
                fontWeight: 500,
              }}>
                {surprisePct !== null
                  ? `${isPositive ? '+' : ''}${surprisePct.toFixed(1)}%`
                  : '—'}
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
  },
  headerRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
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
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
    padding: '0.6rem 0.9rem',
    borderBottom: '1px solid var(--border)',
  },
  td: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
    color: 'var(--text)',
  },
};
