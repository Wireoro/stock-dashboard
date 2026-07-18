import express from 'express';
import axios from 'axios';
import cors from 'cors';
import NodeCache from 'node-cache';
import 'dotenv/config';

const app = express();

// Default cache TTL is intentionally long: Massive/Polygon's free tier caps
// out at 5 requests/minute, so short-TTL caching (the old Finnhub 15s default)
// would burn the whole budget on a single page load. Individual routes below
// override this per-key where a longer or shorter TTL makes sense.
const cache = new NodeCache({ stdTTL: 300 });
const BASE_URL = 'https://api.polygon.io';

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  }
}));
app.use(express.json());

// ── Massive / Polygon.io helper ───────────────────────────────────────────────
// Polygon.io rebranded to Massive in early 2026; api.polygon.io is still live
// and fully supported, so we keep using it rather than swap base URLs.
// Auth is via the `apiKey` query param (an Authorization: Bearer header also
// works, but the query param is simpler to thread through here).
//
// The free tier is rate-limited to 5 req/min, so on a 429 we back off and
// retry a couple of times rather than surface a flaky error to the frontend.
async function polygon(path, params = {}, { ttl } = {}) {
  const cacheKey = path + JSON.stringify(params);
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const maxAttempts = 3;
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data } = await axios.get(`${BASE_URL}${path}`, {
        params: { ...params, apiKey: process.env.POLYGON_API_KEY },
        timeout: 10000,
      });
      // Passing `undefined` for ttl makes node-cache fall back to its own
      // configured stdTTL automatically — no need to read it back out here.
      cache.set(cacheKey, data, ttl);
      return data;
    } catch (e) {
      lastErr = e;
      if (e.response?.status === 429 && attempt < maxAttempts - 1) {
        // Free tier: 5 req/min. Wait out a chunk of the window before retrying.
        await new Promise(r => setTimeout(r, 13000));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

// ── NLP helpers ───────────────────────────────────────────────────────────────
const POSITIVE_WORDS = [
  'beats','beat','growth','record','strong','upgrade','buy','surge','profit',
  'raise','positive','bullish','expand','gain','outperform','rally','soar',
  'exceed','boost','climb','jump','rise','high','best','win','top','leading',
  'innovative','breakthrough','partnership','acquisition','dividend','buyback',
];
const NEGATIVE_WORDS = [
  'miss','missed','cut','loss','weak','downgrade','sell','drop','decline',
  'layoff','negative','bearish','shrink','fall','underperform','investigation',
  'lawsuit','recall','debt','concern','risk','crash','slump','plunge','warn',
  'slow','disappointing','reduce','lower','below','worst','crisis','fail',
];

function nlpScore(text) {
  const lower    = text.toLowerCase();
  const posHits  = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
  const negHits  = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;
  const total    = posHits + negHits;
  if (total === 0) return 0;
  // Normalise to -1 … +1
  return Math.max(-1, Math.min(1, (posHits - negHits) / total));
}

function sentimentLabel(score) {
  if (score >=  0.35) return 'Very Positive';
  if (score >=  0.1)  return 'Positive';
  if (score >= -0.1)  return 'Neutral';
  if (score >= -0.35) return 'Negative';
  return 'Very Negative';
}

// ── Existing routes ───────────────────────────────────────────────────────────

// GET /api/quote?symbol=AAPL
// Finnhub's /quote returned {c,h,l,o,pc,d,dp} in one call. Polygon/Massive has
// no single "quote" endpoint on the free tier, so we combine the previous
// day's OHLC bar (/v2/aggs/ticker/{t}/prev) with the latest trade
// (/v2/last/trade/{t}) and reshape into the same field names, so QuoteCard.jsx
// needs no changes.
app.get('/api/quote', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const sym = symbol.toUpperCase();
    const [prev, lastTrade] = await Promise.all([
      polygon(`/v2/aggs/ticker/${sym}/prev`, {}, { ttl: 60 }),
      polygon(`/v2/last/trade/${sym}`, {}, { ttl: 15 })
        .catch(() => null), // last trade needs a paid real-time entitlement; degrade gracefully
    ]);

    const bar = prev?.results?.[0];
    if (!bar) return res.status(404).json({ error: 'No data for symbol' });

    const pc = bar.c;                                   // previous close
    const currentPrice = lastTrade?.results?.p ?? bar.c; // fall back to prev close if no real-time trade access
    const change = currentPrice - pc;
    const changePct = pc ? (change / pc) * 100 : 0;

    res.json({
      c:  currentPrice,   // current price
      h:  bar.h,           // day high (previous session, since free tier has no live high)
      l:  bar.l,           // day low
      o:  bar.o,           // open
      pc,                   // previous close
      d:  change,
      dp: changePct,
      t:  bar.t ? Math.floor(bar.t / 1000) : undefined,
    });
  } catch (e) {
    console.error('/api/quote error:', e.message);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// GET /api/search?q=apple
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });
  try {
    const data = await polygon('/v3/reference/tickers', {
      search: q, active: true, market: 'stocks', limit: 8,
    }, { ttl: 3600 });
    const results = (data.results || []).map(t => ({
      symbol:      t.ticker,
      description: t.name,
      type:        t.type,
      displaySymbol: t.ticker,
    }));
    res.json(results);
  } catch (e) {
    console.error('/api/search error:', e.message);
    res.status(500).json({ error: 'Failed to search' });
  }
});

// GET /api/candles?symbol=AAPL&resolution=D&from=unix&to=unix
// Finnhub took a resolution code (1,5,15,30,60,D,W,M) and unix timestamps.
// Polygon/Massive aggregates use /range/{multiplier}/{timespan}/{from}/{to}
// with from/to as YYYY-MM-DD (or ms epoch) and returns {t,o,h,l,c,v} bars —
// shaped differently enough that StockChart.jsx needs a small adapter, done
// here so the response still looks like Finnhub's {c:[],h:[],l:[],o:[],t:[],v:[],s:'ok'}.
const RESOLUTION_MAP = {
  '1':  [1, 'minute'],  '5':  [5, 'minute'],  '15': [15, 'minute'],
  '30': [30, 'minute'], '60': [1, 'hour'],
  'D':  [1, 'day'],     'W':  [1, 'week'],    'M':  [1, 'month'],
};
app.get('/api/candles', async (req, res) => {
  const { symbol, resolution = 'D', from, to } = req.query;
  if (!symbol || !from || !to) return res.status(400).json({ error: 'symbol, from, and to are required' });
  try {
    const sym = symbol.toUpperCase();
    const [multiplier, timespan] = RESOLUTION_MAP[resolution] || RESOLUTION_MAP.D;
    // Polygon accepts unix ms or YYYY-MM-DD; Finnhub's `from`/`to` here are unix seconds.
    const fromDate = new Date(Number(from) * 1000).toISOString().slice(0, 10);
    const toDate   = new Date(Number(to)   * 1000).toISOString().slice(0, 10);

    const data = await polygon(
      `/v2/aggs/ticker/${sym}/range/${multiplier}/${timespan}/${fromDate}/${toDate}`,
      { adjusted: true, sort: 'asc', limit: 5000 },
      { ttl: 300 },
    );

    const bars = data.results || [];
    if (bars.length === 0) return res.json({ s: 'no_data' });

    res.json({
      s: 'ok',
      t: bars.map(b => Math.floor(b.t / 1000)), // ms → seconds, to match Finnhub's unix-seconds convention
      o: bars.map(b => b.o),
      h: bars.map(b => b.h),
      l: bars.map(b => b.l),
      c: bars.map(b => b.c),
      v: bars.map(b => b.v),
    });
  } catch (e) {
    console.error('/api/candles error:', e.message);
    res.status(500).json({ error: 'Failed to fetch candles' });
  }
});

// GET /api/profile?symbol=AAPL
app.get('/api/profile', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const sym = symbol.toUpperCase();
    const data = await polygon(`/v3/reference/tickers/${sym}`, {}, { ttl: 3600 });
    const r = data.results;
    if (!r) return res.status(404).json({ error: 'No profile found' });

    res.json({
      name:                r.name,
      ticker:               r.ticker,
      exchange:             r.primary_exchange,
      // Finnhub called this field `finnhubIndustry`; CompanyProfile.jsx reads
      // it directly, so we keep the same key name pointing at Polygon's SIC description.
      finnhubIndustry:      r.sic_description,
      logo:                 r.branding?.logo_url
        ? `${r.branding.logo_url}?apiKey=${process.env.POLYGON_API_KEY}`
        : null,
      weburl:               r.homepage_url,
      country:              r.locale ? r.locale.toUpperCase() : null,
      currency:             r.currency_name ? r.currency_name.toUpperCase() : 'USD',
      shareOutstanding:     r.share_class_shares_outstanding
        ? r.share_class_shares_outstanding / 1e6  // Finnhub reported this in millions
        : null,
      marketCapitalization: r.market_cap ? r.market_cap / 1e6 : null, // Finnhub also reported in millions
      ipo:                  r.list_date,
      phone:                r.phone_number,
      employees:            r.total_employees,
    });
  } catch (e) {
    console.error('/api/profile error:', e.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/news?symbol=AAPL
app.get('/api/news', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await polygon('/v2/reference/news', {
      ticker: symbol.toUpperCase(), limit: 5, order: 'desc', sort: 'published_utc',
    }, { ttl: 300 });

    const articles = (data.results || []).map(a => ({
      id:        a.id,
      headline:  a.title,
      source:    a.publisher?.name,
      url:       a.article_url,
      image:     a.image_url,
      summary:   a.description,
      datetime:  Math.floor(new Date(a.published_utc).getTime() / 1000), // Finnhub used unix seconds
    }));
    res.json(articles);
  } catch (e) {
    console.error('/api/news error:', e.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// GET /api/metrics?symbol=AAPL
// Finnhub's /stock/metric?metric=all bundled dozens of ratios (P/E, ROE,
// margins, beta, 52-week range, etc.) in one free-tier call. Polygon/Massive
// has no direct equivalent on the free tier — the closest thing
// (/stocks/financials/v1/ratios) sits behind the paid "Financials & Ratios
// Expansion" add-on. Rather than fake numbers, this derives what it can from
// data that IS free (52-week high/low from daily aggregates, market cap from
// ticker overview) and returns null for anything that needs the paid ratios
// endpoint. Metrics.jsx already renders '—' for null values, so this degrades
// visibly instead of silently.
app.get('/api/metrics', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const sym   = symbol.toUpperCase();
    const to    = new Date().toISOString().slice(0, 10);
    const from  = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [yearBars, overview] = await Promise.all([
      polygon(`/v2/aggs/ticker/${sym}/range/1/day/${from}/${to}`, { adjusted: true, sort: 'asc', limit: 400 }, { ttl: 3600 }),
      polygon(`/v3/reference/tickers/${sym}`, {}, { ttl: 3600 }),
    ]);

    const bars = yearBars.results || [];
    const week52High = bars.length ? Math.max(...bars.map(b => b.h)) : null;
    const week52Low  = bars.length ? Math.min(...bars.map(b => b.l)) : null;

    res.json({
      metric: {
        '52WeekHigh': week52High,
        '52WeekLow':  week52Low,
        marketCapitalization: overview.results?.market_cap ? overview.results.market_cap / 1e6 : null,
        // Not available without the paid Ratios add-on — surfaced as null
        // rather than guessed, so the UI shows '—' honestly:
        peBasicExclExtraTTM:          null,
        epsBasicExclExtraItemsTTM:    null,
        beta:                         null,
        dividendYieldIndicatedAnnual: null,
        roeTTM:                       null,
        revenueGrowthTTMYoy:          null,
        grossMarginTTM:               null,
        netProfitMarginTTM:           null,
        totalDebt_totalEquityQuarterly: null,
        currentRatioQuarterly:        null,
      },
    });
  } catch (e) {
    console.error('/api/metrics error:', e.message);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// NOTE: /api/earnings and /api/recommendations (Finnhub's EPS-estimate-vs-
// actual earnings history and analyst strongBuy/buy/hold/sell/strongSell
// recommendation trends) have been removed. Polygon/Massive has no
// equivalent data source for either — there's no analyst consensus endpoint
// and no earnings-estimate feed. The corresponding frontend pieces
// (Earnings.jsx, and the already-unused Analysts.jsx) have been removed too;
// see the frontend changes below.

// Shared by /api/insiders and /api/insider-sentiment.
//
// Finnhub's /stock/insider-transactions has no Polygon/Massive equivalent by
// that name; the closest source is SEC Form 4 filings
// (GET /stocks/filings/vX/form-4), which Massive added in April 2026.
// This normalizes each filing/transaction row to the same field names the
// old Finnhub route produced (name, change, transactionPrice,
// transactionDate) so both downstream consumers — Insiders.jsx and the
// insider-sentiment scoring math — work unmodified.
//
// IMPORTANT: Massive's Form 4 endpoint returns one row per *filing*, and a
// single filing can carry multiple reported transactions (see their form-4
// docs). The exact field names for the per-transaction share count and price
// weren't confirmed against a live response while building this — the code
// below tries the documented/likely field names with fallbacks. Log a
// sample response once your API key is active and adjust the field-name
// candidates in the `pick()` calls below if anything comes through as null.
async function fetchForm4Transactions(symbol) {
  const data = await polygon('/stocks/filings/vX/form-4', {
    ticker: symbol, limit: 50, sort: 'filing_date.desc',
  }, { ttl: 3600 });

  const filings = data.results || data.filings || [];
  const pick = (obj, ...keys) => keys.map(k => obj[k]).find(v => v !== undefined && v !== null);

  return filings.map(f => {
    const shares    = Number(pick(f, 'shares_transacted', 'transaction_shares', 'shares', 'amount') ?? 0);
    const price     = Number(pick(f, 'price_per_share', 'transaction_price', 'price') ?? 0);
    const isSale    = pick(f, 'transaction_code') === 'S' || pick(f, 'transaction_type') === 'sale';
    const isGrant   = ['A', 'G'].includes(pick(f, 'transaction_code'));

    return {
      name:             pick(f, 'reporting_owner_name', 'owner_name', 'insider_name') || 'Unknown',
      share:            shares,
      change:           isSale ? -Math.abs(shares) : isGrant ? 0 : Math.abs(shares),
      transactionPrice: price,
      transactionDate:  pick(f, 'transaction_date', 'filing_date'),
      transactionCode:  pick(f, 'transaction_code'),
      isDirector:       pick(f, 'is_director') ?? false,
      isOfficer:        pick(f, 'is_officer') ?? false,
      // Form 4 doesn't give a free-text title the way Finnhub's proprietary
      // field did — approximate from the role flags instead.
      officerTitle:     pick(f, 'is_officer') ? (pick(f, 'officer_title') || 'Officer')
                          : pick(f, 'is_director') ? 'Director'
                          : pick(f, 'is_ten_percent_owner') ? '10% Owner'
                          : null,
    };
  }).filter(t => t.change !== 0);
}

// GET /api/insiders?symbol=AAPL
app.get('/api/insiders', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await fetchForm4Transactions(symbol.toUpperCase());
    res.json(data.slice(0, 10));
  } catch (e) {
    console.error('/api/insiders error:', e.message);
    res.status(500).json({ error: 'Failed to fetch insider transactions' });
  }
});

// GET /api/peers?symbol=AAPL
app.get('/api/peers', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await polygon(`/v1/related-companies/${symbol.toUpperCase()}`, {}, { ttl: 3600 });
    const peers = (data.results || []).map(r => r.ticker);
    res.json(peers);
  } catch (e) {
    console.error('/api/peers error:', e.message);
    res.status(500).json({ error: 'Failed to fetch peers' });
  }
});

app.get('/api/insider-sentiment', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const transactions = await fetchForm4Transactions(symbol.toUpperCase());
    if (!transactions.length) {
      return res.json({ score: 50, totalBuyValue: 0, totalSellValue: 0,
        totalBuyers: 0, totalSellers: 0, netShares: 0, recentTransactions: [] });
    }
    const cutoff  = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const recent  = transactions.filter(t =>
      !isNaN(new Date(t.transactionDate)) && new Date(t.transactionDate).getTime() >= cutoff);
    const buyers  = new Set(), sellers = new Set();
    let buyValue = 0, sellValue = 0, netShares = 0;
    recent.forEach(t => {
      const val = Math.abs((t.change || 0) * (t.transactionPrice || 0));
      if (t.change > 0) { buyers.add(t.name);  buyValue  += val; netShares += t.change; }
      else if (t.change < 0) { sellers.add(t.name); sellValue += val; netShares += t.change; }
    });
    const totalVal = buyValue + sellValue;
    let score = 50;
    if (totalVal > 0) {
      score = (buyValue / totalVal) * 100;
      const tp = buyers.size + sellers.size;
      if (tp > 0) score = score * 0.7 + (buyers.size / tp) * 100 * 0.3;
      score = Math.min(100, Math.max(0, score + (netShares > 0 ? 5 : netShares < 0 ? -5 : 0)));
    }
    res.json({ score: Math.round(score), totalBuyValue: buyValue, totalSellValue: sellValue,
      totalBuyers: buyers.size, totalSellers: sellers.size, netShares,
      recentTransactions: recent.slice(0, 6) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute insider sentiment' });
  }
});

app.get('/api/gov-spending', async (req, res) => {
  const { company } = req.query;
  if (!company) return res.status(400).json({ error: 'company is required' });

  // Cache gov spending for 1 hour — data doesn't change often
  const cacheKey = `gov_${company.toLowerCase().slice(0, 30)}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    const currentYear = new Date().getFullYear();
    const years       = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

    // Strip common suffixes for better search ("Apple Inc" → "Apple")
    const searchTerm = company
      .replace(/\b(inc|corp|corporation|ltd|llc|co|company|technologies|systems|group)\b\.?/gi, '')
      .trim();

    async function fetchYear(year) {
      try {
        const r = await axios.post(
          'https://api.usaspending.gov/api/v2/search/spending_by_award/',
          {
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
          },
          { timeout: 20000 }  // generous timeout for slow API
        );
        return {
          year,
          results: r.data?.results || [],
          total:   r.data?.page_metadata?.total || 0,
        };
      } catch {
        return { year, results: [], total: 0 };
      }
    }

    // Fetch years sequentially to avoid overwhelming the API
    const yearResults = [];
    for (const year of years) {
      yearResults.push(await fetchYear(year));
    }

    const thisYear    = yearResults[0];
    const totalAmount = thisYear.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0);

    // If no results, return empty so frontend hides the section
    if (totalAmount === 0 && thisYear.total === 0) {
      const empty = { totalAmount: 0, totalContracts: 0, agencies: [], recentAwards: [], yearOverYear: [] };
      cache.set(cacheKey, empty, 3600);
      return res.json(empty);
    }

    const agencyMap = {};
    thisYear.results.forEach(r => {
      const a = r['Awarding Agency'] || 'Unknown Agency';
      agencyMap[a] = (agencyMap[a] || 0) + (r['Award Amount'] || 0);
    });

    const result = {
      totalAmount,
      totalContracts: thisYear.total,
      searchTerm,
      agencies: Object.entries(agencyMap)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
      recentAwards: thisYear.results.slice(0, 6).map(r => ({
        description: r['Description']     || 'Contract award',
        recipient:   r['Recipient Name']  || company,
        agency:      r['Awarding Agency'] || '—',
        amount:      r['Award Amount']    || 0,
        date:        r['Action Date']     || '—',
      })),
      yearOverYear: yearResults.map(y => ({
        year:   y.year,
        amount: y.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0),
      })),
    };

    cache.set(cacheKey, result, 3600); // cache 1 hour
    res.json(result);

  } catch (e) {
    console.error('/api/gov-spending error:', e.message);
    res.status(500).json({ error: 'Failed to fetch government spending data' });
  }
});

// ── NEWS SENTIMENT (free tier — NLP on company-news) ─────────────────────────
// Shared by /api/news-sentiment and /api/social-sentiment.
// Finnhub's /company-news took explicit from/to dates and returned exactly
// that window. Polygon/Massive's /v2/reference/news doesn't take a date
// range the same way for a single ticker — it returns most-recent-first — so
// we pull a generous `limit` and filter by `published_utc` client-side to
// reconstruct the same 30-day/7-day windowing the old code relied on.
async function fetchPolygonNews(symbol, days) {
  const data = await polygon('/v2/reference/news', {
    ticker: symbol, limit: 100, order: 'desc', sort: 'published_utc',
  }, { ttl: 300 });

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return (data.results || [])
    .filter(a => new Date(a.published_utc).getTime() >= cutoff)
    .map(a => ({
      headline: a.title,
      source:   a.publisher?.name,
      url:      a.article_url,
      summary:  a.description,
      datetime: Math.floor(new Date(a.published_utc).getTime() / 1000), // unix seconds, matches Finnhub convention
    }));
}

app.get('/api/news-sentiment', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const sym  = symbol.toUpperCase();

    // One 30-day fetch, sliced client-side for the 7-day window — cheaper
    // than two separate calls given the 5 req/min free-tier ceiling.
    const articles30 = await fetchPolygonNews(sym, 30);
    const articles7  = articles30.filter(a => (Date.now() / 1000 - a.datetime) < 7 * 24 * 60 * 60);

    if (articles30.length === 0) {
      return res.json({ error: 'no_data' });
    }

    // Score every article
    const scored = articles30.map(a => ({
      headline:  a.headline,
      source:    a.source,
      url:       a.url,
      date:      new Date(a.datetime * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sentiment: nlpScore((a.headline || '') + ' ' + (a.summary || '')),
    }));

    // Overall company score = average of all article scores
    const companyScore = scored.reduce((s, a) => s + a.sentiment, 0) / scored.length;

    // 7-day vs 30-day trend
    const score7d  = articles7.length > 0
      ? articles7.map(a => nlpScore((a.headline || '') + ' ' + (a.summary || '')))
          .reduce((s, v) => s + v, 0) / articles7.length
      : companyScore;

    // Buzz: how many articles this week vs avg weekly over 30 days
    const weeklyAverage = articles30.length / 4;
    const buzzChange    = weeklyAverage > 0
      ? ((articles7.length - weeklyAverage) / weeklyAverage)
      : 0;

    // Breakdown by sentiment bucket
    const positive = scored.filter(a => a.sentiment >  0.1).length;
    const negative = scored.filter(a => a.sentiment < -0.1).length;
    const neutral  = scored.length - positive - negative;

    res.json({
      companyScore,
      score7d,
      trend:             scored.slice(0, 14).map(a => a.sentiment).reverse(),
      articlesProcessed: scored.length,
      label:             sentimentLabel(companyScore),
      breakdown:         { positive, negative, neutral, total: scored.length },
      buzz: {
        weeklyAverage: Math.round(weeklyAverage),
        buzzChange,
        articles7d: articles7.length,
      },
      articles: scored.slice(0, 8),
    });
  } catch (e) {
    console.error('/api/news-sentiment error:', e.message);
    res.status(500).json({ error: 'Failed to analyse news sentiment' });
  }
});

// ── SOCIAL SENTIMENT (free tier — derived from news only) ─────────────────────
// Previously blended 3 signals: news NLP, Finnhub analyst-recommendation
// consensus, and news-volume momentum. The recommendation signal is gone
// along with /api/recommendations (Polygon/Massive has no analyst-consensus
// endpoint), so this now blends news sentiment + momentum only, reweighted
// to fill the gap left by the analyst signal.
app.get('/api/social-sentiment', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const sym = symbol.toUpperCase();
    const articles = await fetchPolygonNews(sym, 30);
    if (articles.length === 0) return res.json({ error: 'no_data' });

    // ── Signal 1: News NLP sentiment ──────────────────────────────────────────
    const newsScores  = articles.map(a =>
      nlpScore((a.headline || '') + ' ' + (a.summary || '')));
    const newsAvg     = newsScores.reduce((s, v) => s + v, 0) / (newsScores.length || 1);
    const newsMentions = articles.length;

    // Analyst-consensus signal removed (no Polygon/Massive data source).
    // SocialSentiment.jsx only renders the "Analyst consensus" line when
    // analystLabel is truthy, so null here cleanly hides it rather than
    // showing an explanatory string dressed up in the same UI slot as a
    // real Strong Buy/Buy/Hold/Sell label.
    const analystScore = null;
    const analystLabel = null;

    // ── Signal 2: Price momentum from recent news volume ─────────────────────
    const recentCount = articles.filter(a => {
      const age = Date.now() - a.datetime * 1000;
      return age < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const momentumScore = newsAvg * (recentCount > 5 ? 1.2 : 1.0); // amplify if lots of news

    // ── Combine signals (weighted) ────────────────────────────────────────────
    // Old weights: news 0.5, analyst 0.4, momentum 0.1. With analyst gone,
    // its 0.4 is folded back into news (the strongest remaining signal).
    const overall = (newsAvg * 0.9) + (momentumScore * 0.1);

    // ── Build platform breakdown ──────────────────────────────────────────────
    // Group articles by source as proxy for "platforms"
    const sourceMap = {};
    articles.forEach(a => {
      const src = a.source || 'Unknown';
      if (!sourceMap[src]) sourceMap[src] = [];
      sourceMap[src].push(nlpScore((a.headline || '') + ' ' + (a.summary || '')));
    });
    const platforms = Object.entries(sourceMap)
      .map(([source, scores]) => ({
        source,
        score:    scores.reduce((s, v) => s + v, 0) / scores.length,
        mentions: scores.length,
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 6);

    // ── 7-day trend ───────────────────────────────────────────────────────────
    const trend = articles.slice(0, 14)
      .map(a => nlpScore((a.headline || '') + ' ' + (a.summary || '')))
      .reverse();

    // ── Mention stats ─────────────────────────────────────────────────────────
    const posCount = newsScores.filter(s => s >  0.1).length;
    const negCount = newsScores.filter(s => s < -0.1).length;
    const positivePct = Math.round((posCount / newsScores.length) * 100);
    const negativePct = Math.round((negCount / newsScores.length) * 100);

    // ── Recent posts (formatted news articles) ────────────────────────────────
    const posts = articles.slice(0, 8).map(a => ({
      source:    a.source || 'News',
      text:      a.headline,
      sentiment: nlpScore((a.headline || '') + ' ' + (a.summary || '')),
      url:       a.url,
      date:      new Date(a.datetime * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    res.json({
      overall,
      analystScore,
      analystLabel,
      platforms,
      trend,
      mentions: {
        day:      recentCount,
        week:     newsMentions,
        positive: positivePct,
        negative: negativePct,
        neutral:  100 - positivePct - negativePct,
      },
      posts,
      note: 'Signals derived from news NLP + news-volume momentum (analyst consensus unavailable — Massive/Polygon has no equivalent data source)',
    });
  } catch (e) {
    console.error('/api/social-sentiment error:', e.message);
    res.status(500).json({ error: 'Failed to compute social sentiment' });
  }
});


// ── StockTwits ────────────────────────────────────────────────────────────────
// GET /api/stocktwits?symbol=AAPL
// Free API — no key needed. Returns real retail trader sentiment + live feed.
app.get('/api/stocktwits', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const sym      = symbol.toUpperCase();
    const cacheKey = `stocktwits_${sym}`;
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    const response = await axios.get(
      `https://api.stocktwits.com/api/2/streams/symbol/${sym}.json`,
      {
        params:  { limit: 30 },
        timeout: 8000,
        headers: { 'User-Agent': 'StockDashboard/1.0' },
      }
    );

    const raw      = response.data;
    const messages = (raw.messages || []).map(m => ({
      id:        m.id,
      body:      m.body,
      createdAt: m.created_at,
      sentiment: m.entities?.sentiment?.basic || null,
      username:  m.user?.username,
      followers: m.user?.followers,
      likes:     m.likes?.total || 0,
    }));

    const bullish = messages.filter(m => m.sentiment === 'Bullish').length;
    const bearish = messages.filter(m => m.sentiment === 'Bearish').length;

    const result = {
      symbol:         sym,
      bullish,
      bearish,
      total:          messages.length,
      watchlistCount: raw.symbol?.watchlist_count || null,
      messages,
    };

    cache.set(cacheKey, result, 60);
    res.json(result);
  } catch (e) {
    if (e.response?.status === 404) return res.json({ error: 'symbol_not_found' });
    if (e.response?.status === 429) return res.status(429).json({ error: 'rate_limited' });
    console.error('/api/stocktwits error:', e.message);
    res.status(500).json({ error: 'Failed to fetch StockTwits data' });
  }
});


// ── ESG Score (Yahoo Finance / Sustainalytics) ────────────────────────────────
// GET /api/esg?symbol=AAPL
// Uses Yahoo Finance quoteSummary esgScores module — free, no key needed
app.get('/api/esg', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });

  const cacheKey = `esg_${symbol.toUpperCase()}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    const sym = symbol.toUpperCase();

    const response = await axios.get(
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${sym}`,
      {
        params: { modules: 'esgScores' },
        timeout: 10000,
        headers: {
          'User-Agent':  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept':      'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer':     'https://finance.yahoo.com/',
        },
      }
    );

    const esg = response.data?.quoteSummary?.result?.[0]?.esgScores;

    if (!esg) {
      return res.json({ error: 'no_data' });
    }

    // ratingYear + ratingMonth give us the last updated date
    const lastUpdated = esg.ratingYear && esg.ratingMonth
      ? `${esg.ratingMonth}/${esg.ratingYear}`
      : null;

    // Controversy levels 0-5 (0 = none, 5 = severe)
    const controversyMap = {
      0: 'None', 1: 'Low', 2: 'Moderate', 3: 'Significant', 4: 'High', 5: 'Severe',
    };

    const result = {
      totalScore:           esg.totalEsg?.raw          ?? null,
      environmentScore:     esg.environmentScore?.raw  ?? null,
      socialScore:          esg.socialScore?.raw        ?? null,
      governanceScore:      esg.governanceScore?.raw    ?? null,
      // Risk level derived from total score (lower = less risk on Sustainalytics scale)
      riskLevel:            esg.totalEsg?.raw != null
        ? esg.totalEsg.raw < 10  ? 'Negligible'
        : esg.totalEsg.raw < 20  ? 'Low'
        : esg.totalEsg.raw < 30  ? 'Medium'
        : esg.totalEsg.raw < 40  ? 'High'
        : 'Severe'
        : null,
      percentile:           esg.percentile?.raw          ?? null,
      peerGroup:            esg.peerGroup                ?? null,
      peerCount:            esg.peerCount                ?? null,
      controversyLevel:     esg.highestControversy != null
        ? controversyMap[esg.highestControversy] ?? `Level ${esg.highestControversy}`
        : null,
      // Involvement flags
      adultInvolvement:     esg.adult                   ?? false,
      alcoholInvolvement:   esg.alcoholic               ?? false,
      weaponsInvolvement:   esg.weapons                 ?? false,
      furInvolvement:       esg.furLeather               ?? false,
      gamblingInvolvement:  esg.gambling                ?? false,
      gmoInvolvement:       esg.gmo                     ?? false,
      nuclearInvolvement:   esg.nuclear                 ?? false,
      pesticideInvolvement: esg.pesticides              ?? false,
      palmOilInvolvement:   esg.palmOil                 ?? false,
      smallArmsInvolvement: esg.smallArms               ?? false,
      coalInvolvement:      esg.coal                    ?? false,
      tobaccoInvolvement:   esg.tobacco                 ?? false,
      lastUpdated,
      source: 'Yahoo Finance / Sustainalytics',
    };

    cache.set(cacheKey, result, 3600); // cache 1 hour
    res.json(result);

  } catch (e) {
    // Yahoo Finance returns 404 for symbols with no ESG data
    if (e.response?.status === 404) {
      return res.json({ error: 'no_data' });
    }
    console.error('/api/esg error:', e.message);
    res.status(500).json({ error: 'Failed to fetch ESG data' });
  }
});


// ── ROE History ─────────────────────────────────────────────────────────────
// GET /api/roe-history?symbol=AAPL
// Finnhub's /stock/metric?metric=all included multi-year annual ROE/ROA/
// margin *series* for free. Polygon/Massive has no free equivalent — its
// closest dataset (/stocks/financials/v1/ratios) sits behind the paid
// "Financials & Ratios Expansion" add-on, and even then only exposes
// current/TTM ratios, not a historical annual series. Rather than fabricate
// a chart, this returns the same { error: 'no_data' } shape the old route
// used for symbols with no data — ROEChart.jsx already hides itself on that
// response, so the panel just won't render instead of showing wrong numbers.
// If you add the Ratios add-on later, this is the place to wire it in.
app.get('/api/roe-history', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  res.json({ error: 'no_data' });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running → http://localhost:${PORT}`);
  if (!process.env.POLYGON_API_KEY) {
    console.warn('⚠️  POLYGON_API_KEY is not set — requests will fail');
  }
});
