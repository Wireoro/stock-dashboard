import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function Analysts({ symbol }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/recommendations?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading || data.length === 0) return null;

  const latest = data[0];
  const total  = (latest.strongBuy || 0) + (latest.buy || 0) +
                 (latest.hold || 0) + (latest.sell || 0) + (latest.strongSell || 0);

  const ratings = [
    { label: 'Strong buy',  count: latest.strongBuy  || 0, color: '#00d4a0' },
    { label: 'Buy',         count: latest.buy        || 0, color: '#4ade80' },
    { label: 'Hold',        count: latest.hold       || 0, color: '#facc15' },
    { label: 'Sell',        count: latest.sell       || 0, color: '#f97316' },
    { label: 'Strong sell', count: latest.strongSell || 0, color: '#f05252' },
  ];

  // Consensus label
  const bullish = (latest.strongBuy || 0) + (latest.buy || 0);
  const bearish = (latest.sell || 0) + (latest.strongSell || 0);
  const consensus = bullish > bearish * 2 ? 'Strong buy'
    : bullish > bearish ? 'Buy'
    : bearish > bullish * 2 ? 'Strong sell'
    : bearish > bullish ? 'Sell'
    : 'Hold';
  const consensusColor = ['Strong buy', 'Buy'].includes(consensus) ? '#00d4a0'
    : ['Strong sell', 'Sell'].includes(consensus) ? '#f05252'
    : '#facc15';

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <p style={styles.label}>ANALYST RATINGS</p>
        <div style={styles.consensus}>
          <span style={styles.consensusLabel}>Consensus</span>
          <span style={{ ...styles.consensusValue, color: consensusColor }}>
            {consensus}
          </span>
        </div>
      </div>

      <p style={styles.period}>Period: {latest.period} · {total} analysts</p>

      <div style={styles.bars}>
        {ratings.map(({ label, count, color }) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={label} style={styles.barRow}>
              <span style={styles.barLabel}>{label}</span>
              <div style={styles.barTrack}>
                <div style={{
                  ...styles.barFill,
                  width: `${pct}%`,
                  background: color,
                }} />
              </div>
              <span style={{ ...styles.barCount, color }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* History table */}
      {data.length > 1 && (
        <div style={styles.history}>
          <p style={{ ...styles.label, marginBottom: '0.5rem', marginTop: '1rem' }}>HISTORY</p>
          {data.slice(1).map((r, i) => (
            <div key={i} style={styles.histRow}>
              <span style={styles.histPeriod}>{r.period}</span>
              <span style={{ color: '#00d4a0', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                ▲ {(r.strongBuy || 0) + (r.buy || 0)}
              </span>
              <span style={{ color: '#facc15', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                — {r.hold || 0}
              </span>
              <span style={{ color: '#f05252', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                ▼ {(r.sell || 0) + (r.strongSell || 0)}
              </span>
            </div>
          ))}
        </div>
      )}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.25rem',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    color: 'var(--muted)',
  },
  consensus: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  consensusLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    color: 'var(--muted)',
  },
  consensusValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  period: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--muted)',
    marginBottom: '1rem',
  },
  bars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  barLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text2)',
    width: 80,
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: 6,
    background: 'var(--border2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.4s ease',
  },
  barCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    fontWeight: 500,
    width: 24,
    textAlign: 'right',
    flexShrink: 0,
  },
  history: {
    borderTop: '1px solid var(--border)',
    marginTop: '1rem',
    paddingTop: '0.75rem',
  },
  histRow: {
    display: 'flex',
    gap: '1.5rem',
    padding: '0.3rem 0',
    borderBottom: '1px solid var(--border)',
    alignItems: 'center',
  },
  histPeriod: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--text2)',
    flex: 1,
  },
};
