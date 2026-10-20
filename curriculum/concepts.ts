import { z } from 'zod';
import type { Exercise } from './schema';

export const conceptTracks = [
  'javascript',
  'typescript',
  'python',
  'react',
  'go',
  'rust',
  'engineering',
] as const;
export const conceptSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(2),
  track: z.enum(conceptTracks),
  topic: z.string().min(2),
  summary: z.string().min(15),
  difficulty: z.enum(['Foundation', 'Intermediate', 'Advanced']),
  prerequisites: z.array(z.string()),
  recommended: z.array(z.string()),
  related: z.array(z.string()),
  enables: z.array(z.string()),
  objectives: z.array(z.string()),
  exercises: z.array(z.string()),
  status: z.enum(['lesson', 'guide', 'planned']),
  lesson: z
    .object({
      problem: z.string(),
      explanation: z.array(z.string()).min(1),
      code: z.string(),
      walkthrough: z.array(z.string()),
      mistakes: z.array(z.string()),
      application: z.string(),
      debugging: z
        .object({ code: z.string(), diagnosis: z.string(), exercise: z.string().optional() })
        .optional(),
      demo: z
        .enum(['debounce', 'event-loop', 'binary', 'queue', 'stack', 'union', 'ownership'])
        .optional(),
    })
    .optional(),
});
export type Concept = z.infer<typeof conceptSchema>;

// Required edges encode knowledge needed to follow an explanation, never a lock on navigation.
// Recommended and related edges are separate, deliberately sparse relationships.
const catalog: Record<(typeof conceptTracks)[number], string> = {
  javascript: `
js-functions|Functions & scope|Language foundations|Functions create local scopes and carry executable behaviour.| |F
js-closures|Closures|Language foundations|Retain lexical state after the enclosing call returns.|js-functions|F
js-this|The receiver: this|Language foundations|Understand how the call site determines a function's receiver.|js-functions|I
js-higher-order|Higher-order functions|Language foundations|Accept behaviour as an argument or return a reusable function.|js-functions|F
js-timers|Timers & cancellation|Async systems|Schedule work after a delay and cancel work that is no longer needed.|js-functions|F
js-event-loop|The event loop|Async systems|Follow stack execution, promise jobs and timer tasks in order.|js-functions|I
js-promises|Promises|Async systems|Represent an eventual result and compose success and failure.|js-functions|F
js-async-await|Async / await|Async systems|Suspend a function while its promise settles without blocking the thread.|js-promises|I
js-debounce|Debounce|Event control|Wait for a quiet interval before invoking the latest call.|js-closures,js-timers,js-higher-order|I
js-throttle|Throttle|Event control|Bound event frequency without postponing the next eligible call.|js-closures,js-timers|I
js-retry|Retry & backoff|Resilient services|Retry transient failures with bounded attempts and controlled delay.|js-async-await,js-timers|I
js-cancellation|Cancellation & AbortSignal|Resilient services|Propagate a request to stop work through an explicit protocol.|js-promises|I
js-pool|Concurrency limiting|Resilient services|Bound work in flight while preserving each result's input position.|js-async-await|A
js-dedup|Request deduplication|Resilient services|Share a pending operation for identical keys, then release it.|js-promises|A
js-emitter|Event emitters|Language foundations|Decouple producers and subscribers with stable dispatch semantics.|js-higher-order|I
js-memoize|Memoisation|Data & state|Reuse computed results when a key fully describes the input.|js-closures|I
js-lru|LRU caches|Data & state|Evict the least recently used entry from a bounded cache.|js-memoize|A
js-once|One-time initialisation|Data & state|Cache a successful initialisation while allowing failed attempts to retry.|js-closures|I
js-clone|Object graphs & cloning|Data & state|Copy connected data without losing cycles and shared references.|js-functions|A
js-generators|Generators|Language foundations|Yield a sequence lazily and preserve execution state between values.|js-functions|I`,
  typescript: `
ts-structural|Structural typing|Type foundations|Assign values by their shape rather than their declared names.||F
ts-unions|Union types|Type foundations|Describe a value that can inhabit one of several alternatives.|ts-structural|F
ts-narrowing|Type narrowing|Type foundations|Use control flow and checks to refine what is known about a value.|ts-unions|F
ts-discriminated|Discriminated unions|Domain modelling|Link a literal tag to the data that belongs to each state.|ts-narrowing|I
ts-exhaustive|Exhaustiveness & never|Domain modelling|Make a missing case produce a compiler error.|ts-discriminated|I
ts-api|API response modelling|Domain modelling|Represent success and failure without contradictory optional fields.|ts-discriminated|I
ts-unknown|Unknown versus any|Type foundations|Require evidence before using data from an untrusted boundary.|ts-narrowing|F
ts-validation|Runtime validation|Service boundaries|Check real input before treating it as a TypeScript domain value.|ts-unknown|I
ts-interfaces|Interfaces & type aliases|Type foundations|Choose named object contracts or composable type expressions.|ts-structural|F
ts-literals|Literal unions & enums|Type foundations|Model finite choices and understand which forms emit JavaScript.|ts-unions|I
ts-generics|Generics|Reusable types|Preserve a relationship between inputs and outputs across many types.|ts-structural|F
ts-constraints|Generic constraints|Reusable types|Require only the capabilities a generic algorithm actually needs.|ts-generics|I
ts-mapped|Mapped types|Reusable types|Transform properties while preserving their key-specific value types.|ts-generics|I
ts-conditional|Conditional types|Reusable types|Select a type using an assignability relationship.|ts-generics,ts-unions|A
ts-utilities|Utility types|Reusable types|Compose Pick, Omit, Partial and ReturnType into precise contracts.|ts-mapped|I
ts-assertions|Assertions & soundness|Service boundaries|Recognise when an assertion replaces compiler evidence with a promise.|ts-unknown|I
ts-errors|Typed error handling|Service boundaries|Translate transport failures into explicit domain outcomes.|ts-discriminated|I
ts-streams|Node.js streams|Backend architecture|Use backpressure to keep producers from overwhelming consumers.|js-async-await|A
ts-webhooks|Webhooks|Backend architecture|Verify incoming events and handle duplicate or reordered delivery.|ts-validation|A
ts-transactions|Transaction boundaries|Backend architecture|Commit related database changes atomically and release resources on failure.|ts-errors|A
ts-idempotency|Durable idempotency|Backend architecture|Make repeated requests produce one durable business effect.|ts-transactions|A`,
  python: `
py-collections|Dictionaries & sets|Python foundations|Track membership and counts with hash-based collections.||F
py-functions|Functions & defaults|Python foundations|Understand argument binding and the lifetime of default objects.||F
py-iterators|Iterators|Python foundations|Consume values through iter and next without requiring random access.||F
py-generators|Generators|Python foundations|Yield bounded batches while consuming an input only once.|py-iterators|I
py-decorators|Decorators|Python foundations|Wrap behaviour while preserving a function's public metadata.|py-functions|I
py-context|Context managers|Resources & concurrency|Pair resource acquisition with cleanup even when the body raises.|py-functions|I
py-typing|Python typing|Python foundations|Describe contracts for tooling while retaining runtime checks.||F
py-dataclasses|Dataclasses|Domain modelling|Generate value-object boilerplate without hiding mutable defaults.|py-typing|I
py-asyncio|Asyncio|Resources & concurrency|Schedule cooperative tasks on an event loop and await their outcomes.|py-functions|I
py-concurrency|Bounded async work|Resources & concurrency|Use a semaphore to cap active requests without serialising everything.|py-asyncio|A
py-pydantic|Pydantic models|FastAPI services|Parse and validate request data at the application boundary.|py-typing|I
py-fastapi|FastAPI request validation|FastAPI services|Turn HTTP input into validated models and explicit response contracts.|py-pydantic|I
py-dependencies|FastAPI dependencies|FastAPI services|Provide per-request resources through an explicit dependency graph.|py-fastapi|I
py-exceptions|HTTP exception handling|FastAPI services|Translate domain failures into deliberate status codes.|py-fastapi|I
py-rest|REST resource design|FastAPI services|Use resources, methods and status codes to express an HTTP contract.||I
py-pagination|Pagination|FastAPI services|Bound collection responses and make continuation semantics explicit.|py-fastapi|I
py-sessions|Database sessions|FastAPI services|Scope transactions and cleanup to a request without sharing mutable sessions.|py-dependencies,py-context|A
py-testing|API testing|FastAPI services|Exercise real routing, validation and responses through TestClient.|py-fastapi|I
py-auth|Authentication boundaries|FastAPI services|Verify identity before authorising access to a resource.|py-dependencies|A
py-background|Background tasks|Resources & concurrency|Separate response latency from work that can tolerate in-process execution.|py-asyncio|I`,
  react: `
react-render|Rendering & snapshots|Render model|A render computes a UI from one snapshot of props and state.||F
react-props|Props & data flow|Render model|Pass values down and expose callbacks for changes.|react-render|F
react-state|State & queued updates|Render model|Compose updates against queued state rather than a stale render value.|react-render|F
react-derived|Derived values|Render model|Calculate data from current inputs instead of synchronising copies.|react-props,react-state|I
react-controlled|Controlled inputs|Render model|Keep one source of truth for form values.|react-state|F
react-effects|Effects & dependencies|Effects & resources|Synchronise with external systems after a commit.|react-render|I
react-cleanup|Effect cleanup|Effects & resources|Undo each setup before replacement or unmount.|react-effects|I
react-stale|Stale closures|Effects & resources|Understand why a callback sees the state from its creating render.|react-state,js-closures|I
react-refs|Refs & previous values|Effects & resources|Retain mutable values without triggering renders.|react-render|I
react-fetch|Async fetching|Async UI|Represent pending, success and failure while requests settle.|react-state,react-effects|I
react-races|Response races|Async UI|Ignore obsolete completions when request order differs from response order.|react-fetch,react-cleanup|A
react-hooks|Custom hooks|Composition|Share stateful logic while giving each caller independent state.|react-state,react-effects|I
react-context|Context|Composition|Provide a shared dependency through a subtree.|react-props|I
react-memo|Memoisation & identity|Composition|Use stable identities where measured render work justifies caching.|react-render|A
react-keys|Keys & reconciliation|Render model|Identify list items so state follows the intended entity.|react-render|I
react-events|Events versus effects|Effects & resources|Keep user-triggered actions in handlers and synchronisation in effects.|react-effects|I
react-reducer|Reducers|Composition|Express related state transitions as a pure function.|react-state|I
react-accessibility|Accessible interactions|Composition|Use semantic controls, labels and keyboard behaviour.|react-props|I`,
  go: `
go-values|Values & zero values|Go foundations|Understand copying, initialisation and useful zero-value types.||F
go-pointers|Pointers|Go foundations|Share access to a caller-owned value through an explicit address.|go-values|F
go-slices|Slices & maps|Go foundations|Combine slice order with map membership without mutating the caller.|go-values|F
go-structs|Structs|Go foundations|Group related fields into concrete domain values.|go-values|F
go-methods|Methods & receivers|Go foundations|Choose value or pointer receivers based on mutation and identity.|go-structs,go-pointers|I
go-interfaces|Implicit interfaces|Go foundations|Satisfy behavioural contracts through a method set.|go-methods|I
go-errors|Errors|Reliable services|Return errors as values and add context without losing causes.|go-values|F
go-generics|Generics|Go foundations|Parameterise reusable algorithms over constrained types.|go-values|I
go-goroutines|Goroutines|Concurrent services|Start concurrent functions and account for how they stop.|go-functions|I
go-functions|Functions & multiple returns|Go foundations|Return values and explicit status without sentinel ambiguity.|go-values|F
go-channels|Channels|Concurrent services|Coordinate ownership and work using typed communication.|go-goroutines|I
go-context|Context cancellation|Concurrent services|Propagate deadlines and cancellation through request-scoped work.|go-channels|I
go-mutex|Mutexes|Concurrent services|Protect shared invariants across concurrent access.|go-goroutines|I
go-workers|Worker pools|Concurrent services|Bound concurrent consumers and collect every result exactly once.|go-channels|A
go-http|HTTP handlers|Reliable services|Implement the Handler contract and test it without opening a port.|go-interfaces|I
go-testing|Testing|Reliable services|Verify contracts with table-driven tests and meaningful boundary cases.|go-functions|I
go-json|JSON contracts|Reliable services|Decode input and reject invalid domain states explicitly.|go-structs|I
go-defer|Defer & cleanup|Reliable services|Schedule resource cleanup at function exit.|go-functions|I`,
  rust: `
rust-ownership|Ownership & moves|Memory model|Move responsibility for a value and its eventual drop to one owner.||F
rust-borrowing|Borrowing|Memory model|Inspect data through shared references without moving it.|rust-ownership|F
rust-mutable|Mutable references|Memory model|Permit exclusive access while preventing conflicting live borrows.|rust-borrowing|I
rust-lifetimes|Lifetimes|Memory model|Express relationships between references without extending actual lifetimes.|rust-borrowing|A
rust-structs|Structs|Domain modelling|Represent related values with explicit ownership of each field.|rust-ownership|F
rust-enums|Enums|Domain modelling|Make invalid states harder to represent with payload-bearing variants.||F
rust-match|Pattern matching|Domain modelling|Destructure variants and account for every case.|rust-enums|F
rust-option|Option|Domain modelling|Represent absence explicitly and transform the contained value safely.|rust-match|F
rust-result|Result & error propagation|Reliable systems|Return success or a typed error and compose fallible operations.|rust-match|I
rust-traits|Traits|Reusable behaviour|Define shared behaviour without requiring class inheritance.|rust-structs|I
rust-generics|Generics|Reusable behaviour|Share algorithms across types constrained by trait bounds.|rust-traits|I
rust-iterators|Iterators|Reusable behaviour|Compose lazy transformations over owned or borrowed collections.|rust-borrowing|I
rust-collections|Collections & hashing|Reusable behaviour|Use a set for membership while preserving output order separately.|rust-ownership|I
rust-smart|Box, Rc & Arc|Memory model|Choose unique allocation, shared ownership or atomic reference counts.|rust-ownership|A
rust-drop|Drop & RAII|Memory model|Tie resource release to ownership rather than manual cleanup paths.|rust-ownership|I
rust-threads|Threads & Send / Sync|Reliable systems|Use type-checked boundaries for sharing and moving data across threads.|rust-traits,rust-ownership|A
rust-errors|Error types|Reliable systems|Preserve causes and expose useful domain failures.|rust-result|I
rust-cli|CLI parsing|Reliable systems|Parse borrowed argument slices before performing side effects.|rust-result,rust-match|I`,
  engineering: `
eng-arrays|Arrays & contiguous data|Data structures|Index data directly and account for insertion and copying costs.||F
eng-hash|Hash maps & sets|Data structures|Trade hashing and memory for expected constant-time lookup.||F
eng-stacks|Stacks|Data structures|Track nested work in last-in-first-out order.|eng-arrays|F
eng-queues|Queues|Data structures|Process jobs in first-in-first-out order with explicit empty states.|eng-arrays|F
eng-trees|Trees|Data structures|Represent nested structure and traverse it with clear visit order.|eng-stacks|I
eng-graphs|Graphs|Data structures|Represent entities and relationships with adjacency structures.|eng-hash|I
eng-heaps|Heaps & priority queues|Data structures|Repeatedly select the next highest-priority item efficiently.|eng-trees|I
eng-binary|Binary search|Algorithms in systems|Maintain a search interval and halve it on sorted data.|eng-arrays|F
eng-sorting|Sorting|Algorithms in systems|Choose ordering rules and account for stability and mutation.|eng-arrays|I
eng-recursion|Recursion|Algorithms in systems|Solve smaller subproblems with explicit base cases and stack costs.|eng-stacks|I
eng-dp|Dynamic programming|Algorithms in systems|Reuse overlapping subproblem results instead of repeating work.|eng-recursion|I
eng-window|Sliding windows|Algorithms in systems|Maintain an interval invariant while processing a stream in one pass.|eng-hash|I
eng-dependencies|Dependency graphs|Architecture|Order work topologically and identify cycles honestly.|eng-graphs|I
eng-caching|Cache design|Architecture|Choose keys, bounds and invalidation according to the data contract.|eng-hash|I
eng-jobs|Job queues|Architecture|Separate producers from workers and define retry and failure semantics.|eng-queues|I
eng-rate|Rate limiting|Architecture|Bound accepted work over time while keeping rejection semantics explicit.|eng-queues|A
eng-idempotency|Idempotency & deduplication|Architecture|Distinguish overlapping request coalescing from durable duplicate prevention.|js-promises|A
eng-distributed|Distributed systems fundamentals|Architecture|Design around partial failure, latency and independent clocks.|eng-jobs|A
eng-transactions|Transactions & invariants|Architecture|Keep related writes atomic while choosing an isolation level.||A
eng-observability|Observability|Architecture|Use logs, metrics and traces to investigate concrete failure modes.||I`,
};

export const exerciseConcepts: Record<string, string[]> = {
  'js-debounce': ['js-debounce', 'js-closures', 'js-timers', 'js-this'],
  'js-throttle': ['js-throttle'],
  'js-memoize': ['js-memoize'],
  'js-once': ['js-once'],
  'js-clone': ['js-clone', 'eng-graphs'],
  'js-emitter': ['js-emitter'],
  'js-promise-all': ['js-promises'],
  'js-pool': ['js-pool'],
  'js-retry': ['js-retry'],
  'js-timeout': ['js-cancellation'],
  'js-lru': ['js-lru', 'eng-caching'],
  'ts-result': ['ts-discriminated', 'ts-api'],
  'ts-pick': ['ts-generics', 'ts-constraints', 'ts-utilities'],
  'ts-exhaustive': ['ts-exhaustive'],
  'ts-guard': ['ts-validation', 'ts-unknown', 'ts-narrowing'],
  'ts-mapped': ['ts-mapped'],
  'py-frequency': ['py-collections', 'eng-hash'],
  'py-window': ['eng-window'],
  'py-two-sum': ['eng-hash'],
  'py-binary': ['eng-binary'],
  'py-stack': ['eng-stacks'],
  'py-chunks': ['py-generators', 'py-iterators'],
  'py-defaults': ['py-functions'],
  'py-decorator': ['py-decorators'],
  'py-context': ['py-context'],
  'py-async': ['py-concurrency', 'py-asyncio'],
  'py-fastapi-users': ['py-fastapi', 'py-pydantic', 'py-testing', 'py-exceptions'],
  'py-fastapi-pagination': ['py-pagination'],
  'react-stale': ['react-state', 'react-stale'],
  'react-cleanup': ['react-cleanup', 'react-effects'],
  'react-previous': ['react-refs'],
  'react-derived': ['react-derived'],
  'react-race': ['react-races', 'react-fetch'],
  'react-project': ['react-controlled', 'react-hooks'],
  'go-pointer': ['go-pointers'],
  'go-unique': ['go-slices'],
  'go-queue': ['go-methods', 'eng-queues'],
  'go-workers': ['go-workers', 'go-channels', 'go-goroutines'],
  'go-http': ['go-http', 'go-testing'],
  'rust-borrow': ['rust-borrowing', 'rust-ownership'],
  'rust-option': ['rust-option'],
  'rust-result': ['rust-result'],
  'rust-unique': ['rust-collections', 'rust-iterators'],
  'rust-cli': ['rust-cli'],
  'eng-rate': ['eng-rate'],
  'eng-deps': ['eng-dependencies'],
  'eng-idempotency': ['eng-idempotency', 'js-dedup'],
};

export function createConcepts(
  exercises: Exercise[],
  notes: Record<string, [string, string, string]>,
): Concept[] {
  const concepts: Concept[] = Object.entries(catalog).flatMap(([track, rows]) =>
    rows
      .trim()
      .split('\n')
      .map((row) => {
        const [id, title, topic, summary, requirements, level] = row.trim().split('|');
        const associated = exercises.filter((e) => exerciseConcepts[e.id]?.includes(id));
        const primary = associated[0];
        const note = notes[id];
        return conceptSchema.parse({
          id,
          title,
          track,
          topic,
          summary,
          difficulty: level === 'F' ? 'Foundation' : level === 'A' ? 'Advanced' : 'Intermediate',
          prerequisites: requirements.trim() ? requirements.split(',') : [],
          recommended: [],
          related: [],
          enables: [],
          exercises: associated.map((e) => e.id),
          objectives: primary?.objectives ?? [summary],
          status: note && primary ? 'lesson' : primary ? 'guide' : 'planned',
          lesson: primary
            ? {
                problem: note?.[0] ?? primary.problem,
                explanation: [primary.explanation, ...(note ? [note[1]] : [])],
                code: primary.solution,
                walkthrough: primary.hints,
                mistakes: primary.mistakes,
                application: note?.[2] ?? `Implementation contract: ${primary.problem}`,
                debugging: {
                  code: primary.starter,
                  diagnosis: primary.hints.join(' '),
                  exercise: primary.id,
                },
              }
            : undefined,
        });
      }),
  );
  for (const c of concepts)
    c.enables = concepts.filter((next) => next.prerequisites.includes(c.id)).map((next) => next.id);
  const relate = (a: string, b: string) => {
    concepts.find((c) => c.id === a)!.related.push(b);
    concepts.find((c) => c.id === b)!.related.push(a);
  };
  relate('js-debounce', 'js-throttle');
  relate('js-debounce', 'react-races');
  relate('ts-api', 'py-pydantic');
  relate('go-channels', 'eng-jobs');
  relate('rust-ownership', 'go-pointers');
  relate('js-lru', 'eng-caching');
  concepts.find((c) => c.id === 'js-debounce')!.recommended = ['js-this', 'js-event-loop'];
  return concepts;
}

export function validateConcepts(concepts: Concept[], exercises: Pick<Exercise, 'id' | 'track'>[]) {
  const byId = new Map(concepts.map((c) => [c.id, c]));
  if (byId.size !== concepts.length) throw Error('Duplicate concept ID');
  const exerciseIds = new Set(exercises.map((e) => e.id));
  const done = new Set<string>();
  const visit = (id: string, active = new Set<string>()) => {
    if (active.has(id)) throw Error(`Required prerequisite cycle: ${id}`);
    if (done.has(id)) return;
    const c = byId.get(id);
    if (!c) throw Error(`Missing concept: ${id}`);
    active.add(id);
    c.prerequisites.forEach((p) => visit(p, active));
    active.delete(id);
    done.add(id);
  };
  for (const c of concepts) {
    conceptSchema.parse(c);
    visit(c.id);
    if (c.status !== 'planned' && (!c.lesson || !c.lesson.code.trim() || !c.lesson.problem.trim()))
      throw Error(`Empty lesson: ${c.id}`);
    for (const id of [...c.recommended, ...c.related, ...c.enables])
      if (!byId.has(id)) throw Error(`Broken concept link: ${id}`);
    for (const id of c.exercises)
      if (!exerciseIds.has(id)) throw Error(`Broken exercise link: ${id}`);
    for (const id of c.enables)
      if (!byId.get(id)!.prerequisites.includes(c.id)) throw Error(`Inconsistent unlock: ${id}`);
    if (!catalog[c.track].includes(`${c.id}|${c.title}|${c.topic}|`))
      throw Error(`Inconsistent topic: ${c.id}`);
  }
  for (const e of exercises)
    if (!concepts.some((c) => c.exercises.includes(e.id)))
      throw Error(`Unmapped exercise: ${e.id}`);
  return true;
}
