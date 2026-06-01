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
  if (score >=  0.35) return 'Bullish';
  if (score >=  0.1)  return 'Leaning Bullish';
  if (score >= -0.1)  return 'Neutral';
  if (score >= -0.35) return 'Leaning Bearish';
  return 'Bearish';
}

function sourceIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('yahoo'))   return 'YF';
  if (n.includes('seeking')) return 'SA';
  if (n.includes('reuters')) return 'RT';
  if (n.includes('bloomberg')) return 'BB';
  if (n.includes('cnbc'))    return 'CN';
  if (n.includes('wsj'))     return 'WJ';
  if (n.includes('market'))  return 'MW';
  if (n.includes('motley'))  return 'MF';
  return name?.slice(0, 2).toUpperCase() || '??';
}

function sourceColor(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('yahoo'))   return '#6001d2';
  if (n.includes('seeking')) return '#f59e0b';
  if (n.includes('reuters')) return '#ff8000';
  if (n.includes('bloomberg')) return '#1da1f2';
  if (n.includes('cnbc'))    return '#0084c9';
  return '#6366f1';
}

function Sparkline({ points, color }) {
  if (!points || points.length < 2) return null;
  const min   = Math.min(...points);
  const max   = Math.max(...points);
  const range = (max - min) || 1;
  const w = 100, h = 30;
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

export default function SocialSentiment({ symbol }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/social-sentiment?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading) return <Card><p style={styles.loader}>Computing market sentiment…</p></Card>;
  if (!data)   return null;

  const { overall, analystLabel, platforms, trend, mentions, posts } = data;
  const overallColor = sentimentColor(overall ?? 0);
  const overallLabel = sentimentLabel(overall ?? 0);

  return (
    <Card>
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>MARKET SENTIMENT</p>
          <p style={styles.sectionSub}>News NLP · Analyst consensus · Volume signals</p>
        </div>
        <span style={{ ...styles.badge, color: overallColor, background: `${overallColor}18`, border: `1px solid ${overallColor}44` }}>
          {overallLabel}
        </span>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['overview', 'sources', 'articles'].map(t => (
          <button key={t} style={{
            ...styles.tab,
            borderBottom: tab === t ? `2px solid var(--accent)` : '2px solid transparent',
            color: tab === t ? 'var(--accent)' : 'var(--muted)',
          }} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div>
          <div style={styles.overviewRow}>
            <div>
              <p style={{ ...styles.bigScore, color: overallColor }}>
                {overall?.toFixed(3) ?? '—'}
              </p>
              <p style={{ ...styles.bigLabel, color: overallColor }}>{overallLabel}</p>
              {analystLabel && (
                <p style={styles.analystNote}>
                  Analyst consensus: <strong style={{ color: overallColor }}>{analystLabel}</strong>
                </p>
              )}
            </div>
            <Sparkline points={trend} color={overallColor} />
          </div>

          {/* Mention stats */}
          <div style={styles.mentionGrid}>
            {[
              { label: 'Articles (24h)',  value: mentions?.day },
              { label: 'Articles (30d)',  value: mentions?.week },
              { label: 'Positive %',      value: mentions?.positive != null ? `${mentions.positive}%` : '—' },
              { label: 'Negative %',      value: mentions?.negative != null ? `${mentions.negative}%` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={styles.mentionItem}>
                <span style={styles.mentionLabel}>{label}</span>
                <span style={styles.mentionValue}>{value ?? '—'}</span>
              </div>
            ))}
          </div>

          {/* Sentiment split bar */}
          <p style={styles.subLabel}>SENTIMENT SPLIT</p>
          <div style={styles.sentBar}>
            <div style={{ width: `${mentions?.positive ?? 33}%`, background: '#C4654A', height: '100%', borderRadius: '4px 0 0 4px' }} />
            <div style={{ width: `${100 - (mentions?.positive ?? 33) - (mentions?.negative ?? 33)}%`, background: '#facc15', height: '100%' }} />
            <div style={{ width: `${mentions?.negative ?? 33}%`, background: '#f05252', height: '100%', borderRadius: '0 4px 4px 0' }} />
          </div>
          <div style={styles.barLegend}>
            <span style={{ color: '#C4654A' }}>▲ Bullish {mentions?.positive ?? '—'}%</span>
            <span style={{ color: '#facc15' }}>— Neutral</span>
            <span style={{ color: '#f05252' }}>▼ Bearish {mentions?.negative ?? '—'}%</span>
          </div>
        </div>
      )}

      {/* ── SOURCES ── */}
      {tab === 'sources' && (
        <div style={styles.sourceList}>
          {platforms?.length > 0 ? platforms.map((p, i) => {
            const pc    = sourceColor(p.source);
            const sc    = sentimentColor(p.score);
            const pct   = Math.round(((p.score + 1) / 2) * 100);
            return (
              <div key={i} style={styles.sourceRow}>
                <div style={styles.sourceLeft}>
                  <span style={{ ...styles.sourceIcon, background: pc }}>
                    {sourceIcon(p.source)}
                  </span>
                  <div>
                    <p style={styles.sourceName}>{p.source}</p>
                    <p style={styles.sourceMentions}>{p.mentions} articles</p>
                  </div>
                </div>
                <div style={styles.sourceRight}>
                  <div style={styles.sourceBarWrap}>
                    <div style={styles.sourceBarTrack}>
                      <div style={{ ...styles.sourceBarFill, width: `${pct}%`, background: sc }} />
                    </div>
                    <span style={{ color: sc, fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                      {p.score?.toFixed(3)}
                    </span>
                  </div>
                  <span style={{ color: sc, fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                    {sentimentLabel(p.score)}
                  </span>
                </div>
              </div>
            );
          }) : <p style={styles.loader}>No source data available</p>}
        </div>
      )}

      {/* ── ARTICLES ── */}
      {tab === 'articles' && (
        <div style={styles.articlesList}>
          {posts?.length > 0 ? posts.map((p, i) => {
            const sc = sentimentColor(p.sentiment ?? 0);
            const ic = sourceColor(p.source);
            return (
              <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                style={styles.articleRow}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={styles.articleHeader}>
                  <span style={{ ...styles.articleSource, color: ic }}>
                    {sourceIcon(p.source)} {p.source}
                  </span>
                  <span style={{ color: sc, fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                    {sentimentLabel(p.sentiment ?? 0)}
                  </span>
                  <span style={styles.articleDate}>{p.date}</span>
                </div>
                <p style={styles.articleText}>{p.text}</p>
              </a>
            );
          }) : <p style={styles.loader}>No articles available</p>}
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
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)' },
  sectionSub:   { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: 2 },
  badge:        { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 5, flexShrink: 0 },
  tabs:         { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem' },
  tab:          { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', letterSpacing: '0.05em', transition: 'color 0.15s' },
  overviewRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  bigScore:     { fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 600, lineHeight: 1 },
  bigLabel:     { fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginTop: 4 },
  analystNote:  { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', marginTop: 4 },
  mentionGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' },
  mentionItem:  { background: 'var(--surface2)', padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: 3 },
  mentionLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  mentionValue: { fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' },
  subLabel:     { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.5rem' },
  sentBar:      { display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  barLegend:    { display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' },
  sourceList:   { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  sourceRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.7rem', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' },
  sourceLeft:   { display: 'flex', alignItems: 'center', gap: '0.7rem' },
  sourceIcon:   { width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, color: '#fff', flexShrink: 0 },
  sourceName:   { fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text)', fontWeight: 500 },
  sourceMentions: { fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--muted)' },
  sourceRight:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  sourceBarWrap: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  sourceBarTrack: { width: 80, height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' },
  sourceBarFill:  { height: '100%', borderRadius: 2, transition: 'width 0.4s' },
  articlesList: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  articleRow:   { display: 'block', padding: '0.7rem 0.5rem', borderBottom: '1px solid var(--border)', textDecoration: 'none', transition: 'background 0.1s', borderRadius: 4 },
  articleHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' },
  articleSource: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600 },
  articleDate:  { fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--muted)', marginLeft: 'auto' },
  articleText:  { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  loader:       { fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--muted)' },
};
