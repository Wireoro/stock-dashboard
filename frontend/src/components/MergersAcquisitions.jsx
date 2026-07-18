import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function fmtValue(val, currency = 'USD') {
  if (!val) return '—';
  if (val >= 1e9) return `${currency === 'USD' ? '$' : ''}${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${currency === 'USD' ? '$' : ''}${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${currency === 'USD' ? '$' : ''}${(val / 1e3).toFixed(2)}K`;
  return `${val}`;
}

function statusColor(status) {
  if (!status) return 'var(--muted)';
  const s = status.toLowerCase();
  if (s.includes('complet') || s.includes('closed') || s.includes('done')) return '#6B8F71';
  if (s.includes('pending') || s.includes('announced'))                     return '#C4A46C';
  if (s.includes('terminat') || s.includes('withdraw') || s.includes('cancel')) return '#C4654A';
  return 'var(--muted)';
}

function typeIcon(type) {
  if (!type) return '◈';
  const t = type.toLowerCase();
  if (t.includes('acqui'))  return '▲';
  if (t.includes('merger')) return '⇄';
  if (t.includes('spin'))   return '↗';
  if (t.includes('divest')) return '▼';
  return '◈';
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)   return 'Today';
  if (days < 30)  return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function MergersAcquisitions({ symbol }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`${API}/api/mergers?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading || !data || !data.mergers?.length) return null;

  const { mergers, total } = data;

  // Filter options
  const statuses = [...new Set(mergers.map(m => m.status).filter(Boolean))];
  const filtered = filter === 'all' ? mergers : mergers.filter(m => m.status === filter);

  // Summary stats
  const completed = mergers.filter(m => statusColor(m.status) === '#6B8F71').length;
  const pending   = mergers.filter(m => statusColor(m.status) === '#C4A46C').length;
  const totalVal  = mergers.reduce((s, m) => s + (m.value || 0), 0);

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>MERGERS & ACQUISITIONS</p>
          <p style={styles.sectionSub}>M&A activity · {total} transactions</p>
        </div>
        {totalVal > 0 && (
          <div style={styles.totalVal}>
            <span style={styles.totalValLabel}>Total deal value</span>
            <span style={styles.totalValAmt}>{fmtValue(totalVal)}</span>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Total deals',  value: total },
          { label: 'Completed',    value: completed, color: '#6B8F71' },
          { label: 'Pending',      value: pending,   color: '#C4A46C' },
          { label: 'Total value',  value: totalVal > 0 ? fmtValue(totalVal) : '—' },
        ].map(({ label, value, color }) => (
          <div key={label} style={styles.statItem}>
            <span style={styles.statLabel}>{label}</span>
            <span style={{ ...styles.statValue, color: color || 'var(--text)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Status filter pills */}
      {statuses.length > 1 && (
        <div style={styles.filterRow}>
          {['all', ...statuses].map(s => (
            <button key={s} style={{
              ...styles.filterPill,
              background: filter === s ? `${statusColor(s)}18` : 'transparent',
              color:      filter === s ? (s === 'all' ? 'var(--accent)' : statusColor(s)) : 'var(--muted)',
              border:     filter === s ? `1px solid ${s === 'all' ? 'rgba(196,101,74,0.3)' : statusColor(s) + '44'}` : '1px solid var(--border)',
            }} onClick={() => setFilter(s)}>
              {s === 'all' ? `All (${total})` : s}
            </button>
          ))}
        </div>
      )}

      {/* Deals list */}
      <div style={styles.dealsList}>
        {filtered.length > 0 ? filtered.map((m, i) => {
          const sc = statusColor(m.status);
          return (
            <div key={i} style={styles.dealRow}>
              {/* Left accent bar */}
              <div style={{ ...styles.dealBar, background: sc }} />

              <div style={styles.dealContent}>
                <div style={styles.dealTop}>
                  <div style={styles.dealLeft}>
                    <span style={styles.dealIcon}>{typeIcon(m.type)}</span>
                    <div>
                      <p style={styles.dealTarget}>{m.target}</p>
                      {m.acquirer && (
                        <p style={styles.dealAcquirer}>Acquirer: {m.acquirer}</p>
                      )}
                    </div>
                  </div>
                  <div style={styles.dealRight}>
                    {m.value > 0 && (
                      <span style={styles.dealValue}>{fmtValue(m.value, m.currency)}</span>
                    )}
                    <span style={{
                      ...styles.dealStatus,
                      color: sc,
                      background: `${sc}15`,
                      border: `1px solid ${sc}44`,
                    }}>
                      {m.status || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div style={styles.dealMeta}>
                  {m.type && (
                    <span style={styles.dealType}>{m.type}</span>
                  )}
                  {m.date && (
                    <span style={styles.dealDate}>
                      Announced: {m.date} ({timeAgo(m.date)})
                    </span>
                  )}
                  {m.closedDate && (
                    <span style={styles.dealDate}>
                      Closed: {m.closedDate}
                    </span>
                  )}
                  {m.symbol && (
                    <span style={styles.dealSymbol}>{m.symbol}</span>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <p style={styles.empty}>No deals match the selected filter</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  card:          { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  sectionLabel:  { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)' },
  sectionSub:    { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: 2 },
  totalVal:      { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  totalValLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' },
  totalValAmt:   { fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' },
  statsGrid:     { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' },
  statItem:      { background: 'var(--surface2)', padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: 3 },
  statLabel:     { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  statValue:     { fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 600 },
  filterRow:     { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' },
  filterPill:    { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', padding: '3px 10px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s' },
  dealsList:     { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  dealRow:       { display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' },
  dealBar:       { width: 3, flexShrink: 0 },
  dealContent:   { flex: 1, padding: '0.8rem 0.9rem', display: 'flex', flexDirection: 'column', gap: 6 },
  dealTop:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  dealLeft:      { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flex: 1, minWidth: 0 },
  dealIcon:      { fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--muted)', flexShrink: 0, marginTop: 1 },
  dealTarget:    { fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500, lineHeight: 1.3 },
  dealAcquirer:  { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text2)', marginTop: 2 },
  dealRight:     { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  dealValue:     { fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent)' },
  dealStatus:    { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 600, padding: '2px 7px', borderRadius: 4 },
  dealMeta:      { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' },
  dealType:      { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', background: 'var(--surface)', padding: '1px 6px', borderRadius: 3, border: '1px solid var(--border)' },
  dealDate:      { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' },
  dealSymbol:    { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 500 },
  empty:         { fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)', padding: '0.5rem 0' },
};
