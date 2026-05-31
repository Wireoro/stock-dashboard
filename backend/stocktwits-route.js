// ── StockTwits ────────────────────────────────────────────────────────────────
// GET /api/stocktwits?symbol=AAPL
// Free API — no key needed. Returns sentiment counts + recent messages.
app.get('/api/stocktwits', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });

  try {
    const sym = symbol.toUpperCase();
    const cacheKey = `stocktwits_${sym}`;

    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    const response = await axios.get(
      `https://api.stocktwits.com/api/2/streams/symbol/${sym}.json`,
      {
        params: { limit: 30 },
        timeout: 8000,
        headers: {
          'User-Agent': 'StockDashboard/1.0',
        },
      }
    );

    const raw      = response.data;
    const symbol_  = raw.symbol || {};
    const messages = (raw.messages || []).map(m => ({
      id:        m.id,
      body:      m.body,
      createdAt: m.created_at,
      sentiment: m.entities?.sentiment?.basic || null, // 'Bullish' | 'Bearish' | null
      username:  m.user?.username,
      followers: m.user?.followers,
      likes:     m.likes?.total || 0,
    }));

    // Count sentiment from messages
    const bullish = messages.filter(m => m.sentiment === 'Bullish').length;
    const bearish = messages.filter(m => m.sentiment === 'Bearish').length;
    const total   = messages.length;

    const result = {
      symbol:         sym,
      bullish,
      bearish,
      total,
      watchlistCount: symbol_.watchlist_count || null,
      messages,
    };

    cache.set(cacheKey, result, 60); // cache 60 seconds
    res.json(result);

  } catch (e) {
    // StockTwits returns 404 for unknown symbols, 429 for rate limit
    if (e.response?.status === 404) {
      return res.json({ error: 'symbol_not_found' });
    }
    if (e.response?.status === 429) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    console.error('/api/stocktwits error:', e.message);
    res.status(500).json({ error: 'Failed to fetch StockTwits data' });
  }
});
