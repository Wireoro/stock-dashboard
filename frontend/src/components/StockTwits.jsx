import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function SentimentBar({ bullish, bearish }) {
  const total = bullish + bearish;
  if (total === 0) return null;
  const bPct = Math.round((bullish / total) * 100);
  const rPct = 100 - bPct;
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 5 }}>
        <div style={{ width: `${bPct}%`, background: '#C4654A', transition: 'width 0.5s' }} />
        <div style={{ width: `${rPct}%`, background: '#f05252', transition: 'width 0.5s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
        <span style={{ color: '#C4654A' }}>▲ Bullish {bPct}% ({bullish})</span>
        <span style={{ color: '#f05252' }}>▼ Bearish {rPct}% ({bearish})</span>
      </div>
    </div>
  );
}

export default function StockTwits({ symbol }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState('feed');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/stocktwits?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [symbol]);

  if (loading) return <Card><p style={styles.loader}>Loading StockTwits data…</p></Card>;
  if (error)   return null;
  if (!data)   return null;

  const { bullish, bearish, total, watchlistCount, messages } = data;
  const bPct = total > 0 ? Math.round((bullish / total) * 100) : 0;
  const overallSentiment = bPct >= 65 ? { label: 'Very Bullish',  color: '#C4654A' }
    : bPct >= 55 ? { label: 'Bullish',       color: '#A8523A' }
    : bPct >= 45 ? { label: 'Neutral',        color: '#facc15' }
    : bPct >= 35 ? { label: 'Bearish',        color: '#f97316' }
    :              { label: 'Very Bearish',   color: '#f05252' };

  return (
    <Card>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.stLogo}>ST</div>
          <div>
            <p style={styles.sectionLabel}>STOCKTWITS</p>
            <p style={styles.sectionSub}>Real-time retail trader sentiment</p>
          </div>
        </div>
        <a
          href={`https://stocktwits.com/symbol/${symbol}`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.sourceLink}
        >
          ↗ View on StockTwits
        </a>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['feed', 'overview'].map(t => (
          <button key={t} style={{
            ...styles.tab,
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t ? 'var(--accent)' : 'var(--muted)',
          }} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div>
          {/* Overall sentiment */}
          <div style={styles.overviewTop}>
            <div style={styles.sentimentCircle}>
              <span style={{ ...styles.circleLabel, color: overallSentiment.color }}>
                {overallSentiment.label}
              </span>
              <span style={{ ...styles.circlePct, color: overallSentiment.color }}>
                {bPct}%
              </span>
              <span style={styles.circleSub}>bullish</span>
            </div>

            <div style={styles.statsColumn}>
              {[
                { label: 'Total messages',  value: total?.toLocaleString() },
                { label: 'Bullish',         value: bullish?.toLocaleString(), color: '#C4654A' },
                { label: 'Bearish',         value: bearish?.toLocaleString(), color: '#f05252' },
                { label: 'Watchlisted by',  value: watchlistCount ? `${watchlistCount?.toLocaleString()} traders` : '—' },
              ].map(({ label, value, color: c }) => (
                <div key={label} style={styles.statRow}>
                  <span style={styles.statLabel}>{label}</span>
                  <span style={{ ...styles.statValue, color: c || 'var(--text)' }}>{value ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sentiment bar */}
          <div style={{ marginTop: '1rem' }}>
            <SentimentBar bullish={bullish} bearish={bearish} />
          </div>
        </div>
      )}

      {/* ── FEED TAB ── */}
      {tab === 'feed' && (
        <div style={styles.feed}>
          {/* Mini sentiment bar at top of feed */}
          <div style={{ marginBottom: '1rem' }}>
            <SentimentBar bullish={bullish} bearish={bearish} />
          </div>

          {messages?.length > 0 ? messages.map((msg, i) => {
            const isBull = msg.sentiment === 'Bullish';
            const isBear = msg.sentiment === 'Bearish';
            const sentColor = isBull ? '#C4654A' : isBear ? '#f05252' : '#facc15';
            const sentIcon  = isBull ? '▲' : isBear ? '▼' : '—';

            return (
              <div key={msg.id || i} style={styles.message}>
                {/* Message header */}
                <div style={styles.msgHeader}>
                  <div style={styles.msgUser}>
                    <div style={styles.avatar}>
                      {msg.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <span style={styles.username}>@{msg.username}</span>
                      {msg.followers != null && (
                        <span style={styles.followers}>{msg.followers.toLocaleString()} followers</span>
                      )}
                    </div>
                  </div>
                  <div style={styles.msgMeta}>
                    {msg.sentiment && (
                      <span style={{
                        ...styles.sentBadge,
                        color: sentColor,
                        background: `${sentColor}18`,
                        border: `1px solid ${sentColor}44`,
                      }}>
                        {sentIcon} {msg.sentiment}
                      </span>
                    )}
                    <span style={styles.timestamp}>{timeAgo(msg.createdAt)}</span>
                  </div>
                </div>

                {/* Message body */}
                <p style={styles.msgBody}>{msg.body}</p>

                {/* Likes */}
                {msg.likes > 0 && (
                  <span style={styles.likes}>♥ {msg.likes}</span>
                )}
              </div>
            );
          }) : (
            <p style={styles.loader}>No messages found</p>
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
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  stLogo: {
    width: 34, height: 34, borderRadius: 8,
    background: '#40a0ff', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
    fontWeight: 700, color: '#fff', flexShrink: 0,
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
    color: '#40a0ff', textDecoration: 'none',
    border: '1px solid rgba(64,160,255,0.3)',
    padding: '3px 9px', borderRadius: 5,
  },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem' },
  tab: {
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
    background: 'none', border: 'none', padding: '0.5rem 1rem',
    cursor: 'pointer', letterSpacing: '0.05em', transition: 'color 0.15s',
  },
  overviewTop: {
    display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
  },
  sentimentCircle: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', width: 110, height: 110,
    borderRadius: '50%', border: '2px solid var(--border2)',
    background: 'var(--surface2)', flexShrink: 0,
    gap: 2,
  },
  circleLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, textAlign: 'center' },
  circlePct:   { fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 },
  circleSub:   { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' },
  statsColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  statRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '0.4rem 0.7rem',
    background: 'var(--surface2)', borderRadius: 6,
  },
  statLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text2)' },
  statValue: { fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 500 },
  feed: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  message: {
    background: 'var(--surface2)', borderRadius: 8,
    border: '1px solid var(--border)', padding: '0.85rem',
  },
  msgHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem',
  },
  msgUser:  { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--border2)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
    fontWeight: 600, color: 'var(--text2)', flexShrink: 0,
  },
  username:  { fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 500, display: 'block' },
  followers: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' },
  msgMeta:  { display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 },
  sentBadge: {
    fontFamily: 'var(--font-mono)', fontSize: '0.63rem',
    fontWeight: 600, padding: '2px 7px', borderRadius: 4,
  },
  timestamp: { fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--muted)' },
  msgBody: {
    fontFamily: 'var(--font-sans)', fontSize: '0.82rem',
    color: 'var(--text)', lineHeight: 1.5, marginBottom: '0.35rem',
  },
  likes: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' },
  loader: { fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--muted)' },
};
