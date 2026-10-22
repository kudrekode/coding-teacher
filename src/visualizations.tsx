import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react';
type Step = {
  title: string;
  description: string;
  values: string[];
  active: number[];
  done?: number[];
  line: number;
};
export const scenes: Record<
  string,
  { title: string; subtitle: string; code: string[]; steps: Step[] }
> = {
  binary: {
    title: 'Binary search',
    subtitle: 'Halve the search space. Keep the invariant.',
    code: [
      'lo = 0; hi = values.length',
      'while (lo < hi) {',
      '  mid = floor((lo + hi) / 2)',
      '  if (values[mid] < target) lo = mid + 1',
      '  else hi = mid',
      '}',
      'return lo',
    ],
    steps: [
      {
        title: 'Start with the full range',
        description:
          'Find the first occurrence of 23 in this sorted array. The search interval is [0, 8).',
        values: ['3', '8', '12', '17', '23', '31', '42', '56'],
        active: [],
        line: 0,
      },
      {
        title: 'Inspect the midpoint',
        description:
          'mid = 4. The value is 23. Keep the left half, including this candidate, to find the first match.',
        values: ['3', '8', '12', '17', '23', '31', '42', '56'],
        active: [4],
        line: 4,
      },
      {
        title: 'Search the remaining left half',
        description: 'The range is now [0, 4). mid = 2, value 12 is below 23. Move lo to 3.',
        values: ['3', '8', '12', '17', '23', '31', '42', '56'],
        active: [2],
        done: [5, 6, 7],
        line: 3,
      },
      {
        title: 'Narrow to the boundary',
        description: 'The range is [3, 4). mid = 3, value 17 is below 23. Move lo to 4.',
        values: ['3', '8', '12', '17', '23', '31', '42', '56'],
        active: [3],
        done: [0, 1, 2, 5, 6, 7],
        line: 3,
      },
      {
        title: 'The boundaries meet',
        description:
          'lo = hi = 4. Check values[4] === 23: the first matching index is 4. Only three comparisons were needed.',
        values: ['3', '8', '12', '17', '23', '31', '42', '56'],
        active: [4],
        done: [0, 1, 2, 3, 5, 6, 7],
        line: 6,
      },
    ],
  },
  queue: {
    title: 'A bounded task queue',
    subtitle: 'Backpressure is a scheduling decision.',
    code: [
      'queue = [A, B, C, D]',
      'while (active < limit && queue.length) {',
      '  task = queue.shift()',
      '  active++',
      '  await task()',
      '  active--',
      '}',
    ],
    steps: [
      {
        title: 'Four jobs, two workers',
        description:
          'A concurrency limit of two means only two tasks may be in flight. These are predefined scheduling steps, not a trace of your source.',
        values: ['A · queued', 'B · queued', 'C · queued', 'D · queued'],
        active: [],
        line: 0,
      },
      {
        title: 'Workers claim A and B',
        description: 'Two worker slots are occupied. C and D wait; they have not started.',
        values: ['A · running', 'B · running', 'C · queued', 'D · queued'],
        active: [0, 1],
        line: 3,
      },
      {
        title: 'B finishes first',
        description:
          'Completion order differs from submission order. Store B at index 1 and start C in the free slot.',
        values: ['A · running', 'B · done', 'C · running', 'D · queued'],
        active: [0, 2],
        done: [1],
        line: 2,
      },
      {
        title: 'A finishes; D starts',
        description: 'A occupies result index 0. D can now run alongside C.',
        values: ['A · done', 'B · done', 'C · running', 'D · running'],
        active: [2, 3],
        done: [0, 1],
        line: 4,
      },
      {
        title: 'All tasks settled',
        description:
          'Return [resultA, resultB, resultC, resultD] in input order. Peak concurrency was two.',
        values: ['A · done', 'B · done', 'C · done', 'D · done'],
        active: [],
        done: [0, 1, 2, 3],
        line: 6,
      },
    ],
  },
  stack: {
    title: 'Nested delimiters',
    subtitle: 'Last opened. First closed.',
    code: [
      'for char in "([])":',
      '  if opening(char): stack.push(char)',
      '  else:',
      '    assert stack.pop() == matching(char)',
      'return stack.length == 0',
    ],
    steps: [
      {
        title: 'An empty stack',
        description: 'Read the expression ([]). A stack records unfinished opening delimiters.',
        values: ['empty'],
        active: [],
        line: 0,
      },
      {
        title: 'Push an opening parenthesis',
        description: 'The first character is (. Push it onto the stack.',
        values: ['('],
        active: [0],
        line: 1,
      },
      {
        title: 'Push an opening bracket',
        description: 'The next character is [. It becomes the top of the stack.',
        values: ['(', '['],
        active: [1],
        line: 1,
      },
      {
        title: 'Close the bracket',
        description: '] matches the top [. Pop it; the parenthesis remains unfinished.',
        values: ['('],
        active: [0],
        line: 3,
      },
      {
        title: 'Close the parenthesis',
        description: ') matches (. The stack is now empty, so the expression is balanced.',
        values: ['empty'],
        active: [],
        line: 4,
      },
    ],
  },
  'event-loop': {
    title: 'The JavaScript event loop',
    subtitle: 'Synchronous work. Microtasks. Then timers.',
    code: [
      "console.log('A')",
      "setTimeout(() => log('D'), 0)",
      "Promise.resolve().then(() => log('C'))",
      "console.log('B')",
    ],
    steps: [
      {
        title: 'Start synchronous execution',
        description: 'The call stack executes the current script. Nothing has been printed yet.',
        values: ['stack · script', 'microtasks · empty', 'timers · empty', 'output · empty'],
        active: [0],
        line: 0,
      },
      {
        title: 'Print A and register a timer',
        description:
          'A is printed immediately. A zero-delay timer becomes eligible later; it does not interrupt this script.',
        values: ['stack · script', 'microtasks · empty', 'timers · D', 'output · A'],
        active: [2],
        line: 1,
      },
      {
        title: 'Queue a promise reaction',
        description: 'The fulfilled promise queues C as a microtask. The current script continues.',
        values: ['stack · script', 'microtasks · C', 'timers · D', 'output · A'],
        active: [1],
        line: 2,
      },
      {
        title: 'Finish synchronous work',
        description: 'B is printed. The current task ends and the stack becomes empty.',
        values: ['stack · empty', 'microtasks · C', 'timers · D', 'output · A B'],
        active: [3],
        line: 3,
      },
      {
        title: 'Drain microtasks',
        description: 'The promise reaction prints C before the timer task gets a turn.',
        values: ['stack · empty', 'microtasks · empty', 'timers · D', 'output · A B C'],
        active: [1],
        line: 2,
      },
      {
        title: 'Run the timer task',
        description:
          'D is printed. A delay of zero meant no minimum wait beyond scheduling, not immediate execution.',
        values: ['stack · empty', 'microtasks · empty', 'timers · empty', 'output · A B C D'],
        active: [2, 3],
        line: 1,
      },
    ],
  },
};
export function Visualizer({
  initial = 'binary',
  compact = false,
}: {
  initial?: string;
  compact?: boolean;
}) {
  const [kind, setKind] = useState(initial),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1);
  const scene = scenes[kind] ?? scenes.binary,
    step = scene.steps[index];
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(
      () =>
        setIndex((i) => {
          if (i >= scene.steps.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        }),
      1600 / speed,
    );
    return () => clearInterval(id);
  }, [playing, speed, scene]);
  return (
    <div className={`visualizer ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="viz-tabs">
          {Object.entries(scenes).map(([key, s]) => (
            <button
              className={kind === key ? 'selected' : ''}
              key={key}
              onClick={() => {
                setKind(key);
                setIndex(0);
                setPlaying(false);
              }}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}
      <div className="viz-heading">
        <span className="eyebrow">ALGORITHM LAB · GUIDED STEPS</span>
        <h2>{scene.title}</h2>
        <p>{scene.subtitle}</p>
      </div>
      <div className={`viz-values ${kind === 'binary' ? 'array' : ''}`}>
        {step.values.map((v, i) => (
          <div
            key={i}
            className={`viz-cell ${step.active.includes(i) ? 'active' : ''} ${step.done?.includes(i) ? 'muted' : ''}`}
          >
            <strong>{v}</strong>
            {kind === 'binary' && <small>{i}</small>}
          </div>
        ))}
      </div>
      <div className="viz-explanation">
        <span className="accent">
          {String(index + 1).padStart(2, '0')} / {String(scene.steps.length).padStart(2, '0')}
        </span>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
      </div>
      <div className="viz-code">
        {scene.code.map((line, i) => (
          <div key={i} className={step.line === i ? 'active' : ''}>
            <span>{i + 1}</span>
            <code>{line}</code>
          </div>
        ))}
      </div>
      <div className="viz-controls">
        <button
          aria-label="Reset visualisation"
          className="icon-button"
          onClick={() => {
            setIndex(0);
            setPlaying(false);
          }}
        >
          <RotateCcw size={17} />
        </button>
        <button
          aria-label="Previous step"
          className="icon-button"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => i - 1);
            setPlaying(false);
          }}
        >
          <ArrowLeft size={17} />
        </button>
        <button
          className="button primary"
          onClick={() => {
            if (index === scene.steps.length - 1) setIndex(0);
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause' : 'Play'}
        </button>
        <button
          aria-label="Next step"
          className="icon-button"
          disabled={index === scene.steps.length - 1}
          onClick={() => {
            setIndex((i) => i + 1);
            setPlaying(false);
          }}
        >
          <ArrowRight size={17} />
        </button>
        <label>
          Speed{' '}
          <select
            aria-label="Animation speed"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
          </select>
        </label>
      </div>
      <p className="micro">
        A predefined conceptual model. This does not trace arbitrary submitted code.
      </p>
    </div>
  );
}
