import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function NewsPanel({ symbol }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/news?symbol=${symbol}`)
      .then(r => r.json())
      .then(data => {
        setArticles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading) return null;
  if (articles.length === 0) return null;

  return (
    <div style={styles.card}>
      <p style={styles.sectionLabel}>RECENT NEWS</p>
      <div style={styles.list}>
        {articles.map((a, i) => (
          <a
            key={a.id || i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.item}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={styles.itemMeta}>
              <span style={styles.source}>{a.source}</span>
              <span style={styles.date}>{formatDate(a.datetime)}</span>
            </div>
            <p style={styles.headline}>{a.headline}</p>
            {a.summary && (
              <p style={styles.summary}>{a.summary.slice(0, 160)}{a.summary.length > 160 ? '…' : ''}</p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const styles = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.5rem',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    color: 'var(--muted)',
    marginBottom: '1rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  item: {
    display: 'block',
    padding: '0.9rem',
    borderRadius: 8,
    border: '1px solid transparent',
    textDecoration: 'none',
    transition: 'border-color 0.15s',
    background: 'var(--surface2)',
  },
  itemMeta: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '0.35rem',
    alignItems: 'center',
  },
  source: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  date: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--muted)',
  },
  headline: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--text)',
    lineHeight: 1.4,
    marginBottom: '0.3rem',
  },
  summary: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.78rem',
    color: 'var(--text2)',
    lineHeight: 1.55,
  },
};
