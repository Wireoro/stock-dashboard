import { useEffect, useState } from 'react';

// Called DIRECTLY from the browser — no backend needed, no API key needed
const USASPENDING = 'https://api.usaspending.gov/api/v2';

function fmtDollars(n) {
  if (!n) return '$0';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(0)}`;
}

function agencyColor(i) {
  const colors = ['#00d4a0', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f97316'];
  return colors[i % colors.length];
}

function stripSuffix(name) {
  return name
    .replace(/\b(inc|corp|corporation|ltd|llc|co|company|technologies|systems|group|holdings?)\b\.?/gi, '')
    .replace(/,\s*$/, '')
    .trim();
}

export default function GovSpending({ symbol, companyName }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [dots, setDots]       = useState('');

  // Animated dots
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    if (!companyName) return;
    setLoading(true);
    setError(null);
    setData(null);

    const searchTerm  = stripSuffix(companyName);
    const currentYear = new Date().getFullYear();

    async function fetchYear(year) {
      try {
        const r = await fetch(`${USASPENDING}/search/spending_by_award/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters: {
              keywords:         [searchTerm],
              award_type_codes: ['A', 'B', 'C', 'D'],
              time_period: [{
                start_date: `${year - 1}-10-01`,
                end_date:   `${year}-09-30`,
              }],
            },
            fields:  ['Award Amount', 'Awarding Agency', 'Description', 'Action Date', 'Recipient Name'],
            sort:    'Award Amount',
            order:   'desc',
            limit:   15,
            page:    1,
          }),
          signal: AbortSignal.timeout(25000),
        });
        const d = await r.json();
        return { year, results: d.results || [], total: d.page_metadata?.total || 0 };
      } catch {
        return { year, results: [], total: 0 };
      }
    }

    // Fetch current year first for fast first paint, then fetch history
    fetchYear(currentYear).then(thisYear => {
      const totalAmount = thisYear.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0);

      if (totalAmount === 0 && thisYear.total === 0) {
        setData(null);
        setLoading(false);
        return;
      }

      // Build agency map
      const agencyMap = {};
      thisYear.results.forEach(r => {
        const a = r['Awarding Agency'] || 'Unknown Agency';
        agencyMap[a] = (agencyMap[a] || 0) + (r['Award Amount'] || 0);
      });

      const partial = {
        totalAmount,
        totalContracts: thisYear.total,
        searchTerm,
        agencies: Object.entries(agencyMap)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount),
        recentAwards: thisYear.results.slice(0, 6).map(r => ({
          description: r['Description']     || 'Contract award',
          agency:      r['Awarding Agency'] || '—',
          amount:      r['Award Amount']    || 0,
          date:        r['Action Date']     || '—',
        })),
        yearOverYear: [{ year: currentYear, amount: totalAmount }],
        loadingHistory: true,
      };

      setData(partial);
      setLoading(false);

      // Fetch historical years in background
      Promise.all([
        fetchYear(currentYear - 1),
        fetchYear(currentYear - 2),
        fetchYear(currentYear - 3),
      ]).then(([y1, y2, y3]) => {
        setData(prev => prev ? {
          ...prev,
          loadingHistory: false,
          yearOverYear: [
            { year: currentYear,     amount: totalAmount },
            { year: currentYear - 1, amount: y1.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0) },
            { year: currentYear - 2, amount: y2.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0) },
            { year: currentYear - 3, amount: y3.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0) },
          ],
        } : prev);
      });
    });

  }, [companyName]);

  if (loading) {
    return (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={styles.sectionLabel}>USA GOVERNMENT SPENDING</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)' }}>
            Searching federal contracts{dots}
            <span style={{ fontSize: '0.63rem', opacity: 0.6 }}> (may take 15–25s)</span>
          </p>
        </div>
      </Card>
    );
  }

  if (!data || data.totalContracts === 0) return null;

  const { totalAmount, totalContracts, searchTerm, agencies, recentAwards, yearOverYear, loadingHistory } = data;
  const maxAgencyAmt = Math.max(...(agencies?.map(a => a.amount) || [1]));

  return (
    <Card>
      <div style={styles.header}>
        <div>
          <p style={styles.sectionLabel}>USA GOVERNMENT SPENDING</p>
          {searchTerm && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.6, marginTop: 2 }}>
              searched: "{searchTerm}"
            </p>
          )}
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

      {/* Year over year */}
      {yearOverYear?.filter(y => y.amount > 0).length > 0 && (
        <div style={styles.section}>
          <p style={styles.subLabel}>
            ANNUAL CONTRACT VALUE
            {loadingHistory && <span style={{ opacity: 0.5, marginLeft: 8 }}>loading history…</span>}
          </p>
          {yearOverYear.map((y, i) => {
            const maxY = Math.max(...yearOverYear.map(x => x.amount), 1);
            const pct  = (y.amount / maxY) * 100;
            return (
              <div key={i} style={styles.yoyRow}>
                <span style={styles.yoyYear}>FY{y.year}</span>
                <div style={styles.yoyTrack}>
                  <div style={{ ...styles.yoyFill, width: `${pct}%`, background: i === 0 ? 'var(--accent)' : 'var(--border2)' }} />
                </div>
                <span style={{ ...styles.yoyAmt, color: i === 0 ? 'var(--accent)' : 'var(--text2)' }}>
                  {fmtDollars(y.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Agencies */}
      {agencies?.length > 0 && (
        <div style={styles.section}>
          <p style={styles.subLabel}>TOP CONTRACTING AGENCIES</p>
          {agencies.slice(0, 6).map((a, i) => {
            const pct   = (a.amount / maxAgencyAmt) * 100;
            const color = agencyColor(i);
            return (
              <div key={i} style={{ marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color, fontWeight: 500, flex: 1, paddingRight: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text2)', flexShrink: 0 }}>{fmtDollars(a.amount)}</span>
                </div>
                <div style={{ height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: color, opacity: 0.75, transition: 'width 0.5s ease' }} />
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
  yoyRow:       { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' },
  yoyYear:      { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text2)', width: 44, flexShrink: 0 },
  yoyTrack:     { flex: 1, height: 6, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden' },
  yoyFill:      { height: '100%', borderRadius: 3, transition: 'width 0.5s ease' },
  yoyAmt:       { fontFamily: 'var(--font-mono)', fontSize: '0.75rem', width: 70, textAlign: 'right', flexShrink: 0 },
};
