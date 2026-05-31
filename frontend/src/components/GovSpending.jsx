import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function fmtDollars(n) {
  if (!n) return '$0';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(0)}`;
}

function agencyColor(i) {
  const colors = ['#00d4a0', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899',
                  '#8b5cf6', '#10b981', '#f97316'];
  return colors[i % colors.length];
}

export default function GovSpending({ symbol, companyName }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!companyName) return;
    setLoading(true);
    setError(null);
    fetch(`${API}/api/gov-spending?company=${encodeURIComponent(companyName)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [companyName]);

  if (!companyName) return null;
  if (loading) return <Card><Loader text="Searching federal contracts…" /></Card>;
  if (error || !data || data.totalContracts === 0) return null;

  const { totalAmount, totalContracts, agencies, recentAwards, yearOverYear } = data;

  const maxAgencyAmt = Math.max(...(agencies?.map(a => a.amount) || [1]));

  return (
    <Card>
      <div style={styles.header}>
        <p style={styles.sectionLabel}>USA GOVERNMENT SPENDING</p>
        <a
          href={`https://www.usaspending.gov/search/?query=${encodeURIComponent(companyName)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.sourceLink}
        >
          ↗ USASpending.gov
        </a>
      </div>

      {/* Top summary */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Total contracts (12mo)</span>
          <span style={styles.summaryValue}>{fmtDollars(totalAmount)}</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Number of awards</span>
          <span style={styles.summaryValue}>{totalContracts?.toLocaleString()}</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Avg award size</span>
          <span style={styles.summaryValue}>
            {fmtDollars(totalContracts > 0 ? totalAmount / totalContracts : 0)}
          </span>
        </div>
      </div>

      {/* Year over year */}
      {yearOverYear && yearOverYear.length > 0 && (
        <div style={styles.section}>
          <p style={styles.subLabel}>ANNUAL CONTRACT VALUE</p>
          <div style={styles.yoyBars}>
            {yearOverYear.map((y, i) => {
              const maxY = Math.max(...yearOverYear.map(x => x.amount));
              const pct  = maxY > 0 ? (y.amount / maxY) * 100 : 0;
              return (
                <div key={i} style={styles.yoyRow}>
                  <span style={styles.yoyYear}>{y.year}</span>
                  <div style={styles.yoyTrack}>
                    <div style={{
                      ...styles.yoyFill,
                      width: `${pct}%`,
                      background: i === 0 ? 'var(--accent)' : 'var(--border2)',
                    }} />
                  </div>
                  <span style={{
                    ...styles.yoyAmt,
                    color: i === 0 ? 'var(--accent)' : 'var(--text2)',
                  }}>
                    {fmtDollars(y.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agencies breakdown */}
      {agencies && agencies.length > 0 && (
        <div style={styles.section}>
          <p style={styles.subLabel}>TOP CONTRACTING AGENCIES</p>
          <div style={styles.agencyList}>
            {agencies.slice(0, 6).map((a, i) => {
              const pct = maxAgencyAmt > 0 ? (a.amount / maxAgencyAmt) * 100 : 0;
              const color = agencyColor(i);
              return (
                <div key={i} style={styles.agencyRow}>
                  <div style={styles.agencyTop}>
                    <span style={{ ...styles.agencyName, color }}>{a.name}</span>
                    <span style={styles.agencyAmt}>{fmtDollars(a.amount)}</span>
                  </div>
                  <div style={styles.agencyTrack}>
                    <div style={{
                      ...styles.agencyFill,
                      width: `${pct}%`,
                      background: color,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent awards */}
      {recentAwards && recentAwards.length > 0 && (
        <div style={styles.section}>
          <p style={styles.subLabel}>RECENT AWARDS</p>
          <div style={styles.awardsList}>
            {recentAwards.map((a, i) => (
              <div key={i} style={styles.awardRow}>
                <div style={styles.awardLeft}>
                  <span style={styles.awardDesc}>{a.description}</span>
                  <span style={styles.awardAgency}>{a.agency}</span>
                </div>
                <div style={styles.awardRight}>
                  <span style={styles.awardAmt}>{fmtDollars(a.amount)}</span>
                  <span style={styles.awardDate}>{a.date}</span>
                </div>
              </div>
            ))}
          </div>
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

function Loader({ text }) {
  return (
    <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      {text}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    color: 'var(--muted)',
  },
  sourceLink: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    color: 'var(--accent)',
    textDecoration: 'none',
    border: '1px solid rgba(0,212,160,0.25)',
    padding: '3px 9px',
    borderRadius: 5,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1px',
    background: 'var(--border)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: '1.25rem',
  },
  summaryItem: {
    background: 'var(--surface2)',
    padding: '0.75rem 0.9rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  summaryLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  summaryValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  section: {
    marginBottom: '1.25rem',
  },
  subLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    letterSpacing: '0.1em',
    color: 'var(--muted)',
    marginBottom: '0.65rem',
  },
  yoyBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  yoyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  yoyYear: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text2)',
    width: 36,
    flexShrink: 0,
  },
  yoyTrack: {
    flex: 1,
    height: 6,
    background: 'var(--border2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  yoyFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
  yoyAmt: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    width: 70,
    textAlign: 'right',
    flexShrink: 0,
  },
  agencyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  agencyRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  agencyTop: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  agencyName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    paddingRight: '1rem',
  },
  agencyAmt: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--text2)',
    flexShrink: 0,
  },
  agencyTrack: {
    height: 4,
    background: 'var(--border2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  agencyFill: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.7,
    transition: 'width 0.5s ease',
  },
  awardsList: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid var(--border)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  awardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.65rem 0.9rem',
    borderBottom: '1px solid var(--border)',
    gap: '1rem',
    background: 'var(--surface2)',
  },
  awardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    flex: 1,
    minWidth: 0,
  },
  awardDesc: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  awardAgency: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--muted)',
  },
  awardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 3,
    flexShrink: 0,
  },
  awardAmt: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--accent)',
  },
  awardDate: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--muted)',
  },
};
