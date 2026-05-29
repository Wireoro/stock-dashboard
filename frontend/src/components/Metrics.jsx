import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function fmt(val, prefix = '', suffix = '', decimals = 2) {
  if (val === null || val === undefined || val === 0) return '—';
  return `${prefix}${Number(val).toFixed(decimals)}${suffix}`;
}

export default function Metrics({ symbol }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/metrics?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setMetrics(d.metric || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading || !metrics) return null;

  const items = [
    { label: 'P/E ratio',       value: fmt(metrics.peBasicExclExtraTTM) },
    { label: 'EPS (TTM)',       value: fmt(metrics.epsBasicExclExtraItemsTTM, '$') },
    { label: '52W high',        value: fmt(metrics['52WeekHigh'], '$') },
    { label: '52W low',         value: fmt(metrics['52WeekLow'], '$') },
    { label: 'Beta',            value: fmt(metrics.beta) },
    { label: 'Dividend yield',  value: fmt(metrics.dividendYieldIndicatedAnnual, '', '%') },
    { label: 'ROE',             value: fmt(metrics.roeTTM, '', '%') },
    { label: 'Revenue growth',  value: fmt(metrics.revenueGrowthTTMYoy, '', '%') },
    { label: 'Gross margin',    value: fmt(metrics.grossMarginTTM, '', '%') },
    { label: 'Net margin',      value: fmt(metrics.netProfitMarginTTM, '', '%') },
    { label: 'Debt / equity',   value: fmt(metrics.totalDebt_totalEquityQuarterly) },
    { label: 'Current ratio',   value: fmt(metrics.currentRatioQuarterly) },
  ];

  return (
    <div style={styles.card}>
      <p style={styles.label}>KEY METRICS</p>
      <div style={styles.grid}>
        {items.map(({ label, value }) => (
          <div key={label} style={styles.item}>
            <span style={styles.itemLabel}>{label}</span>
            <span style={{
              ...styles.itemValue,
              color: value === '—' ? 'var(--muted)' : 'var(--text)',
            }}>
              {value}
            </span>
          </div>
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '1px',
    background: 'var(--border)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  item: {
    background: 'var(--surface2)',
    padding: '0.7rem 0.9rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  itemLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  itemValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.92rem',
    fontWeight: 500,
  },
};
