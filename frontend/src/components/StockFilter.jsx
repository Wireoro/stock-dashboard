import { useState } from 'react';

// Curated list of major global stocks with metadata
// Grouped by country and industry for pill filtering
export const STOCK_UNIVERSE = [
  // 🇺🇸 United States — Technology
  { symbol: 'AAPL',  name: 'Apple',           country: 'US', flag: '🇺🇸', industry: 'Technology' },
  { symbol: 'MSFT',  name: 'Microsoft',        country: 'US', flag: '🇺🇸', industry: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet',         country: 'US', flag: '🇺🇸', industry: 'Technology' },
  { symbol: 'NVDA',  name: 'NVIDIA',           country: 'US', flag: '🇺🇸', industry: 'Semiconductors' },
  { symbol: 'META',  name: 'Meta',             country: 'US', flag: '🇺🇸', industry: 'Technology' },
  { symbol: 'AMZN',  name: 'Amazon',           country: 'US', flag: '🇺🇸', industry: 'E-Commerce' },
  { symbol: 'TSLA',  name: 'Tesla',            country: 'US', flag: '🇺🇸', industry: 'Automotive' },
  { symbol: 'AMD',   name: 'AMD',              country: 'US', flag: '🇺🇸', industry: 'Semiconductors' },
  { symbol: 'INTC',  name: 'Intel',            country: 'US', flag: '🇺🇸', industry: 'Semiconductors' },
  { symbol: 'ORCL',  name: 'Oracle',           country: 'US', flag: '🇺🇸', industry: 'Technology' },
  { symbol: 'CRM',   name: 'Salesforce',       country: 'US', flag: '🇺🇸', industry: 'Technology' },
  { symbol: 'NFLX',  name: 'Netflix',          country: 'US', flag: '🇺🇸', industry: 'Media' },
  // 🇺🇸 United States — Finance
  { symbol: 'JPM',   name: 'JPMorgan',         country: 'US', flag: '🇺🇸', industry: 'Finance' },
  { symbol: 'BAC',   name: 'Bank of America',  country: 'US', flag: '🇺🇸', industry: 'Finance' },
  { symbol: 'GS',    name: 'Goldman Sachs',    country: 'US', flag: '🇺🇸', industry: 'Finance' },
  { symbol: 'BRK.B', name: 'Berkshire',        country: 'US', flag: '🇺🇸', industry: 'Finance' },
  { symbol: 'V',     name: 'Visa',             country: 'US', flag: '🇺🇸', industry: 'Finance' },
  { symbol: 'MA',    name: 'Mastercard',       country: 'US', flag: '🇺🇸', industry: 'Finance' },
  // 🇺🇸 United States — Healthcare
  { symbol: 'JNJ',   name: 'Johnson & Johnson',country: 'US', flag: '🇺🇸', industry: 'Healthcare' },
  { symbol: 'UNH',   name: 'UnitedHealth',     country: 'US', flag: '🇺🇸', industry: 'Healthcare' },
  { symbol: 'PFE',   name: 'Pfizer',           country: 'US', flag: '🇺🇸', industry: 'Healthcare' },
  { symbol: 'LLY',   name: 'Eli Lilly',        country: 'US', flag: '🇺🇸', industry: 'Healthcare' },
  // 🇺🇸 United States — Energy
  { symbol: 'XOM',   name: 'ExxonMobil',       country: 'US', flag: '🇺🇸', industry: 'Energy' },
  { symbol: 'CVX',   name: 'Chevron',          country: 'US', flag: '🇺🇸', industry: 'Energy' },
  // 🇺🇸 United States — Consumer
  { symbol: 'WMT',   name: 'Walmart',          country: 'US', flag: '🇺🇸', industry: 'Retail' },
  { symbol: 'MCD',   name: "McDonald's",       country: 'US', flag: '🇺🇸', industry: 'Consumer' },
  { symbol: 'KO',    name: 'Coca-Cola',        country: 'US', flag: '🇺🇸', industry: 'Consumer' },
  { symbol: 'PG',    name: 'Procter & Gamble', country: 'US', flag: '🇺🇸', industry: 'Consumer' },
  // 🇬🇧 United Kingdom
  { symbol: 'SHEL',  name: 'Shell',            country: 'GB', flag: '🇬🇧', industry: 'Energy' },
  { symbol: 'AZN',   name: 'AstraZeneca',      country: 'GB', flag: '🇬🇧', industry: 'Healthcare' },
  { symbol: 'HSBC',  name: 'HSBC',             country: 'GB', flag: '🇬🇧', industry: 'Finance' },
  { symbol: 'BP',    name: 'BP',               country: 'GB', flag: '🇬🇧', industry: 'Energy' },
  // 🇩🇪 Germany
  { symbol: 'SAP',   name: 'SAP',              country: 'DE', flag: '🇩🇪', industry: 'Technology' },
  { symbol: 'SIEGY', name: 'Siemens',          country: 'DE', flag: '🇩🇪', industry: 'Industrial' },
  // 🇫🇷 France
  { symbol: 'LVMUY', name: 'LVMH',             country: 'FR', flag: '🇫🇷', industry: 'Luxury' },
  { symbol: 'TTE',   name: 'TotalEnergies',    country: 'FR', flag: '🇫🇷', industry: 'Energy' },
  // 🇨🇭 Switzerland
  { symbol: 'NESN',  name: 'Nestlé',           country: 'CH', flag: '🇨🇭', industry: 'Consumer' },
  { symbol: 'NOVN',  name: 'Novartis',         country: 'CH', flag: '🇨🇭', industry: 'Healthcare' },
  // 🇯🇵 Japan
  { symbol: 'TM',    name: 'Toyota',           country: 'JP', flag: '🇯🇵', industry: 'Automotive' },
  { symbol: 'SONY',  name: 'Sony',             country: 'JP', flag: '🇯🇵', industry: 'Technology' },
  { symbol: 'NTDOY', name: 'Nintendo',         country: 'JP', flag: '🇯🇵', industry: 'Technology' },
  // 🇰🇷 South Korea
  { symbol: 'SSNLF', name: 'Samsung',          country: 'KR', flag: '🇰🇷', industry: 'Semiconductors' },
  { symbol: 'HYMTF', name: 'Hyundai',          country: 'KR', flag: '🇰🇷', industry: 'Automotive' },
  // 🇨🇳 China
  { symbol: 'BABA',  name: 'Alibaba',          country: 'CN', flag: '🇨🇳', industry: 'E-Commerce' },
  { symbol: 'TCEHY', name: 'Tencent',          country: 'CN', flag: '🇨🇳', industry: 'Technology' },
  { symbol: 'BIDU',  name: 'Baidu',            country: 'CN', flag: '🇨🇳', industry: 'Technology' },
  // 🇮🇳 India
  { symbol: 'INFY',  name: 'Infosys',          country: 'IN', flag: '🇮🇳', industry: 'Technology' },
  { symbol: 'WIT',   name: 'Wipro',            country: 'IN', flag: '🇮🇳', industry: 'Technology' },
  // 🇨🇦 Canada
  { symbol: 'SHOP',  name: 'Shopify',          country: 'CA', flag: '🇨🇦', industry: 'Technology' },
  { symbol: 'RY',    name: 'Royal Bank',       country: 'CA', flag: '🇨🇦', industry: 'Finance' },
  // 🇦🇺 Australia
  { symbol: 'BHP',   name: 'BHP Group',        country: 'AU', flag: '🇦🇺', industry: 'Mining' },
  // 🇸🇦 Saudi Arabia
  { symbol: 'ARMCO', name: 'Saudi Aramco',     country: 'SA', flag: '🇸🇦', industry: 'Energy' },
  // 🇹🇼 Taiwan
  { symbol: 'TSM',   name: 'TSMC',             country: 'TW', flag: '🇹🇼', industry: 'Semiconductors' },
  // 🇳🇱 Netherlands
  { symbol: 'ASML',  name: 'ASML',             country: 'NL', flag: '🇳🇱', industry: 'Semiconductors' },
  { symbol: 'RDSA',  name: 'Shell (NL)',        country: 'NL', flag: '🇳🇱', industry: 'Energy' },
];

// Derive unique countries and industries
const COUNTRIES = [...new Map(
  STOCK_UNIVERSE.map(s => [s.country, { code: s.country, flag: s.flag }])
).values()];

const INDUSTRIES = [...new Set(STOCK_UNIVERSE.map(s => s.industry))].sort();

export default function StockFilter({ selected, onSelect }) {
  const [activeCountry,  setActiveCountry]  = useState(null);
  const [activeIndustry, setActiveIndustry] = useState(null);

  // Filtered results based on active pills
  const filtered = STOCK_UNIVERSE.filter(s => {
    if (activeCountry  && s.country   !== activeCountry)  return false;
    if (activeIndustry && s.industry  !== activeIndustry) return false;
    return true;
  });

  function toggleCountry(code) {
    setActiveCountry(prev => prev === code ? null : code);
  }

  function toggleIndustry(name) {
    setActiveIndustry(prev => prev === name ? null : name);
  }

  // Count how many stocks match current filter for each pill
  function countryCount(code) {
    return STOCK_UNIVERSE.filter(s =>
      s.country === code &&
      (!activeIndustry || s.industry === activeIndustry)
    ).length;
  }
  function industryCount(name) {
    return STOCK_UNIVERSE.filter(s =>
      s.industry === name &&
      (!activeCountry || s.country === activeCountry)
    ).length;
  }

  return (
    <div style={styles.wrap}>
      {/* Country pills */}
      <div style={styles.group}>
        <span style={styles.groupLabel}>INVENTOR COUNTRY</span>
        <div style={styles.pills}>
          {COUNTRIES.map(c => {
            const count   = countryCount(c.code);
            const isActive = activeCountry === c.code;
            if (count === 0 && activeCountry && activeCountry !== c.code) return null;
            return (
              <button
                key={c.code}
                style={{
                  ...styles.pill,
                  background:   isActive ? 'var(--accent)'    : 'var(--surface)',
                  color:        isActive ? '#fff'              : 'var(--text)',
                  borderColor:  isActive ? 'var(--accent)'    : 'var(--border2)',
                }}
                onClick={() => toggleCountry(c.code)}
              >
                {c.flag} {c.code}
                <span style={{ ...styles.pillCount, opacity: isActive ? 0.8 : 0.5 }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Industry pills */}
      <div style={styles.group}>
        <span style={styles.groupLabel}>TECHNOLOGY AREA</span>
        <div style={styles.pills}>
          {INDUSTRIES.map(ind => {
            const count   = industryCount(ind);
            const isActive = activeIndustry === ind;
            if (count === 0) return null;
            return (
              <button
                key={ind}
                style={{
                  ...styles.pill,
                  background:  isActive ? 'var(--accent)'  : 'var(--surface)',
                  color:       isActive ? '#fff'            : 'var(--text)',
                  borderColor: isActive ? 'var(--accent)'  : 'var(--border2)',
                }}
                onClick={() => toggleIndustry(ind)}
              >
                {ind}
                <span style={{ ...styles.pillCount, opacity: isActive ? 0.8 : 0.5 }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Matching stocks grid */}
      {filtered.length > 0 && (
        <div style={styles.stockGrid}>
          {filtered.map(s => (
            <button
              key={s.symbol}
              style={{
                ...styles.stockPill,
                background:  selected === s.symbol ? 'var(--accent)'         : 'var(--surface)',
                color:       selected === s.symbol ? '#fff'                  : 'var(--text)',
                borderColor: selected === s.symbol ? 'var(--accent)'         : 'var(--border2)',
                boxShadow:   selected === s.symbol ? '0 2px 8px rgba(196,101,74,0.2)' : 'none',
              }}
              onClick={() => onSelect(s.symbol)}
            >
              <span style={{
                ...styles.stockSymbol,
                color: selected === s.symbol ? '#fff' : 'var(--accent)',
              }}>
                {s.flag} {s.symbol}
              </span>
              <span style={{
                ...styles.stockName,
                color: selected === s.symbol ? 'rgba(255,255,255,0.8)' : 'var(--text2)',
              }}>
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  groupLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.62rem',
    letterSpacing: '0.1em',
    color: 'var(--muted)',
    textTransform: 'uppercase',
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 14px',
    borderRadius: 20,
    border: '1px solid',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.78rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
    userSelect: 'none',
  },
  pillCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
  },
  stockGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    borderTop: '1px solid var(--border)',
    paddingTop: '1rem',
  },
  stockPill: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '7px 12px',
    borderRadius: 8,
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left',
    minWidth: 90,
  },
  stockSymbol: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  stockName: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.65rem',
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 120,
  },
};
