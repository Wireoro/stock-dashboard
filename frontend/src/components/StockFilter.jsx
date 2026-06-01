import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Global stock universe — all symbols are US-listed (NYSE/NASDAQ/OTC)
// International companies trade as ADRs, so Finnhub free tier returns real data
// ─────────────────────────────────────────────────────────────────────────────
export const STOCK_UNIVERSE = [

  // ── 🇬🇧 United Kingdom ────────────────────────────────────────────────────
  { symbol: 'AZN',    name: 'AstraZeneca',         country: 'GB', flag: '🇬🇧', industry: 'Healthcare' },
  { symbol: 'SHEL',   name: 'Shell',               country: 'GB', flag: '🇬🇧', industry: 'Energy' },
  { symbol: 'BP',     name: 'BP',                  country: 'GB', flag: '🇬🇧', industry: 'Energy' },
  { symbol: 'HSBC',   name: 'HSBC',                country: 'GB', flag: '🇬🇧', industry: 'Finance' },
  { symbol: 'GSK',    name: 'GSK',                 country: 'GB', flag: '🇬🇧', industry: 'Healthcare' },
  { symbol: 'RELX',   name: 'RELX',                country: 'GB', flag: '🇬🇧', industry: 'Media' },
  { symbol: 'RIO',    name: 'Rio Tinto',           country: 'GB', flag: '🇬🇧', industry: 'Mining' },
  { symbol: 'LSEG',   name: 'London Stock Exchange',country:'GB', flag: '🇬🇧', industry: 'Finance' },
  { symbol: 'DGE',    name: 'Diageo',              country: 'GB', flag: '🇬🇧', industry: 'Consumer' },
  { symbol: 'BATS',   name: 'BAT',                 country: 'GB', flag: '🇬🇧', industry: 'Consumer' },

  // ── 🇩🇪 Germany ───────────────────────────────────────────────────────────
  { symbol: 'SAP',    name: 'SAP',                 country: 'DE', flag: '🇩🇪', industry: 'Technology' },
  { symbol: 'SIEGY',  name: 'Siemens',             country: 'DE', flag: '🇩🇪', industry: 'Industrial' },
  { symbol: 'ADDYY',  name: 'Adidas',              country: 'DE', flag: '🇩🇪', industry: 'Consumer' },
  { symbol: 'BMWYY',  name: 'BMW',                 country: 'DE', flag: '🇩🇪', industry: 'Automotive' },
  { symbol: 'VWAGY',  name: 'Volkswagen',          country: 'DE', flag: '🇩🇪', industry: 'Automotive' },
  { symbol: 'DAIMY',  name: 'Mercedes-Benz',       country: 'DE', flag: '🇩🇪', industry: 'Automotive' },
  { symbol: 'BAYZF',  name: 'Bayer',               country: 'DE', flag: '🇩🇪', industry: 'Healthcare' },
  { symbol: 'ALIZY',  name: 'Allianz',             country: 'DE', flag: '🇩🇪', industry: 'Finance' },
  { symbol: 'BASFY',  name: 'BASF',                country: 'DE', flag: '🇩🇪', industry: 'Chemicals' },
  { symbol: 'DBOEY',  name: 'Deutsche Börse',      country: 'DE', flag: '🇩🇪', industry: 'Finance' },

  // ── 🇫🇷 France ────────────────────────────────────────────────────────────
  { symbol: 'LVMUY',  name: 'LVMH',               country: 'FR', flag: '🇫🇷', industry: 'Luxury' },
  { symbol: 'TTE',    name: 'TotalEnergies',       country: 'FR', flag: '🇫🇷', industry: 'Energy' },
  { symbol: 'CRRFY',  name: 'Hermès',             country: 'FR', flag: '🇫🇷', industry: 'Luxury' },
  { symbol: 'SNYNF',  name: 'Sanofi',             country: 'FR', flag: '🇫🇷', industry: 'Healthcare' },
  { symbol: 'BNPQY',  name: 'BNP Paribas',        country: 'FR', flag: '🇫🇷', industry: 'Finance' },
  { symbol: 'AIVVY',  name: 'Air Liquide',         country: 'FR', flag: '🇫🇷', industry: 'Chemicals' },
  { symbol: 'AXAHY',  name: 'AXA',                country: 'FR', flag: '🇫🇷', industry: 'Finance' },
  { symbol: 'CGSGY',  name: 'Capgemini',          country: 'FR', flag: '🇫🇷', industry: 'Technology' },
  { symbol: 'PPRUY',  name: 'Kering (Gucci)',     country: 'FR', flag: '🇫🇷', industry: 'Luxury' },
  { symbol: 'RHHBY',  name: 'LVMH Wines',         country: 'FR', flag: '🇫🇷', industry: 'Consumer' },

  // ── 🇨🇭 Switzerland ───────────────────────────────────────────────────────
  { symbol: 'NSRGY',  name: 'Nestlé',             country: 'CH', flag: '🇨🇭', industry: 'Consumer' },
  { symbol: 'RHHBY',  name: 'Roche',              country: 'CH', flag: '🇨🇭', industry: 'Healthcare' },
  { symbol: 'NOVNF',  name: 'Novartis',           country: 'CH', flag: '🇨🇭', industry: 'Healthcare' },
  { symbol: 'ABBNF',  name: 'ABB',                country: 'CH', flag: '🇨🇭', industry: 'Industrial' },
  { symbol: 'ZURVY',  name: 'Zurich Insurance',   country: 'CH', flag: '🇨🇭', industry: 'Finance' },
  { symbol: 'CSGKF',  name: 'Credit Suisse',      country: 'CH', flag: '🇨🇭', industry: 'Finance' },
  { symbol: 'UBSFF',  name: 'UBS',                country: 'CH', flag: '🇨🇭', industry: 'Finance' },
  { symbol: 'GIVNF',  name: 'Givaudan',           country: 'CH', flag: '🇨🇭', industry: 'Chemicals' },

  // ── 🇳🇱 Netherlands ───────────────────────────────────────────────────────
  { symbol: 'ASML',   name: 'ASML',               country: 'NL', flag: '🇳🇱', industry: 'Semiconductors' },
  { symbol: 'HEIA',   name: 'Heineken',            country: 'NL', flag: '🇳🇱', industry: 'Consumer' },
  { symbol: 'PHPPY',  name: 'Philips',             country: 'NL', flag: '🇳🇱', industry: 'Healthcare' },
  { symbol: 'NXPIY',  name: 'NXP Semiconductors', country: 'NL', flag: '🇳🇱', industry: 'Semiconductors' },
  { symbol: 'INGA',   name: 'ING Group',           country: 'NL', flag: '🇳🇱', industry: 'Finance' },

  // ── 🇸🇪 Sweden ────────────────────────────────────────────────────────────
  { symbol: 'VOLVY',  name: 'Volvo',              country: 'SE', flag: '🇸🇪', industry: 'Automotive' },
  { symbol: 'ERIC',   name: 'Ericsson',           country: 'SE', flag: '🇸🇪', industry: 'Technology' },
  { symbol: 'ATLKY',  name: 'Atlas Copco',        country: 'SE', flag: '🇸🇪', industry: 'Industrial' },
  { symbol: 'HNNMY',  name: 'H&M',               country: 'SE', flag: '🇸🇪', industry: 'Retail' },
  { symbol: 'ESALY',  name: 'Essity',             country: 'SE', flag: '🇸🇪', industry: 'Consumer' },

  // ── 🇩🇰 Denmark ───────────────────────────────────────────────────────────
  { symbol: 'NOVO',   name: 'Novo Nordisk',       country: 'DK', flag: '🇩🇰', industry: 'Healthcare' },
  { symbol: 'MAERSK', name: 'Maersk',             country: 'DK', flag: '🇩🇰', industry: 'Logistics' },
  { symbol: 'ORSTED', name: 'Ørsted',             country: 'DK', flag: '🇩🇰', industry: 'Energy' },

  // ── 🇫🇮 Finland ───────────────────────────────────────────────────────────
  { symbol: 'NOKIA',  name: 'Nokia',              country: 'FI', flag: '🇫🇮', industry: 'Technology' },
  { symbol: 'NESTE',  name: 'Neste',              country: 'FI', flag: '🇫🇮', industry: 'Energy' },

  // ── 🇳🇴 Norway ────────────────────────────────────────────────────────────
  { symbol: 'EQNR',   name: 'Equinor',            country: 'NO', flag: '🇳🇴', industry: 'Energy' },
  { symbol: 'DNBHF',  name: 'DNB Bank',           country: 'NO', flag: '🇳🇴', industry: 'Finance' },

  // ── 🇪🇸 Spain ─────────────────────────────────────────────────────────────
  { symbol: 'BBVA',   name: 'BBVA',               country: 'ES', flag: '🇪🇸', industry: 'Finance' },
  { symbol: 'SAN',    name: 'Santander',          country: 'ES', flag: '🇪🇸', industry: 'Finance' },
  { symbol: 'IDEXY',  name: 'Inditex (Zara)',     country: 'ES', flag: '🇪🇸', industry: 'Retail' },
  { symbol: 'TLEFY',  name: 'Telefónica',         country: 'ES', flag: '🇪🇸', industry: 'Telecom' },

  // ── 🇮🇹 Italy ─────────────────────────────────────────────────────────────
  { symbol: 'ENEL',   name: 'Enel',               country: 'IT', flag: '🇮🇹', industry: 'Energy' },
  { symbol: 'FCAU',   name: 'Stellantis',         country: 'IT', flag: '🇮🇹', industry: 'Automotive' },
  { symbol: 'ENIOY',  name: 'ENI',                country: 'IT', flag: '🇮🇹', industry: 'Energy' },

  // ── 🇯🇵 Japan ─────────────────────────────────────────────────────────────
  { symbol: 'TM',     name: 'Toyota',             country: 'JP', flag: '🇯🇵', industry: 'Automotive' },
  { symbol: 'SONY',   name: 'Sony',               country: 'JP', flag: '🇯🇵', industry: 'Technology' },
  { symbol: 'NTDOY',  name: 'Nintendo',           country: 'JP', flag: '🇯🇵', industry: 'Technology' },
  { symbol: 'HMC',    name: 'Honda',              country: 'JP', flag: '🇯🇵', industry: 'Automotive' },
  { symbol: 'MUFG',   name: 'Mitsubishi UFJ',     country: 'JP', flag: '🇯🇵', industry: 'Finance' },
  { symbol: 'SMFG',   name: 'Sumitomo Mitsui',    country: 'JP', flag: '🇯🇵', industry: 'Finance' },
  { symbol: 'NTT',    name: 'NTT',                country: 'JP', flag: '🇯🇵', industry: 'Telecom' },
  { symbol: 'SBT',    name: 'SoftBank',           country: 'JP', flag: '🇯🇵', industry: 'Technology' },
  { symbol: 'FANUY',  name: 'Fanuc',              country: 'JP', flag: '🇯🇵', industry: 'Industrial' },
  { symbol: 'KYCCF',  name: 'Kyocera',            country: 'JP', flag: '🇯🇵', industry: 'Technology' },
  { symbol: 'TOELY',  name: 'Tokyo Electron',     country: 'JP', flag: '🇯🇵', industry: 'Semiconductors' },
  { symbol: 'DSNKY',  name: 'Denso',              country: 'JP', flag: '🇯🇵', industry: 'Automotive' },

  // ── 🇰🇷 South Korea ───────────────────────────────────────────────────────
  { symbol: 'SSNLF',  name: 'Samsung',            country: 'KR', flag: '🇰🇷', industry: 'Semiconductors' },
  { symbol: 'HYMTF',  name: 'Hyundai',            country: 'KR', flag: '🇰🇷', industry: 'Automotive' },
  { symbol: 'LGEIF',  name: 'LG Electronics',     country: 'KR', flag: '🇰🇷', industry: 'Technology' },
  { symbol: 'SKHHY',  name: 'SK Hynix',           country: 'KR', flag: '🇰🇷', industry: 'Semiconductors' },
  { symbol: 'KBFPY',  name: 'KB Financial',       country: 'KR', flag: '🇰🇷', industry: 'Finance' },

  // ── 🇨🇳 China ─────────────────────────────────────────────────────────────
  { symbol: 'BABA',   name: 'Alibaba',            country: 'CN', flag: '🇨🇳', industry: 'E-Commerce' },
  { symbol: 'TCEHY',  name: 'Tencent',            country: 'CN', flag: '🇨🇳', industry: 'Technology' },
  { symbol: 'JD',     name: 'JD.com',             country: 'CN', flag: '🇨🇳', industry: 'E-Commerce' },
  { symbol: 'PDD',    name: 'PDD Holdings',       country: 'CN', flag: '🇨🇳', industry: 'E-Commerce' },
  { symbol: 'BIDU',   name: 'Baidu',              country: 'CN', flag: '🇨🇳', industry: 'Technology' },
  { symbol: 'NIO',    name: 'NIO',                country: 'CN', flag: '🇨🇳', industry: 'Automotive' },
  { symbol: 'XPEV',   name: 'Xpeng',              country: 'CN', flag: '🇨🇳', industry: 'Automotive' },
  { symbol: 'NTES',   name: 'NetEase',            country: 'CN', flag: '🇨🇳', industry: 'Technology' },
  { symbol: 'BEKE',   name: 'KE Holdings',        country: 'CN', flag: '🇨🇳', industry: 'Real Estate' },
  { symbol: 'LI',     name: 'Li Auto',            country: 'CN', flag: '🇨🇳', industry: 'Automotive' },

  // ── 🇹🇼 Taiwan ────────────────────────────────────────────────────────────
  { symbol: 'TSM',    name: 'TSMC',               country: 'TW', flag: '🇹🇼', industry: 'Semiconductors' },
  { symbol: 'UMC',    name: 'United Micro',       country: 'TW', flag: '🇹🇼', industry: 'Semiconductors' },
  { symbol: 'ASX',    name: 'ASE Technology',     country: 'TW', flag: '🇹🇼', industry: 'Semiconductors' },

  // ── 🇮🇳 India ─────────────────────────────────────────────────────────────
  { symbol: 'INFY',   name: 'Infosys',            country: 'IN', flag: '🇮🇳', industry: 'Technology' },
  { symbol: 'WIT',    name: 'Wipro',              country: 'IN', flag: '🇮🇳', industry: 'Technology' },
  { symbol: 'HDB',    name: 'HDFC Bank',          country: 'IN', flag: '🇮🇳', industry: 'Finance' },
  { symbol: 'IBN',    name: 'ICICI Bank',         country: 'IN', flag: '🇮🇳', industry: 'Finance' },
  { symbol: 'VEDL',   name: 'Vedanta',            country: 'IN', flag: '🇮🇳', industry: 'Mining' },
  { symbol: 'TTM',    name: 'Tata Motors',        country: 'IN', flag: '🇮🇳', industry: 'Automotive' },
  { symbol: 'RDY',    name: 'Dr Reddys',          country: 'IN', flag: '🇮🇳', industry: 'Healthcare' },

  // ── 🇭🇰 Hong Kong ─────────────────────────────────────────────────────────
  { symbol: 'HKHHY',  name: 'CK Hutchison',       country: 'HK', flag: '🇭🇰', industry: 'Industrial' },
  { symbol: 'CPCAY',  name: 'Cathay Pacific',     country: 'HK', flag: '🇭🇰', industry: 'Transport' },

  // ── 🇸🇬 Singapore ─────────────────────────────────────────────────────────
  { symbol: 'DBSDY',  name: 'DBS Group',          country: 'SG', flag: '🇸🇬', industry: 'Finance' },
  { symbol: 'GMGNF',  name: 'Grab Holdings',      country: 'SG', flag: '🇸🇬', industry: 'Technology' },
  { symbol: 'SE',     name: 'Sea Limited',        country: 'SG', flag: '🇸🇬', industry: 'Technology' },

  // ── 🇦🇺 Australia ─────────────────────────────────────────────────────────
  { symbol: 'BHP',    name: 'BHP',                country: 'AU', flag: '🇦🇺', industry: 'Mining' },
  { symbol: 'RIO',    name: 'Rio Tinto',          country: 'AU', flag: '🇦🇺', industry: 'Mining' },
  { symbol: 'ANZBY',  name: 'ANZ Bank',           country: 'AU', flag: '🇦🇺', industry: 'Finance' },
  { symbol: 'NABZY',  name: 'NAB',                country: 'AU', flag: '🇦🇺', industry: 'Finance' },
  { symbol: 'WBCAY',  name: 'Westpac',            country: 'AU', flag: '🇦🇺', industry: 'Finance' },
  { symbol: 'CSLLY',  name: 'CSL',                country: 'AU', flag: '🇦🇺', industry: 'Healthcare' },
  { symbol: 'WFAFY',  name: 'Wesfarmers',         country: 'AU', flag: '🇦🇺', industry: 'Retail' },

  // ── 🇿🇦 South Africa ──────────────────────────────────────────────────────
  { symbol: 'NASPERS', name: 'Naspers',           country: 'ZA', flag: '🇿🇦', industry: 'Technology' },
  { symbol: 'AGLXY',  name: 'Anglo American',     country: 'ZA', flag: '🇿🇦', industry: 'Mining' },
  { symbol: 'GFI',    name: 'Gold Fields',        country: 'ZA', flag: '🇿🇦', industry: 'Mining' },
  { symbol: 'HMY',    name: 'Harmony Gold',       country: 'ZA', flag: '🇿🇦', industry: 'Mining' },
  { symbol: 'SSW',    name: 'Sibanye Stillwater',country: 'ZA', flag: '🇿🇦', industry: 'Mining' },

  // ── 🇧🇷 Brazil ────────────────────────────────────────────────────────────
  { symbol: 'VALE',   name: 'Vale',               country: 'BR', flag: '🇧🇷', industry: 'Mining' },
  { symbol: 'PBR',    name: 'Petrobras',          country: 'BR', flag: '🇧🇷', industry: 'Energy' },
  { symbol: 'ITUB',   name: 'Itaú Unibanco',     country: 'BR', flag: '🇧🇷', industry: 'Finance' },
  { symbol: 'BBD',    name: 'Bradesco',           country: 'BR', flag: '🇧🇷', industry: 'Finance' },
  { symbol: 'ABEV',   name: 'Ambev',              country: 'BR', flag: '🇧🇷', industry: 'Consumer' },
  { symbol: 'BRHHY',  name: 'WEG',                country: 'BR', flag: '🇧🇷', industry: 'Industrial' },

  // ── 🇨🇦 Canada ────────────────────────────────────────────────────────────
  { symbol: 'SHOP',   name: 'Shopify',            country: 'CA', flag: '🇨🇦', industry: 'Technology' },
  { symbol: 'RY',     name: 'Royal Bank',         country: 'CA', flag: '🇨🇦', industry: 'Finance' },
  { symbol: 'TD',     name: 'TD Bank',            country: 'CA', flag: '🇨🇦', industry: 'Finance' },
  { symbol: 'CNR',    name: 'Canadian National',  country: 'CA', flag: '🇨🇦', industry: 'Logistics' },
  { symbol: 'ENB',    name: 'Enbridge',           country: 'CA', flag: '🇨🇦', industry: 'Energy' },
  { symbol: 'BMO',    name: 'Bank of Montreal',   country: 'CA', flag: '🇨🇦', industry: 'Finance' },
  { symbol: 'SU',     name: 'Suncor Energy',      country: 'CA', flag: '🇨🇦', industry: 'Energy' },
  { symbol: 'CCO',    name: 'Cameco',             country: 'CA', flag: '🇨🇦', industry: 'Energy' },

  // ── 🇲🇽 Mexico ────────────────────────────────────────────────────────────
  { symbol: 'AMXL',   name: 'América Móvil',     country: 'MX', flag: '🇲🇽', industry: 'Telecom' },
  { symbol: 'WALMEX', name: 'Walmart México',    country: 'MX', flag: '🇲🇽', industry: 'Retail' },
  { symbol: 'FEMSAUBD',name:'FEMSA',             country: 'MX', flag: '🇲🇽', industry: 'Consumer' },

  // ── 🇷🇺 Russia ────────────────────────────────────────────────────────────
  { symbol: 'SBER',   name: 'Sberbank',           country: 'RU', flag: '🇷🇺', industry: 'Finance' },
  { symbol: 'LUKOY',  name: 'Lukoil',             country: 'RU', flag: '🇷🇺', industry: 'Energy' },
  { symbol: 'GZPFY',  name: 'Gazprom',            country: 'RU', flag: '🇷🇺', industry: 'Energy' },

  // ── 🇸🇦 Saudi Arabia ──────────────────────────────────────────────────────
  { symbol: 'ARAMCO', name: 'Saudi Aramco',       country: 'SA', flag: '🇸🇦', industry: 'Energy' },
  { symbol: 'SABIC',  name: 'SABIC',              country: 'SA', flag: '🇸🇦', industry: 'Chemicals' },

  // ── 🇮🇱 Israel ────────────────────────────────────────────────────────────
  { symbol: 'NICE',   name: 'NICE Systems',       country: 'IL', flag: '🇮🇱', industry: 'Technology' },
  { symbol: 'CYBR',   name: 'CyberArk',           country: 'IL', flag: '🇮🇱', industry: 'Technology' },
  { symbol: 'CHKP',   name: 'Check Point',        country: 'IL', flag: '🇮🇱', industry: 'Technology' },
  { symbol: 'TEVA',   name: 'Teva Pharma',        country: 'IL', flag: '🇮🇱', industry: 'Healthcare' },
  { symbol: 'MNDY',   name: 'Monday.com',         country: 'IL', flag: '🇮🇱', industry: 'Technology' },
  { symbol: 'GLBE',   name: 'Global-E Online',    country: 'IL', flag: '🇮🇱', industry: 'Technology' },

  // ── 🇮🇩 Indonesia ─────────────────────────────────────────────────────────
  { symbol: 'TLKMY',  name: 'Telkom Indonesia',   country: 'ID', flag: '🇮🇩', industry: 'Telecom' },

  // ── 🇲🇾 Malaysia ──────────────────────────────────────────────────────────
  { symbol: 'PETGAS', name: 'Petronas Gas',       country: 'MY', flag: '🇲🇾', industry: 'Energy' },

  // ── 🇦🇷 Argentina ─────────────────────────────────────────────────────────
  { symbol: 'MER',    name: 'MercadoLibre',       country: 'AR', flag: '🇦🇷', industry: 'E-Commerce' },
  { symbol: 'MELI',   name: 'MercadoLibre',       country: 'AR', flag: '🇦🇷', industry: 'E-Commerce' },
  { symbol: 'GLOB',   name: 'Globant',            country: 'AR', flag: '🇦🇷', industry: 'Technology' },

  // ── 🇵🇹 Portugal ──────────────────────────────────────────────────────────
  { symbol: 'EDP',    name: 'EDP',                country: 'PT', flag: '🇵🇹', industry: 'Energy' },

  // ── 🇬🇷 Greece ────────────────────────────────────────────────────────────
  { symbol: 'DKNG',   name: 'DraftKings',         country: 'GR', flag: '🇬🇷', industry: 'Technology' },
];

// Deduplicate by symbol
const seen = new Set();
const UNIVERSE = STOCK_UNIVERSE.filter(s => {
  if (seen.has(s.symbol)) return false;
  seen.add(s.symbol);
  return true;
});

// Derive unique countries (sorted by count desc)
const countryCounts = {};
UNIVERSE.forEach(s => { countryCounts[s.country] = (countryCounts[s.country] || 0) + 1; });
export const COUNTRIES = [...new Map(
  UNIVERSE.map(s => [s.country, { code: s.country, flag: s.flag }])
).values()].sort((a, b) => (countryCounts[b.code] || 0) - (countryCounts[a.code] || 0));

export const INDUSTRIES = [...new Set(UNIVERSE.map(s => s.industry))].sort();

export default function StockFilter({ selected, onSelect }) {
  const [activeCountry,  setActiveCountry]  = useState(null);
  const [activeIndustry, setActiveIndustry] = useState(null);

  const filtered = UNIVERSE.filter(s => {
    if (activeCountry  && s.country  !== activeCountry)  return false;
    if (activeIndustry && s.industry !== activeIndustry) return false;
    return true;
  });

  function countryCount(code) {
    return UNIVERSE.filter(s =>
      s.country === code && (!activeIndustry || s.industry === activeIndustry)
    ).length;
  }
  function industryCount(name) {
    return UNIVERSE.filter(s =>
      s.industry === name && (!activeCountry || s.country === activeCountry)
    ).length;
  }

  return (
    <div style={styles.wrap}>

      {/* Country pills */}
      <div style={styles.group}>
        <span style={styles.groupLabel}>Country</span>
        <div style={styles.pills}>
          {COUNTRIES.map(c => {
            const count = countryCount(c.code);
            if (count === 0) return null;
            const isActive = activeCountry === c.code;
            return (
              <button key={c.code} style={{
                ...styles.pill,
                background:  isActive ? 'var(--accent)' : 'var(--surface)',
                color:       isActive ? '#fff'           : 'var(--text)',
                borderColor: isActive ? 'var(--accent)'  : 'var(--border2)',
              }} onClick={() => setActiveCountry(p => p === c.code ? null : c.code)}>
                {c.flag} {c.code}
                <span style={{ ...styles.pillCount, opacity: isActive ? 0.8 : 0.5 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Industry pills */}
      <div style={styles.group}>
        <span style={styles.groupLabel}>Industry</span>
        <div style={styles.pills}>
          {INDUSTRIES.map(ind => {
            const count = industryCount(ind);
            if (count === 0) return null;
            const isActive = activeIndustry === ind;
            return (
              <button key={ind} style={{
                ...styles.pill,
                background:  isActive ? 'var(--accent)' : 'var(--surface)',
                color:       isActive ? '#fff'           : 'var(--text)',
                borderColor: isActive ? 'var(--accent)'  : 'var(--border2)',
              }} onClick={() => setActiveIndustry(p => p === ind ? null : ind)}>
                {ind}
                <span style={{ ...styles.pillCount, opacity: isActive ? 0.8 : 0.5 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Matching stock cards */}
      {filtered.length > 0 && (
        <div style={styles.stockGrid}>
          {filtered.map(s => {
            const isSelected = selected === s.symbol;
            return (
              <button key={s.symbol} style={{
                ...styles.stockCard,
                background:  isSelected ? 'var(--accent)'  : 'var(--surface)',
                borderColor: isSelected ? 'var(--accent)'  : 'var(--border2)',
                boxShadow:   isSelected ? '0 2px 8px rgba(196,101,74,0.2)' : 'none',
              }} onClick={() => onSelect(s.symbol)}>
                <span style={{
                  ...styles.cardFlag,
                  color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--muted)',
                }}>
                  {s.flag}
                </span>
                <span style={{
                  ...styles.cardSymbol,
                  color: isSelected ? '#fff' : 'var(--accent)',
                }}>
                  {s.symbol}
                </span>
                <span style={{
                  ...styles.cardName,
                  color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text2)',
                }}>
                  {s.name}
                </span>
                <span style={{
                  ...styles.cardIndustry,
                  color: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--muted)',
                }}>
                  {s.industry}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--muted)', padding: '0.5rem 0' }}>
          No stocks match the selected filters
        </p>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
    display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  group:      { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  groupLabel: {
    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
    letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase',
  },
  pills: { display: 'flex', flexWrap: 'wrap', gap: '5px' },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '4px 12px', borderRadius: 20, border: '1px solid',
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
    cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
  },
  pillCount: { fontFamily: 'var(--font-mono)', fontSize: '0.62rem' },
  stockGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '6px',
    borderTop: '1px solid var(--border)',
    paddingTop: '1rem',
  },
  stockCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    padding: '8px 10px', borderRadius: 8, border: '1px solid',
    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
  },
  cardFlag:     { fontSize: '0.85rem', lineHeight: 1 },
  cardSymbol:   { fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, marginTop: 3 },
  cardName:     { fontFamily: 'var(--font-sans)', fontSize: '0.65rem', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },
  cardIndustry: { fontFamily: 'var(--font-mono)', fontSize: '0.58rem', marginTop: 2 },
};
