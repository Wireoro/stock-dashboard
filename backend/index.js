import express from 'express';
import axios from 'axios';
import cors from 'cors';
import NodeCache from 'node-cache';
import 'dotenv/config';

const app = express();
const cache = new NodeCache({ stdTTL: 15 });
const BASE_URL = 'https://finnhub.io/api/v1';

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  }
}));
app.use(express.json());

// ── Finnhub helper ────────────────────────────────────────────────────────────
async function finnhub(path, params = {}) {
  const cacheKey = path + JSON.stringify(params);
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const { data } = await axios.get(`${BASE_URL}${path}`, {
    params: { ...params, token: process.env.FINNHUB_API_KEY },
    timeout: 8000,
  });
  cache.set(cacheKey, data);
  return data;
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

app.get('/api/quote', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try { res.json(await finnhub('/quote', { symbol: symbol.toUpperCase() })); }
  catch (e) { res.status(500).json({ error: 'Failed to fetch quote' }); }
});

app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });
  try {
    const data = await finnhub('/search', { q });
    res.json((data.result || []).slice(0, 8));
  } catch (e) { res.status(500).json({ error: 'Failed to search' }); }
});

app.get('/api/candles', async (req, res) => {
  const { symbol, resolution = 'D', from, to } = req.query;
  if (!symbol || !from || !to) return res.status(400).json({ error: 'symbol, from, and to are required' });
  try { res.json(await finnhub('/stock/candle', { symbol: symbol.toUpperCase(), resolution, from, to })); }
  catch (e) { res.status(500).json({ error: 'Failed to fetch candles' }); }
});

app.get('/api/profile', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try { res.json(await finnhub('/stock/profile2', { symbol: symbol.toUpperCase() })); }
  catch (e) { res.status(500).json({ error: 'Failed to fetch profile' }); }
});

app.get('/api/news', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  const to   = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  try {
    const data = await finnhub('/company-news', { symbol: symbol.toUpperCase(), from, to });
    res.json((data || []).slice(0, 5));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch news' }); }
});

app.get('/api/metrics', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try { res.json(await finnhub('/stock/metric', { symbol: symbol.toUpperCase(), metric: 'all' })); }
  catch (e) { res.status(500).json({ error: 'Failed to fetch metrics' }); }
});

app.get('/api/earnings', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try { res.json(await finnhub('/stock/earnings', { symbol: symbol.toUpperCase(), limit: 8 }) || []); }
  catch (e) { res.status(500).json({ error: 'Failed to fetch earnings' }); }
});

app.get('/api/recommendations', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/recommendation', { symbol: symbol.toUpperCase() });
    res.json((data || []).slice(0, 6));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch recommendations' }); }
});

app.get('/api/insiders', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/insider-transactions', { symbol: symbol.toUpperCase() });
    res.json((data?.data || []).slice(0, 10));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch insider transactions' }); }
});

app.get('/api/peers', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try { res.json(await finnhub('/stock/peers', { symbol: symbol.toUpperCase() }) || []); }
  catch (e) { res.status(500).json({ error: 'Failed to fetch peers' }); }
});

app.get('/api/insider-sentiment', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data         = await finnhub('/stock/insider-transactions', { symbol: symbol.toUpperCase() });
    const transactions = data?.data || [];
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
app.get('/api/news-sentiment', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const sym  = symbol.toUpperCase();
    const to   = new Date().toISOString().slice(0, 10);

    // Fetch 30 days of news for a stronger signal
    const from30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const from7  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [news30, news7] = await Promise.all([
      finnhub('/company-news', { symbol: sym, from: from30, to }),
      finnhub('/company-news', { symbol: sym, from: from7,  to }),
    ]);

    const articles30 = news30 || [];
    const articles7  = news7  || [];

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

// ── SOCIAL SENTIMENT (free tier — derived from news + recommendations) ────────
app.get('/api/social-sentiment', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const sym  = symbol.toUpperCase();
    const to   = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Use 3 free signals in parallel
    const [news, recs, peers] = await Promise.all([
      finnhub('/company-news',       { symbol: sym, from, to }),
      finnhub('/stock/recommendation',{ symbol: sym }),
      finnhub('/stock/peers',         { symbol: sym }),
    ]);

    const articles = news || [];
    if (articles.length === 0) return res.json({ error: 'no_data' });

    // ── Signal 1: News NLP sentiment ──────────────────────────────────────────
    const newsScores  = articles.map(a =>
      nlpScore((a.headline || '') + ' ' + (a.summary || '')));
    const newsAvg     = newsScores.reduce((s, v) => s + v, 0) / (newsScores.length || 1);
    const newsMentions = articles.length;

    // ── Signal 2: Analyst consensus → map to -1…+1 ───────────────────────────
    const latestRec   = (recs || [])[0];
    let analystScore  = 0;
    let analystLabel  = 'No data';
    if (latestRec) {
      const total = (latestRec.strongBuy || 0) + (latestRec.buy || 0) +
                    (latestRec.hold || 0) + (latestRec.sell || 0) + (latestRec.strongSell || 0);
      if (total > 0) {
        const weighted =
          (latestRec.strongBuy  || 0) *  1.0 +
          (latestRec.buy        || 0) *  0.5 +
          (latestRec.hold       || 0) *  0   +
          (latestRec.sell       || 0) * -0.5 +
          (latestRec.strongSell || 0) * -1.0;
        analystScore = weighted / total;
        const bullish = (latestRec.strongBuy || 0) + (latestRec.buy || 0);
        const bearish = (latestRec.sell || 0) + (latestRec.strongSell || 0);
        analystLabel  = bullish > bearish * 2 ? 'Strong Buy'
          : bullish > bearish ? 'Buy'
          : bearish > bullish * 2 ? 'Strong Sell'
          : bearish > bullish ? 'Sell' : 'Hold';
      }
    }

    // ── Signal 3: Price momentum from recent news volume ─────────────────────
    const recentCount = articles.filter(a => {
      const age = Date.now() - a.datetime * 1000;
      return age < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const momentumScore = newsAvg * (recentCount > 5 ? 1.2 : 1.0); // amplify if lots of news

    // ── Combine signals (weighted) ────────────────────────────────────────────
    const overall = (newsAvg * 0.5) + (analystScore * 0.4) + (momentumScore * 0.1);

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
      note: 'Signals derived from news NLP + analyst consensus (free tier)',
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



// ── ESG Score (Yahoo Finance / Sustainalytics via yahoo-finance2) ─────────────
// GET /api/esg?symbol=AAPL
// Uses yahoo-finance2 npm package which handles Yahoo auth properly
app.get('/api/esg', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });

  const cacheKey = `esg_${symbol.toUpperCase()}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    const sym = symbol.toUpperCase();

    // Dynamically import yahoo-finance2 (ESM compatible)
    const yf = (await import('yahoo-finance2')).default;

    const result = await yf.quoteSummary(sym, {
      modules: ['esgScores'],
    });

    const esg = result?.esgScores;

    if (!esg || Object.keys(esg).length === 0) {
      return res.json({ error: 'no_data' });
    }

    const lastUpdated = esg.ratingYear && esg.ratingMonth
      ? `${esg.ratingMonth}/${esg.ratingYear}`
      : null;

    const controversyMap = {
      0: 'None', 1: 'Low', 2: 'Moderate',
      3: 'Significant', 4: 'High', 5: 'Severe',
    };

    const data = {
      totalScore:           esg.totalEsg          ?? null,
      environmentScore:     esg.environmentScore  ?? null,
      socialScore:          esg.socialScore       ?? null,
      governanceScore:      esg.governanceScore   ?? null,
      riskLevel:            esg.totalEsg != null
        ? esg.totalEsg < 10 ? 'Negligible Risk'
        : esg.totalEsg < 20 ? 'Low Risk'
        : esg.totalEsg < 30 ? 'Medium Risk'
        : esg.totalEsg < 40 ? 'High Risk'
        : 'Severe Risk'
        : null,
      percentile:          esg.percentile          ?? null,
      peerGroup:           esg.peerGroup           ?? null,
      peerCount:           esg.peerCount           ?? null,
      controversyLevel:    esg.highestControversy != null
        ? controversyMap[esg.highestControversy] ?? `Level ${esg.highestControversy}`
        : null,
      adultInvolvement:    esg.adult               ?? false,
      alcoholInvolvement:  esg.alcoholic           ?? false,
      weaponsInvolvement:  esg.weapons             ?? false,
      gamblingInvolvement: esg.gambling            ?? false,
      nuclearInvolvement:  esg.nuclear             ?? false,
      tobaccoInvolvement:  esg.tobacco             ?? false,
      coalInvolvement:     esg.coal                ?? false,
      smallArmsInvolvement:esg.smallArms           ?? false,
      lastUpdated,
      source: 'Yahoo Finance / Sustainalytics',
    };

    cache.set(cacheKey, data, 3600);
    res.json(data);

  } catch (e) {
    // No ESG data available for this symbol
    if (e.message?.includes('No fundamentals') ||
        e.message?.includes('Not Found') ||
        e.message?.includes('404')) {
      return res.json({ error: 'no_data' });
    }
    console.error('/api/esg error:', e.message);
    res.status(500).json({ error: 'Failed to fetch ESG data' });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running → http://localhost:${PORT}`);
  if (!process.env.FINNHUB_API_KEY) {
    console.warn('⚠️  FINNHUB_API_KEY is not set — requests will fail');
  }
});
