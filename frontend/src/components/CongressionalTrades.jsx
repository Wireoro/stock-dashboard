import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function partyColor(party) {
  if (!party) return 'var(--muted)';
  const p = party.toUpperCase();
  if (p.includes('R')) return '#f05252';
  if (p.includes('D')) return '#3b82f6';
  return '#facc15';
}

function partyLabel(party) {
  if (!party) return '';
  const p = party.toUpperCase();
  if (p.includes('REPUBLICAN') || p === 'R') return 'R';
  if (p.includes('DEMOCRAT') || p === 'D') return 'D';
  if (p.includes('INDEPENDENT') || p === 'I') return 'I';
  return party.charAt(0);
}

function tradeColor(type) {
  if (!type) return 'var(--muted)';
  const t = type.toLowerCase();
  if (t.includes('purchase') || t.includes('buy')) return '#00d4a0';
  if (t.includes('sale') || t.includes('sell'))    return '#f05252';
  if (t.includes('exchange'))                       return '#facc15';
  return 'var(--muted)';
}

function tradeIcon(type) {
  if (!type) return '—';
  const t = type.toLowerCase();
  if (t.includes('purchase') || t.includes('buy')) return '▲ Buy';
  if (t.includes('sale') || t.includes('sell'))    return '▼ Sell';
  if (t.includes('exchange'))                       return '⇄ Exchange';
  return type;
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)  return 'Today';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function CongressionalTrades({ symbol }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all'); // all | buy | sell

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`${API}/api/congress-trades?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading) return null;
  if (!data || data.totalTrades === 0) return null;

  const { totalTrades, purchases, sales, uniqueMembers, trades } = data;

  const filtered = trades.filter(t => {
    if (filter === 'buy')  return t.type?.toLowerCase().includes('purchase');
    if (filter === 'sell') return t.type?.toLowerCase().includes('sale');
    return true;
  });

  const buyPct  = totalTrades > 0 ? Math.round((purchases / totalTrades) * 100) : 0;
  const sellPct = totalTrades > 0 ? Math.round((sales / totalTrades) * 100) : 0;

  const overallSentiment = buyPct >= 65 ? { label: 'Bullish Signal',  color: '#00d4a0' }
    : buyPct >= 50 ? { label: 'Leaning Bullish', color: '#4ade80' }
    : sellPct >= 65 ? { label: 'Bearish Signal',  color: '#f05252' }
    : sellPct >= 50 ? { label: 'Leaning Bearish', color: '#f97316' }
    : { label: 'Mixed Activity', color: '#facc15' };

  return (
    <Card>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>CONGRESSIONAL TRADING</p>
          <p style={styles.sectionSub}>STOCK Act disclosures · House & Senate</p>
        </div>
        <span style={{
          ...styles.sentimentBadge,
          color: overallSentiment.color,
          background: `${overallSentiment.color}18`,
          border: `1px solid ${overallSentiment.color}44`,
        }}>
          {overallSentiment.label}
        </span>
      </div>

      {/* Summary row */}
      <div style={styles.summaryGrid}>
        {[
          { label: 'Total disclosures', value: totalTrades },
          { label: 'Purchases',         value: purchases, color: '#00d4a0' },
          { label: 'Sales',             value: sales,     color: '#f05252' },
          { label: 'Members',           value: uniqueMembers },
        ].map(({ label, value, color: c }) => (
          <div key={label} style={styles.statItem}>
            <span style={styles.statLabel}>{label}</span>
            <span style={{ ...styles.statValue, color: c || 'var(--text)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Buy / sell bar */}
      <div style={styles.sentBar}>
        <div style={{ width: `${buyPct}%`,  background: '#00d4a0', height: '100%', borderRadius: '4px 0 0 4px' }} />
        <div style={{ width: `${sellPct}%`, background: '#f05252', height: '100%', borderRadius: '0 4px 4px 0' }} />
      </div>
      <div style={styles.barLegend}>
        <span style={{ color: '#00d4a0' }}>▲ Buys {buyPct}%</span>
        <span style={{ color: '#f05252' }}>▼ Sells {sellPct}%</span>
      </div>

      {/* Filter buttons */}
      <div style={styles.filters}>
        {[
          { key: 'all',  label: `All (${totalTrades})` },
          { key: 'buy',  label: `Buys (${purchases})` },
          { key: 'sell', label: `Sells (${sales})` },
        ].map(f => (
          <button key={f.key} style={{
            ...styles.filterBtn,
            background: filter === f.key ? 'rgba(0,212,160,0.1)' : 'transparent',
            color:      filter === f.key ? 'var(--accent)' : 'var(--muted)',
            border:     filter === f.key ? '1px solid rgba(0,212,160,0.3)' : '1px solid var(--border)',
          }} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Trade rows */}
      <div style={styles.tradeList}>
        {filtered.length > 0 ? filtered.map((t, i) => {
          const tc = tradeColor(t.type);
          const pc = partyColor(t.party);
          return (
            <div key={i} style={styles.tradeRow}>
              <div style={styles.tradeLeft}>
                {/* Party badge + name */}
                <div style={styles.tradeNameRow}>
                  {t.party && (
                    <span style={{ ...styles.partyBadge, color: pc, background: `${pc}22`, border: `1px solid ${pc}44` }}>
                      {partyLabel(t.party)}
                    </span>
                  )}
                  <span style={styles.tradeMember}>{t.member}</span>
                  <span style={styles.tradeChamber}>{t.chamber}</span>
                </div>
                {t.assetDescription && (
                  <p style={styles.tradeAsset}>{t.assetDescription}</p>
                )}
                <div style={styles.tradeDates}>
                  <span style={styles.tradeDateLabel}>Traded:</span>
                  <span style={styles.tradeDateVal}>{t.transactionDate || '—'}</span>
                  <span style={styles.tradeDateLabel}>Filed:</span>
                  <span style={{ ...styles.tradeDateVal, color: 'var(--muted)' }}>
                    {timeAgo(t.disclosureDate)}
                  </span>
                </div>
              </div>
              <div style={styles.tradeRight}>
                <span style={{ ...styles.tradeTypeBadge, color: tc, background: `${tc}15`, border: `1px solid ${tc}44` }}>
                  {tradeIcon(t.type)}
                </span>
                {t.amount && (
                  <span style={styles.tradeAmount}>{t.amount}</span>
                )}
              </div>
            </div>
          );
        }) : (
          <p style={styles.empty}>No {filter === 'all' ? '' : filter} trades to show</p>
        )}
      </div>

      {/* Disclaimer */}
      <p style={styles.disclaimer}>
        Data from House Stock Watcher & Senate Stock Watcher. Disclosures filed within 45 days of trade.
      </p>
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
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  sectionLabel:   { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)' },
  sectionSub:     { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: 2 },
  sentimentBadge: { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: 5, flexShrink: 0 },
  summaryGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: '0.75rem' },
  statItem:       { background: 'var(--surface2)', padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: 3 },
  statLabel:      { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  statValue:      { fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 600 },
  sentBar:        { display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 5 },
  barLegend:      { display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', marginBottom: '1rem' },
  filters:        { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  filterBtn:      { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', padding: '4px 12px', borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s' },
  tradeList:      { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  tradeRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0.8rem', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', gap: '1rem' },
  tradeLeft:      { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 },
  tradeNameRow:   { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  partyBadge:     { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3, flexShrink: 0 },
  tradeMember:    { fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text)', fontWeight: 500 },
  tradeChamber:   { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)', background: 'var(--surface)', padding: '1px 5px', borderRadius: 3 },
  tradeAsset:     { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tradeDates:     { display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' },
  tradeDateLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' },
  tradeDateVal:   { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text2)' },
  tradeRight:     { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  tradeTypeBadge: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4 },
  tradeAmount:    { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text2)' },
  empty:          { fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)', padding: '0.5rem 0' },
  disclaimer:     { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: '0.75rem', lineHeight: 1.5 },
};
