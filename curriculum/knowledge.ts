import type { PublicExercise } from './schema';
type Check = { question: string; answer: boolean; explanation: string };
const checks: Record<string, Check> = {
  'js-debounce': {
    question: 'Must successive calls share the same pending timer handle?',
    answer: true,
    explanation:
      'Correct. A closure retains the pending timer so each new call can cancel the previous invocation.',
  },
  'js-throttle': {
    question: 'Should a suppressed call postpone the next eligible invocation?',
    answer: false,
    explanation:
      'Correct. A leading-edge throttle measures the interval from the last accepted call.',
  },
  'js-memoize': {
    question: 'Can a cached undefined value be treated as a cache miss?',
    answer: false,
    explanation: 'Correct. Use Map.has to distinguish missing entries from cached undefined.',
  },
  'js-once': {
    question: 'Should an initialisation that throws count as successfully completed?',
    answer: false,
    explanation: 'Correct. Set the completion flag only after the function returns successfully.',
  },
  'js-clone': {
    question: 'Can JSON serialisation preserve cyclic object references?',
    answer: false,
    explanation:
      'Correct. Cycles require an explicit visited map that connects source objects to clones.',
  },
  'js-emitter': {
    question: 'Does copying the listener Set give stable dispatch semantics?',
    answer: true,
    explanation:
      'Correct. A snapshot prevents unsubscribe calls from skipping listeners in the current dispatch.',
  },
  'js-promise-all': {
    question: 'Should output positions follow the order promises settle?',
    answer: false,
    explanation: 'Correct. Output positions follow input order, regardless of settlement order.',
  },
  'js-pool': {
    question: 'Can workers claim an index synchronously before awaiting a task?',
    answer: true,
    explanation:
      'Correct. Claiming first gives each worker distinct work and lets results keep their original positions.',
  },
  'js-retry': {
    question: 'Should the runner sleep after its final failed attempt?',
    answer: false,
    explanation: 'Correct. Waiting only makes sense when another attempt remains.',
  },
  'js-timeout': {
    question: 'Does rejecting a timeout wrapper cancel the underlying operation?',
    answer: false,
    explanation: 'Correct. Cancellation needs an explicit protocol such as AbortSignal.',
  },
  'js-lru': {
    question: 'Should a successful cache read refresh its recency?',
    answer: true,
    explanation: 'Correct. Least-recently-used eviction counts reads as use, not only writes.',
  },
  'py-window': {
    question: 'May the left window boundary move backwards after a repeated character?',
    answer: false,
    explanation: 'Correct. max(left, previous + 1) keeps the unique-window invariant intact.',
  },
  'py-binary': {
    question: 'Should you return immediately on equality when seeking the first duplicate?',
    answer: false,
    explanation: 'Correct. Continue searching left to find the earliest matching position.',
  },
  'py-stack': {
    question: 'Is counting opening and closing delimiters enough to validate nesting?',
    answer: false,
    explanation:
      'Correct. Crossed nesting can have equal counts; a stack verifies the closing order.',
  },
  'py-chunks': {
    question: 'Can a generator emit a batch before the full input is consumed?',
    answer: true,
    explanation: 'Correct. Bounded batches keep only the current batch in memory.',
  },
  'py-defaults': {
    question: 'Are mutable default arguments recreated for every call?',
    answer: false,
    explanation:
      'Correct. Defaults are evaluated once at definition time; use None for per-call allocation.',
  },
  'py-decorator': {
    question: 'Does a wrapper automatically keep the original function name?',
    answer: false,
    explanation: 'Correct. functools.wraps preserves introspection metadata explicitly.',
  },
  'py-context': {
    question: 'Must cleanup run even if the context body raises an exception?',
    answer: true,
    explanation: 'Correct. A finally block releases the resource on normal and exceptional exits.',
  },
  'py-async': {
    question: 'Does awaiting each coroutine in a loop start them concurrently?',
    answer: false,
    explanation:
      'Correct. Each await must finish before the next iteration; gather schedules wrapper coroutines together.',
  },
  'py-fastapi-users': {
    question: 'Should a duplicate create request return the same 201 status as a new user?',
    answer: false,
    explanation:
      'Correct. This API contract uses 409 for duplicates, 422 for invalid input and 201 for creation.',
  },
  'py-fastapi-pagination': {
    question: 'Should total report the full collection rather than only the page length?',
    answer: true,
    explanation: 'Correct. A client needs the full total to decide whether more pages exist.',
  },
  'react-cleanup': {
    question: 'Does React automatically remove event listeners registered inside an effect?',
    answer: false,
    explanation: 'Correct. Return a cleanup function that removes the exact original callback.',
  },
  'react-previous': {
    question: 'Can an effect update a ref after the current render has read its previous value?',
    answer: true,
    explanation: 'Correct. Updating after commit makes the new value available to the next render.',
  },
  'react-derived': {
    question: 'Does a useState initialiser rerun whenever a prop changes?',
    answer: false,
    explanation:
      'Correct. Derive totals from current props instead of copying initial data into state.',
  },
  'react-race': {
    question: 'Can an older request resolve after a newer one?',
    answer: true,
    explanation:
      'Correct. Ignore obsolete completions using cleanup or cancel them with an appropriate API.',
  },
  'eng-rate': {
    question: 'Should a rejected request consume a slot in this accepted-request window?',
    answer: false,
    explanation:
      'Correct. This contract counts accepted requests; rejected calls must not extend the window.',
  },
  'eng-deps': {
    question: 'Does encountering a currently visiting node reveal a dependency cycle?',
    answer: true,
    explanation:
      'Correct. Visiting and completed nodes need separate states to distinguish cycles from shared dependencies.',
  },
  'eng-idempotency': {
    question: 'Is in-process request coalescing equivalent to durable payment idempotency?',
    answer: false,
    explanation:
      'Correct. This only deduplicates overlapping calls in one process, not retries across restarts or services.',
  },
};
const defaults: Record<string, Check> = {
  javascript: {
    question: 'Does rejecting a promise automatically cancel other running work?',
    answer: false,
    explanation:
      'Correct. Promise rejection communicates an outcome; it does not cancel other operations.',
  },
  typescript: {
    question: 'Can a TypeScript annotation validate external JSON at runtime?',
    answer: false,
    explanation:
      'Correct. Type annotations are erased; external data still needs runtime validation.',
  },
  python: {
    question: 'Can a dictionary track previously seen values without rescanning the entire input?',
    answer: true,
    explanation:
      'Correct. Expected constant-time lookups make one-pass counting and complement searches practical.',
  },
  react: {
    question: 'Does a state setter immediately change the value captured by the current render?',
    answer: false,
    explanation:
      'Correct. Each render has a state snapshot. Functional updates compose with queued updates.',
  },
  go: {
    question: 'Does a pointer let a function update a caller-owned value?',
    answer: true,
    explanation:
      'Correct. The pointer itself is copied, but both pointers refer to the same underlying variable.',
  },
  rust: {
    question: 'Does passing an owned Vec by value preserve ownership for the original caller?',
    answer: false,
    explanation:
      'Correct. Passing by value moves ownership. Borrow a slice when you only need to inspect it.',
  },
  swift: {
    question: 'Can external code synchronously mutate an actor-isolated property?',
    answer: false,
    explanation:
      'Correct. Actor isolation requires appropriate asynchronous access across the isolation boundary.',
  },
};
export function knowledgeFor(exercise: Pick<PublicExercise, 'id' | 'language'>): Check {
  return checks[exercise.id] ?? defaults[exercise.language];
}
