import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(item) {
    onSelect(item.symbol);
    setQuery(item.symbol);
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <div style={styles.inputWrap}>
        <span style={styles.searchIcon}>⌕</span>
        <input
          style={styles.input}
          value={query}
          onChange={handleChange}
          placeholder="Search ticker or company…"
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <span style={styles.spinner}>⟳</span>}
      </div>

      {open && results.length > 0 && (
        <ul style={styles.dropdown}>
          {results.map(r => (
            <li
              key={r.symbol}
              style={styles.item}
              onMouseDown={() => handleSelect(r)}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,160,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={styles.itemSymbol}>{r.symbol}</span>
              <span style={styles.itemName}>{r.description}</span>
              <span style={styles.itemType}>{r.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--surface2)',
    border: '1px solid var(--border2)',
    borderRadius: 'var(--radius)',
    padding: '0 0.75rem',
    gap: '0.5rem',
    transition: 'border-color 0.15s',
  },
  searchIcon: {
    fontSize: '1.2rem',
    color: 'var(--muted)',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    padding: '0.6rem 0',
    color: 'var(--text)',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-mono)',
  },
  spinner: {
    color: 'var(--accent)',
    fontSize: '1rem',
    animation: 'spin 0.8s linear infinite',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: 'var(--surface2)',
    border: '1px solid var(--border2)',
    borderRadius: 'var(--radius)',
    listStyle: 'none',
    zIndex: 200,
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 1rem',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.1s',
  },
  itemSymbol: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    fontSize: '0.85rem',
    color: 'var(--accent)',
    minWidth: 60,
  },
  itemName: {
    flex: 1,
    fontSize: '0.82rem',
    color: 'var(--text2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemType: {
    fontSize: '0.7rem',
    color: 'var(--muted)',
    fontFamily: 'var(--font-mono)',
    background: 'var(--surface)',
    padding: '2px 6px',
    borderRadius: 4,
  },
};
