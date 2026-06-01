import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const RANGES = [
  { label: '1W', days: 7,   resolution: 60 },
  { label: '1M', days: 30,  resolution: 'D' },
  { label: '3M', days: 90,  resolution: 'D' },
  { label: '6M', days: 180, resolution: 'D' },
  { label: '1Y', days: 365, resolution: 'W' },
];

export default function StockChart({ symbol }) {
  const [data, setData]     = useState([]);
  const [range, setRange]   = useState(RANGES[1]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const to   = Math.floor(Date.now() / 1000);
    const from = to - range.days * 24 * 60 * 60;

    fetch(`${API}/api/candles?symbol=${symbol}&resolution=${range.resolution}&from=${from}&to=${to}`)
      .then(r => r.json())
      .then(d => {
        if (d.s !== 'ok' || !d.t) {
          setData([]);
          setLoading(false);
          return;
        }
        setData(d.t.map((ts, i) => ({
          date: formatDate(ts, range.resolution),
          close: d.c[i],
          open:  d.o[i],
          high:  d.h[i],
          low:   d.l[i],
        })));
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load chart');
        setLoading(false);
      });
  }, [symbol, range]);

  const isUp = data.length >= 2 && data[data.length - 1].close >= data[0].close;
  const color = isUp ? '#C4654A' : '#f05252';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={styles.tooltip}>
        <p style={styles.tooltipDate}>{label}</p>
        <p style={{ ...styles.tooltipVal, color }}>Close: ${d.close?.toFixed(2)}</p>
        <p style={styles.tooltipSub}>H: ${d.high?.toFixed(2)} · L: ${d.low?.toFixed(2)}</p>
      </div>
    );
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>Price history</span>
        <div style={styles.rangeGroup}>
          {RANGES.map(r => (
            <button
              key={r.label}
              style={{
                ...styles.rangeBtn,
                background: r.label === range.label ? 'rgba(196,101,74,0.1)' : 'transparent',
                color: r.label === range.label ? 'var(--accent)' : 'var(--muted)',
                border: r.label === range.label ? '1px solid rgba(196,101,74,0.3)' : '1px solid transparent',
              }}
              onClick={() => setRange(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 260 }}>
        {loading ? (
          <div style={styles.loader}>Loading…</div>
        ) : error ? (
          <div style={styles.loader}>{error}</div>
        ) : data.length === 0 ? (
          <div style={styles.loader}>No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="#232830" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#5a6475', fontSize: 11, fontFamily: 'DM Mono' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#5a6475', fontSize: 11, fontFamily: 'DM Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${v.toFixed(0)}`}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={1.5}
                fill="url(#grad)"
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: 'var(--bg)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function formatDate(ts, resolution) {
  const d = new Date(ts * 1000);
  if (resolution === 60) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (resolution === 'W' || resolution === 'M') {
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    color: 'var(--muted)',
    textTransform: 'uppercase',
  },
  rangeGroup: {
    display: 'flex',
    gap: 4,
  },
  rangeBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    padding: '3px 10px',
    borderRadius: 5,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  loader: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
  },
  tooltip: {
    background: 'var(--surface2)',
    border: '1px solid var(--border2)',
    borderRadius: 8,
    padding: '10px 14px',
  },
  tooltipDate: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--muted)',
    marginBottom: 4,
  },
  tooltipVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem',
    fontWeight: 500,
    marginBottom: 2,
  },
  tooltipSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text2)',
  },
};
