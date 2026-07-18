import { useEffect, useState } from 'react';

const USASPENDING = 'https://api.usaspending.gov/api/v2';

function fmtDollars(n) {
  if (!n) return '$0';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(0)}`;
}

function agencyColor(i) {
  const colors = ['#C4654A','#6366f1','#6B8F71','#C4A46C','#3b82f6','#ec4899','#8b5cf6','#f59e0b'];
  return colors[i % colors.length];
}

function stripSuffix(name) {
  return name
    .replace(/\b(inc|corp|corporation|ltd|llc|co|company|technologies|systems|group|holdings?)\b\.?/gi, '')
    .replace(/,\s*$/, '')
    .trim();
}

export default function GovSpending({ symbol, companyName }) {
  const [state, setState]   = useState('idle');
  const [data,  setData]    = useState(null);
  const [dots,  setDots]    = useState('');

  useEffect(() => {
    if (!companyName) return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (!companyName) return;
    const searchTerm  = stripSuffix(companyName);
    const currentYear = new Date().getFullYear();
    setState('loading');
    setData(null);

    const controller = new AbortController();

    fetch(`${USASPENDING}/search/spending_by_award/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body: JSON.stringify({
        filters: {
          keywords:         [searchTerm],
          award_type_codes: ['A','B','C','D'],
          time_period: [{
            start_date: `${currentYear - 1}-10-01`,
            end_date:   `${currentYear}-09-30`,
          }],
        },
        fields: [
          'Award Amount',
          'Awarding Agency',
          'Description',
          'Action Date',
          'Recipient Name',
          'generated_unique_award_id',
        ],
        sort:  'Award Amount',
        order: 'desc',
        limit: 15,
        page:  1,
      }),
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => {
        const results = d.results || [];
        const total   = d.page_metadata?.total || 0;
        const amount  = results.reduce((s, r) => s + (r['Award Amount'] || 0), 0);

        if (amount === 0 && total === 0) { setState('empty'); return; }

        const agencyMap = {};
        results.forEach(r => {
          const a = r['Awarding Agency'] || 'Unknown';
          agencyMap[a] = (agencyMap[a] || 0) + (r['Award Amount'] || 0);
        });

        setData({
          totalAmount:    amount,
          totalContracts: total,
          searchTerm,
          year:           currentYear,
          agencies: Object.entries(agencyMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount),
          recentAwards: results.slice(0, 8).map(r => ({
            description: r['Description']              || 'Contract award',
            agency:      r['Awarding Agency']          || '—',
            amount:      r['Award Amount']             || 0,
            date:        r['Action Date']              || '—',
            awardId:     r['generated_unique_award_id'] || null,
            url: r['generated_unique_award_id']
              ? `https://www.usaspending.gov/award/${encodeURIComponent(r['generated_unique_award_id'])}/`
              : null,
          })),
        });
        setState('done');
      })
      .catch(e => {
        if (e.name === 'AbortError') return;
        setState('error');
      });

    return () => controller.abort();
  }, [companyName]);

  if (state === 'idle') return null;

  if (state === 'loading') return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={styles.sectionLabel}>USA GOVERNMENT SPENDING</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)' }}>
          Searching federal contracts{dots}
          <span style={{ fontSize: '0.63rem', opacity: 0.5 }}> (may take 15–25s)</span>
        </p>
      </div>
    </Card>
  );

  if (state === 'error' || state === 'empty' || !data) return (
    <Card>
      <p style={styles.sectionLabel}>USA GOVERNMENT SPENDING</p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)', marginTop: 8 }}>
        {state === 'empty'
          ? `No federal contracts found for "${stripSuffix(companyName)}" in FY${new Date().getFullYear()}.`
          : 'Could not load data — try refreshing.'}
      </p>
    </Card>
  );

  const { totalAmount, totalContracts, searchTerm, year, agencies, recentAwards } = data;
  const maxAmt = Math.max(...(agencies?.map(a => a.amount) || [1]));

  return (
    <Card>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>USA GOVERNMENT SPENDING</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: 2 }}>
            FY{year} · searched: "{searchTerm}"
          </p>
        </div>
        <a
          href={`https://www.usaspending.gov/search/?query=${encodeURIComponent(companyName)}&award_type_codes=A,B,C,D`}
          target="_blank" rel="noopener noreferrer"
          style={styles.sourceLink}
        >
          ↗ View all on USASpending.gov
        </a>
      </div>

      {/* Summary */}
      <div style={styles.summaryGrid}>
        {[
          { label: 'Total contracts (FY)', value: fmtDollars(totalAmount) },
          { label: 'Number of awards',     value: totalContracts?.toLocaleString() },
          { label: 'Avg award size',       value: fmtDollars(totalContracts > 0 ? totalAmount / totalContracts : 0) },
        ].map(({ label, value }) => (
          <div key={label} style={styles.summaryItem}>
            <span style={styles.summaryLabel}>{label}</span>
            <span style={styles.summaryValue}>{value}</span>
          </div>
        ))}
      </div>

      {/* Agency bars */}
      {agencies?.length > 0 && (
        <div style={styles.section}>
          <p style={styles.subLabel}>TOP CONTRACTING AGENCIES</p>
          {agencies.slice(0, 6).map((a, i) => {
            const pct   = (a.amount / maxAmt) * 100;
            const color = agencyColor(i);
            return (
              <div key={i} style={{ marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color, fontWeight: 500, flex: 1, paddingRight: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text2)', flexShrink: 0 }}>
                    {fmtDollars(a.amount)}
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: color, opacity: 0.75 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent awards — each row links to USASpending award page */}
      {recentAwards?.length > 0 && (
        <div style={styles.section}>
          <p style={styles.subLabel}>RECENT AWARDS — click any row to view full announcement</p>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {recentAwards.map((a, i) => {
              const RowEl = a.url ? 'a' : 'div';
              return (
                <RowEl
                  key={i}
                  href={a.url || undefined}
                  target={a.url ? '_blank' : undefined}
                  rel={a.url ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.7rem 0.9rem',
                    borderBottom: i < recentAwards.length - 1 ? '1px solid var(--border)' : 'none',
                    gap: '1rem',
                    background: 'var(--surface2)',
                    textDecoration: 'none',
                    cursor: a.url ? 'pointer' : 'default',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={a.url ? e => e.currentTarget.style.background = 'rgba(196,101,74,0.06)' : undefined}
                  onMouseLeave={a.url ? e => e.currentTarget.style.background = 'var(--surface2)' : undefined}
                >
                  {/* Left — description + agency */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {a.url && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent)', flexShrink: 0 }}>↗</span>
                      )}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.description}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
                      {a.agency}
                    </span>
                  </div>

                  {/* Right — amount + date */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {fmtDollars(a.amount)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
                      {a.date}
                    </span>
                  </div>
                </RowEl>
              );
            })}
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: '0.5rem' }}>
            ↗ Rows with links open the official USASpending.gov award announcement page
          </p>
        </div>
      )}
    </Card>
  );
}

function Card({ children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem' }}>
      {children}
    </div>
  );
}

const styles = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)' },
  sourceLink:   { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)', textDecoration: 'none', border: '1px solid rgba(196,101,74,0.25)', padding: '3px 9px', borderRadius: 5, flexShrink: 0, whiteSpace: 'nowrap' },
  summaryGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: '1.25rem' },
  summaryItem:  { background: 'var(--surface2)', padding: '0.75rem 0.9rem', display: 'flex', flexDirection: 'column', gap: 4 },
  summaryLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  summaryValue: { fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)' },
  section:      { marginBottom: '1.25rem' },
  subLabel:     { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.65rem' },
};
