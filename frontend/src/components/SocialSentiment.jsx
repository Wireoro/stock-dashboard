import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function platformColor(name) {
  const map = {
    reddit:         '#ff4500',
    twitter:        '#1d9bf0',
    wallstreetbets: '#ff4500',
    stocktwits:     '#40a0ff',
    '4chan':           '#789922',
  };
  return map[name?.toLowerCase()] || '#6366f1';
}

function platformIcon(name) {
  const map = {
    reddit:         'r/',
    twitter:        '𝕏',
    wallstreetbets: 'WSB',
    stocktwits:     'ST',
  };
  return map[name?.toLowerCase()] || name?.slice(0, 2).toUpperCase();
}

function sentimentColor(score) {
  if (score >= 0.35)  return '#00d4a0';
  if (score >= 0.1)   return '#4ade80';
  if (score >= -0.1)  return '#facc15';
  if (score >= -0.35) return '#f97316';
  return '#f05252';
}

function sentimentLabel(score) {
  if (score >= 0.35)  return 'Bullish';
  if (score >= 0.1)   return 'Leaning Bullish';
  if (score >= -0.1)  return 'Neutral';
  if (score >= -0.35) return 'Leaning Bearish';
  return 'Bearish';
}

function MiniSparkline({ points, color }) {
  if (!points || points.length < 2) return null;
  const min  = Math.min(...points);
  const max  = Math.max(...points);
  const range = max - min || 1;
  const w = 80, h = 28;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline points={coords} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
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

  if (loading) return <Card><p style={styles.loader}>Scanning social platforms…</p></Card>;
  if (!data)   return null;

  const { overall, platforms, trend, mentions, posts } = data;
  const overallColor = sentimentColor(overall ?? 0);
  const overallLabel = sentimentLabel(overall ?? 0);

  return (
    <Card>
      <div style={styles.header}>
        <p style={styles.sectionLabel}>SOCIAL SENTIMENT</p>
        <span style={{
          ...styles.overallBadge,
          color: overallColor,
          background: `${overallColor}18`,
          border: `1px solid ${overallColor}44`,
        }}>
          {overallLabel}
        </span>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['overview', 'platforms', 'posts'].map(t => (
          <button key={t} style={{
            ...styles.tab,
            borderBottom: tab === t ? `2px solid var(--accent)` : '2px solid transparent',
            color: tab === t ? 'var(--accent)' : 'var(--muted)',
          }} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div>
          {/* Overall score + sparkline */}
          <div style={styles.overviewRow}>
            <div>
              <p style={styles.bigScore} >{overall?.toFixed(3) ?? '—'}</p>
              <p style={{ ...styles.bigLabel, color: overallColor }}>{overallLabel}</p>
            </div>
            <MiniSparkline points={trend} color={overallColor} />
          </div>

          {/* Mention stats */}
          <div style={styles.mentionGrid}>
            {[
              { label: 'Mentions (24h)',  value: mentions?.day?.toLocaleString()  ?? '—' },
              { label: 'Mentions (7d)',   value: mentions?.week?.toLocaleString() ?? '—' },
              { label: 'Positive posts',  value: mentions?.positive != null ? `${mentions.positive}%` : '—' },
              { label: 'Negative posts',  value: mentions?.negative != null ? `${mentions.negative}%` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={styles.mentionItem}>
                <span style={styles.mentionLabel}>{label}</span>
                <span style={styles.mentionValue}>{value}</span>
              </div>
            ))}
          </div>

          {/* Sentiment bar */}
          <div style={styles.barSection}>
            <p style={styles.subLabel}>SENTIMENT SPLIT</p>
            <div style={styles.sentBar}>
              <div style={{ width: `${mentions?.positive ?? 33}%`, background: '#00d4a0', height: '100%', borderRadius: '4px 0 0 4px' }} />
              <div style={{ width: `${100 - (mentions?.positive ?? 33) - (mentions?.negative ?? 33)}%`, background: '#facc15', height: '100%' }} />
              <div style={{ width: `${mentions?.negative ?? 33}%`, background: '#f05252', height: '100%', borderRadius: '0 4px 4px 0' }} />
            </div>
            <div style={styles.barLegend}>
              <span style={{ color: '#00d4a0' }}>▲ Bullish {mentions?.positive ?? '—'}%</span>
              <span style={{ color: '#facc15' }}>— Neutral</span>
              <span style={{ color: '#f05252' }}>▼ Bearish {mentions?.negative ?? '—'}%</span>
            </div>
          </div>
        </div>
      )}

      {/* PLATFORMS TAB */}
      {tab === 'platforms' && (
        <div style={styles.platformList}>
          {platforms?.length > 0 ? platforms.map((p, i) => {
            const pColor = platformColor(p.source);
            const pct    = Math.round(((p.score + 1) / 2) * 100);
            return (
              <div key={i} style={styles.platformRow}>
                <div style={styles.platformLeft}>
                  <span style={{ ...styles.platformIcon, background: pColor }}>
                    {platformIcon(p.source)}
                  </span>
                  <div>
                    <p style={styles.platformName}>{p.source}</p>
                    <p style={styles.platformMentions}>{p.mentions?.toLocaleString() ?? '—'} mentions</p>
                  </div>
                </div>
                <div style={styles.platformRight}>
                  <div style={styles.platformBarWrap}>
                    <div style={styles.platformBarTrack}>
                      <div style={{
                        ...styles.platformBarFill,
                        width: `${pct}%`,
                        background: sentimentColor(p.score),
                      }} />
                    </div>
                    <span style={{ color: sentimentColor(p.score), ...styles.platformScore }}>
                      {p.score?.toFixed(3)}
                    </span>
                  </div>
                  <span style={{
                    ...styles.platformLabel,
                    color: sentimentColor(p.score),
                  }}>
                    {sentimentLabel(p.score)}
                  </span>
                </div>
              </div>
            );
          }) : (
            <p style={styles.loader}>No platform breakdown available</p>
          )}
        </div>
      )}

      {/* POSTS TAB */}
      {tab === 'posts' && (
        <div style={styles.postsList}>
          {posts?.length > 0 ? posts.map((p, i) => {
            const pColor = platformColor(p.source);
            const sColor = sentimentColor(p.sentiment ?? 0);
            return (
              <div key={i} style={styles.postRow}>
                <div style={styles.postHeader}>
                  <span style={{ ...styles.postSource, color: pColor }}>
                    {platformIcon(p.source)} {p.source}
                  </span>
                  <span style={{ ...styles.postSentiment, color: sColor }}>
                    {sentimentLabel(p.sentiment ?? 0)}
                  </span>
                  <span style={styles.postDate}>{p.date}</span>
                </div>
                <p style={styles.postText}>{p.text}</p>
                <div style={styles.postStats}>
                  {p.upvotes   != null && <span style={styles.postStat}>▲ {p.upvotes.toLocaleString()}</span>}
                  {p.comments  != null && <span style={styles.postStat}>💬 {p.comments}</span>}
                  {p.likes     != null && <span style={styles.postStat}>♥ {p.likes.toLocaleString()}</span>}
                </div>
              </div>
            );
          }) : (
            <p style={styles.loader}>No recent posts available</p>
          )}
        </div>
      )}
    </Card>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.5rem',
    }}>
      {children}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '1rem',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
    letterSpacing: '0.12em', color: 'var(--muted)',
  },
  overallBadge: {
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
    fontWeight: 600, padding: '3px 10px', borderRadius: 5,
  },
  tabs: {
    display: 'flex', gap: 0,
    borderBottom: '1px solid var(--border)', marginBottom: '1rem',
  },
  tab: {
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
    background: 'none', border: 'none', padding: '0.5rem 1rem',
    cursor: 'pointer', letterSpacing: '0.05em', transition: 'color 0.15s',
  },
  overviewRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '1rem',
  },
  bigScore: {
    fontFamily: 'var(--font-mono)', fontSize: '2rem',
    fontWeight: 600, color: 'var(--text)', lineHeight: 1,
  },
  bigLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginTop: 4,
  },
  mentionGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1px', background: 'var(--border)',
    border: '1px solid var(--border)', borderRadius: 8,
    overflow: 'hidden', marginBottom: '1rem',
  },
  mentionItem: {
    background: 'var(--surface2)', padding: '0.6rem 0.8rem',
    display: 'flex', flexDirection: 'column', gap: 3,
  },
  mentionLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  mentionValue: {
    fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
    fontWeight: 600, color: 'var(--text)',
  },
  barSection: { marginBottom: '0.5rem' },
  subLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
    letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.5rem',
  },
  sentBar: {
    display: 'flex', height: 8, borderRadius: 4,
    overflow: 'hidden', marginBottom: 6,
  },
  barLegend: {
    display: 'flex', justifyContent: 'space-between',
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
  },
  platformList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  platformRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: '1rem',
    padding: '0.75rem', background: 'var(--surface2)',
    borderRadius: 8, border: '1px solid var(--border)',
  },
  platformLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  platformIcon: {
    width: 32, height: 32, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
    fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  platformName: {
    fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
    color: 'var(--text)', fontWeight: 500, textTransform: 'capitalize',
  },
  platformMentions: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)',
  },
  platformRight: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
  },
  platformBarWrap: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  platformBarTrack: {
    width: 80, height: 4, background: 'var(--border2)',
    borderRadius: 2, overflow: 'hidden',
  },
  platformBarFill: { height: '100%', borderRadius: 2, transition: 'width 0.4s ease' },
  platformScore: {
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 500,
  },
  platformLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
  },
  postsList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  postRow: {
    background: 'var(--surface2)', borderRadius: 8,
    border: '1px solid var(--border)', padding: '0.75rem',
  },
  postHeader: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem',
  },
  postSource: {
    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600,
  },
  postSentiment: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem', flex: 1,
  },
  postDate: {
    fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--muted)',
  },
  postText: {
    fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
    color: 'var(--text)', lineHeight: 1.5, marginBottom: '0.4rem',
  },
  postStats: { display: 'flex', gap: '0.75rem' },
  postStat: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)',
  },
  loader: {
    fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--muted)',
  },
};
