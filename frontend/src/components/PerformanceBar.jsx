import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function formatPct(val) {
  if (val == null) return '—';
  const abs = Math.abs(val);
  // Show as K if over 1000%
  if (abs >= 1000) return `${(val / 1000).toFixed(2)}K%`;
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
}

export default function PerformanceBar({ symbol }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState('1d');

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`${API}/api/performance?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading || !data) return null;

  const { periods } = data;

  return (
    <div style={styles.wrap}>
      {periods.map(p => {
        const isActive  = active === p.key;
        const isPos     = p.change != null && p.change >= 0;
        const isNeg     = p.change != null && p.change < 0;
        const changeColor = isPos ? 'var(--green)' : isNeg ? 'var(--red)' : 'var(--muted)';

        return (
          <button
            key={p.key}
            style={{
              ...styles.cell,
              background:   isActive ? 'var(--surface2)' : 'transparent',
              borderColor:  isActive ? 'var(--border2)'  : 'transparent',
            }}
            onClick={() => setActive(p.key)}
          >
            <span style={{
              ...styles.label,
              color: isActive ? 'var(--text)' : 'var(--text2)',
              fontWeight: isActive ? 600 : 400,
            }}>
              {p.label}
            </span>
            <span style={{ ...styles.value, color: changeColor }}>
              {formatPct(p.change)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '0.85rem 0.5rem',
    border: '1px solid transparent',
    borderRadius: 8,
    margin: 3,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
    background: 'transparent',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    color: 'var(--text2)',
    whiteSpace: 'nowrap',
  },
  value: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
};
