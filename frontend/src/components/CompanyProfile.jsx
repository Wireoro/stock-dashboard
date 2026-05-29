import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function fmt(n) {
  if (!n) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export default function CompanyProfile({ symbol }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/profile?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => {
        setProfile(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading || !profile || !profile.name) return null;

  return (
    <div style={styles.card}>
      <div style={styles.top}>
        {profile.logo && (
          <img
            src={profile.logo}
            alt={profile.name}
            style={styles.logo}
            onError={e => e.target.style.display = 'none'}
          />
        )}
        <div>
          <p style={styles.name}>{profile.name}</p>
          <p style={styles.sub}>
            {profile.exchange} · {profile.finnhubIndustry}
          </p>
        </div>
        {profile.weburl && (
          <a
            href={profile.weburl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            ↗ Website
          </a>
        )}
      </div>

      <div style={styles.grid}>
        {[
          ['Country',    profile.country],
          ['Currency',   profile.currency],
          ['Shares out', profile.shareOutstanding ? `${(profile.shareOutstanding / 1e6).toFixed(0)}M` : '—'],
          ['Market cap', fmt(profile.marketCapitalization * 1e6)],
          ['IPO date',   profile.ipo || '—'],
        ].map(([label, val]) => (
          <div key={label} style={styles.stat}>
            <span style={styles.statLabel}>{label}</span>
            <span style={styles.statVal}>{val || '—'}</span>
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
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  top: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
  },
  logo: {
    width: 36,
    height: 36,
    objectFit: 'contain',
    borderRadius: 8,
    background: '#fff',
    padding: 3,
    flexShrink: 0,
  },
  name: {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: '1rem',
    color: 'var(--text)',
  },
  sub: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--muted)',
    marginTop: 2,
  },
  link: {
    marginLeft: 'auto',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--accent)',
    textDecoration: 'none',
    border: '1px solid rgba(0,212,160,0.25)',
    padding: '4px 10px',
    borderRadius: 5,
  },
  grid: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  statLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  statVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.88rem',
    color: 'var(--text)',
    fontWeight: 500,
  },
};
