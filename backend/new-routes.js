// ─────────────────────────────────────────────────────────────────────────────
// ADD THESE TWO ROUTES TO YOUR EXISTING backend/index.js
// Paste them just before the health check route:
//   app.get('/health', ...)
// ─────────────────────────────────────────────────────────────────────────────


// GET /api/insider-sentiment?symbol=AAPL
// Scores insider buying/selling activity on a 0-100 scale
app.get('/api/insider-sentiment', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol is required' });

  try {
    const data = await finnhub('/stock/insider-transactions', {
      symbol: symbol.toUpperCase(),
    });

    const transactions = data?.data || [];

    if (transactions.length === 0) {
      return res.json({
        score: 50,
        totalBuyValue: 0,
        totalSellValue: 0,
        totalBuyers: 0,
        totalSellers: 0,
        netShares: 0,
        recentTransactions: [],
      });
    }

    // Only look at last 90 days
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
        buyers.add(t.name);
        buyValue  += val;
        netShares += t.change;
      } else if (t.change < 0) {
        sellers.add(t.name);
        sellValue += val;
        netShares += t.change; // negative
      }
    });

    // Scoring algorithm (0-100):
    // Base 50. Weighted by dollar value ratio + unique buyer count bonus
    const totalVal = buyValue + sellValue;
    let score = 50;

    if (totalVal > 0) {
      // Value ratio: how much of total activity is buying?
      const valuePct = (buyValue / totalVal) * 100; // 0-100
      score = valuePct; // start with value ratio

      // Buyer/seller count modifier (±10 points)
      const totalPeople = buyers.size + sellers.size;
      if (totalPeople > 0) {
        const peoplePct = (buyers.size / totalPeople);
        score = score * 0.7 + peoplePct * 100 * 0.3;
      }

      // Net shares direction bonus (±5 points)
      if (netShares > 0) score = Math.min(100, score + 5);
      if (netShares < 0) score = Math.max(0,   score - 5);
    }

    res.json({
      score:               Math.round(score),
      totalBuyValue:       buyValue,
      totalSellValue:      sellValue,
      totalBuyers:         buyers.size,
      totalSellers:        sellers.size,
      netShares,
      recentTransactions:  recent.slice(0, 6),
    });

  } catch (e) {
    console.error('/api/insider-sentiment error:', e.message);
    res.status(500).json({ error: 'Failed to compute insider sentiment' });
  }
});


// GET /api/gov-spending?company=Apple+Inc
// Fetches federal contract data from USASpending.gov (free, no key needed)
app.get('/api/gov-spending', async (req, res) => {
  const { company } = req.query;
  if (!company) return res.status(400).json({ error: 'company is required' });

  try {
    const currentYear = new Date().getFullYear();

    // Fetch last 4 fiscal years in parallel
    const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

    const yearResults = await Promise.all(
      years.map(year =>
        axios.post('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
          filters: {
            keywords:   [company],
            award_type_codes: ['A', 'B', 'C', 'D'], // contracts only
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

    // Total contracts this fiscal year
    const thisYear     = yearResults[0];
    const totalAmount  = thisYear.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0);
    const totalContracts = thisYear.total;

    // Year-over-year totals
    const yearOverYear = yearResults.map(y => ({
      year:   y.year,
      amount: y.results.reduce((s, r) => s + (r['Award Amount'] || 0), 0),
    }));

    // Agency breakdown from this year
    const agencyMap = {};
    thisYear.results.forEach(r => {
      const agency = r['Awarding Agency'] || 'Unknown';
      agencyMap[agency] = (agencyMap[agency] || 0) + (r['Award Amount'] || 0);
    });
    const agencies = Object.entries(agencyMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Recent individual awards
    const recentAwards = thisYear.results.slice(0, 5).map(r => ({
      description: r['Description'] || 'Contract award',
      agency:      r['Awarding Agency'] || '—',
      amount:      r['Award Amount'] || 0,
      date:        r['Action Date'] || '—',
    }));

    res.json({
      totalAmount,
      totalContracts,
      agencies,
      recentAwards,
      yearOverYear,
    });

  } catch (e) {
    console.error('/api/gov-spending error:', e.message);
    res.status(500).json({ error: 'Failed to fetch government spending data' });
  }
});
