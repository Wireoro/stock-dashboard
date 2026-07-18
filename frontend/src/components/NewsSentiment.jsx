import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function sentimentColor(score) {
  if (score >=  0.35) return '#C4654A';
  if (score >=  0.1)  return '#A8523A';
  if (score >= -0.1)  return '#facc15';
  if (score >= -0.35) return '#f97316';
  return '#f05252';
}

function sentimentLabel(score) {
  if (score >=  0.35) return 'Very Positive';
  if (score >=  0.1)  return 'Positive';
  if (score >= -0.1)  return 'Neutral';
  if (score >= -0.35) return 'Negative';
  return 'Very Negative';
}

function scoreToPercent(score) {
  return Math.round(((score + 1) / 2) * 100);
}

function Sparkline({ points, color }) {
  if (!points || points.length < 2) return null;
  const min   = Math.min(...points);
  const max   = Math.max(...points);
  const range = (max - min) || 1;
  const w = 120, h = 36;
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function NewsSentiment({ symbol }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/news-sentiment?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading) return <Card><p style={styles.loader}>Analysing news sentiment…</p></Card>;
  if (!data)   return null;

  const { companyScore, score7d, trend, articlesProcessed,
          breakdown, buzz, articles } = data;
  const pct   = scoreToPercent(companyScore ?? 0);
  const color = sentimentColor(companyScore ?? 0);
  const label = sentimentLabel(companyScore ?? 0);

  const trendDir = score7d > companyScore ? '↑' : score7d < companyScore ? '↓' : '→';
  const trendColor = score7d > companyScore ? '#C4654A' : score7d < companyScore ? '#f05252' : '#facc15';

  return (
    <Card>
      {/* Header */}
      <div style={styles.header}>
        <p style={styles.sectionLabel}>NEWS SENTIMENT</p>
        <span style={{ ...styles.badge, color, background: `${color}18`, border: `1px solid ${color}44` }}>
          {label}
        </span>
      </div>

      {/* Score + sparkline */}
      <div style={styles.topRow}>
        <div>
          <p style={{ ...styles.bigScore, color }}>{companyScore?.toFixed(3)}</p>
          <p style={styles.bigSub}>
            7-day trend&nbsp;
            <span style={{ color: trendColor, fontWeight: 600 }}>
              {trendDir} {score7d?.toFixed(3)}
            </span>
          </p>
        </div>
        <Sparkline points={trend} color={color} />
      </div>

      {/* Gauge */}
      <div style={styles.gaugeWrap}>
        <div style={styles.gaugeTrack}>
          <div style={{ ...styles.zone, left: '0%',  width: '20%', background: '#f0525222' }} />
          <div style={{ ...styles.zone, left: '20%', width: '20%', background: '#f9731622' }} />
          <div style={{ ...styles.zone, left: '40%', width: '20%', background: '#facc1522' }} />
          <div style={{ ...styles.zone, left: '60%', width: '20%', background: '#A8523A22' }} />
          <div style={{ ...styles.zone, left: '80%', width: '20%', background: '#C4654A22' }} />
          <div style={{ ...styles.gaugeThumb, left: `${pct}%`, background: color }} />
        </div>
        <div style={styles.gaugeLabels}>
          <span>Very Negative</span><span>Neutral</span><span>Very Positive</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={styles.grid}>
        {[
          { label: 'Articles (30d)',   value: articlesProcessed },
          { label: 'Positive',         value: breakdown?.positive, color: '#C4654A' },
          { label: 'Neutral',          value: breakdown?.neutral,  color: '#facc15' },
          { label: 'Negative',         value: breakdown?.negative, color: '#f05252' },
          { label: 'Weekly avg',       value: buzz?.weeklyAverage },
          { label: 'This week',        value: buzz?.articles7d },
        ].map(({ label, value, color: c }) => (
          <div key={label} style={styles.statItem}>
            <span style={styles.statLabel}>{label}</span>
            <span style={{ ...styles.statValue, color: c || 'var(--text)' }}>{value ?? '—'}</span>
          </div>
        ))}
      </div>

      {/* Buzz change */}
      {buzz?.buzzChange != null && (
        <div style={styles.buzzRow}>
          <span style={styles.buzzLabel}>News volume change vs 30-day avg</span>
          <span style={{
            ...styles.buzzValue,
            color: buzz.buzzChange >= 0 ? '#C4654A' : '#f05252',
          }}>
            {buzz.buzzChange >= 0 ? '+' : ''}{(buzz.buzzChange * 100).toFixed(1)}%
          </span>
        </div>
      )}

      {/* Per-article sentiment */}
      {articles?.length > 0 && (
        <div style={styles.articlesWrap}>
          <p style={styles.subLabel}>ARTICLE SENTIMENT BREAKDOWN</p>
          {articles.map((a, i) => {
            const c = sentimentColor(a.sentiment ?? 0);
            const l = sentimentLabel(a.sentiment ?? 0);
            return (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                style={styles.articleRow}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={styles.articleLeft}>
                  <span style={styles.articleHeadline}>{a.headline}</span>
                  <span style={styles.articleMeta}>{a.source} · {a.date}</span>
                </div>
                <div style={styles.articleRight}>
                  <span style={{ ...styles.chip, color: c, background: `${c}18`, border: `1px solid ${c}44` }}>
                    {l}
                  </span>
                  <span style={{ ...styles.scoreChip, color: c }}>{a.sentiment?.toFixed(2)}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
    }}>
      {children}
    </div>
  );
}

const styles = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)' },
  badge:        { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 5 },
  topRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  bigScore:     { fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 600, lineHeight: 1 },
  bigSub:       { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 },
  gaugeWrap:    { marginBottom: '1.25rem' },
  gaugeTrack:   { position: 'relative', height: 10, background: 'var(--border2)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  zone:         { position: 'absolute', top: 0, height: '100%' },
  gaugeThumb:   { position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--bg)', zIndex: 2 },
  gaugeLabels:  { display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: '0.75rem' },
  statItem:     { background: 'var(--surface2)', padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: 3 },
  statLabel:    { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  statValue:    { fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600 },
  buzzRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', borderRadius: 8, padding: '0.6rem 0.9rem', marginBottom: '1rem' },
  buzzLabel:    { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text2)' },
  buzzValue:    { fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600 },
  articlesWrap: { borderTop: '1px solid var(--border)', paddingTop: '1rem' },
  subLabel:     { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.65rem' },
  articleRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.4rem', borderBottom: '1px solid var(--border)', textDecoration: 'none', gap: '0.75rem', transition: 'background 0.1s', borderRadius: 4 },
  articleLeft:  { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  articleHeadline: { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  articleMeta:  { fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--muted)' },
  articleRight: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 },
  chip:         { fontFamily: 'var(--font-mono)', fontSize: '0.63rem', fontWeight: 600, padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap' },
  scoreChip:    { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 500, width: 36, textAlign: 'right' },
  loader:       { fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--muted)' },
};
