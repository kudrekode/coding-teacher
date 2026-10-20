import { exercises } from './exercises';
import './python';
import './react';
import './native';
import './engineering';
import './expanded';
import { createConcepts, validateConcepts } from './concepts';
import { lessonNotes } from './lesson-notes';
import { addFoundationLessons } from './foundation-lessons';
export { exercises };
export const concepts = createConcepts(exercises, lessonNotes);
addFoundationLessons(concepts);
export const tracks = [
  {
    id: 'javascript',
    name: 'JavaScript',
    short: 'JS',
    color: '#e8c863',
    description: 'From closures to resilient systems. Build the tools you use every day.',
    level: 'Deepen your foundations',
    modules: ['Closures & execution', 'Async programming', 'Type-safe design', 'Backend patterns'],
    future: [
      'Prototypes & this',
      'Generators & modules',
      'Conditional types & infer',
      'Transactions & webhooks',
      'Graceful shutdown & observability',
    ],
  },
  {
    id: 'python',
    name: 'Python & FastAPI',
    short: 'Py',
    color: '#70b7e5',
    description: 'Think in Python. Master data patterns and ship validated APIs.',
    level: 'From patterns to production',
    modules: ['Python idioms', 'Data structures', 'Asyncio', 'Real FastAPI services'],
    future: [
      'Dataclasses & protocols',
      'Trees & heaps',
      'Dynamic programming',
      'Database sessions & lifespan',
      'Authentication dependencies',
    ],
  },
  {
    id: 'react',
    name: 'React Fundamentals',
    short: 'Re',
    color: '#69d1df',
    description: 'Understand renders, effects and state. Fix the bugs that matter.',
    level: 'Beyond memorising hooks',
    modules: ['Render snapshots', 'Effects & cleanup', 'Refs & derived data', 'Async UI'],
    future: [
      'Context & state lifting',
      'Controlled forms',
      'Memoisation & profiling',
      'Accessible component design',
    ],
  },
  {
    id: 'go',
    name: 'Go',
    short: 'Go',
    color: '#7bd3c5',
    description: 'Simple interfaces. Explicit errors. Practical concurrency.',
    level: 'Learn a new mental model',
    modules: ['Pointers & values', 'Slices & maps', 'Methods', 'Workers & HTTP'],
    future: [
      'Interfaces & generics',
      'Context cancellation',
      'Mutexes & race detection',
      'JSON request validation',
    ],
  },
  {
    id: 'rust',
    name: 'Rust',
    short: 'Rs',
    color: '#dca07a',
    description: 'Make ownership click. Write expressive, reliable systems code.',
    level: 'Safety through understanding',
    modules: ['Ownership & borrowing', 'Option & Result', 'Collections', 'CLI design'],
    future: ['Lifetimes', 'Traits & generics', 'Smart pointers', 'Async fundamentals'],
  },
  {
    id: 'typescript',
    name: 'TypeScript & Node.js',
    short: 'TS',
    color: '#8caeda',
    description: 'Model valid states. Make boundaries explicit. Build reliable services.',
    level: 'From types to backend architecture',
    modules: ['Type foundations', 'Domain modelling', 'Reusable types', 'Backend architecture'],
    future: ['Streams', 'Webhooks', 'Durable idempotency'],
  },
  {
    id: 'engineering',
    name: 'DSA & Engineering',
    short: 'SE',
    color: '#b8a0e9',
    description: 'Connect algorithms to caches, queues and reliable backend systems.',
    level: 'Think beyond the function',
    modules: ['Rate limiting', 'Dependency graphs', 'Idempotency'],
    future: [
      'Database transactions & indexes',
      'Distributed locks',
      'Message queues',
      'Testing & observability',
      'Performance profiling',
    ],
  },
].sort(
  (a, b) =>
    ['javascript', 'typescript', 'python', 'react', 'go', 'rust', 'engineering'].indexOf(a.id) -
    ['javascript', 'typescript', 'python', 'react', 'go', 'rust', 'engineering'].indexOf(b.id),
);
export function validateCurriculum() {
  const ids = new Set<string>();
  for (const e of exercises) {
    if (ids.has(e.id)) throw Error(`Duplicate exercise: ${e.id}`);
    ids.add(e.id);
  }
  const visit = (id: string, active: Set<string>, done: Set<string>) => {
    if (active.has(id)) throw Error(`Prerequisite cycle: ${id}`);
    if (done.has(id)) return;
    const e = exercises.find((e) => e.id === id);
    if (!e) throw Error(`Missing prerequisite: ${id}`);
    active.add(id);
    for (const p of e.prerequisites) visit(p, active, done);
    active.delete(id);
    done.add(id);
  };
  const done = new Set<string>();
  for (const e of exercises) visit(e.id, new Set(), done);
  validateConcepts(concepts, exercises);
  return true;
}
validateCurriculum();
