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

// ── Existing routes ───────────────────────────────────────────────────────────

app.get('/api/quote', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/quote', { symbol: symbol.toUpperCase() });
    res.json(data);
  } catch (e) {
    console.error('/api/quote error:', e.message);
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
    console.error('/api/search error:', e.message);
    res.status(500).json({ error: 'Failed to search' });
  }
});

app.get('/api/candles', async (req, res) => {
  const { symbol, resolution = 'D', from, to } = req.query;
  if (!symbol || !from || !to) {
    return res.status(400).json({ error: 'symbol, from, and to are required' });
  }
  try {
    const data = await finnhub('/stock/candle', {
      symbol: symbol.toUpperCase(), resolution, from, to,
    });
    res.json(data);
  } catch (e) {
    console.error('/api/candles error:', e.message);
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
    console.error('/api/profile error:', e.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.get('/api/news', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  try {
    const data = await finnhub('/company-news', { symbol: symbol.toUpperCase(), from, to });
    res.json((data || []).slice(0, 5));
  } catch (e) {
    console.error('/api/news error:', e.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// ── NEW routes ────────────────────────────────────────────────────────────────

// GET /api/metrics?symbol=AAPL
// Returns P/E, EPS, 52-week high/low, beta, dividend yield, ROE, etc.
app.get('/api/metrics', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/metric', {
      symbol: symbol.toUpperCase(),
      metric: 'all',
    });
    res.json(data);
  } catch (e) {
    console.error('/api/metrics error:', e.message);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// GET /api/earnings?symbol=AAPL
// Returns past and upcoming earnings dates with EPS estimates vs actuals
app.get('/api/earnings', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/earnings', {
      symbol: symbol.toUpperCase(),
      limit: 8,
    });
    res.json(data || []);
  } catch (e) {
    console.error('/api/earnings error:', e.message);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// GET /api/recommendations?symbol=AAPL
// Returns analyst buy/sell/hold recommendations over time
app.get('/api/recommendations', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/recommendation', {
      symbol: symbol.toUpperCase(),
    });
    res.json((data || []).slice(0, 6));
  } catch (e) {
    console.error('/api/recommendations error:', e.message);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// GET /api/insiders?symbol=AAPL
// Returns insider buy/sell transactions by executives
app.get('/api/insiders', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/insider-transactions', {
      symbol: symbol.toUpperCase(),
    });
    const transactions = (data?.data || []).slice(0, 10);
    res.json(transactions);
  } catch (e) {
    console.error('/api/insiders error:', e.message);
    res.status(500).json({ error: 'Failed to fetch insider transactions' });
  }
});

// GET /api/peers?symbol=AAPL
// Returns list of similar companies in the same sector
app.get('/api/peers', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/peers', {
      symbol: symbol.toUpperCase(),
    });
    res.json(data || []);
  } catch (e) {
    console.error('/api/peers error:', e.message);
    res.status(500).json({ error: 'Failed to fetch peers' });
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
