import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Top companies by market cap per country — only US-listed tickers included
// Source: companiesmarketcap.com + stockanalysis.com (June 2026)
// Non-US stocks without a US ADR are omitted (they won't return data on free tier)
// ─────────────────────────────────────────────────────────────────────────────

const STOCK_UNIVERSE = [

  // ══════════════════════════════════════════════════════════════════════════
  // 🇺🇸 USA — S&P 100 + Nasdaq 100 top companies by market cap
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'NVDA',  name:'NVIDIA',              country:'US', flag:'🇺🇸', industry:'Semiconductors' },
  { symbol:'GOOGL', name:'Alphabet',            country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'AAPL',  name:'Apple',               country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'MSFT',  name:'Microsoft',           country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'AMZN',  name:'Amazon',              country:'US', flag:'🇺🇸', industry:'E-Commerce' },
  { symbol:'AVGO',  name:'Broadcom',            country:'US', flag:'🇺🇸', industry:'Semiconductors' },
  { symbol:'TSLA',  name:'Tesla',               country:'US', flag:'🇺🇸', industry:'Automotive' },
  { symbol:'META',  name:'Meta',                country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'WMT',   name:'Walmart',             country:'US', flag:'🇺🇸', industry:'Retail' },
  { symbol:'BRK.B', name:'Berkshire Hathaway',  country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'LLY',   name:'Eli Lilly',           country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'JPM',   name:'JPMorgan Chase',      country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'AMD',   name:'AMD',                 country:'US', flag:'🇺🇸', industry:'Semiconductors' },
  { symbol:'XOM',   name:'ExxonMobil',          country:'US', flag:'🇺🇸', industry:'Energy' },
  { symbol:'V',     name:'Visa',                country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'ORCL',  name:'Oracle',              country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'JNJ',   name:'Johnson & Johnson',   country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'CSCO',  name:'Cisco',               country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'COST',  name:'Costco',              country:'US', flag:'🇺🇸', industry:'Retail' },
  { symbol:'MA',    name:'Mastercard',          country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'CAT',   name:'Caterpillar',         country:'US', flag:'🇺🇸', industry:'Industrial' },
  { symbol:'ABBV',  name:'AbbVie',              country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'NFLX',  name:'Netflix',             country:'US', flag:'🇺🇸', industry:'Media' },
  { symbol:'CVX',   name:'Chevron',             country:'US', flag:'🇺🇸', industry:'Energy' },
  { symbol:'UNH',   name:'UnitedHealth',        country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'BAC',   name:'Bank of America',     country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'KO',    name:'Coca-Cola',           country:'US', flag:'🇺🇸', industry:'Consumer' },
  { symbol:'PG',    name:'Procter & Gamble',    country:'US', flag:'🇺🇸', industry:'Consumer' },
  { symbol:'PLTR',  name:'Palantir',            country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'GE',    name:'GE Aerospace',        country:'US', flag:'🇺🇸', industry:'Industrial' },
  { symbol:'MU',    name:'Micron Technology',   country:'US', flag:'🇺🇸', industry:'Semiconductors' },
  { symbol:'WFC',   name:'Wells Fargo',         country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'CRM',   name:'Salesforce',          country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'PEP',   name:'PepsiCo',             country:'US', flag:'🇺🇸', industry:'Consumer' },
  { symbol:'IBM',   name:'IBM',                 country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'AXP',   name:'American Express',    country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'PM',    name:'Philip Morris',       country:'US', flag:'🇺🇸', industry:'Consumer' },
  { symbol:'MS',    name:'Morgan Stanley',      country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'GS',    name:'Goldman Sachs',       country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'TMO',   name:'Thermo Fisher',       country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'MCD',   name:"McDonald's",          country:'US', flag:'🇺🇸', industry:'Consumer' },
  { symbol:'INTU',  name:'Intuit',              country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'RTX',   name:'RTX Corp',            country:'US', flag:'🇺🇸', industry:'Defense' },
  { symbol:'AMGN',  name:'Amgen',               country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'DHR',   name:'Danaher',             country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'CMCSA', name:'Comcast',             country:'US', flag:'🇺🇸', industry:'Media' },
  { symbol:'TXN',   name:'Texas Instruments',   country:'US', flag:'🇺🇸', industry:'Semiconductors' },
  { symbol:'HON',   name:'Honeywell',           country:'US', flag:'🇺🇸', industry:'Industrial' },
  { symbol:'VZ',    name:'Verizon',             country:'US', flag:'🇺🇸', industry:'Telecom' },
  { symbol:'ISRG',  name:'Intuitive Surgical',  country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'NOW',   name:'ServiceNow',          country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'NEE',   name:'NextEra Energy',      country:'US', flag:'🇺🇸', industry:'Energy' },
  { symbol:'LOW',   name:"Lowe's",              country:'US', flag:'🇺🇸', industry:'Retail' },
  { symbol:'SPGI',  name:'S&P Global',          country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'BLK',   name:'BlackRock',           country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'UBER',  name:'Uber',                country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'UPS',   name:'UPS',                 country:'US', flag:'🇺🇸', industry:'Logistics' },
  { symbol:'SCHW',  name:'Charles Schwab',      country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'C',     name:'Citigroup',           country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'PFE',   name:'Pfizer',              country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'DE',    name:'Deere & Company',     country:'US', flag:'🇺🇸', industry:'Industrial' },
  { symbol:'BA',    name:'Boeing',              country:'US', flag:'🇺🇸', industry:'Defense' },
  { symbol:'BMY',   name:'Bristol-Myers Squibb',country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'REGN',  name:'Regeneron',           country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'AMT',   name:'American Tower',      country:'US', flag:'🇺🇸', industry:'Real Estate' },
  { symbol:'CB',    name:'Chubb',               country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'MDT',   name:'Medtronic',           country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'MO',    name:'Altria',              country:'US', flag:'🇺🇸', industry:'Consumer' },
  { symbol:'CI',    name:'Cigna',               country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'MMC',   name:'Marsh McLennan',      country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'EOG',   name:'EOG Resources',       country:'US', flag:'🇺🇸', industry:'Energy' },
  { symbol:'SLB',   name:'Schlumberger',        country:'US', flag:'🇺🇸', industry:'Energy' },
  { symbol:'ETN',   name:'Eaton',               country:'US', flag:'🇺🇸', industry:'Industrial' },
  { symbol:'PLD',   name:'Prologis',            country:'US', flag:'🇺🇸', industry:'Real Estate' },
  { symbol:'ADP',   name:'ADP',                 country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'ICE',   name:'Intercontinental Exchange',country:'US',flag:'🇺🇸',industry:'Finance'},
  { symbol:'LRCX',  name:'Lam Research',        country:'US', flag:'🇺🇸', industry:'Semiconductors' },
  { symbol:'AMAT',  name:'Applied Materials',   country:'US', flag:'🇺🇸', industry:'Semiconductors' },
  { symbol:'USB',   name:'US Bancorp',          country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'GEV',   name:'GE Vernova',          country:'US', flag:'🇺🇸', industry:'Energy' },
  { symbol:'KLAC',  name:'KLA Corp',            country:'US', flag:'🇺🇸', industry:'Semiconductors' },
  { symbol:'TT',    name:'Trane Technologies',  country:'US', flag:'🇺🇸', industry:'Industrial' },
  { symbol:'CME',   name:'CME Group',           country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'MCO',   name:"Moody's",             country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'MMM',   name:'3M',                  country:'US', flag:'🇺🇸', industry:'Industrial' },
  { symbol:'SO',    name:'Southern Company',    country:'US', flag:'🇺🇸', industry:'Energy' },
  { symbol:'DUK',   name:'Duke Energy',         country:'US', flag:'🇺🇸', industry:'Energy' },
  { symbol:'TJX',   name:'TJX Companies',       country:'US', flag:'🇺🇸', industry:'Retail' },
  { symbol:'HCA',   name:'HCA Healthcare',      country:'US', flag:'🇺🇸', industry:'Healthcare' },
  { symbol:'COF',   name:'Capital One',         country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'MET',   name:'MetLife',             country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'PSA',   name:'Public Storage',      country:'US', flag:'🇺🇸', industry:'Real Estate' },
  { symbol:'ITW',   name:'Illinois Tool Works', country:'US', flag:'🇺🇸', industry:'Industrial' },
  { symbol:'CEG',   name:'Constellation Energy',country:'US', flag:'🇺🇸', industry:'Energy' },
  { symbol:'WELL',  name:'Welltower',           country:'US', flag:'🇺🇸', industry:'Real Estate' },
  { symbol:'AON',   name:'Aon',                 country:'US', flag:'🇺🇸', industry:'Finance' },
  { symbol:'SPOT',  name:'Spotify',             country:'US', flag:'🇺🇸', industry:'Media' },
  { symbol:'CRWD',  name:'CrowdStrike',         country:'US', flag:'🇺🇸', industry:'Technology' },
  { symbol:'ZTS',   name:'Zoetis',              country:'US', flag:'🇺🇸', industry:'Healthcare' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇬🇧 UK — Top 40 US-listed (ADRs) by market cap
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'AZN',   name:'AstraZeneca',         country:'GB', flag:'🇬🇧', industry:'Healthcare' },
  { symbol:'HSBC',  name:'HSBC',                country:'GB', flag:'🇬🇧', industry:'Finance' },
  { symbol:'SHEL',  name:'Shell',               country:'GB', flag:'🇬🇧', industry:'Energy' },
  { symbol:'BP',    name:'BP',                  country:'GB', flag:'🇬🇧', industry:'Energy' },
  { symbol:'LSEG',  name:'London Stock Exchange',country:'GB',flag:'🇬🇧', industry:'Finance' },
  { symbol:'GSK',   name:'GSK',                 country:'GB', flag:'🇬🇧', industry:'Healthcare' },
  { symbol:'RIO',   name:'Rio Tinto',           country:'GB', flag:'🇬🇧', industry:'Mining' },
  { symbol:'RELX',  name:'RELX',                country:'GB', flag:'🇬🇧', industry:'Media' },
  { symbol:'DEO',   name:'Diageo',              country:'GB', flag:'🇬🇧', industry:'Consumer' },
  { symbol:'BATS',  name:'British American Tobacco',country:'GB',flag:'🇬🇧',industry:'Consumer'},
  { symbol:'BTI',   name:'BAT',                 country:'GB', flag:'🇬🇧', industry:'Consumer' },
  { symbol:'NGG',   name:'National Grid',       country:'GB', flag:'🇬🇧', industry:'Energy' },
  { symbol:'LNVGY', name:'Lenovo',              country:'GB', flag:'🇬🇧', industry:'Technology' },
  { symbol:'CMSD',  name:'Compass Group',       country:'GB', flag:'🇬🇧', industry:'Consumer' },
  { symbol:'EXPGY', name:'Experian',            country:'GB', flag:'🇬🇧', industry:'Technology' },
  { symbol:'PSON',  name:'Pearson',             country:'GB', flag:'🇬🇧', industry:'Media' },
  { symbol:'BDEV',  name:'Barratt Developments',country:'GB', flag:'🇬🇧', industry:'Real Estate' },
  { symbol:'IAG',   name:'IAG',                 country:'GB', flag:'🇬🇧', industry:'Transport' },
  { symbol:'LLOY',  name:'Lloyds Banking',      country:'GB', flag:'🇬🇧', industry:'Finance' },
  { symbol:'BARC',  name:'Barclays',            country:'GB', flag:'🇬🇧', industry:'Finance' },
  { symbol:'BCS',   name:'Barclays ADR',        country:'GB', flag:'🇬🇧', industry:'Finance' },
  { symbol:'NWG',   name:'NatWest Group',       country:'GB', flag:'🇬🇧', industry:'Finance' },
  { symbol:'STAN',  name:'Standard Chartered',  country:'GB', flag:'🇬🇧', industry:'Finance' },
  { symbol:'FERG',  name:'Ferguson',            country:'GB', flag:'🇬🇧', industry:'Industrial' },
  { symbol:'RKT',   name:'Reckitt',             country:'GB', flag:'🇬🇧', industry:'Consumer' },
  { symbol:'ULVR',  name:'Unilever',            country:'GB', flag:'🇬🇧', industry:'Consumer' },
  { symbol:'UL',    name:'Unilever ADR',        country:'GB', flag:'🇬🇧', industry:'Consumer' },
  { symbol:'ABDN',  name:'abrdn',               country:'GB', flag:'🇬🇧', industry:'Finance' },
  { symbol:'HL',    name:'Hargreaves Lansdown',  country:'GB', flag:'🇬🇧', industry:'Finance' },
  { symbol:'SDR',   name:'Schroders',           country:'GB', flag:'🇬🇧', industry:'Finance' },
  { symbol:'HLMA',  name:'Halma',               country:'GB', flag:'🇬🇧', industry:'Industrial' },
  { symbol:'IMB',   name:'Imperial Brands',     country:'GB', flag:'🇬🇧', industry:'Consumer' },
  { symbol:'VOD',   name:'Vodafone',            country:'GB', flag:'🇬🇧', industry:'Telecom' },
  { symbol:'GLEN',  name:'Glencore',            country:'GB', flag:'🇬🇧', industry:'Mining' },
  { symbol:'GLNCY', name:'Glencore ADR',        country:'GB', flag:'🇬🇧', industry:'Mining' },
  { symbol:'AAL',   name:'Anglo American',      country:'GB', flag:'🇬🇧', industry:'Mining' },
  { symbol:'PRU',   name:'Prudential',          country:'GB', flag:'🇬🇧', industry:'Finance' },
  { symbol:'LGEN',  name:'Legal & General',     country:'GB', flag:'🇬🇧', industry:'Finance' },
  { symbol:'MNDI',  name:'Mondi',               country:'GB', flag:'🇬🇧', industry:'Industrial' },
  { symbol:'WPP',   name:'WPP',                 country:'GB', flag:'🇬🇧', industry:'Media' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇫🇷 France — Top US-listed by market cap
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'LVMUY', name:'LVMH',               country:'FR', flag:'🇫🇷', industry:'Luxury' },
  { symbol:'TTE',   name:'TotalEnergies',       country:'FR', flag:'🇫🇷', industry:'Energy' },
  { symbol:'CRRFY', name:'Hermès',              country:'FR', flag:'🇫🇷', industry:'Luxury' },
  { symbol:'SNYNF', name:'Sanofi',              country:'FR', flag:'🇫🇷', industry:'Healthcare' },
  { symbol:'SNY',   name:'Sanofi ADR',          country:'FR', flag:'🇫🇷', industry:'Healthcare' },
  { symbol:'BNPQY', name:'BNP Paribas',         country:'FR', flag:'🇫🇷', industry:'Finance' },
  { symbol:'AIVVY', name:'Air Liquide',          country:'FR', flag:'🇫🇷', industry:'Chemicals' },
  { symbol:'AXAHY', name:'AXA',                 country:'FR', flag:'🇫🇷', industry:'Finance' },
  { symbol:'CGSGY', name:'Capgemini',            country:'FR', flag:'🇫🇷', industry:'Technology' },
  { symbol:'PPRUY', name:'Kering',               country:'FR', flag:'🇫🇷', industry:'Luxury' },
  { symbol:'STMEF', name:'STMicroelectronics',   country:'FR', flag:'🇫🇷', industry:'Semiconductors' },
  { symbol:'STM',   name:'STMicro ADR',          country:'FR', flag:'🇫🇷', industry:'Semiconductors' },
  { symbol:'SGBLY', name:'Société Générale',     country:'FR', flag:'🇫🇷', industry:'Finance' },
  { symbol:'CRBPY', name:'Crédit Agricole',      country:'FR', flag:'🇫🇷', industry:'Finance' },
  { symbol:'VLEEY', name:'Veolia',               country:'FR', flag:'🇫🇷', industry:'Energy' },
  { symbol:'RWEOY', name:'Airbus',               country:'FR', flag:'🇫🇷', industry:'Defense' },
  { symbol:'EADSY', name:'Airbus ADR',           country:'FR', flag:'🇫🇷', industry:'Defense' },
  { symbol:'DANO',  name:'Danone',               country:'FR', flag:'🇫🇷', industry:'Consumer' },
  { symbol:'DANOY', name:'Danone ADR',           country:'FR', flag:'🇫🇷', industry:'Consumer' },
  { symbol:'ENGI',  name:'Engie',                country:'FR', flag:'🇫🇷', industry:'Energy' },
  { symbol:'ENGIY', name:'Engie ADR',            country:'FR', flag:'🇫🇷', industry:'Energy' },
  { symbol:'VVDRY', name:'Vivendi',              country:'FR', flag:'🇫🇷', industry:'Media' },
  { symbol:'MKGAF', name:'Michelin',             country:'FR', flag:'🇫🇷', industry:'Industrial' },
  { symbol:'PUGOY', name:'Peugeot/Stellantis',   country:'FR', flag:'🇫🇷', industry:'Automotive' },
  { symbol:'STLA',  name:'Stellantis',           country:'FR', flag:'🇫🇷', industry:'Automotive' },
  { symbol:'LRLCY', name:"L'Oréal",             country:'FR', flag:'🇫🇷', industry:'Consumer' },
  { symbol:'RNSDF', name:'Renault',              country:'FR', flag:'🇫🇷', industry:'Automotive' },
  { symbol:'SAFRY', name:'Safran',               country:'FR', flag:'🇫🇷', industry:'Defense' },
  { symbol:'SGPYY', name:'Saint-Gobain',         country:'FR', flag:'🇫🇷', industry:'Industrial' },
  { symbol:'LEGIF', name:'Legrand',              country:'FR', flag:'🇫🇷', industry:'Industrial' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇩🇪 Germany — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'SAP',   name:'SAP',                 country:'DE', flag:'🇩🇪', industry:'Technology' },
  { symbol:'SIEGY', name:'Siemens',             country:'DE', flag:'🇩🇪', industry:'Industrial' },
  { symbol:'ALIZY', name:'Allianz',             country:'DE', flag:'🇩🇪', industry:'Finance' },
  { symbol:'ADDYY', name:'Adidas',              country:'DE', flag:'🇩🇪', industry:'Consumer' },
  { symbol:'BAYZF', name:'Bayer',               country:'DE', flag:'🇩🇪', industry:'Healthcare' },
  { symbol:'BASFY', name:'BASF',                country:'DE', flag:'🇩🇪', industry:'Chemicals' },
  { symbol:'BMWYY', name:'BMW',                 country:'DE', flag:'🇩🇪', industry:'Automotive' },
  { symbol:'VWAGY', name:'Volkswagen',          country:'DE', flag:'🇩🇪', industry:'Automotive' },
  { symbol:'MBGAF', name:'Mercedes-Benz',       country:'DE', flag:'🇩🇪', industry:'Automotive' },
  { symbol:'DBOEY', name:'Deutsche Börse',      country:'DE', flag:'🇩🇪', industry:'Finance' },
  { symbol:'DTEGY', name:'Deutsche Telekom',    country:'DE', flag:'🇩🇪', industry:'Telecom' },
  { symbol:'MURGY', name:'Munich Re',           country:'DE', flag:'🇩🇪', industry:'Finance' },
  { symbol:'HXSPY', name:'HeidelbergMaterials', country:'DE', flag:'🇩🇪', industry:'Industrial' },
  { symbol:'SZGPY', name:'Symrise',             country:'DE', flag:'🇩🇪', industry:'Chemicals' },
  { symbol:'XNGSY', name:'Infineon',            country:'DE', flag:'🇩🇪', industry:'Semiconductors' },
  { symbol:'IFNNY', name:'Infineon ADR',        country:'DE', flag:'🇩🇪', industry:'Semiconductors' },
  { symbol:'RHABY', name:'Rheinmetall',         country:'DE', flag:'🇩🇪', industry:'Defense' },
  { symbol:'ENLAY', name:'E.ON',                country:'DE', flag:'🇩🇪', industry:'Energy' },
  { symbol:'RWEOY', name:'RWE',                 country:'DE', flag:'🇩🇪', industry:'Energy' },
  { symbol:'DPSGY', name:'Deutsche Post',       country:'DE', flag:'🇩🇪', industry:'Logistics' },
  { symbol:'HAWKY', name:'Hannover Re',         country:'DE', flag:'🇩🇪', industry:'Finance' },
  { symbol:'MTUAY', name:'MTU Aero Engines',    country:'DE', flag:'🇩🇪', industry:'Defense' },
  { symbol:'WKSPY', name:'Wirecard (Naga/DF)',  country:'DE', flag:'🇩🇪', industry:'Finance' },
  { symbol:'PDRKY', name:'Porsche',             country:'DE', flag:'🇩🇪', industry:'Automotive' },
  { symbol:'ZARFY', name:'Zalando',             country:'DE', flag:'🇩🇪', industry:'E-Commerce' },
  { symbol:'CPXWY', name:'CureVac',             country:'DE', flag:'🇩🇪', industry:'Healthcare' },
  { symbol:'SMAWY', name:'SMA Solar',           country:'DE', flag:'🇩🇪', industry:'Energy' },
  { symbol:'HMRNY', name:'Henkel',              country:'DE', flag:'🇩🇪', industry:'Consumer' },
  { symbol:'BNTNY', name:'BioNTech',            country:'DE', flag:'🇩🇪', industry:'Healthcare' },
  { symbol:'BNTX',  name:'BioNTech ADR',        country:'DE', flag:'🇩🇪', industry:'Healthcare' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇨🇭 Switzerland — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'NSRGY', name:'Nestlé',              country:'CH', flag:'🇨🇭', industry:'Consumer' },
  { symbol:'RHHBY', name:'Roche',               country:'CH', flag:'🇨🇭', industry:'Healthcare' },
  { symbol:'NOVN',  name:'Novartis',            country:'CH', flag:'🇨🇭', industry:'Healthcare' },
  { symbol:'NVS',   name:'Novartis ADR',        country:'CH', flag:'🇨🇭', industry:'Healthcare' },
  { symbol:'UBSFF', name:'UBS',                 country:'CH', flag:'🇨🇭', industry:'Finance' },
  { symbol:'UBS',   name:'UBS ADR',             country:'CH', flag:'🇨🇭', industry:'Finance' },
  { symbol:'ABBNF', name:'ABB',                 country:'CH', flag:'🇨🇭', industry:'Industrial' },
  { symbol:'ABB',   name:'ABB ADR',             country:'CH', flag:'🇨🇭', industry:'Industrial' },
  { symbol:'ZURVY', name:'Zurich Insurance',    country:'CH', flag:'🇨🇭', industry:'Finance' },
  { symbol:'GIVNF', name:'Givaudan',            country:'CH', flag:'🇨🇭', industry:'Chemicals' },
  { symbol:'CSGKF', name:'Credit Suisse',       country:'CH', flag:'🇨🇭', industry:'Finance' },
  { symbol:'SGSOY', name:'SGS',                 country:'CH', flag:'🇨🇭', industry:'Industrial' },
  { symbol:'SFSNY', name:'Schindler',           country:'CH', flag:'🇨🇭', industry:'Industrial' },
  { symbol:'RISKF', name:'Swiss Re',            country:'CH', flag:'🇨🇭', industry:'Finance' },
  { symbol:'SGPYY', name:'Sika',                country:'CH', flag:'🇨🇭', industry:'Chemicals' },
  { symbol:'ARLUF', name:'Richemont',           country:'CH', flag:'🇨🇭', industry:'Luxury' },
  { symbol:'CFR',   name:'Richemont ADR',       country:'CH', flag:'🇨🇭', industry:'Luxury' },
  { symbol:'LHNFY', name:'Lonza',               country:'CH', flag:'🇨🇭', industry:'Healthcare' },
  { symbol:'GEBN',  name:'Geberit',             country:'CH', flag:'🇨🇭', industry:'Industrial' },
  { symbol:'SRCL',  name:'Stericycle',          country:'CH', flag:'🇨🇭', industry:'Industrial' },
  { symbol:'KUHN',  name:'Kuehne+Nagel',        country:'CH', flag:'🇨🇭', industry:'Logistics' },
  { symbol:'CHMRY', name:'Chocoladefabriken',   country:'CH', flag:'🇨🇭', industry:'Consumer' },
  { symbol:'BARN',  name:'Barry Callebaut',     country:'CH', flag:'🇨🇭', industry:'Consumer' },
  { symbol:'PSPN',  name:'PSP Swiss Property',  country:'CH', flag:'🇨🇭', industry:'Real Estate' },
  { symbol:'LOGN',  name:'Logitech',            country:'CH', flag:'🇨🇭', industry:'Technology' },
  { symbol:'LOGI',  name:'Logitech ADR',        country:'CH', flag:'🇨🇭', industry:'Technology' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇳🇱 Netherlands — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'ASML',  name:'ASML',                country:'NL', flag:'🇳🇱', industry:'Semiconductors' },
  { symbol:'NXPI',  name:'NXP Semiconductors',  country:'NL', flag:'🇳🇱', industry:'Semiconductors' },
  { symbol:'HEIA',  name:'Heineken',             country:'NL', flag:'🇳🇱', industry:'Consumer' },
  { symbol:'HEINY', name:'Heineken ADR',         country:'NL', flag:'🇳🇱', industry:'Consumer' },
  { symbol:'PHPPY', name:'Philips',              country:'NL', flag:'🇳🇱', industry:'Healthcare' },
  { symbol:'PHG',   name:'Philips ADR',          country:'NL', flag:'🇳🇱', industry:'Healthcare' },
  { symbol:'ING',   name:'ING Group ADR',        country:'NL', flag:'🇳🇱', industry:'Finance' },
  { symbol:'ADYEN', name:'Adyen',                country:'NL', flag:'🇳🇱', industry:'Technology' },
  { symbol:'ARGX',  name:'argenx',               country:'NL', flag:'🇳🇱', industry:'Healthcare' },
  { symbol:'WTKWY', name:'Wolters Kluwer',       country:'NL', flag:'🇳🇱', industry:'Media' },
  { symbol:'ADRNY', name:'Ahold Delhaize',       country:'NL', flag:'🇳🇱', industry:'Retail' },
  { symbol:'AD',    name:'Ahold Delhaize ADS',   country:'NL', flag:'🇳🇱', industry:'Retail' },
  { symbol:'ASMIY', name:'ASM International',    country:'NL', flag:'🇳🇱', industry:'Semiconductors' },
  { symbol:'BESIW', name:'BE Semiconductor',     country:'NL', flag:'🇳🇱', industry:'Semiconductors' },
  { symbol:'PROSF', name:'Prosus',               country:'NL', flag:'🇳🇱', industry:'Technology' },
  { symbol:'AHOLD', name:'Ahold',                country:'NL', flag:'🇳🇱', industry:'Retail' },
  { symbol:'RDSMY', name:'SBM Offshore',         country:'NL', flag:'🇳🇱', industry:'Energy' },
  { symbol:'AABVY', name:'ABN AMRO',             country:'NL', flag:'🇳🇱', industry:'Finance' },
  { symbol:'AEGOF', name:'Aegon',                country:'NL', flag:'🇳🇱', industry:'Finance' },
  { symbol:'AEG',   name:'Aegon ADR',            country:'NL', flag:'🇳🇱', industry:'Finance' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇸🇪 Sweden — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'ERIC',  name:'Ericsson',             country:'SE', flag:'🇸🇪', industry:'Technology' },
  { symbol:'VOLVY', name:'Volvo',                country:'SE', flag:'🇸🇪', industry:'Automotive' },
  { symbol:'ATLKY', name:'Atlas Copco',          country:'SE', flag:'🇸🇪', industry:'Industrial' },
  { symbol:'HNNMY', name:'H&M',                  country:'SE', flag:'🇸🇪', industry:'Retail' },
  { symbol:'ESALY', name:'Essity',               country:'SE', flag:'🇸🇪', industry:'Consumer' },
  { symbol:'SKFRY', name:'SKF',                  country:'SE', flag:'🇸🇪', industry:'Industrial' },
  { symbol:'HNKG',  name:'Hexagon',              country:'SE', flag:'🇸🇪', industry:'Technology' },
  { symbol:'SEBA',  name:'SEB',                  country:'SE', flag:'🇸🇪', industry:'Finance' },
  { symbol:'SWDBY', name:'Swedbank',             country:'SE', flag:'🇸🇪', industry:'Finance' },
  { symbol:'INVEAY',name:'Investor AB',          country:'SE', flag:'🇸🇪', industry:'Finance' },
  { symbol:'SSAAY', name:'Svenska Handelsbanken',country:'SE', flag:'🇸🇪', industry:'Finance' },
  { symbol:'ALFVY', name:'Alfa Laval',           country:'SE', flag:'🇸🇪', industry:'Industrial' },
  { symbol:'GETIB', name:'Getinge',              country:'SE', flag:'🇸🇪', industry:'Healthcare' },
  { symbol:'SBSNY', name:'Sandvik',              country:'SE', flag:'🇸🇪', industry:'Industrial' },
  { symbol:'ELEKTA',name:'Elekta',              country:'SE', flag:'🇸🇪', industry:'Healthcare' },
  { symbol:'EKABY', name:'Electrolux',           country:'SE', flag:'🇸🇪', industry:'Consumer' },
  { symbol:'TELIA', name:'Telia',                country:'SE', flag:'🇸🇪', industry:'Telecom' },
  { symbol:'SSYS',  name:'Autoliv',              country:'SE', flag:'🇸🇪', industry:'Automotive' },
  { symbol:'ALV',   name:'Autoliv ADR',          country:'SE', flag:'🇸🇪', industry:'Automotive' },
  { symbol:'KINVF', name:'Kinnevik',             country:'SE', flag:'🇸🇪', industry:'Finance' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇩🇰 Denmark — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'NVO',   name:'Novo Nordisk',         country:'DK', flag:'🇩🇰', industry:'Healthcare' },
  { symbol:'AMKBY', name:'Ambu',                 country:'DK', flag:'🇩🇰', industry:'Healthcare' },
  { symbol:'NNDNF', name:'Novozymes',            country:'DK', flag:'🇩🇰', industry:'Chemicals' },
  { symbol:'NZYMB', name:'Novozymes B',          country:'DK', flag:'🇩🇰', industry:'Chemicals' },
  { symbol:'RBREW', name:'Royal Unibrew',        country:'DK', flag:'🇩🇰', industry:'Consumer' },
  { symbol:'COPEN', name:'Carlsberg',            country:'DK', flag:'🇩🇰', industry:'Consumer' },
  { symbol:'CWBHF', name:'Carlsberg ADR',        country:'DK', flag:'🇩🇰', industry:'Consumer' },
  { symbol:'ORSTED',name:'Ørsted',               country:'DK', flag:'🇩🇰', industry:'Energy' },
  { symbol:'DSV',   name:'DSV',                  country:'DK', flag:'🇩🇰', industry:'Logistics' },
  { symbol:'GMAB',  name:'Genmab',               country:'DK', flag:'🇩🇰', industry:'Healthcare' },
  { symbol:'COLOB', name:'Coloplast',            country:'DK', flag:'🇩🇰', industry:'Healthcare' },
  { symbol:'DEMANT',name:'Demant',               country:'DK', flag:'🇩🇰', industry:'Healthcare' },
  { symbol:'MAERSK',name:'Maersk',               country:'DK', flag:'🇩🇰', industry:'Logistics' },
  { symbol:'TRYG',  name:'Tryg',                 country:'DK', flag:'🇩🇰', industry:'Finance' },
  { symbol:'FLS',   name:'FLSmidth',             country:'DK', flag:'🇩🇰', industry:'Industrial' },
  { symbol:'ISS',   name:'ISS',                  country:'DK', flag:'🇩🇰', industry:'Industrial' },
  { symbol:'PNDORA',name:'Pandora',              country:'DK', flag:'🇩🇰', industry:'Luxury' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇳🇴 Norway — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'EQNR',  name:'Equinor',              country:'NO', flag:'🇳🇴', industry:'Energy' },
  { symbol:'DNBHF', name:'DNB Bank',             country:'NO', flag:'🇳🇴', industry:'Finance' },
  { symbol:'MHLA',  name:'Mowi',                 country:'NO', flag:'🇳🇴', industry:'Consumer' },
  { symbol:'TOMRA', name:'Tomra Systems',        country:'NO', flag:'🇳🇴', industry:'Industrial' },
  { symbol:'NHYDY', name:'Norsk Hydro',          country:'NO', flag:'🇳🇴', industry:'Industrial' },
  { symbol:'YARIY', name:'Yara',                 country:'NO', flag:'🇳🇴', industry:'Chemicals' },
  { symbol:'ORKLY', name:'Orkla',                country:'NO', flag:'🇳🇴', industry:'Consumer' },
  { symbol:'SBGSF', name:'Subsea 7',             country:'NO', flag:'🇳🇴', industry:'Energy' },
  { symbol:'AKRBP', name:'Aker BP',              country:'NO', flag:'🇳🇴', industry:'Energy' },
  { symbol:'TGS',   name:'TGS',                  country:'NO', flag:'🇳🇴', industry:'Energy' },
  { symbol:'NOGSF', name:'Nordic Semiconductor', country:'NO', flag:'🇳🇴', industry:'Semiconductors' },
  { symbol:'SALM',  name:'SalMar',               country:'NO', flag:'🇳🇴', industry:'Consumer' },
  { symbol:'LERX',  name:'Leroy Seafood',        country:'NO', flag:'🇳🇴', industry:'Consumer' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇧🇪 Belgium — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'BUD',   name:'AB InBev',             country:'BE', flag:'🇧🇪', industry:'Consumer' },
  { symbol:'ARGX',  name:'argenx',               country:'BE', flag:'🇧🇪', industry:'Healthcare' },
  { symbol:'UCB',   name:'UCB',                  country:'BE', flag:'🇧🇪', industry:'Healthcare' },
  { symbol:'SOFB',  name:'Sofina',               country:'BE', flag:'🇧🇪', industry:'Finance' },
  { symbol:'GBL',   name:'Groupe Bruxelles',     country:'BE', flag:'🇧🇪', industry:'Finance' },
  { symbol:'KBC',   name:'KBC Group',            country:'BE', flag:'🇧🇪', industry:'Finance' },
  { symbol:'AGEAS', name:'Ageas',                country:'BE', flag:'🇧🇪', industry:'Finance' },
  { symbol:'COLR',  name:'Colruyt',              country:'BE', flag:'🇧🇪', industry:'Retail' },
  { symbol:'MELX',  name:'Melexis',              country:'BE', flag:'🇧🇪', industry:'Semiconductors' },
  { symbol:'WDP',   name:'Warehouses De Pauw',   country:'BE', flag:'🇧🇪', industry:'Real Estate' },
  { symbol:'LOTB',  name:'Lotus Bakeries',       country:'BE', flag:'🇧🇪', industry:'Consumer' },
  { symbol:'BEKB',  name:'Bekaert',              country:'BE', flag:'🇧🇪', industry:'Industrial' },
  { symbol:'TNET',  name:'Telenet',              country:'BE', flag:'🇧🇪', industry:'Telecom' },
  { symbol:'MBBF',  name:'Elia Group',           country:'BE', flag:'🇧🇪', industry:'Energy' },
  { symbol:'RPBHF', name:'Proximus',             country:'BE', flag:'🇧🇪', industry:'Telecom' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇪🇸 Spain — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'SAN',   name:'Santander',            country:'ES', flag:'🇪🇸', industry:'Finance' },
  { symbol:'BBVA',  name:'BBVA',                 country:'ES', flag:'🇪🇸', industry:'Finance' },
  { symbol:'IDEXY', name:'Inditex (Zara)',        country:'ES', flag:'🇪🇸', industry:'Retail' },
  { symbol:'TLEFY', name:'Telefónica',            country:'ES', flag:'🇪🇸', industry:'Telecom' },
  { symbol:'TEF',   name:'Telefónica ADR',        country:'ES', flag:'🇪🇸', industry:'Telecom' },
  { symbol:'IBDRY', name:'Iberdrola',             country:'ES', flag:'🇪🇸', industry:'Energy' },
  { symbol:'ACSAF', name:'ACS Group',             country:'ES', flag:'🇪🇸', industry:'Industrial' },
  { symbol:'CAIXY', name:'CaixaBank',             country:'ES', flag:'🇪🇸', industry:'Finance' },
  { symbol:'REPSF', name:'Repsol',                country:'ES', flag:'🇪🇸', industry:'Energy' },
  { symbol:'IBEXY', name:'Iberia/IAG',            country:'ES', flag:'🇪🇸', industry:'Transport' },
  { symbol:'FERRF', name:'Ferrovial',             country:'ES', flag:'🇪🇸', industry:'Industrial' },
  { symbol:'FER',   name:'Ferrovial ADR',         country:'ES', flag:'🇪🇸', industry:'Industrial' },
  { symbol:'BMEF',  name:'Bankinter',             country:'ES', flag:'🇪🇸', industry:'Finance' },
  { symbol:'GCXAY', name:'Grifols',               country:'ES', flag:'🇪🇸', industry:'Healthcare' },
  { symbol:'GRFS',  name:'Grifols ADR',           country:'ES', flag:'🇪🇸', industry:'Healthcare' },
  { symbol:'AMADY', name:'Amadeus IT',            country:'ES', flag:'🇪🇸', industry:'Technology' },
  { symbol:'AMADY', name:'Amadeus ADR',           country:'ES', flag:'🇪🇸', industry:'Technology' },
  { symbol:'ENDEY', name:'Endesa',                country:'ES', flag:'🇪🇸', industry:'Energy' },
  { symbol:'MELIA', name:'Meliá Hotels',          country:'ES', flag:'🇪🇸', industry:'Consumer' },
  { symbol:'MAPI',  name:'Mapfre',                country:'ES', flag:'🇪🇸', industry:'Finance' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇮🇹 Italy — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'STLA',  name:'Stellantis',            country:'IT', flag:'🇮🇹', industry:'Automotive' },
  { symbol:'ENIOY', name:'ENI',                   country:'IT', flag:'🇮🇹', industry:'Energy' },
  { symbol:'E',     name:'ENI ADR',               country:'IT', flag:'🇮🇹', industry:'Energy' },
  { symbol:'ENEL',  name:'Enel',                  country:'IT', flag:'🇮🇹', industry:'Energy' },
  { symbol:'ENLAY', name:'Enel ADR',              country:'IT', flag:'🇮🇹', industry:'Energy' },
  { symbol:'ISNPY', name:'Intesa Sanpaolo',       country:'IT', flag:'🇮🇹', industry:'Finance' },
  { symbol:'UNCFY', name:'UniCredit',             country:'IT', flag:'🇮🇹', industry:'Finance' },
  { symbol:'LXESY', name:'Leonardo',              country:'IT', flag:'🇮🇹', industry:'Defense' },
  { symbol:'MDIBY', name:'Mediobanca',            country:'IT', flag:'🇮🇹', industry:'Finance' },
  { symbol:'ATASY', name:'Atlantia',              country:'IT', flag:'🇮🇹', industry:'Industrial' },
  { symbol:'PIAAF', name:'Prysmian',              country:'IT', flag:'🇮🇹', industry:'Industrial' },
  { symbol:'GVNDY', name:'Generali',              country:'IT', flag:'🇮🇹', industry:'Finance' },
  { symbol:'TENAF', name:'Tenaris',               country:'IT', flag:'🇮🇹', industry:'Industrial' },
  { symbol:'TS',    name:'Tenaris ADR',           country:'IT', flag:'🇮🇹', industry:'Industrial' },
  { symbol:'FNEUF', name:'Ferrari',               country:'IT', flag:'🇮🇹', industry:'Automotive' },
  { symbol:'RACE',  name:'Ferrari ADR',           country:'IT', flag:'🇮🇹', industry:'Automotive' },
  { symbol:'LUXTY', name:'Luxottica/EssilorLuxottica',country:'IT',flag:'🇮🇹',industry:'Consumer'},
  { symbol:'ESLOY', name:'EssilorLuxottica ADR',  country:'IT', flag:'🇮🇹', industry:'Consumer' },
  { symbol:'PIAGF', name:'Piaggio',               country:'IT', flag:'🇮🇹', industry:'Automotive' },
  { symbol:'MZDAY', name:'Moncler',               country:'IT', flag:'🇮🇹', industry:'Luxury' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇰🇷 South Korea — Top US-listed (ADRs/OTC)
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'SSNLF', name:'Samsung Electronics',  country:'KR', flag:'🇰🇷', industry:'Semiconductors' },
  { symbol:'SKHHY', name:'SK Hynix',             country:'KR', flag:'🇰🇷', industry:'Semiconductors' },
  { symbol:'HYMTF', name:'Hyundai Motor',        country:'KR', flag:'🇰🇷', industry:'Automotive' },
  { symbol:'KBFPY', name:'KB Financial',         country:'KR', flag:'🇰🇷', industry:'Finance' },
  { symbol:'KB',    name:'KB Financial ADR',     country:'KR', flag:'🇰🇷', industry:'Finance' },
  { symbol:'SEMCO', name:'Samsung Electro-Mech', country:'KR', flag:'🇰🇷', industry:'Technology' },
  { symbol:'LGCCY', name:'LG Chem',              country:'KR', flag:'🇰🇷', industry:'Chemicals' },
  { symbol:'LGEIY', name:'LG Electronics',       country:'KR', flag:'🇰🇷', industry:'Technology' },
  { symbol:'SHIBF', name:'Shinhan Financial',    country:'KR', flag:'🇰🇷', industry:'Finance' },
  { symbol:'SHG',   name:'Shinhan ADR',          country:'KR', flag:'🇰🇷', industry:'Finance' },
  { symbol:'HXPHY', name:'Hyundai Heavy Ind.',   country:'KR', flag:'🇰🇷', industry:'Industrial' },
  { symbol:'POSCO', name:'POSCO',                country:'KR', flag:'🇰🇷', industry:'Industrial' },
  { symbol:'PKX',   name:'POSCO ADR',            country:'KR', flag:'🇰🇷', industry:'Industrial' },
  { symbol:'KIAGY', name:'Kia Corp',             country:'KR', flag:'🇰🇷', industry:'Automotive' },
  { symbol:'KSPI',  name:'Kaspi.kz ADR',         country:'KR', flag:'🇰🇷', industry:'Technology' },
  { symbol:'NCNTY', name:'NCSoft',               country:'KR', flag:'🇰🇷', industry:'Technology' },
  { symbol:'KT',    name:'KT Corp',              country:'KR', flag:'🇰🇷', industry:'Telecom' },
  { symbol:'SKM',   name:'SK Telecom',           country:'KR', flag:'🇰🇷', industry:'Telecom' },
  { symbol:'COWAY', name:'Coway',                country:'KR', flag:'🇰🇷', industry:'Consumer' },
  { symbol:'CTPCY', name:'CJ CheilJedang',       country:'KR', flag:'🇰🇷', industry:'Consumer' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇸🇬 Singapore — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'SE',    name:'Sea Limited',           country:'SG', flag:'🇸🇬', industry:'Technology' },
  { symbol:'GRAB',  name:'Grab Holdings',         country:'SG', flag:'🇸🇬', industry:'Technology' },
  { symbol:'DBSDY', name:'DBS Group',             country:'SG', flag:'🇸🇬', industry:'Finance' },
  { symbol:'OCPNY', name:'OCBC Bank',             country:'SG', flag:'🇸🇬', industry:'Finance' },
  { symbol:'UOBKY', name:'UOB',                   country:'SG', flag:'🇸🇬', industry:'Finance' },
  { symbol:'SIAGY', name:'Singapore Airlines',    country:'SG', flag:'🇸🇬', industry:'Transport' },
  { symbol:'WLMIY', name:'Wilmar International',  country:'SG', flag:'🇸🇬', industry:'Consumer' },
  { symbol:'GCPEF', name:'CapitaLand',            country:'SG', flag:'🇸🇬', industry:'Real Estate' },
  { symbol:'SEMCQ', name:'SingTel',               country:'SG', flag:'🇸🇬', industry:'Telecom' },
  { symbol:'SNGNF', name:'SingTel ADR',           country:'SG', flag:'🇸🇬', industry:'Telecom' },
  { symbol:'SGXAY', name:'SGX',                   country:'SG', flag:'🇸🇬', industry:'Finance' },
  { symbol:'KEPPF', name:'Keppel Corp',           country:'SG', flag:'🇸🇬', industry:'Industrial' },
  { symbol:'GARPF', name:'Genting Singapore',     country:'SG', flag:'🇸🇬', industry:'Consumer' },
  { symbol:'FDUS',  name:'Fidelis Insurance',     country:'SG', flag:'🇸🇬', industry:'Finance' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇧🇷 Brazil — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'VALE',  name:'Vale',                  country:'BR', flag:'🇧🇷', industry:'Mining' },
  { symbol:'PBR',   name:'Petrobras',             country:'BR', flag:'🇧🇷', industry:'Energy' },
  { symbol:'ITUB',  name:'Itaú Unibanco',         country:'BR', flag:'🇧🇷', industry:'Finance' },
  { symbol:'BBD',   name:'Bradesco',              country:'BR', flag:'🇧🇷', industry:'Finance' },
  { symbol:'ABEV',  name:'Ambev',                 country:'BR', flag:'🇧🇷', industry:'Consumer' },
  { symbol:'MELI',  name:'MercadoLibre',          country:'BR', flag:'🇧🇷', industry:'E-Commerce' },
  { symbol:'BRAP',  name:'Bradespar',             country:'BR', flag:'🇧🇷', industry:'Mining' },
  { symbol:'BRFS',  name:'BRF',                   country:'BR', flag:'🇧🇷', industry:'Consumer' },
  { symbol:'ERJ',   name:'Embraer',               country:'BR', flag:'🇧🇷', industry:'Defense' },
  { symbol:'SID',   name:'CSN',                   country:'BR', flag:'🇧🇷', industry:'Industrial' },
  { symbol:'GGB',   name:'Gerdau',                country:'BR', flag:'🇧🇷', industry:'Industrial' },
  { symbol:'CIG',   name:'CEMIG',                 country:'BR', flag:'🇧🇷', industry:'Energy' },
  { symbol:'SBS',   name:'SABESP',                country:'BR', flag:'🇧🇷', industry:'Energy' },
  { symbol:'ELET3', name:'Eletrobras',             country:'BR', flag:'🇧🇷', industry:'Energy' },
  { symbol:'EBR',   name:'Eletrobras ADR',        country:'BR', flag:'🇧🇷', industry:'Energy' },
  { symbol:'BSBR',  name:'Bradesco ADR',          country:'BR', flag:'🇧🇷', industry:'Finance' },
  { symbol:'ITSA',  name:'Itaúsa',                country:'BR', flag:'🇧🇷', industry:'Finance' },
  { symbol:'LREN3', name:'Lojas Renner',          country:'BR', flag:'🇧🇷', industry:'Retail' },
  { symbol:'TIMS',  name:'TIM Brasil',            country:'BR', flag:'🇧🇷', industry:'Telecom' },
  { symbol:'SUZB3', name:'Suzano',                country:'BR', flag:'🇧🇷', industry:'Industrial' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇦🇺 Australia — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'BHP',   name:'BHP Group',             country:'AU', flag:'🇦🇺', industry:'Mining' },
  { symbol:'RIO',   name:'Rio Tinto',             country:'AU', flag:'🇦🇺', industry:'Mining' },
  { symbol:'CSLLY', name:'CSL',                   country:'AU', flag:'🇦🇺', industry:'Healthcare' },
  { symbol:'ANZBY', name:'ANZ Bank',              country:'AU', flag:'🇦🇺', industry:'Finance' },
  { symbol:'NABZY', name:'NAB',                   country:'AU', flag:'🇦🇺', industry:'Finance' },
  { symbol:'WBCAY', name:'Westpac',               country:'AU', flag:'🇦🇺', industry:'Finance' },
  { symbol:'CMWAY', name:'Commonwealth Bank',     country:'AU', flag:'🇦🇺', industry:'Finance' },
  { symbol:'WFAFY', name:'Wesfarmers',            country:'AU', flag:'🇦🇺', industry:'Retail' },
  { symbol:'MQBKY', name:'Macquarie Group',       country:'AU', flag:'🇦🇺', industry:'Finance' },
  { symbol:'WSTP',  name:'Woolworths',            country:'AU', flag:'🇦🇺', industry:'Retail' },
  { symbol:'WOWLF', name:'Woolworths ADR',        country:'AU', flag:'🇦🇺', industry:'Retail' },
  { symbol:'FSUMF', name:'Fortescue',             country:'AU', flag:'🇦🇺', industry:'Mining' },
  { symbol:'AAUKF', name:'Australia & NZ Bank',   country:'AU', flag:'🇦🇺', industry:'Finance' },
  { symbol:'TCLAF', name:'Transurban',            country:'AU', flag:'🇦🇺', industry:'Industrial' },
  { symbol:'SOUHY', name:'Santos',                country:'AU', flag:'🇦🇺', industry:'Energy' },
  { symbol:'WDSFY', name:'Woodside Energy',       country:'AU', flag:'🇦🇺', industry:'Energy' },
  { symbol:'BKPKF', name:'Beach Energy',          country:'AU', flag:'🇦🇺', industry:'Energy' },
  { symbol:'NCMGY', name:'Newcrest Mining',       country:'AU', flag:'🇦🇺', industry:'Mining' },
  { symbol:'SBMOF', name:'St Barbara',            country:'AU', flag:'🇦🇺', industry:'Mining' },
  { symbol:'OZKAF', name:'OZ Minerals',          country:'AU', flag:'🇦🇺', industry:'Mining' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇨🇦 Canada — Top US-listed
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'SHOP',  name:'Shopify',               country:'CA', flag:'🇨🇦', industry:'Technology' },
  { symbol:'RY',    name:'Royal Bank of Canada',  country:'CA', flag:'🇨🇦', industry:'Finance' },
  { symbol:'TD',    name:'TD Bank',               country:'CA', flag:'🇨🇦', industry:'Finance' },
  { symbol:'ENB',   name:'Enbridge',              country:'CA', flag:'🇨🇦', industry:'Energy' },
  { symbol:'CNR',   name:'Canadian National Rlwy',country:'CA', flag:'🇨🇦', industry:'Logistics' },
  { symbol:'BMO',   name:'Bank of Montreal',      country:'CA', flag:'🇨🇦', industry:'Finance' },
  { symbol:'BNS',   name:'Bank of Nova Scotia',   country:'CA', flag:'🇨🇦', industry:'Finance' },
  { symbol:'CP',    name:'Canadian Pacific',      country:'CA', flag:'🇨🇦', industry:'Logistics' },
  { symbol:'SU',    name:'Suncor Energy',         country:'CA', flag:'🇨🇦', industry:'Energy' },
  { symbol:'TRP',   name:'TC Energy',             country:'CA', flag:'🇨🇦', industry:'Energy' },
  { symbol:'BCE',   name:'BCE',                   country:'CA', flag:'🇨🇦', industry:'Telecom' },
  { symbol:'T',     name:'Telus',                 country:'CA', flag:'🇨🇦', industry:'Telecom' },
  { symbol:'MFC',   name:'Manulife Financial',    country:'CA', flag:'🇨🇦', industry:'Finance' },
  { symbol:'SLF',   name:'Sun Life Financial',    country:'CA', flag:'🇨🇦', industry:'Finance' },
  { symbol:'ABX',   name:'Barrick Gold',          country:'CA', flag:'🇨🇦', industry:'Mining' },
  { symbol:'AEM',   name:'Agnico Eagle Mines',    country:'CA', flag:'🇨🇦', industry:'Mining' },
  { symbol:'ATO',   name:'Atmos Energy',          country:'CA', flag:'🇨🇦', industry:'Energy' },
  { symbol:'WPM',   name:'Wheaton Precious Metals',country:'CA',flag:'🇨🇦', industry:'Mining' },
  { symbol:'CCO',   name:'Cameco',                country:'CA', flag:'🇨🇦', industry:'Energy' },
  { symbol:'IMO',   name:'Imperial Oil',          country:'CA', flag:'🇨🇦', industry:'Energy' },
  { symbol:'POW',   name:'Power Corp Canada',     country:'CA', flag:'🇨🇦', industry:'Finance' },
  { symbol:'ATD',   name:'Alimentation Couche-Tard',country:'CA',flag:'🇨🇦',industry:'Retail'},
  { symbol:'TECK',  name:'Teck Resources',        country:'CA', flag:'🇨🇦', industry:'Mining' },
  { symbol:'CNQ',   name:'Canadian Natural Res',  country:'CA', flag:'🇨🇦', industry:'Energy' },
  { symbol:'OTEX',  name:'OpenText',              country:'CA', flag:'🇨🇦', industry:'Technology' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇨🇳 China — Top US-listed (ADRs on NYSE/NASDAQ)
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'BABA',  name:'Alibaba',               country:'CN', flag:'🇨🇳', industry:'E-Commerce' },
  { symbol:'TCEHY', name:'Tencent',               country:'CN', flag:'🇨🇳', industry:'Technology' },
  { symbol:'PDD',   name:'PDD Holdings',          country:'CN', flag:'🇨🇳', industry:'E-Commerce' },
  { symbol:'JD',    name:'JD.com',                country:'CN', flag:'🇨🇳', industry:'E-Commerce' },
  { symbol:'BIDU',  name:'Baidu',                 country:'CN', flag:'🇨🇳', industry:'Technology' },
  { symbol:'NTES',  name:'NetEase',               country:'CN', flag:'🇨🇳', industry:'Technology' },
  { symbol:'MANU',  name:'Manchester United',     country:'CN', flag:'🇨🇳', industry:'Media' },
  { symbol:'NIO',   name:'NIO',                   country:'CN', flag:'🇨🇳', industry:'Automotive' },
  { symbol:'LI',    name:'Li Auto',               country:'CN', flag:'🇨🇳', industry:'Automotive' },
  { symbol:'XPEV',  name:'Xpeng',                 country:'CN', flag:'🇨🇳', industry:'Automotive' },
  { symbol:'YUMC',  name:'Yum China',             country:'CN', flag:'🇨🇳', industry:'Consumer' },
  { symbol:'BEKE',  name:'KE Holdings',           country:'CN', flag:'🇨🇳', industry:'Real Estate' },
  { symbol:'EDU',   name:'New Oriental Education',country:'CN', flag:'🇨🇳', industry:'Technology' },
  { symbol:'TAL',   name:'TAL Education',         country:'CN', flag:'🇨🇳', industry:'Technology' },
  { symbol:'ZTO',   name:'ZTO Express',           country:'CN', flag:'🇨🇳', industry:'Logistics' },
  { symbol:'VIPS',  name:'Vipshop',               country:'CN', flag:'🇨🇳', industry:'E-Commerce' },
  { symbol:'IQ',    name:'iQIYI',                 country:'CN', flag:'🇨🇳', industry:'Media' },
  { symbol:'BILI',  name:'Bilibili',              country:'CN', flag:'🇨🇳', industry:'Media' },
  { symbol:'BZMF',  name:'BeiGene',               country:'CN', flag:'🇨🇳', industry:'Healthcare' },
  { symbol:'BGNE',  name:'BeiGene ADR',           country:'CN', flag:'🇨🇳', industry:'Healthcare' },
  { symbol:'WB',    name:'Weibo',                 country:'CN', flag:'🇨🇳', industry:'Technology' },
  { symbol:'TME',   name:'Tencent Music',         country:'CN', flag:'🇨🇳', industry:'Media' },
  { symbol:'HTHT',  name:'H World Hotels',        country:'CN', flag:'🇨🇳', industry:'Consumer' },
  { symbol:'RLX',   name:'RLX Technology',        country:'CN', flag:'🇨🇳', industry:'Consumer' },
  { symbol:'CANG',  name:'Cango',                 country:'CN', flag:'🇨🇳', industry:'Finance' },

  // ══════════════════════════════════════════════════════════════════════════
  // 🇯🇵 Japan — Top US-listed (ADRs only — home exchange symbols excluded)
  // ══════════════════════════════════════════════════════════════════════════
  { symbol:'TM',    name:'Toyota',                country:'JP', flag:'🇯🇵', industry:'Automotive' },
  { symbol:'MUFG',  name:'Mitsubishi UFJ',        country:'JP', flag:'🇯🇵', industry:'Finance' },
  { symbol:'SMFG',  name:'Sumitomo Mitsui',       country:'JP', flag:'🇯🇵', industry:'Finance' },
  { symbol:'SONY',  name:'Sony Group',            country:'JP', flag:'🇯🇵', industry:'Technology' },
  { symbol:'MFG',   name:'Mizuho Financial',      country:'JP', flag:'🇯🇵', industry:'Finance' },
  { symbol:'HMC',   name:'Honda',                 country:'JP', flag:'🇯🇵', industry:'Automotive' },
  { symbol:'NTT',   name:'NTT',                   country:'JP', flag:'🇯🇵', industry:'Telecom' },
  { symbol:'NTDOY', name:'Nintendo',              country:'JP', flag:'🇯🇵', industry:'Technology' },
  { symbol:'FANUY', name:'Fanuc',                 country:'JP', flag:'🇯🇵', industry:'Industrial' },
  { symbol:'KYCCF', name:'Kyocera',              country:'JP', flag:'🇯🇵', industry:'Technology' },
  { symbol:'TOELY', name:'Tokyo Electron',        country:'JP', flag:'🇯🇵', industry:'Semiconductors' },
  { symbol:'DSNKY', name:'Denso',                 country:'JP', flag:'🇯🇵', industry:'Automotive' },
  { symbol:'BRDCY', name:'Bridgestone',           country:'JP', flag:'🇯🇵', industry:'Automotive' },
  { symbol:'MSBHF', name:'Mitsubishi Corp',       country:'JP', flag:'🇯🇵', industry:'Industrial' },
  { symbol:'MSBHY', name:'Mitsubishi Corp ADR',   country:'JP', flag:'🇯🇵', industry:'Industrial' },
  { symbol:'ITOCY', name:'Itochu Corp',           country:'JP', flag:'🇯🇵', industry:'Industrial' },
  { symbol:'MITSF', name:'Mitsui & Co',           country:'JP', flag:'🇯🇵', industry:'Industrial' },
  { symbol:'MITSY', name:'Mitsui ADR',            country:'JP', flag:'🇯🇵', industry:'Industrial' },
  { symbol:'TKOMY', name:'Tokio Marine',          country:'JP', flag:'🇯🇵', industry:'Finance' },
  { symbol:'SGIOY', name:'Shin-Etsu Chemical',    country:'JP', flag:'🇯🇵', industry:'Chemicals' },
  { symbol:'KEYCY', name:'Keyence',               country:'JP', flag:'🇯🇵', industry:'Technology' },
  { symbol:'HTHIY', name:'Hitachi',               country:'JP', flag:'🇯🇵', industry:'Industrial' },
  { symbol:'FRNVF', name:'Fast Retailing',        country:'JP', flag:'🇯🇵', industry:'Retail' },
  { symbol:'ADTMY', name:'Advantest',             country:'JP', flag:'🇯🇵', industry:'Semiconductors' },
  { symbol:'MHVYF', name:'Mitsubishi Heavy Ind.', country:'JP', flag:'🇯🇵', industry:'Defense' },
];

// Deduplicate by symbol (keep first occurrence)
const seen = new Set();
const UNIVERSE = STOCK_UNIVERSE.filter(s => {
  if (seen.has(s.symbol)) return false;
  seen.add(s.symbol);
  return true;
});

const countryCounts = {};
UNIVERSE.forEach(s => { countryCounts[s.country] = (countryCounts[s.country] || 0) + 1; });

export const COUNTRIES = [...new Map(
  UNIVERSE.map(s => [s.country, { code: s.country, flag: s.flag, label: {
    US:'USA', GB:'UK', FR:'France', DE:'Germany', CH:'Switzerland',
    NL:'Netherlands', SE:'Sweden', DK:'Denmark', NO:'Norway', BE:'Belgium',
    ES:'Spain', IT:'Italy', KR:'Korea', SG:'Singapore', BR:'Brazil',
    AU:'Australia', CA:'Canada', CN:'China', JP:'Japan',
  }[s.country] || s.country }])
).values()].sort((a, b) => (countryCounts[b.code]||0) - (countryCounts[a.code]||0));

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
    return UNIVERSE.filter(s => s.country === code && (!activeIndustry || s.industry === activeIndustry)).length;
  }
  function industryCount(name) {
    return UNIVERSE.filter(s => s.industry === name && (!activeCountry || s.country === activeCountry)).length;
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
                {c.flag} {c.label}
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

      {/* Stock cards */}
      {filtered.length > 0 && (
        <div style={styles.stockGrid}>
          {filtered.map(s => {
            const isSelected = selected === s.symbol;
            return (
              <button key={s.symbol} style={{
                ...styles.stockCard,
                background:  isSelected ? 'var(--accent)' : 'var(--surface)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border2)',
                boxShadow:   isSelected ? '0 2px 8px rgba(196,101,74,0.2)' : 'none',
              }} onClick={() => onSelect(s.symbol)}>
                <span style={{ fontSize:'0.8rem', lineHeight:1 }}>{s.flag}</span>
                <span style={{
                  fontFamily:'var(--font-mono)', fontSize:'0.73rem', fontWeight:600,
                  color: isSelected ? '#fff' : 'var(--accent)', marginTop:3,
                }}>{s.symbol}</span>
                <span style={{
                  fontFamily:'var(--font-sans)', fontSize:'0.62rem', marginTop:2,
                  color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text)',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%',
                }}>{s.name}</span>
                <span style={{
                  fontFamily:'var(--font-mono)', fontSize:'0.55rem', marginTop:1,
                  color: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--muted)',
                }}>{s.industry}</span>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', color:'var(--muted)', padding:'0.5rem 0' }}>
          No stocks match the selected filters
        </p>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:'var(--radius-lg)', padding:'1.25rem 1.5rem',
    display:'flex', flexDirection:'column', gap:'1rem',
  },
  group:      { display:'flex', flexDirection:'column', gap:'0.5rem' },
  groupLabel: { fontFamily:'var(--font-mono)', fontSize:'0.62rem', letterSpacing:'0.1em', color:'var(--muted)', textTransform:'uppercase' },
  pills:      { display:'flex', flexWrap:'wrap', gap:'5px' },
  pill: {
    display:'inline-flex', alignItems:'center', gap:'5px',
    padding:'4px 12px', borderRadius:20, border:'1px solid',
    fontFamily:'var(--font-sans)', fontSize:'0.75rem',
    cursor:'pointer', transition:'all 0.15s', userSelect:'none',
  },
  pillCount:  { fontFamily:'var(--font-mono)', fontSize:'0.62rem' },
  stockGrid: {
    display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))',
    gap:'5px', borderTop:'1px solid var(--border)', paddingTop:'1rem',
  },
  stockCard: {
    display:'flex', flexDirection:'column', alignItems:'flex-start',
    padding:'7px 9px', borderRadius:7, border:'1px solid',
    cursor:'pointer', transition:'all 0.12s', textAlign:'left',
  },
};
