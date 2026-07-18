# StockPulse — Full-Stack Stock Dashboard

A full-stack stock information dashboard built with **Node.js + Express** (backend) and **React + Vite** (frontend), powered by the [Massive](https://massive.com) API (formerly Polygon.io — `api.polygon.io` is still the live endpoint and is what this app uses).

---

## Features

- 🔍 Live ticker/company search
- 💹 Real-time quote with price flash on change
- 📈 Interactive area chart with 1W / 1M / 3M / 6M / 1Y ranges
- 🏢 Company profile (logo, market cap, IPO date, industry)
- 📰 Recent company news
- 📋 Persistent watchlist sidebar
- 🔒 API key kept secure on the backend (never exposed to browser)
- ⚡ Aggressive response caching (5-60 min depending on route) to stay within Massive/Polygon's free-tier limit of 5 requests/minute

---

## Quick start

### 1. Get a Massive/Polygon API key

Sign up at [polygon.io](https://polygon.io/dashboard/signup) (redirects to Massive) → copy your API key from the dashboard. The free tier gives you 5 requests/minute and 15-minute-delayed data — no credit card required.

### 2. Backend

```bash
cd backend
npm install

# Create your .env from the example
cp .env.example .env
# Then edit .env and paste your POLYGON_API_KEY

npm run dev   # starts on http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install

cp .env.example .env
# VITE_API_BASE defaults to http://localhost:3001 — no change needed locally

npm run dev   # starts on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project structure

```
stock-dashboard/
├── backend/
│   ├── index.js          # Express server + Massive/Polygon proxy + cache
│   ├── .env.example      # Copy to .env and fill in your key
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── .env.example      # Copy to .env
    └── src/
        ├── main.jsx
        ├── App.jsx           # Layout + watchlist state
        ├── index.css         # Global tokens + dark theme
        └── components/
            ├── SearchBar.jsx       # Debounced search dropdown
            ├── QuoteCard.jsx       # Price + metrics grid
            ├── StockChart.jsx      # Area chart with range picker
            ├── CompanyProfile.jsx  # Logo + company stats
            └── NewsPanel.jsx       # Recent news articles
```

## API routes (backend)

| Route | Params | Description |
|-------|--------|-------------|
| `GET /api/quote` | `symbol` | Current price, change, H/L/O/PC — derived from Massive's previous-day bar + last trade |
| `GET /api/search` | `q` | Ticker/company search (top 8) |
| `GET /api/candles` | `symbol, resolution, from, to` | OHLCV candle data |
| `GET /api/profile` | `symbol` | Company profile (name, logo, cap, industry) |
| `GET /api/news` | `symbol` | Last 5 news articles |
| `GET /api/metrics` | `symbol` | 52-week high/low + market cap only — see note below |
| `GET /api/insiders` | `symbol` | Insider buy/sell transactions, from SEC Form 4 filings |
| `GET /api/peers` | `symbol` | Related/similar tickers |
| `GET /api/insider-sentiment` | `symbol` | 0–100 score derived from Form 4 activity |
| `GET /api/news-sentiment` | `symbol` | NLP sentiment score over recent news |
| `GET /api/social-sentiment` | `symbol` | Blended news-sentiment + momentum score |
| `GET /api/gov-spending` | `company` | Federal contract data (USASpending.gov, unrelated to Massive/Polygon) |
| `GET /api/stocktwits` | `symbol` | Retail trader sentiment (StockTwits, unrelated to Massive/Polygon) |
| `GET /api/esg` | `symbol` | ESG scores (Yahoo Finance, unrelated to Massive/Polygon) |
| `GET /api/roe-history` | `symbol` | Always returns `{ error: 'no_data' }` — see note below |
| `GET /health` | — | Health check |

**Note on data gaps vs. the old Finnhub version:** two routes were removed outright (`/api/earnings`, `/api/recommendations`) because Massive/Polygon has no free-tier equivalent to Finnhub's EPS-estimate-vs-actual earnings history or analyst strongBuy/buy/hold/sell/strongSell recommendation trends — that data simply isn't offered. `/api/metrics` and `/api/roe-history` are similarly limited: Finnhub bundled dozens of ratios (P/E, ROE, margins, beta, dividend yield, debt/equity) into one free call; Massive/Polygon's equivalent (`/stocks/financials/v1/ratios`) sits behind a paid "Financials & Ratios Expansion" add-on and doesn't offer historical annual series at all, so `/api/roe-history` can't be meaningfully implemented on the free tier. The frontend already handles these gaps gracefully (empty metric fields render as `—`, and panels with no data hide themselves) rather than showing wrong numbers.

Also worth knowing: `PerformanceBar.jsx`, `RevenueBreakdown.jsx`, `SupplyChain.jsx`, `PatentFilings.jsx`, `MergersAcquisitions.jsx`, and `CongressionalTrades.jsx` call backend routes (`/api/performance`, `/api/revenue-breakdown`, `/api/supply-chain`, `/api/patents`, `/api/mergers`, `/api/congress-trades`) that don't exist anywhere in this backend and never did — they predate this migration and aren't wired into `App.jsx`, so they're inert. Not something this migration touched or broke; flagging in case you pick them up later.

---

## Deployment

### Backend → Railway or Render

1. Push `backend/` to GitHub.
2. Create a new service on [railway.app](https://railway.app) or [render.com](https://render.com).
3. Set environment variables:
   - `POLYGON_API_KEY` = your key
   - `CORS_ORIGIN` = your Vercel frontend URL (e.g. `https://my-app.vercel.app`)
4. Note your deployed backend URL.

### Frontend → Vercel

1. Push `frontend/` to GitHub.
2. Import into [vercel.com](https://vercel.com).
3. Set environment variable:
   - `VITE_API_BASE` = your deployed backend URL
4. Deploy — Vite is auto-detected.

---

## Ideas for next steps

- Poll `/api/quote` every 30 s for live price updates
- Persist the watchlist to `localStorage`
- Add `/api/metrics` for P/E, EPS, 52-week high/low
- Add user auth + saved watchlists in a database
- WebSocket streaming for real-time tick data (Massive/Polygon supports this via `socket.polygon.io`, but it requires a paid plan for anything beyond delayed data)
