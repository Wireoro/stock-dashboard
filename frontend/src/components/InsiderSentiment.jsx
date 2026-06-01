import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function scoreLabel(score) {
  if (score >= 80) return { label: 'Very Bullish',  color: '#C4654A' };
  if (score >= 60) return { label: 'Bullish',       color: '#A8523A' };
  if (score >= 40) return { label: 'Neutral',       color: '#facc15' };
  if (score >= 20) return { label: 'Bearish',       color: '#f97316' };
  return               { label: 'Very Bearish',  color: '#f05252' };
}

function fmtVal(n) {
  if (!n) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(abs / 1e3).toFixed(1)}K`;
  return `$${abs.toFixed(0)}`;
}

export default function InsiderSentiment({ symbol }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/insider-sentiment?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [symbol]);

  if (loading) return <Card><Loader text="Loading insider sentiment…" /></Card>;
  if (error || !data)  return null;

  const { score, totalBuyValue, totalSellValue, totalBuyers, totalSellers,
          netShares, recentTransactions } = data;
  const { label, color } = scoreLabel(score);
  const totalValue = totalBuyValue + totalSellValue;
  const buyPct  = totalValue > 0 ? (totalBuyValue  / totalValue) * 100 : 50;
  const sellPct = totalValue > 0 ? (totalSellValue / totalValue) * 100 : 50;

  return (
    <Card>
      <div style={styles.header}>
        <p style={styles.sectionLabel}>INSIDER SENTIMENT</p>
        <div style={styles.scoreBadge}>
          <span style={styles.scoreNum}>{score}</span>
          <span style={{ ...styles.scoreLabel, color }}>{label}</span>
        </div>
      </div>

      {/* Score gauge bar */}
      <div style={styles.gaugeWrap}>
        <div style={styles.gaugeTrack}>
          <div style={{
            ...styles.gaugeFill,
            width: `${score}%`,
            background: `linear-gradient(90deg, #f05252, #facc15 50%, #C4654A)`,
            clipPath: `inset(0 ${100 - score}% 0 0)`,
          }} />
          <div style={{ ...styles.gaugeThumb, left: `${score}%`, borderColor: color }} />
        </div>
        <div style={styles.gaugeLabels}>
          <span>Very Bearish</span>
          <span>Neutral</span>
          <span>Very Bullish</span>
        </div>
      </div>

      {/* Buy vs Sell summary */}
      <div style={styles.splitBar}>
        <div style={{ ...styles.splitFill, width: `${buyPct}%`, background: '#C4654A' }} />
        <div style={{ ...styles.splitFill, width: `${sellPct}%`, background: '#f05252' }} />
      </div>
      <div style={styles.splitLabels}>
        <span style={{ color: '#C4654A' }}>
          ▲ Buys {fmtVal(totalBuyValue)} ({totalBuyers} insiders)
        </span>
        <span style={{ color: '#f05252' }}>
          ▼ Sells {fmtVal(totalSellValue)} ({totalSellers} insiders)
        </span>
      </div>

      {/* Net shares */}
      <div style={styles.netRow}>
        <span style={styles.netLabel}>Net shares (3 months)</span>
        <span style={{
          ...styles.netValue,
          color: netShares >= 0 ? '#C4654A' : '#f05252',
        }}>
          {netShares >= 0 ? '+' : ''}{netShares?.toLocaleString()} shares
        </span>
      </div>

      {/* Recent transactions */}
      {recentTransactions?.length > 0 && (
        <div style={styles.recentWrap}>
          <p style={styles.recentTitle}>RECENT INSIDER ACTIVITY</p>
          {recentTransactions.map((t, i) => {
            const isBuy = t.change > 0;
            return (
              <div key={i} style={styles.txRow}>
                <div style={styles.txLeft}>
                  <span style={styles.txName}>{t.name}</span>
                  <span style={styles.txTitle}>{t.officerTitle}</span>
                </div>
                <div style={styles.txRight}>
                  <span style={{
                    ...styles.txBadge,
                    background: isBuy ? 'rgba(196,101,74,0.08)' : 'rgba(240,82,82,0.1)',
                    color: isBuy ? '#C4654A' : '#f05252',
                    border: `1px solid ${isBuy ? 'rgba(196,101,74,0.3)' : 'rgba(240,82,82,0.3)'}`,
                  }}>
                    {isBuy ? '▲ BUY' : '▼ SELL'}
                  </span>
                  <span style={styles.txShares}>
                    {Math.abs(t.change).toLocaleString()} shares
                  </span>
                  <span style={styles.txDate}>{t.transactionDate}</span>
                </div>
              </div>
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
    alignItems: 'flex-start',
    marginBottom: '1.25rem',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    color: 'var(--muted)',
  },
  scoreBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  scoreNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1.6rem',
    fontWeight: 600,
    color: 'var(--text)',
    lineHeight: 1,
  },
  scoreLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    fontWeight: 500,
  },
  gaugeWrap: {
    marginBottom: '1.25rem',
  },
  gaugeTrack: {
    position: 'relative',
    height: 8,
    background: 'var(--border2)',
    borderRadius: 4,
    overflow: 'visible',
    marginBottom: 6,
  },
  gaugeFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 4,
  },
  gaugeThumb: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: 'var(--bg)',
    border: '2px solid',
    zIndex: 2,
  },
  gaugeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    color: 'var(--muted)',
    marginTop: 4,
  },
  splitBar: {
    display: 'flex',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    gap: 1,
    marginBottom: 6,
  },
  splitFill: {
    height: '100%',
    transition: 'width 0.4s ease',
  },
  splitLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    marginBottom: '1rem',
  },
  netRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 0.9rem',
    background: 'var(--surface2)',
    borderRadius: 8,
    marginBottom: '1rem',
  },
  netLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text2)',
  },
  netValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  recentWrap: {
    borderTop: '1px solid var(--border)',
    paddingTop: '1rem',
  },
  recentTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    letterSpacing: '0.1em',
    color: 'var(--muted)',
    marginBottom: '0.75rem',
  },
  txRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--border)',
    gap: '1rem',
  },
  txLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  txName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.78rem',
    color: 'var(--text)',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  txTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--muted)',
  },
  txRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
  },
  txBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    padding: '2px 7px',
    borderRadius: 4,
    fontWeight: 600,
  },
  txShares: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--text2)',
  },
  txDate: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    color: 'var(--muted)',
  },
};
