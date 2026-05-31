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

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/api/quote', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/quote', { symbol: symbol.toUpperCase() });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });
  try {
    const data = await finnhub('/search', { q });
    res.json((data.result || []).slice(0, 8));
  } catch (e) {
    res.status(500).json({ error: 'Failed to search' });
  }
});

app.get('/api/candles', async (req, res) => {
  const { symbol, resolution = 'D', from, to } = req.query;
  if (!symbol || !from || !to) return res.status(400).json({ error: 'symbol, from, and to are required' });
  try {
    const data = await finnhub('/stock/candle', { symbol: symbol.toUpperCase(), resolution, from, to });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch candles' });
  }
});

app.get('/api/profile', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/profile2', { symbol: symbol.toUpperCase() });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.get('/api/news', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  const to   = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  try {
    const data = await finnhub('/company-news', { symbol: symbol.toUpperCase(), from, to });
    res.json((data || []).slice(0, 5));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.get('/api/metrics', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/metric', { symbol: symbol.toUpperCase(), metric: 'all' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

app.get('/api/earnings', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/earnings', { symbol: symbol.toUpperCase(), limit: 8 });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

app.get('/api/recommendations', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/recommendation', { symbol: symbol.toUpperCase() });
    res.json((data || []).slice(0, 6));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

app.get('/api/insiders', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/insider-transactions', { symbol: symbol.toUpperCase() });
    res.json((data?.data || []).slice(0, 10));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch insider transactions' });
  }
});

app.get('/api/peers', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/peers', { symbol: symbol.toUpperCase() });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch peers' });
  }
});

// ── NEW: Insider Sentiment ────────────────────────────────────────────────────

app.get('/api/insider-sentiment', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/insider-transactions', { symbol: symbol.toUpperCase() });
    const transactions = data?.data || [];

    if (transactions.length === 0) {
      return res.json({ score: 50, totalBuyValue: 0, totalSellValue: 0,
        totalBuyers: 0, totalSellers: 0, netShares: 0, recentTransactions: [] });
    }

    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const recent = transactions.filter(t => {
      const d = new Date(t.transactionDate).getTime();
      return !isNaN(d) && d >= cutoff;
    });

    const buyers  = new Set();
    const sellers = new Set();
    let buyValue  = 0;
    let sellValue = 0;
    let netShares = 0;

    recent.forEach(t => {
      const val = Math.abs((t.change || 0) * (t.transactionPrice || 0));
      if (t.change > 0) {
        buyers.add(t.name); buyValue += val; netShares += t.change;
      } else if (t.change < 0) {
        sellers.add(t.name); sellValue += val; netShares += t.change;
      }
    });

    const totalVal = buyValue + sellValue;
    let score = 50;
    if (totalVal > 0) {
      const valuePct = (buyValue / totalVal) * 100;
      score = valuePct;
      const totalPeople = buyers.size + sellers.size;
      if (totalPeople > 0) {
        score = score * 0.7 + (buyers.size / totalPeople) * 100 * 0.3;
      }
      if (netShares > 0) score = Math.min(100, score + 5);
      if (netShares < 0) score = Math.max(0,   score - 5);
    }

    res.json({
      score:              Math.round(score),
      totalBuyValue:      buyValue,
      totalSellValue:     sellValue,
      totalBuyers:        buyers.size,
      totalSellers:       sellers.size,
      netShares,
      recentTransactions: recent.slice(0, 6),
    });
  } catch (e) {
    console.error('/api/insider-sentiment error:', e.message);
    res.status(500).json({ error: 'Failed to compute insider sentiment' });
  }
});

// ── NEW: Government Spending ──────────────────────────────────────────────────

app.get('/api/gov-spending', async (req, res) => {
  const { company } = req.query;
  if (!company) return res.status(400).json({ error: 'company is required' });

  try {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

    const yearResults = await Promise.all(
      years.map(year =>
        axios.post('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
          filters: {
            keywords: [company],
            award_type_codes: ['A', 'B', 'C', 'D'],
            time_period: [{
              start_date: `${year - 1}-10-01`,
              end_date:   `${year}-09-30`,
            }],
          },
          fields:  ['Award Amount', 'Awarding Agency', 'Description', 'Action Date'],
          sort:    'Award Amount',
          order:   'desc',
          limit:   10,
          page:    1,
        }, { timeout: 10000 })
          .then(r => ({ year, results: r.data?.results || [], total: r.data?.page_metadata?.total || 0 }))
          .catch(() => ({ year, results: [], total: 0 }))
      )
    );

    const thisYear       = yearResults[0];
    const totalAmount    = thisYear.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0);
    const totalContracts = thisYear.total;

    const yearOverYear = yearResults.map(y => ({
      year:   y.year,
      amount: y.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0),
    }));

    const agencyMap = {};
    thisYear.results.forEach(r => {
      const agency = r['Awarding Agency'] || 'Unknown';
      agencyMap[agency] = (agencyMap[agency] || 0) + (r['Award Amount'] || 0);
    });
    const agencies = Object.entries(agencyMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const recentAwards = thisYear.results.slice(0, 5).map(r => ({
      description: r['Description'] || 'Contract award',
      agency:      r['Awarding Agency'] || '—',
      amount:      r['Award Amount'] || 0,
      date:        r['Action Date'] || '—',
    }));

    res.json({ totalAmount, totalContracts, agencies, recentAwards, yearOverYear });

  } catch (e) {
    console.error('/api/gov-spending error:', e.message);
    res.status(500).json({ error: 'Failed to fetch government spending data' });
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
