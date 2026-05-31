import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const CPC_LABELS = {
  A: 'Human Necessities',
  B: 'Operations & Transport',
  C: 'Chemistry & Metallurgy',
  D: 'Textiles & Paper',
  E: 'Fixed Constructions',
  F: 'Mechanical Engineering',
  G: 'Physics & Computing',
  H: 'Electricity & Electronics',
  Y: 'Emerging Technologies',
};

function categoryColor(letter) {
  const map = {
    A: '#00d4a0', B: '#6366f1', C: '#f59e0b', D: '#3b82f6',
    E: '#ec4899', F: '#8b5cf6', G: '#10b981', H: '#f97316', Y: '#facc15',
  };
  return map[letter] || '#64748b';
}

export default function PatentFilings({ symbol, companyName }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState('recent');

  useEffect(() => {
    if (!companyName) return;
    setLoading(true);
    setData(null);
    fetch(`${API}/api/patents?company=${encodeURIComponent(companyName)}&symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [companyName, symbol]);

  if (loading) return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={styles.sectionLabel}>PATENT FILINGS</p>
        <p style={styles.loader}>Searching USPTO database…</p>
      </div>
    </Card>
  );

  if (!data) return null;

  const { searchName, totalPatents, recentPatents, patents, topCategories } = data;
  const maxCatCount = Math.max(...(topCategories?.map(c => c.count) || [1]));

  return (
    <Card>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>PATENT FILINGS</p>
          <p style={styles.sectionSub}>USPTO PatentsView · searched: "{searchName}"</p>
        </div>
        <a
          href={`https://patents.google.com/?assignee=${encodeURIComponent(searchName)}&sort=new`}
          target="_blank" rel="noopener noreferrer"
          style={styles.sourceLink}
        >
          ↗ Google Patents
        </a>
      </div>

      {/* Summary stats */}
      <div style={styles.summaryGrid}>
        {[
          { label: 'Total patents (all time)', value: totalPatents?.toLocaleString() },
          { label: 'Granted (last 2 years)',   value: recentPatents?.toLocaleString() },
          { label: 'Avg per year (recent)',     value: Math.round(recentPatents / 2).toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} style={styles.statItem}>
            <span style={styles.statLabel}>{label}</span>
            <span style={styles.statValue}>{value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['recent', 'categories'].map(t => (
          <button key={t} style={{
            ...styles.tab,
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t ? 'var(--accent)' : 'var(--muted)',
          }} onClick={() => setTab(t)}>
            {t === 'recent' ? `Recent Patents (${patents?.length})` : 'Tech Categories'}
          </button>
        ))}
      </div>

      {/* Recent patents tab */}
      {tab === 'recent' && (
        <div style={styles.patentList}>
          {patents?.length > 0 ? patents.map((p, i) => (
            <a
              key={p.number || i}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.patentRow}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={styles.patentLeft}>
                <div style={styles.patentTopRow}>
                  <span style={styles.patentNumber}>US{p.number}</span>
                  <span style={styles.patentDate}>{p.date}</span>
                  {p.type && <span style={styles.patentType}>{p.type}</span>}
                </div>
                <p style={styles.patentTitle}>{p.title}</p>
                {p.abstract && (
                  <p style={styles.patentAbstract}>{p.abstract}</p>
                )}
                {p.categories?.length > 0 && (
                  <div style={styles.catChips}>
                    {p.categories.map((cat, j) => {
                      const letter = cat?.charAt(0)?.toUpperCase();
                      const color  = categoryColor(letter);
                      return (
                        <span key={j} style={{ ...styles.catChip, color, background: `${color}18`, border: `1px solid ${color}44` }}>
                          {CPC_LABELS[letter] || cat}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </a>
          )) : (
            <p style={styles.empty}>No recent patents found</p>
          )}
        </div>
      )}

      {/* Categories tab */}
      {tab === 'categories' && (
        <div style={styles.catList}>
          <p style={styles.catNote}>
            CPC (Cooperative Patent Classification) categories for recent 2-year patents
          </p>
          {topCategories?.length > 0 ? topCategories.map((cat, i) => {
            const letter = cat.name?.charAt(0)?.toUpperCase();
            const color  = categoryColor(letter);
            const pct    = (cat.count / maxCatCount) * 100;
            return (
              <div key={i} style={styles.catRow}>
                <div style={styles.catRowTop}>
                  <span style={{ ...styles.catLetter, color, background: `${color}18`, border: `1px solid ${color}44` }}>
                    {letter}
                  </span>
                  <span style={styles.catName}>{CPC_LABELS[letter] || cat.name}</span>
                  <span style={{ ...styles.catCount, color }}>{cat.count} patents</span>
                </div>
                <div style={styles.catBarTrack}>
                  <div style={{ ...styles.catBarFill, width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          }) : (
            <p style={styles.empty}>No category data available</p>
          )}
        </div>
      )}
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
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)' },
  sectionSub:   { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: 2 },
  sourceLink:   { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)', textDecoration: 'none', border: '1px solid rgba(0,212,160,0.25)', padding: '3px 9px', borderRadius: 5, flexShrink: 0 },
  summaryGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' },
  statItem:     { background: 'var(--surface2)', padding: '0.65rem 0.9rem', display: 'flex', flexDirection: 'column', gap: 4 },
  statLabel:    { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statValue:    { fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--text)' },
  tabs:         { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem' },
  tab:          { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', letterSpacing: '0.05em', transition: 'color 0.15s' },
  patentList:   { display: 'flex', flexDirection: 'column' },
  patentRow:    { padding: '0.8rem 0.4rem', borderBottom: '1px solid var(--border)', textDecoration: 'none', transition: 'background 0.1s', borderRadius: 4, display: 'block' },
  patentLeft:   { display: 'flex', flexDirection: 'column', gap: 4 },
  patentTopRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  patentNumber: { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 500 },
  patentDate:   { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--muted)' },
  patentType:   { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)', background: 'var(--surface2)', padding: '1px 6px', borderRadius: 3 },
  patentTitle:  { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 },
  patentAbstract: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--text2)', lineHeight: 1.5 },
  catChips:     { display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 2 },
  catChip:      { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 500, padding: '1px 6px', borderRadius: 3 },
  catList:      { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  catNote:      { fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--muted)', marginBottom: '0.5rem' },
  catRow:       { display: 'flex', flexDirection: 'column', gap: 5 },
  catRowTop:    { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  catLetter:    { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 4, flexShrink: 0 },
  catName:      { fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text)', flex: 1 },
  catCount:     { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 500, flexShrink: 0 },
  catBarTrack:  { height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' },
  catBarFill:   { height: '100%', borderRadius: 2, transition: 'width 0.5s ease', opacity: 0.75 },
  empty:        { fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)', padding: '0.5rem 0' },
  loader:       { fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)' },
};
