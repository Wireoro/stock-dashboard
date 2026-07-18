import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const COLORS = [
  '#C4654A', '#6366f1', '#6B8F71', '#C4A46C', '#3b82f6',
  '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#f97316',
];

function fmtVal(n) {
  if (n == null) return '—';
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={tt.wrap}>
      <p style={{ ...tt.label, color: d.payload.fill }}>{d.name}</p>
      <p style={tt.val}>{fmtVal(d.value)}</p>
      <p style={tt.pct}>{d.payload.pct?.toFixed(1)}%</p>
    </div>
  );
}

const tt = {
  wrap:  { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  label: { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, marginBottom: 3 },
  val:   { fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 },
  pct:   { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--muted)' },
};

function SegmentChart({ segments, title }) {
  if (!segments?.length) return null;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const data  = segments.map((s, i) => ({
    ...s,
    fill: COLORS[i % COLORS.length],
    pct:  total > 0 ? (s.value / total) * 100 : 0,
  }));

  return (
    <div style={styles.segmentWrap}>
      <p style={styles.segmentTitle}>{title}</p>
      <div style={styles.segmentRow}>
        {/* Pie chart */}
        <div style={{ width: 160, height: 160, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%"
                innerRadius={40} outerRadius={70} paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend list */}
        <div style={styles.legendList}>
          {data.map((d, i) => (
            <div key={i} style={styles.legendItem}>
              <div style={{ ...styles.legendDot, background: d.fill }} />
              <span style={styles.legendName}>{d.name}</span>
              <span style={{ ...styles.legendPct, color: d.fill }}>{d.pct.toFixed(1)}%</span>
              <span style={styles.legendVal}>{fmtVal(d.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RevenueBreakdown({ symbol }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('product');

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`${API}/api/revenue-breakdown?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading || !data) return null;
  if (!data.productSegments?.length && !data.geoSegments?.length) return null;

  const { latestPeriod, productSegments, geoSegments, revenueTrend } = data;

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>REVENUE BREAKDOWN</p>
          <p style={styles.sectionSub}>
            {latestPeriod ? `Period ending ${latestPeriod}` : 'Latest available'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: 'product',    label: `By Product (${productSegments?.length || 0})` },
          { key: 'geographic', label: `By Region (${geoSegments?.length || 0})` },
          { key: 'trend',      label: 'Revenue Trend' },
        ].map(t => (
          <button key={t.key} style={{
            ...styles.tab,
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t.key ? 'var(--accent)' : 'var(--muted)',
          }} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'product' && (
        <SegmentChart segments={productSegments} title="Product & Service Segments" />
      )}

      {tab === 'geographic' && (
        geoSegments?.length
          ? <SegmentChart segments={geoSegments} title="Geographic Revenue Split" />
          : <p style={styles.empty}>No geographic breakdown available</p>
      )}

      {tab === 'trend' && revenueTrend?.length > 0 && (
        <div>
          <p style={styles.segmentTitle}>Total Revenue by Period</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtVal(v)} tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  formatter={(v) => [fmtVal(v), 'Revenue']}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                />
                <Bar dataKey="total" fill="#C4654A" opacity={0.8} radius={[3, 3, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card:         { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)' },
  sectionSub:   { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: 2 },
  tabs:         { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' },
  tab:          { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', letterSpacing: '0.05em', transition: 'color 0.15s' },
  segmentWrap:  { display: 'flex', flexDirection: 'column', gap: '1rem' },
  segmentTitle: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' },
  segmentRow:   { display: 'flex', gap: '1.5rem', alignItems: 'center' },
  legendList:   { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  legendItem:   { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  legendDot:    { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  legendName:   { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  legendPct:    { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0, width: 44, textAlign: 'right' },
  legendVal:    { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--muted)', flexShrink: 0, width: 60, textAlign: 'right' },
  empty:        { fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)', padding: '1rem 0' },
};
