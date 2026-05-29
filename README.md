# StockPulse — Full-Stack Stock Dashboard

A full-stack stock information dashboard built with **Node.js + Express** (backend) and **React + Vite** (frontend), powered by the [Finnhub API](https://finnhub.io).

---

## Features

- 🔍 Live ticker/company search
- 💹 Real-time quote with price flash on change
- 📈 Interactive area chart with 1W / 1M / 3M / 6M / 1Y ranges
- 🏢 Company profile (logo, market cap, IPO date, industry)
- 📰 Recent company news
- 📋 Persistent watchlist sidebar
- 🔒 API key kept secure on the backend (never exposed to browser)
- ⚡ Response caching to stay within Finnhub free-tier rate limits

---

## Quick start

### 1. Get a Finnhub API key

Sign up at [finnhub.io](https://finnhub.io) → copy your API key from the dashboard.

### 2. Backend

```bash
cd backend
npm install

# Create your .env from the example
cp .env.example .env
# Then edit .env and paste your FINNHUB_API_KEY

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
│   ├── index.js          # Express server + Finnhub proxy + cache
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
| `GET /api/quote` | `symbol` | Current price, change, H/L/O/PC |
| `GET /api/search` | `q` | Ticker/company search (top 8) |
| `GET /api/candles` | `symbol, resolution, from, to` | OHLCV candle data |
| `GET /api/profile` | `symbol` | Company profile (name, logo, cap) |
| `GET /api/news` | `symbol` | Last 5 news articles (past 7 days) |
| `GET /health` | — | Health check |

---

## Deployment

### Backend → Railway or Render

1. Push `backend/` to GitHub.
2. Create a new service on [railway.app](https://railway.app) or [render.com](https://render.com).
3. Set environment variables:
   - `FINNHUB_API_KEY` = your key
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
- WebSocket streaming for real-time tick data (Finnhub supports this)
