import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function RelationCard({ company, type, onSelect }) {
  const [quote, setQuote]   = useState(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!company.symbol) return;
    fetch(`${API}/api/quote?symbol=${company.symbol}`)
      .then(r => r.json())
      .then(d => { if (d.c) setQuote(d); })
      .catch(() => {});
  }, [company.symbol]);

  const isUp    = quote && (quote.dp ?? 0) >= 0;
  const color   = isUp ? '#00d4a0' : '#f05252';
  const typeColor = type === 'supplier' ? '#6366f1' : '#f59e0b';
  const typeLabel = type === 'supplier' ? '↑ Supplier' : '↓ Customer';

  return (
    <div
      style={{
        ...styles.relationCard,
        borderColor: hovered ? 'var(--border2)' : 'var(--border)',
        cursor: company.symbol ? 'pointer' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => company.symbol && onSelect && onSelect(company.symbol)}
    >
      <div style={styles.rcTop}>
        <span style={{ ...styles.rcType, color: typeColor, background: `${typeColor}18`,
          border: `1px solid ${typeColor}33` }}>
          {typeLabel}
        </span>
        {company.symbol && (
          <span style={styles.rcSymbol}>{company.symbol}</span>
        )}
      </div>
      <p style={styles.rcName}>{company.name || company.symbol}</p>
      {company.country && (
        <p style={styles.rcCountry}>{company.country}</p>
      )}
      {quote && quote.c > 0 && (
        <div style={styles.rcQuote}>
          <span style={styles.rcPrice}>${quote.c?.toFixed(2)}</span>
          <span style={{ ...styles.rcChange, color }}>
            {isUp ? '▲' : '▼'} {Math.abs(quote.dp ?? 0).toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default function SupplyChain({ symbol, onSelect }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('all');

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`${API}/api/supply-chain?symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d.error ? null : d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol]);

  if (loading) return null;
  if (!data)   return null;

  const suppliers = data.suppliers || [];
  const customers = data.customers || [];

  if (suppliers.length === 0 && customers.length === 0) return null;

  const shown = tab === 'all'
    ? [...suppliers.map(s => ({ ...s, type: 'supplier' })),
       ...customers.map(c => ({ ...c, type: 'customer' }))]
    : tab === 'suppliers'
    ? suppliers.map(s => ({ ...s, type: 'supplier' }))
    : customers.map(c => ({ ...c, type: 'customer' }));

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>SUPPLY CHAIN</p>
          <p style={styles.sectionSub}>
            {suppliers.length} suppliers · {customers.length} customers
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: 'all',       label: `All (${suppliers.length + customers.length})` },
          { key: 'suppliers', label: `Suppliers (${suppliers.length})` },
          { key: 'customers', label: `Customers (${customers.length})` },
        ].map(t => (
          <button key={t.key} style={{
            ...styles.tab,
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t.key ? 'var(--accent)' : 'var(--muted)',
          }} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Flow diagram header */}
      <div style={styles.flowRow}>
        <div style={styles.flowBox}>
          <span style={styles.flowIcon}>↑</span>
          <span style={styles.flowLabel}>Suppliers provide inputs</span>
        </div>
        <div style={{ ...styles.flowCenter, border: '2px solid var(--accent)' }}>
          <span style={styles.flowSymbol}>{symbol}</span>
        </div>
        <div style={styles.flowBox}>
          <span style={styles.flowIcon}>↓</span>
          <span style={styles.flowLabel}>Customers buy outputs</span>
        </div>
      </div>

      {/* Cards grid */}
      {shown.length > 0 ? (
        <div style={styles.grid}>
          {shown.map((company, i) => (
            <RelationCard
              key={company.symbol || company.name || i}
              company={company}
              type={company.type}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <p style={styles.empty}>No {tab} data available</p>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)' },
  sectionSub: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: 2 },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem' },
  tab: {
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: 'none',
    border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
    letterSpacing: '0.05em', transition: 'color 0.15s',
  },
  flowRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '1rem', marginBottom: '1.25rem',
  },
  flowBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 4, flex: 1,
  },
  flowIcon: { fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--muted)' },
  flowLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', textAlign: 'center' },
  flowCenter: {
    width: 64, height: 64, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,212,160,0.08)', flexShrink: 0,
  },
  flowSymbol: { fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '0.6rem',
  },
  empty: { fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)', padding: '1rem 0' },
  // RelationCard styles
  relationCard: {
    background: 'var(--surface2)', border: '1px solid',
    borderRadius: 8, padding: '0.75rem',
    transition: 'border-color 0.15s',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  rcTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rcType: {
    fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
    fontWeight: 600, padding: '1px 6px', borderRadius: 4,
  },
  rcSymbol: {
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
    fontWeight: 600, color: 'var(--accent)',
  },
  rcName: {
    fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
    color: 'var(--text)', fontWeight: 500, lineHeight: 1.3,
  },
  rcCountry: { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)' },
  rcQuote: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  rcPrice: { fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 },
  rcChange: { fontFamily: 'var(--font-mono)', fontSize: '0.7rem' },
};
