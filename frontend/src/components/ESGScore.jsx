import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function scoreColor(score) {
  if (score >= 70) return '#00d4a0';
  if (score >= 50) return '#4ade80';
  if (score >= 35) return '#facc15';
  if (score >= 20) return '#f97316';
  return '#f05252';
}

function scoreLabel(score) {
  if (score >= 70) return 'Excellent';
  if (score >= 50) return 'Good';
  if (score >= 35) return 'Average';
  if (score >= 20) return 'Below Avg';
  return 'Poor';
}

function RatingGauge({ label, value, max = 100, icon }) {
  const pct   = Math.round((value / max) * 100);
  const color = scoreColor(pct);
  return (
    <div style={gStyles.gaugeCard}>
      <div style={gStyles.gaugeTop}>
        <span style={gStyles.gaugeIcon}>{icon}</span>
        <span style={gStyles.gaugeLabel}>{label}</span>
        <span style={{ ...gStyles.gaugeBadge, color, background: `${color}18`, border: `1px solid ${color}44` }}>
          {scoreLabel(pct)}
        </span>
      </div>
      <div style={gStyles.gaugeRow}>
        <div style={gStyles.gaugeTrack}>
          <div style={{ ...gStyles.gaugeFill, width: `${pct}%`, background: color }} />
        </div>
        <span style={{ ...gStyles.gaugeScore, color }}>{value?.toFixed(1)}</span>
      </div>
      <div style={gStyles.gaugeFooter}>
        <span style={gStyles.gaugeFooterText}>Score out of {max}</span>
        <span style={{ ...gStyles.gaugeFooterText, color }}>{pct}th percentile</span>
      </div>
    </div>
  );
}

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

  if (loading) return null;
  if (!data || (!data.environmentScore && !data.socialScore && !data.governanceScore)) return null;

  const { environmentScore, socialScore, governanceScore, totalScore,
          esgRiskRating, esgRiskLevel, percentile, industry, lastProcessed } = data;

  const overallColor = scoreColor(totalScore ?? 0);
  const riskColor    = esgRiskLevel === 'Low' ? '#00d4a0'
    : esgRiskLevel === 'Medium'   ? '#facc15'
    : esgRiskLevel === 'High'     ? '#f97316'
    : esgRiskLevel === 'Severe'   ? '#f05252' : 'var(--muted)';

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>ESG SCORE</p>
          <p style={styles.sectionSub}>Environmental · Social · Governance</p>
        </div>
        {esgRiskLevel && (
          <div style={styles.riskBadge}>
            <span style={styles.riskLabel}>ESG Risk</span>
            <span style={{ ...styles.riskValue, color: riskColor,
              background: `${riskColor}18`, border: `1px solid ${riskColor}44` }}>
              {esgRiskLevel} Risk
            </span>
          </div>
        )}
      </div>

      {/* Overall score + details */}
      <div style={styles.overviewRow}>
        {/* Big score circle */}
        <div style={{ ...styles.scoreCircle, borderColor: overallColor }}>
          <span style={{ ...styles.scoreNumber, color: overallColor }}>{totalScore?.toFixed(0) ?? '—'}</span>
          <span style={styles.scoreOutOf}>/ 100</span>
          <span style={{ ...styles.scoreRating, color: overallColor }}>{scoreLabel(totalScore ?? 0)}</span>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {[
            { label: 'ESG Risk Rating', value: esgRiskRating?.toFixed(1) ?? '—' },
            { label: 'Industry',        value: industry ?? '—' },
            { label: 'Percentile',      value: percentile ? `${percentile}th` : '—' },
            { label: 'Last updated',    value: lastProcessed ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} style={styles.statItem}>
              <span style={styles.statLabel}>{label}</span>
              <span style={styles.statValue}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Three pillar gauges */}
      <div style={styles.gaugesRow}>
        {environmentScore != null && (
          <RatingGauge label="Environmental" value={environmentScore} icon="🌱" />
        )}
        {socialScore != null && (
          <RatingGauge label="Social" value={socialScore} icon="👥" />
        )}
        {governanceScore != null && (
          <RatingGauge label="Governance" value={governanceScore} icon="🏛" />
        )}
      </div>

      {/* Interpretation note */}
      <p style={styles.note}>
        Scores sourced from Finnhub ESG data. Higher scores indicate better ESG performance.
        ESG Risk Rating measures unmanaged risk exposure (lower = better managed).
      </p>
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)' },
  sectionSub: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: 2 },
  riskBadge: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  riskLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' },
  riskValue: { fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 5 },
  overviewRow: { display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.25rem' },
  scoreCircle: {
    width: 100, height: 100, borderRadius: '50%',
    border: '3px solid', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface2)', flexShrink: 0,
  },
  scoreNumber: { fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 },
  scoreOutOf:  { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', marginTop: 1 },
  scoreRating: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, marginTop: 2 },
  statsGrid: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' },
  statItem: { background: 'var(--surface2)', padding: '0.55rem 0.8rem', display: 'flex', flexDirection: 'column', gap: 3 },
  statLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  statValue: { fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 },
  gaugesRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' },
  note: { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)', opacity: 0.7, lineHeight: 1.5 },
};

const gStyles = {
  gaugeCard: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.85rem' },
  gaugeTop: { display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' },
  gaugeIcon: { fontSize: '0.85rem' },
  gaugeLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text)', fontWeight: 500, flex: 1 },
  gaugeBadge: { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4 },
  gaugeRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' },
  gaugeTrack: { flex: 1, height: 6, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden' },
  gaugeFill: { height: '100%', borderRadius: 3, transition: 'width 0.5s ease' },
  gaugeScore: { fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, width: 36, textAlign: 'right', flexShrink: 0 },
  gaugeFooter: { display: 'flex', justifyContent: 'space-between' },
  gaugeFooterText: { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--muted)' },
};
