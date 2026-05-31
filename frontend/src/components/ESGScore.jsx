import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

// Sustainalytics scale: LOWER score = BETTER (less risk)
// 0-10: Negligible, 10-20: Low, 20-30: Medium, 30-40: High, 40+: Severe
function riskColor(score) {
  if (score == null) return 'var(--muted)';
  if (score < 10)  return '#00d4a0';
  if (score < 20)  return '#4ade80';
  if (score < 30)  return '#facc15';
  if (score < 40)  return '#f97316';
  return '#f05252';
}

function riskLabel(score) {
  if (score == null) return '—';
  if (score < 10)  return 'Negligible Risk';
  if (score < 20)  return 'Low Risk';
  if (score < 30)  return 'Medium Risk';
  if (score < 40)  return 'High Risk';
  return 'Severe Risk';
}

// Invert score for bar display (lower risk = longer green bar)
function riskToBarPct(score) {
  if (score == null) return 0;
  return Math.max(0, Math.min(100, 100 - (score / 50) * 100));
}

function PillarBar({ label, score, icon }) {
  if (score == null) return null;
  const color = riskColor(score);
  const pct   = riskToBarPct(score);
  return (
    <div style={pillar.wrap}>
      <div style={pillar.top}>
        <span style={pillar.icon}>{icon}</span>
        <span style={pillar.label}>{label}</span>
        <span style={{ ...pillar.score, color }}>{score.toFixed(1)}</span>
      </div>
      <div style={pillar.track}>
        <div style={{ ...pillar.fill, width: `${pct}%`, background: color }} />
      </div>
      <span style={{ ...pillar.riskLabel, color }}>{riskLabel(score)}</span>
    </div>
  );
}

const CONTROVERSY_COLORS = {
  'None':        '#00d4a0',
  'Low':         '#4ade80',
  'Moderate':    '#facc15',
  'Significant': '#f97316',
  'High':        '#f05252',
  'Severe':      '#f05252',
};

export default function ESGScore({ symbol }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`${API}/api/esg?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading || !data) return null;
  if (data.totalScore == null && data.environmentScore == null) return null;

  const {
    totalScore, environmentScore, socialScore, governanceScore,
    riskLevel, percentile, peerGroup, peerCount,
    controversyLevel, lastUpdated, source,
    adultInvolvement, alcoholInvolvement, weaponsInvolvement,
    gamblingInvolvement, nuclearInvolvement, tobaccoInvolvement,
    coalInvolvement, smallArmsInvolvement,
  } = data;

  const totalColor = riskColor(totalScore);
  const controvColor = CONTROVERSY_COLORS[controversyLevel] || 'var(--muted)';

  // Build involvement flags list
  const involvements = [
    adultInvolvement     && 'Adult Entertainment',
    alcoholInvolvement   && 'Alcohol',
    weaponsInvolvement   && 'Weapons',
    gamblingInvolvement  && 'Gambling',
    nuclearInvolvement   && 'Nuclear',
    tobaccoInvolvement   && 'Tobacco',
    coalInvolvement      && 'Coal',
    smallArmsInvolvement && 'Small Arms',
  ].filter(Boolean);

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>ESG RISK SCORE</p>
          <p style={styles.sectionSub}>Powered by Sustainalytics via Yahoo Finance</p>
        </div>
        <a
          href={`https://finance.yahoo.com/quote/${symbol}/sustainability/`}
          target="_blank" rel="noopener noreferrer"
          style={styles.sourceLink}
        >
          ↗ Yahoo Finance
        </a>
      </div>

      {/* Main score + stats */}
      <div style={styles.topRow}>
        {/* Score circle */}
        <div style={{ ...styles.scoreCircle, borderColor: totalColor }}>
          <span style={{ ...styles.scoreNum, color: totalColor }}>
            {totalScore?.toFixed(1) ?? '—'}
          </span>
          <span style={styles.scoreScale}>/ 100</span>
          <span style={{ ...styles.scoreRisk, color: totalColor }}>
            {riskLevel ?? riskLabel(totalScore)}
          </span>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {[
            { label: 'Peer group',      value: peerGroup   ?? '—' },
            { label: 'Peers compared',  value: peerCount   ?? '—' },
            { label: 'Percentile',      value: percentile != null ? `${percentile.toFixed(0)}th` : '—' },
            { label: 'Last updated',    value: lastUpdated ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} style={styles.statItem}>
              <span style={styles.statLabel}>{label}</span>
              <span style={styles.statValue}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Important note about the scale */}
      <div style={styles.scaleNote}>
        <span style={styles.scaleIcon}>ℹ</span>
        <span style={styles.scaleText}>
          Sustainalytics scale: <strong style={{ color: '#00d4a0' }}>lower score = less ESG risk</strong>.
          Scores below 10 are negligible, above 40 are severe.
        </span>
      </div>

      {/* Three pillar bars */}
      <div style={styles.pillarsRow}>
        <PillarBar label="Environment" score={environmentScore} icon="🌱" />
        <PillarBar label="Social"      score={socialScore}      icon="👥" />
        <PillarBar label="Governance"  score={governanceScore}  icon="🏛" />
      </div>

      {/* Controversy level */}
      {controversyLevel && (
        <div style={styles.controversyRow}>
          <span style={styles.controversyLabel}>Controversy level</span>
          <span style={{
            ...styles.controversyBadge,
            color: controvColor,
            background: `${controvColor}18`,
            border: `1px solid ${controvColor}44`,
          }}>
            {controversyLevel}
          </span>
        </div>
      )}

      {/* Involvement flags */}
      {involvements.length > 0 && (
        <div style={styles.involvementWrap}>
          <p style={styles.involvementTitle}>INDUSTRY INVOLVEMENT</p>
          <div style={styles.involvementChips}>
            {involvements.map(inv => (
              <span key={inv} style={styles.involvementChip}>{inv}</span>
            ))}
          </div>
        </div>
      )}
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
    alignItems: 'flex-start', marginBottom: '1.25rem',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
    letterSpacing: '0.12em', color: 'var(--muted)',
  },
  sectionSub: {
    fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
    color: 'var(--muted)', opacity: 0.6, marginTop: 2,
  },
  sourceLink: {
    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
    color: '#6366f1', textDecoration: 'none',
    border: '1px solid rgba(99,102,241,0.3)',
    padding: '3px 9px', borderRadius: 5, flexShrink: 0,
  },
  topRow: {
    display: 'flex', gap: '1.25rem',
    alignItems: 'center', marginBottom: '1rem',
  },
  scoreCircle: {
    width: 96, height: 96, borderRadius: '50%',
    border: '3px solid', flexShrink: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface2)', gap: 1,
  },
  scoreNum:   { fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 },
  scoreScale: { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--muted)', marginTop: 2 },
  scoreRisk:  { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', fontWeight: 600, marginTop: 2, textAlign: 'center', padding: '0 4px' },
  statsGrid: {
    flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '1px', background: 'var(--border)',
    border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
  },
  statItem: {
    background: 'var(--surface2)', padding: '0.55rem 0.8rem',
    display: 'flex', flexDirection: 'column', gap: 3,
  },
  statLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  statValue: {
    fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
    color: 'var(--text)', fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  scaleNote: {
    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
    background: 'var(--surface2)', borderRadius: 7,
    padding: '0.6rem 0.8rem', marginBottom: '1rem',
  },
  scaleIcon: { fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)', flexShrink: 0 },
  scaleText: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', lineHeight: 1.5 },
  pillarsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem', marginBottom: '1rem',
  },
  controversyRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '0.6rem 0.9rem',
    background: 'var(--surface2)', borderRadius: 8, marginBottom: '0.75rem',
  },
  controversyLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text2)',
  },
  controversyBadge: {
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
    fontWeight: 600, padding: '2px 10px', borderRadius: 5,
  },
  involvementWrap: { borderTop: '1px solid var(--border)', paddingTop: '0.75rem' },
  involvementTitle: {
    fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
    letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.5rem',
  },
  involvementChips: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  involvementChip: {
    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
    color: '#f97316', background: 'rgba(249,115,22,0.1)',
    border: '1px solid rgba(249,115,22,0.3)',
    padding: '2px 8px', borderRadius: 4,
  },
};

const pillar = {
  wrap: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '0.8rem',
  },
  top: {
    display: 'flex', alignItems: 'center',
    gap: '0.4rem', marginBottom: '0.5rem',
  },
  icon:  { fontSize: '0.85rem' },
  label: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text)', flex: 1 },
  score: { fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600 },
  track: { height: 5, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden', marginBottom: '0.35rem' },
  fill:  { height: '100%', borderRadius: 3, transition: 'width 0.5s ease' },
  riskLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 500 },
};
