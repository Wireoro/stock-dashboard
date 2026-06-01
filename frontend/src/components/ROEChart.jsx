import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const METRICS = [
  { key: 'roe',          label: 'ROE',          color: '#00d4a0', type: 'bar',  desc: 'Return on Equity' },
  { key: 'roa',          label: 'ROA',          color: '#6366f1', type: 'line', desc: 'Return on Assets' },
  { key: 'netMargin',    label: 'Net Margin',   color: '#f59e0b', type: 'line', desc: 'Net Profit Margin' },
  { key: 'grossMargin',  label: 'Gross Margin', color: '#3b82f6', type: 'line', desc: 'Gross Profit Margin' },
];

function roeRating(roe) {
  if (roe == null) return null;
  if (roe >= 30)  return { label: 'Excellent', color: '#00d4a0' };
  if (roe >= 15)  return { label: 'Good',      color: '#4ade80' };
  if (roe >= 8)   return { label: 'Average',   color: '#facc15' };
  if (roe >= 0)   return { label: 'Weak',      color: '#f97316' };
  return           { label: 'Negative',  color: '#f05252' };
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border2)',
      borderRadius: 8, padding: '10px 14px', minWidth: 160,
    }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 6 }}>
        FY {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: 3 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: p.color }}>
            {p.name}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: p.color, fontWeight: 600 }}>
            {p.value != null ? `${p.value.toFixed(1)}%` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ROEChart({ symbol }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState(['roe', 'netMargin']); // which metrics shown

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`${API}/api/roe-history?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading || !data || !data.timeline?.length) return null;

  const { timeline, current } = data;
  const latest  = timeline[timeline.length - 1];
  const rating  = roeRating(latest?.roe ?? current?.roe);

  // Trend: compare last 3 years avg vs prior 3 years avg
  const last3  = timeline.slice(-3).map(d => d.roe).filter(v => v != null);
  const prior3 = timeline.slice(-6, -3).map(d => d.roe).filter(v => v != null);
  const last3Avg  = last3.length  ? last3.reduce((a, b) => a + b, 0)  / last3.length  : null;
  const prior3Avg = prior3.length ? prior3.reduce((a, b) => a + b, 0) / prior3.length : null;
  const trend = last3Avg != null && prior3Avg != null
    ? last3Avg > prior3Avg + 2  ? { label: 'Improving ↑', color: '#00d4a0' }
    : last3Avg < prior3Avg - 2  ? { label: 'Declining ↓',  color: '#f05252' }
    : { label: 'Stable →', color: '#facc15' }
    : null;

  function toggleMetric(key) {
    setActive(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key]
    );
  }

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>PROFITABILITY OVER TIME</p>
          <p style={styles.sectionSub}>Annual figures · Return on Equity & margins</p>
        </div>
        <div style={styles.headerRight}>
          {rating && (
            <div style={styles.ratingBadge}>
              <span style={styles.ratingLabel}>Latest ROE</span>
              <span style={{ ...styles.ratingValue, color: rating.color }}>
                {(latest?.roe ?? current?.roe)?.toFixed(1)}%
              </span>
              <span style={{ ...styles.ratingTag, color: rating.color, background: `${rating.color}18`, border: `1px solid ${rating.color}44` }}>
                {rating.label}
              </span>
            </div>
          )}
          {trend && (
            <span style={{ ...styles.trendBadge, color: trend.color, background: `${trend.color}18`, border: `1px solid ${trend.color}44` }}>
              {trend.label}
            </span>
          )}
        </div>
      </div>

      {/* Metric toggles */}
      <div style={styles.toggleRow}>
        {METRICS.map(m => (
          <button
            key={m.key}
            style={{
              ...styles.toggleBtn,
              opacity: active.includes(m.key) ? 1 : 0.35,
              borderColor: active.includes(m.key) ? m.color : 'var(--border)',
              background: active.includes(m.key) ? `${m.color}12` : 'transparent',
            }}
            onClick={() => toggleMetric(m.key)}
            title={m.desc}
          >
            <span style={{ ...styles.toggleDot, background: m.color }} />
            <span style={{ ...styles.toggleLabel, color: active.includes(m.key) ? m.color : 'var(--muted)' }}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'DM Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `${v}%`}
              tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'DM Mono' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="var(--border2)" strokeDasharray="4 4" />
            <ReferenceLine
              y={15}
              stroke="#00d4a044"
              strokeDasharray="4 4"
              label={{ value: 'Good ROE (15%)', fill: '#00d4a066', fontSize: 10, fontFamily: 'DM Mono', position: 'insideTopRight' }}
            />

            {/* ROE as bars */}
            {active.includes('roe') && (
              <Bar
                dataKey="roe"
                name="ROE"
                fill="#00d4a0"
                opacity={0.75}
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
            )}

            {/* Other metrics as lines */}
            {active.includes('roa') && (
              <Line type="monotone" dataKey="roa" name="ROA"
                stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }}
                activeDot={{ r: 5 }} connectNulls />
            )}
            {active.includes('netMargin') && (
              <Line type="monotone" dataKey="netMargin" name="Net Margin"
                stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }}
                activeDot={{ r: 5 }} connectNulls />
            )}
            {active.includes('grossMargin') && (
              <Line type="monotone" dataKey="grossMargin" name="Gross Margin"
                stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 5 }} connectNulls />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Current TTM metrics row */}
      {current && (
        <div style={styles.currentRow}>
          {[
            { label: 'ROE (TTM)',          value: current.roe,         color: '#00d4a0' },
            { label: 'ROA (TTM)',          value: current.roa,         color: '#6366f1' },
            { label: 'Net margin (TTM)',   value: current.netMargin,   color: '#f59e0b' },
            { label: 'Gross margin (TTM)', value: current.grossMargin, color: '#3b82f6' },
          ].map(({ label, value, color }) => (
            <div key={label} style={styles.currentItem}>
              <span style={styles.currentLabel}>{label}</span>
              <span style={{ ...styles.currentValue, color: value != null ? color : 'var(--muted)' }}>
                {value != null ? `${value.toFixed(1)}%` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Interpretation note */}
      <p style={styles.note}>
        ROE measures how efficiently a company uses shareholders' equity to generate profit.
        Above 15% is generally considered good; above 30% is excellent.
        <span style={{ color: '#00d4a066' }}> — dashed line marks 15% threshold.</span>
      </p>
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
  },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '1rem',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
    letterSpacing: '0.12em', color: 'var(--muted)',
  },
  sectionSub: {
    fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
    color: 'var(--muted)', opacity: 0.6, marginTop: 2,
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  ratingBadge: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  ratingLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' },
  ratingValue: { fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1 },
  ratingTag: {
    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
    fontWeight: 600, padding: '2px 7px', borderRadius: 4,
  },
  trendBadge: {
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
    fontWeight: 600, padding: '3px 9px', borderRadius: 5,
  },
  toggleRow: { display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' },
  toggleBtn: {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    padding: '4px 10px', borderRadius: 5, border: '1px solid',
    cursor: 'pointer', background: 'transparent',
    transition: 'all 0.15s',
  },
  toggleDot:   { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  toggleLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 500 },
  currentRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1px', background: 'var(--border)',
    border: '1px solid var(--border)', borderRadius: 8,
    overflow: 'hidden', marginTop: '1rem',
  },
  currentItem: {
    background: 'var(--surface2)', padding: '0.6rem 0.8rem',
    display: 'flex', flexDirection: 'column', gap: 3,
  },
  currentLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  currentValue: {
    fontFamily: 'var(--font-mono)', fontSize: '0.92rem', fontWeight: 600,
  },
  note: {
    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
    color: 'var(--muted)', opacity: 0.7, lineHeight: 1.5, marginTop: '0.75rem',
  },
};
