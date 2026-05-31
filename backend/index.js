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

// ── Quote ─────────────────────────────────────────────────────────────────────
app.get('/api/quote', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    res.json(await finnhub('/quote', { symbol: symbol.toUpperCase() }));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch quote' }); }
});

// ── Search ────────────────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });
  try {
    const data = await finnhub('/search', { q });
    res.json((data.result || []).slice(0, 8));
  } catch (e) { res.status(500).json({ error: 'Failed to search' }); }
});

// ── Candles ───────────────────────────────────────────────────────────────────
app.get('/api/candles', async (req, res) => {
  const { symbol, resolution = 'D', from, to } = req.query;
  if (!symbol || !from || !to) return res.status(400).json({ error: 'symbol, from, and to are required' });
  try {
    res.json(await finnhub('/stock/candle', { symbol: symbol.toUpperCase(), resolution, from, to }));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch candles' }); }
});

// ── Profile ───────────────────────────────────────────────────────────────────
app.get('/api/profile', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    res.json(await finnhub('/stock/profile2', { symbol: symbol.toUpperCase() }));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch profile' }); }
});

// ── News ──────────────────────────────────────────────────────────────────────
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

// ── Metrics ───────────────────────────────────────────────────────────────────
app.get('/api/metrics', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    res.json(await finnhub('/stock/metric', { symbol: symbol.toUpperCase(), metric: 'all' }));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch metrics' }); }
});

// ── Earnings ──────────────────────────────────────────────────────────────────
app.get('/api/earnings', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    res.json(await finnhub('/stock/earnings', { symbol: symbol.toUpperCase(), limit: 8 }) || []);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch earnings' }); }
});

// ── Recommendations ───────────────────────────────────────────────────────────
app.get('/api/recommendations', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/recommendation', { symbol: symbol.toUpperCase() });
    res.json((data || []).slice(0, 6));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch recommendations' }); }
});

// ── Insiders ──────────────────────────────────────────────────────────────────
app.get('/api/insiders', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data = await finnhub('/stock/insider-transactions', { symbol: symbol.toUpperCase() });
    res.json((data?.data || []).slice(0, 10));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch insider transactions' }); }
});

// ── Peers ─────────────────────────────────────────────────────────────────────
app.get('/api/peers', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    res.json(await finnhub('/stock/peers', { symbol: symbol.toUpperCase() }) || []);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch peers' }); }
});

// ── Insider Sentiment ─────────────────────────────────────────────────────────
app.get('/api/insider-sentiment', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const data         = await finnhub('/stock/insider-transactions', { symbol: symbol.toUpperCase() });
    const transactions = data?.data || [];
    if (transactions.length === 0) {
      return res.json({ score: 50, totalBuyValue: 0, totalSellValue: 0,
        totalBuyers: 0, totalSellers: 0, netShares: 0, recentTransactions: [] });
    }
    const cutoff  = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const recent  = transactions.filter(t => !isNaN(new Date(t.transactionDate)) &&
      new Date(t.transactionDate).getTime() >= cutoff);
    const buyers  = new Set();
    const sellers = new Set();
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
    console.error('/api/insider-sentiment error:', e.message);
    res.status(500).json({ error: 'Failed to compute insider sentiment' });
  }
});

// ── Government Spending ───────────────────────────────────────────────────────
app.get('/api/gov-spending', async (req, res) => {
  const { company } = req.query;
  if (!company) return res.status(400).json({ error: 'company is required' });
  try {
    const currentYear = new Date().getFullYear();
    const years       = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
    const yearResults = await Promise.all(years.map(year =>
      axios.post('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
        filters: { keywords: [company], award_type_codes: ['A','B','C','D'],
          time_period: [{ start_date: `${year-1}-10-01`, end_date: `${year}-09-30` }] },
        fields: ['Award Amount','Awarding Agency','Description','Action Date'],
        sort: 'Award Amount', order: 'desc', limit: 10, page: 1,
      }, { timeout: 10000 })
        .then(r => ({ year, results: r.data?.results || [], total: r.data?.page_metadata?.total || 0 }))
        .catch(() => ({ year, results: [], total: 0 }))
    ));
    const thisYear    = yearResults[0];
    const totalAmount = thisYear.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0);
    const agencyMap   = {};
    thisYear.results.forEach(r => {
      const a = r['Awarding Agency'] || 'Unknown';
      agencyMap[a] = (agencyMap[a] || 0) + (r['Award Amount'] || 0);
    });
    res.json({
      totalAmount, totalContracts: thisYear.total,
      agencies: Object.entries(agencyMap).map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
      recentAwards: thisYear.results.slice(0, 5).map(r => ({
        description: r['Description'] || 'Contract award',
        agency: r['Awarding Agency'] || '—',
        amount: r['Award Amount'] || 0, date: r['Action Date'] || '—',
      })),
      yearOverYear: yearResults.map(y => ({
        year: y.year, amount: y.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0),
      })),
    });
  } catch (e) {
    console.error('/api/gov-spending error:', e.message);
    res.status(500).json({ error: 'Failed to fetch government spending data' });
  }
});

// ── News Sentiment ────────────────────────────────────────────────────────────
// Uses Finnhub's NLP-scored sentiment endpoint + recent news with scores
app.get('/api/news-sentiment', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const sym = symbol.toUpperCase();

    // Finnhub sentiment + buzz endpoint
    const sentiment = await finnhub('/news-sentiment', { symbol: sym });

    // Recent news for per-article scores
    const to   = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const news = await finnhub('/company-news', { symbol: sym, from, to });

    // Finnhub doesn't return per-article NLP scores on free tier,
    // so we derive a score from headline keywords as a fallback
    const POSITIVE_WORDS = ['beats','growth','record','strong','upgrade','buy',
      'surge','profit','raise','positive','bullish','expand','gain','outperform'];
    const NEGATIVE_WORDS = ['miss','cut','loss','weak','downgrade','sell','drop',
      'decline','layoff','negative','bearish','shrink','fall','underperform','investigation'];

    const scoredArticles = (news || []).slice(0, 8).map(a => {
      const text   = (a.headline + ' ' + (a.summary || '')).toLowerCase();
      const posHits = POSITIVE_WORDS.filter(w => text.includes(w)).length;
      const negHits = NEGATIVE_WORDS.filter(w => text.includes(w)).length;
      const total   = posHits + negHits;
      const score   = total > 0 ? (posHits - negHits) / total : 0;
      return {
        headline:  a.headline,
        source:    a.source,
        url:       a.url,
        date:      new Date(a.datetime * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sentiment: score,
      };
    });

    res.json({
      companyScore:      sentiment?.companyNewsScore   ?? null,
      sectorScore:       sentiment?.sectorAverageNewsScore ?? null,
      marketScore:       sentiment?.marketAverageNewsScore ?? null,
      articlesProcessed: sentiment?.articlesInLastWeek ?? scoredArticles.length,
      buzz: {
        buzz:          sentiment?.buzz?.buzz          ?? null,
        weeklyAverage: sentiment?.buzz?.weeklyAverage ?? null,
      },
      articles: scoredArticles,
    });
  } catch (e) {
    console.error('/api/news-sentiment error:', e.message);
    res.status(500).json({ error: 'Failed to fetch news sentiment' });
  }
});

// ── Social Sentiment ──────────────────────────────────────────────────────────
// Uses Finnhub social sentiment endpoint (Reddit + Twitter data)
app.get('/api/social-sentiment', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });
  try {
    const sym  = symbol.toUpperCase();
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to   = new Date().toISOString().slice(0, 10);

    // Finnhub social sentiment (Reddit + Twitter)
    const social = await finnhub('/stock/social-sentiment', { symbol: sym, from, to });

    const reddit  = social?.reddit  || [];
    const twitter = social?.twitter || [];

    // Aggregate per-platform scores
    function aggregatePlatform(posts, sourceName) {
      if (!posts.length) return null;
      const avgScore    = posts.reduce((s, p) => s + (p.score ?? 0), 0) / posts.length;
      const totalMentions = posts.reduce((s, p) => s + (p.mention ?? 0), 0);
      return { source: sourceName, score: avgScore, mentions: totalMentions };
    }

    const redditAgg  = aggregatePlatform(reddit,  'Reddit');
    const twitterAgg = aggregatePlatform(twitter, 'Twitter');
    const platforms  = [redditAgg, twitterAgg].filter(Boolean);

    // Overall score weighted by mention count
    let overall = 0;
    const totalMentions = platforms.reduce((s, p) => s + p.mentions, 0);
    if (totalMentions > 0) {
      overall = platforms.reduce((s, p) => s + p.score * (p.mentions / totalMentions), 0);
    } else if (platforms.length > 0) {
      overall = platforms.reduce((s, p) => s + p.score, 0) / platforms.length;
    }

    // Build 7-day trend from daily reddit scores
    const trend = reddit.slice(-7).map(p => p.score ?? 0);

    // Mention stats
    const allPosts     = [...reddit, ...twitter];
    const totalDay     = allPosts.reduce((s, p) => s + (p.mention ?? 0), 0);
    const positivePosts = allPosts.filter(p => (p.score ?? 0) >  0.1).length;
    const negativePosts = allPosts.filter(p => (p.score ?? 0) < -0.1).length;
    const neutralPosts  = allPosts.length - positivePosts - negativePosts;
    const positivePct   = allPosts.length > 0 ? Math.round((positivePosts / allPosts.length) * 100) : 33;
    const negativePct   = allPosts.length > 0 ? Math.round((negativePosts / allPosts.length) * 100) : 33;

    // Recent posts for the Posts tab (combine reddit + twitter, sort by date)
    const recentPosts = [
      ...reddit.slice(0, 5).map(p => ({
        source:    'Reddit',
        text:      p.mentionedBullish > p.mentionedBearish
          ? `Bullish discussion — ${p.mentionedBullish} bullish mentions vs ${p.mentionedBearish} bearish`
          : `Bearish discussion — ${p.mentionedBearish} bearish mentions vs ${p.mentionedBullish} bullish`,
        sentiment: p.score ?? 0,
        upvotes:   p.positiveMention ?? null,
        comments:  null,
        date:      p.atTime ? new Date(p.atTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
      })),
      ...twitter.slice(0, 5).map(p => ({
        source:    'Twitter',
        text:      `${p.mention ?? 0} mentions — ${p.mentionedBullish ?? 0} bullish, ${p.mentionedBearish ?? 0} bearish`,
        sentiment: p.score ?? 0,
        likes:     p.positiveMention ?? null,
        comments:  null,
        date:      p.atTime ? new Date(p.atTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
      })),
    ].slice(0, 8);

    res.json({
      overall,
      platforms,
      trend,
      mentions: {
        day:      totalDay,
        week:     totalDay * 7,
        positive: positivePct,
        negative: negativePct,
        neutral:  allPosts.length > 0 ? Math.round((neutralPosts / allPosts.length) * 100) : 34,
      },
      posts: recentPosts,
    });
  } catch (e) {
    console.error('/api/social-sentiment error:', e.message);
    res.status(500).json({ error: 'Failed to fetch social sentiment' });
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
