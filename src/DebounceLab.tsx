import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Search, X, Timer } from 'lucide-react';

type Event = {
  id: number;
  at: number;
  value: string;
  kind: 'input' | 'schedule' | 'cancel' | 'callback';
  lane: 'raw' | 'debounce' | 'throttle';
  target?: number;
  due?: number;
};
export function DebounceLab() {
  const [value, setValue] = useState(''),
    [wait, setWait] = useState(500),
    [events, setEvents] = useState<Event[]>([]),
    [now, setNow] = useState(0),
    [playing, setPlaying] = useState(false);
  const origin = useRef(performance.now()),
    nextId = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    scheduled = useRef<Event | null>(null),
    lastThrottle = useRef(-Infinity),
    playback = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [totals, setTotals] = useState({ input: 0, raw: 0, debounce: 0, throttle: 0 });
  const elapsed = () => performance.now() - origin.current;
  const emit = (event: Omit<Event, 'id' | 'at'>) => {
    const entry = { ...event, id: ++nextId.current, at: elapsed() };
    if (entry.kind === 'input') setTotals((t) => ({ ...t, input: t.input + 1 }));
    if (entry.kind === 'callback') setTotals((t) => ({ ...t, [entry.lane]: t[entry.lane] + 1 }));
    setEvents((e) => [...e.slice(-119), entry]);
    return entry;
  };
  const clear = () => {
    clearTimeout(timer.current);
    playback.current.forEach(clearTimeout);
    playback.current = [];
    scheduled.current = null;
    lastThrottle.current = -Infinity;
  };
  const reset = () => {
    clear();
    origin.current = performance.now();
    setValue('');
    setEvents([]);
    setTotals({ input: 0, raw: 0, debounce: 0, throttle: 0 });
    setNow(0);
    setPlaying(false);
  };
  useEffect(() => {
    const tick = setInterval(() => setNow(performance.now() - origin.current), 40);
    return () => {
      clearInterval(tick);
      clearTimeout(timer.current);
      playback.current.forEach(clearTimeout);
    };
  }, []);
  const input = (text: string) => {
    setValue(text);
    emit({ value: text, kind: 'input', lane: 'raw' });
    emit({ value: text, kind: 'callback', lane: 'raw' });
    if (elapsed() - lastThrottle.current >= wait) {
      lastThrottle.current = elapsed();
      emit({ value: text, kind: 'callback', lane: 'throttle' });
    }
    if (scheduled.current)
      emit({
        value: scheduled.current.value,
        kind: 'cancel',
        lane: 'debounce',
        target: scheduled.current.id,
      });
    clearTimeout(timer.current);
    scheduled.current = null;
    if (!wait) {
      emit({ value: text, kind: 'callback', lane: 'debounce' });
      return;
    }
    const event = emit({ value: text, kind: 'schedule', lane: 'debounce', due: elapsed() + wait });
    scheduled.current = event;
    timer.current = setTimeout(() => {
      scheduled.current = null;
      emit({ value: text, kind: 'callback', lane: 'debounce', target: event.id });
    }, wait);
  };
  const play = () => {
    reset();
    setPlaying(true);
    ['f', 'fo', 'for', 'forg', 'forge'].forEach((text, i) => {
      playback.current.push(setTimeout(() => input(text), [60, 160, 280, 410, 1050][i]));
    });
    playback.current.push(setTimeout(() => setPlaying(false), 1100 + wait));
  };
  const count = (lane: Event['lane']) => totals[lane];
  const end = Math.max(
    2400,
    ...events.map((e) => e.due ?? e.at),
    Math.min(now, (events.at(-1)?.at ?? 0) + wait + 250),
  );
  const start = Math.max(0, end - 8000),
    span = Math.min(end, 8000);
  const x = (at: number) => 112 + Math.max(0, (at - start) / span) * 620;
  const pending = scheduled.current;
  return (
    <div className="timing-lab" data-testid="debounce-lab">
      <div className="lab-topline">
        <span className="eyebrow">
          <span className="live-dot" /> LIVE TIMING LAB
        </span>
        <span>Actual browser timers</span>
      </div>
      <div className="lab-inputs">
        <label className="lab-search">
          <Search size={18} />
          <input
            aria-label="Try debounce search"
            value={value}
            disabled={playing}
            placeholder="Type a search. Watch what runs."
            onChange={(e) => input(e.target.value)}
          />
        </label>
        <label className="delay-select">
          Quiet interval
          <select
            aria-label="Debounce interval"
            value={wait}
            onChange={(e) => {
              reset();
              setWait(Number(e.target.value));
            }}
          >
            <option value={0}>No debounce</option>
            {[250, 500, 1000].map((n) => (
              <option key={n} value={n}>
                {n} ms
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="lab-counters" aria-live="polite">
        <div>
          <b data-testid="input-count">{totals.input}</b>
          <span>input events</span>
        </div>
        <div>
          <b>{count('raw')}</b>
          <span>without control</span>
        </div>
        <div className="mint">
          <b data-testid="debounced-count">{count('debounce')}</b>
          <span>debounced callbacks</span>
        </div>
        <div>
          <b>{count('throttle')}</b>
          <span>leading throttle</span>
        </div>
      </div>
      <div className="timing-chart">
        <svg
          viewBox="0 0 760 220"
          role="img"
          aria-label="Shared input timeline comparing every event, trailing debounce and leading throttle"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line x1={112 + i * 155} x2={112 + i * 155} y1="18" y2="184" className="time-grid" />
              <text x={112 + i * 155} y="209" className="time-label">
                {Math.round(start + (span * i) / 4)} ms
              </text>
            </g>
          ))}
          {(['raw', 'debounce', 'throttle'] as const).map((lane, i) => (
            <g key={lane}>
              <text x="0" y={48 + i * 61} className="lane-label">
                {['Every input', 'Debounce', 'Throttle'][i]}
              </text>
              <line x1="112" x2="735" y1={44 + i * 61} y2={44 + i * 61} className="time-axis" />
              {events
                .filter(
                  (e) =>
                    e.lane === lane &&
                    e.at >= start &&
                    (e.kind === 'callback' || e.kind === 'schedule'),
                )
                .map((e) => {
                  const cancellation = events.find((c) => c.kind === 'cancel' && c.target === e.id);
                  const y = 44 + i * 61;
                  return e.kind === 'schedule' ? (
                    <g key={e.id}>
                      <rect
                        x={x(e.at)}
                        y={y - 11}
                        width={Math.max(1, x(cancellation?.at ?? e.due!) - x(e.at))}
                        height="22"
                        rx="2"
                        className={cancellation ? 'timer-span cancelled' : 'timer-span'}
                      >
                        <title>
                          {cancellation ? 'Cancelled' : 'Scheduled'}: {e.value}
                        </title>
                      </rect>
                      {cancellation && (
                        <text x={x(cancellation.at) - 3} y={y + 5} className="cancel-cross">
                          ×
                        </text>
                      )}
                    </g>
                  ) : (
                    <g key={e.id}>
                      <circle cx={x(e.at)} cy={y} r="5" className={`event-dot ${lane}`}>
                        <title>
                          Callback: {e.value} at {Math.round(e.at)} ms
                        </title>
                      </circle>
                    </g>
                  );
                })}
            </g>
          ))}
        </svg>
      </div>
      <div className="lab-bottom">
        <span className="pending-timer">
          <Timer size={14} />
          {pending
            ? `${Math.max(0, Math.ceil((pending.due ?? 0) - now))} ms remaining · latest “${pending.value}”`
            : 'No pending callback'}
        </span>
        <div className="button-row">
          <button className="button secondary small" onClick={play} disabled={playing}>
            <Play size={13} />
            Play a burst
          </button>
          <button className="button secondary small" onClick={reset}>
            <RotateCcw size={13} />
            Reset timeline
          </button>
        </div>
      </div>
      <div className="timeline-key">
        <span>
          <i className="key-dot" /> callback executed
        </span>
        <span>
          <i className="key-range" /> scheduled timeout
        </span>
        <span>
          <X size={12} /> previous timeout cancelled
        </span>
      </div>
      <details className="event-log">
        <summary>Inspect the event log ({events.length})</summary>
        <ol>
          {events.map((e) => (
            <li key={e.id}>
              <code>{Math.round(e.at)} ms</code>
              <span>
                {e.lane} · {e.kind}
              </span>
              <code>“{e.value}”</code>
            </li>
          ))}
        </ol>
      </details>
      <p className="micro">
        The last 120 events are retained. Debounce waits for silence; leading throttle accepts at
        most one callback per interval. Timer execution can be delayed by a busy browser.
      </p>
    </div>
  );
}

const searchable = [
  'Closures',
  'Debounce',
  'Throttle',
  'React state',
  'React effects',
  'React response races',
  'Rust ownership',
  'Request cancellation',
  'TypeScript unions',
  'Go channels',
];
function searchLocal(query: string, signal: AbortSignal): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const id = setTimeout(
      () => {
        signal.removeEventListener('abort', cancel);
        resolve(searchable.filter((x) => x.toLowerCase().includes(query.toLowerCase())));
      },
      query.length < 3 ? 900 : 180,
    );
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
  });
}
export function ProductionSearch() {
  const [query, setQuery] = useState(''),
    [results, setResults] = useState<string[]>([]),
    [status, setStatus] = useState('Type to search the local concept index.');
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (!query.trim()) {
      setResults([]);
      setStatus('Type to search the local concept index.');
      return;
    }
    setStatus('Waiting for a 350 ms pause…');
    setResults([]);
    const timer = setTimeout(async () => {
      setStatus(`Searching for “${query}”…`);
      try {
        const found = await searchLocal(query, controller.signal);
        if (active) {
          setResults(found);
          setStatus(`${found.length} results for “${query}”`);
        }
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === 'AbortError'))
          setStatus('Search failed. Try again.');
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <div className="production-search">
      <span className="eyebrow">A REAL REACT COMPONENT · SIMULATED NETWORK</span>
      <label className="lab-search">
        <Search size={17} />
        <input
          aria-label="Production concept search"
          placeholder="Try “re”, then “react”"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <p role="status">{status}</p>
      <ul>
        {results.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <small>
        Local data with real, abortable delays: short queries take 900 ms; longer queries take 180
        ms. No external API. Cleanup cancels the delay and prevents obsolete results from
        committing.
      </small>
    </div>
  );
}
