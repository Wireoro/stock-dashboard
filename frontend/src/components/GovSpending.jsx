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
  const colors = ['#00d4a0','#6366f1','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#10b981','#f97316'];
  return colors[i % colors.length];
}

function stripSuffix(name) {
  return name
    .replace(/\b(inc|corp|corporation|ltd|llc|co|company|technologies|systems|group|holdings?)\b\.?/gi, '')
    .replace(/,\s*$/, '')
    .trim();
}

export default function GovSpending({ symbol, companyName }) {
  const [state, setState] = useState('idle'); // idle | loading | done | empty | error
  const [data,  setData]  = useState(null);
  const [msg,   setMsg]   = useState('');
  const [dots,  setDots]  = useState('');

  useEffect(() => {
    if (!dots) return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    // Wait until we have a real company name
    if (!companyName || companyName === 'Apple Inc' && symbol !== 'AAPL') return;
    if (!companyName) return;

    const searchTerm  = stripSuffix(companyName);
    const currentYear = new Date().getFullYear();

    setState('loading');
    setMsg(`Searching contracts for "${searchTerm}"${dots}`);
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
        fields:  ['Award Amount','Awarding Agency','Description','Action Date','Recipient Name'],
        sort:    'Award Amount',
        order:   'desc',
        limit:   15,
        page:    1,
      }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        const results = d.results || [];
        const total   = d.page_metadata?.total || 0;
        const amount  = results.reduce((s, r) => s + (r['Award Amount'] || 0), 0);

        if (amount === 0 && total === 0) {
          setState('empty');
          return;
        }

        const agencyMap = {};
        results.forEach(r => {
          const a = r['Awarding Agency'] || 'Unknown';
          agencyMap[a] = (agencyMap[a] || 0) + (r['Award Amount'] || 0);
        });

        setData({
          totalAmount:    amount,
          totalContracts: total,
          searchTerm,
          agencies: Object.entries(agencyMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount),
          recentAwards: results.slice(0, 6).map(r => ({
            description: r['Description']     || 'Contract award',
            agency:      r['Awarding Agency'] || '—',
            amount:      r['Award Amount']    || 0,
            date:        r['Action Date']     || '—',
          })),
          year: currentYear,
        });
        setState('done');
      })
      .catch(e => {
        if (e.name === 'AbortError') return;
        console.error('GovSpending error:', e);
        setState('error');
        setMsg(e.message);
      });

    return () => controller.abort();
  }, [companyName]);

  // Always show the card so you can see what's happening
  if (state === 'idle') return null;

  if (state === 'loading') {
    return (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={styles.sectionLabel}>USA GOVERNMENT SPENDING</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)' }}>
            Searching federal contracts{dots}
            <span style={{ fontSize: '0.63rem', opacity: 0.5 }}> (may take 15–25s)</span>
          </p>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--muted)', marginTop: 8 }}>
          Querying USASpending.gov for "{stripSuffix(companyName)}"…
        </p>
      </Card>
    );
  }

  if (state === 'error') {
    return (
      <Card>
        <p style={styles.sectionLabel}>USA GOVERNMENT SPENDING</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#f05252', marginTop: 8 }}>
          Error: {msg} — try refreshing
        </p>
      </Card>
    );
  }

  if (state === 'empty' || !data) {
    return (
      <Card>
        <p style={styles.sectionLabel}>USA GOVERNMENT SPENDING</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)', marginTop: 8 }}>
          No federal contracts found for "{stripSuffix(companyName)}" in the current fiscal year.
          Try MSFT, LMT, RTX, or AMZN for companies with large government contracts.
        </p>
      </Card>
    );
  }

  const { totalAmount, totalContracts, searchTerm, agencies, recentAwards, year } = data;
  const maxAmt = Math.max(...(agencies?.map(a => a.amount) || [1]));

  return (
    <Card>
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>USA GOVERNMENT SPENDING</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: 2 }}>
            FY{year} · searched: "{searchTerm}"
          </p>
        </div>
        <a
          href={`https://www.usaspending.gov/search/?query=${encodeURIComponent(companyName)}`}
          target="_blank" rel="noopener noreferrer"
          style={styles.sourceLink}
        >
          ↗ USASpending.gov
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

      {/* Agencies */}
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

      {/* Recent awards */}
      {recentAwards?.length > 0 && (
        <div style={styles.section}>
          <p style={styles.subLabel}>RECENT AWARDS</p>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {recentAwards.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.9rem', borderBottom: '1px solid var(--border)', gap: '1rem', background: 'var(--surface2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>{a.agency}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)' }}>{fmtDollars(a.amount)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>{a.date}</span>
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
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem' }}>
      {children}
    </div>
  );
}

const styles = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--muted)' },
  sourceLink:   { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)', textDecoration: 'none', border: '1px solid rgba(0,212,160,0.25)', padding: '3px 9px', borderRadius: 5, flexShrink: 0 },
  summaryGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: '1.25rem' },
  summaryItem:  { background: 'var(--surface2)', padding: '0.75rem 0.9rem', display: 'flex', flexDirection: 'column', gap: 4 },
  summaryLabel: { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  summaryValue: { fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)' },
  section:      { marginBottom: '1.25rem' },
  subLabel:     { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.65rem' },
};
