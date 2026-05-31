import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function sentimentLabel(score) {
  if (score >=  0.35) return { label: 'Very Positive', color: '#00d4a0', bg: 'rgba(0,212,160,0.1)' };
  if (score >=  0.1)  return { label: 'Positive',      color: '#4ade80', bg: 'rgba(74,222,128,0.1)' };
  if (score >= -0.1)  return { label: 'Neutral',        color: '#facc15', bg: 'rgba(250,204,21,0.1)' };
  if (score >= -0.35) return { label: 'Negative',       color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
  return               { label: 'Very Negative',  color: '#f05252', bg: 'rgba(240,82,82,0.1)' };
}

function scoreToPercent(score) {
  // score is -1 to +1, convert to 0-100
  return Math.round(((score + 1) / 2) * 100);
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

  if (loading) return <Card><p style={styles.loader}>Analyzing news sentiment…</p></Card>;
  if (!data)   return null;

  const { companyScore, sectorScore, marketScore, articlesProcessed, buzz, articles } = data;
  const pct     = scoreToPercent(companyScore ?? 0);
  const { label, color, bg } = sentimentLabel(companyScore ?? 0);

  return (
    <Card>
      <div style={styles.header}>
        <p style={styles.sectionLabel}>NEWS SENTIMENT</p>
        <span style={{ ...styles.overallBadge, color, background: bg, border: `1px solid ${color}44` }}>
          {label}
        </span>
      </div>

      {/* Score gauge */}
      <div style={styles.gaugeWrap}>
        <div style={styles.gaugeTrack}>
          {/* colour zones */}
          <div style={{ ...styles.zone, left: '0%',  width: '20%', background: '#f0525230' }} />
          <div style={{ ...styles.zone, left: '20%', width: '20%', background: '#f9731630' }} />
          <div style={{ ...styles.zone, left: '40%', width: '20%', background: '#facc1530' }} />
          <div style={{ ...styles.zone, left: '60%', width: '20%', background: '#4ade8030' }} />
          <div style={{ ...styles.zone, left: '80%', width: '20%', background: '#00d4a030' }} />
          <div style={{ ...styles.gaugeThumb, left: `${pct}%`, background: color }} />
        </div>
        <div style={styles.gaugeLabels}>
          <span>Very Negative</span>
          <span>Neutral</span>
          <span>Very Positive</span>
        </div>
      </div>

      {/* Score grid */}
      <div style={styles.scoreGrid}>
        {[
          { label: 'Company score',  value: companyScore?.toFixed(3) ?? '—', highlight: true },
          { label: 'Sector score',   value: sectorScore?.toFixed(3)  ?? '—' },
          { label: 'Market score',   value: marketScore?.toFixed(3)  ?? '—' },
          { label: 'Articles (7d)',  value: articlesProcessed ?? '—' },
        ].map(({ label, value, highlight }) => (
          <div key={label} style={styles.scoreItem}>
            <span style={styles.scoreLabel}>{label}</span>
            <span style={{
              ...styles.scoreValue,
              color: highlight ? color : 'var(--text)',
              fontSize: highlight ? '1.1rem' : '0.92rem',
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Buzz */}
      {buzz && (
        <div style={styles.buzzRow}>
          <div style={styles.buzzItem}>
            <span style={styles.buzzLabel}>Weekly mentions</span>
            <span style={styles.buzzValue}>{buzz.weeklyAverage?.toFixed(0) ?? '—'}</span>
          </div>
          <div style={styles.buzzDivider} />
          <div style={styles.buzzItem}>
            <span style={styles.buzzLabel}>Buzz change</span>
            <span style={{
              ...styles.buzzValue,
              color: (buzz.buzz ?? 0) >= 0 ? '#00d4a0' : '#f05252',
            }}>
              {buzz.buzz != null ? `${buzz.buzz > 0 ? '+' : ''}${(buzz.buzz * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
          <div style={styles.buzzDivider} />
          <div style={styles.buzzItem}>
            <span style={styles.buzzLabel}>Articles processed</span>
            <span style={styles.buzzValue}>{articlesProcessed ?? '—'}</span>
          </div>
        </div>
      )}

      {/* Individual article sentiment */}
      {articles && articles.length > 0 && (
        <div style={styles.articlesWrap}>
          <p style={styles.subLabel}>RECENT ARTICLE SENTIMENT</p>
          {articles.map((a, i) => {
            const s = sentimentLabel(a.sentiment ?? 0);
            return (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.articleRow}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={styles.articleLeft}>
                  <span style={styles.articleHeadline}>{a.headline}</span>
                  <span style={styles.articleMeta}>{a.source} · {a.date}</span>
                </div>
                <span style={{
                  ...styles.sentimentChip,
                  color: s.color,
                  background: s.bg,
                  border: `1px solid ${s.color}44`,
                }}>
                  {s.label}
                </span>
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
    alignItems: 'center', marginBottom: '1.25rem',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
    letterSpacing: '0.12em', color: 'var(--muted)',
  },
  overallBadge: {
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
    fontWeight: 600, padding: '3px 10px', borderRadius: 5,
  },
  gaugeWrap: { marginBottom: '1.25rem' },
  gaugeTrack: {
    position: 'relative', height: 10,
    background: 'var(--border2)', borderRadius: 5,
    overflow: 'hidden', marginBottom: 6,
  },
  zone: { position: 'absolute', top: 0, height: '100%' },
  gaugeThumb: {
    position: 'absolute', top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid var(--bg)', zIndex: 2,
  },
  gaugeLabels: {
    display: 'flex', justifyContent: 'space-between',
    fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
    color: 'var(--muted)', marginTop: 4,
  },
  scoreGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1px', background: 'var(--border)',
    border: '1px solid var(--border)', borderRadius: 8,
    overflow: 'hidden', marginBottom: '1rem',
  },
  scoreItem: {
    background: 'var(--surface2)', padding: '0.65rem 0.9rem',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  scoreLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  scoreValue: {
    fontFamily: 'var(--font-mono)', fontWeight: 600,
  },
  buzzRow: {
    display: 'flex', alignItems: 'center',
    background: 'var(--surface2)', borderRadius: 8,
    padding: '0.75rem 1rem', marginBottom: '1rem', gap: '1rem',
  },
  buzzItem: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1 },
  buzzDivider: { width: 1, height: 32, background: 'var(--border)' },
  buzzLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  buzzValue: {
    fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
    fontWeight: 600, color: 'var(--text)',
  },
  articlesWrap: { borderTop: '1px solid var(--border)', paddingTop: '1rem' },
  subLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
    letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.65rem',
  },
  articleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.6rem 0.5rem', borderBottom: '1px solid var(--border)',
    textDecoration: 'none', gap: '1rem', transition: 'background 0.1s',
    borderRadius: 4, cursor: 'pointer',
  },
  articleLeft: {
    display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0,
  },
  articleHeadline: {
    fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
    color: 'var(--text)', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  articleMeta: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)',
  },
  sentimentChip: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
    fontWeight: 600, padding: '2px 8px', borderRadius: 4,
    flexShrink: 0, whiteSpace: 'nowrap',
  },
  loader: {
    fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--muted)',
  },
};
