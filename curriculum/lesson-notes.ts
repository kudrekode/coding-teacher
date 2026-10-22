// Each entry adds a concrete engineering problem, mechanism and production context
// to the existing executable lesson. Reference code and fixtures stay server-owned.
export const lessonNotes: Record<string, [string, string, string]> = {
  'js-debounce': [
    'You are building search. Typing “forge” emits five input events. Sending five requests competes for the same connection, repeats backend work and allows old responses to overwrite new results. Keep the input responsive while waiting for a pause before requesting results.',
    'Create the timer variable once, when debounce is called. Every invocation of the returned wrapper closes over that same variable. Cancel its previous handle, capture the current arguments and receiver, then schedule one callback. setTimeout supplies a minimum delay, not an exact execution instant: a busy event loop can run it later. A zero delay still defers the call. The timer does not block typing.',
    'Use trailing debounce for search suggestions, draft persistence and expensive validation. Cancel pending work when its owner unmounts. Debouncing reduces requests; it does not order network responses. Pair it with AbortController and an obsolete-result guard. For continuous scroll feedback, consider throttle instead.',
  ],
  'js-throttle': [
    'A pointer can move hundreds of times each second, but a telemetry endpoint needs at most one update every interval. Waiting for complete silence would starve updates during a continuous drag.',
    'A leading throttle stores the time of the last accepted call. Compare now minus last against the interval; update last only when accepting. Initialise last to negative infinity so a first event at time zero runs. This implementation deliberately has no trailing callback. Calling it more often cannot push the eligibility boundary into the future.',
    'Use bounded telemetry or coarse scroll measurements. requestAnimationFrame is usually better when updates must align with paint. Document leading and trailing semantics: two functions named throttle can have different contracts.',
  ],
  'js-memoize': [
    'Rendering the same expensive report repeatedly recomputes identical totals. You want reuse, but a legitimate undefined result must also be cached.',
    'A Map separates membership from the stored value. Use has before get so falsy and undefined results remain hits. The cache key must encode every input that changes the answer. Object identity is a different contract from structural equality. Mutation can make a previously correct cached result stale.',
    'Memoise pure calculations with stable, bounded key spaces. For user-generated keys use an eviction policy. Avoid caching authorisation decisions indefinitely or treating a memo table as a substitute for invalidation.',
  ],
  'js-once': [
    'A service must initialise a local resource once. The first attempt can throw, and a later call should retry rather than silently returning an uninitialised value.',
    'Keep a completion flag separate from the cached result. Call the wrapped function, store its result and only then set the flag. A throw leaves the flag false. Checking the result for truthiness would repeat valid initialisations returning zero or undefined. This synchronous contract does not automatically deduplicate pending asynchronous initialisation.',
    'Use for lazy synchronous setup such as parsing a fixed configuration. For async connections, cache the in-flight promise and decide whether rejection should evict it. Make resource lifetime explicit.',
  ],
  'js-clone': [
    'Your editor document contains shared style objects and parent references. JSON copying fails on cycles and loses the fact that two nodes referenced the same object.',
    'Treat the input as a graph. Allocate an empty destination, register source-to-destination identity in a visited map, then recursively copy edges. Registering after recursion is too late for a self-reference. A visited map also preserves shared aliases. This exercise supports the stated plain-object and array contract, not arbitrary class instances.',
    'Document editors and graph transforms need identity-aware copies. Often immutable updates or structuredClone fit better. Neither technique removes the need to define supported values, transferable resources and custom prototypes.',
  ],
  'js-emitter': [
    'A listener unsubscribes another listener while an event is being dispatched. Should that change the list halfway through the current event?',
    'Store a Set of listeners per event and take a snapshot at dispatch time. Subscription changes affect the next event, giving the current dispatch a stable audience. Return an unsubscribe closure that removes the exact listener. Define whether exceptions stop dispatch; the exercise contract determines this rather than the name EventEmitter.',
    'Use for in-process notifications where producers should not know subscribers. Always provide disposal for long-lived producers. An emitter provides neither durable delivery nor acknowledgement across process boundaries.',
  ],
  'js-promises': [
    'A page fetches three independent resources. They resolve in an unpredictable order, but the caller expects the results in the same order as the inputs.',
    'Reserve a result slot for each input index before attaching handlers. Increment a settled count and resolve only when every input succeeds. Promise.resolve normalises values and thenables. Reject on the first failure, but remember that rejection does not stop other work. Handle an empty input without waiting for a callback that cannot occur.',
    'Aggregate independent reads when all results are required. Use allSettled when partial results are useful, and an explicit cancellation protocol when outstanding work should stop. Preserve input order even when network latency differs.',
  ],
  'js-pool': [
    'An import contains 10,000 remote lookups. Starting everything at once exhausts connections; awaiting one lookup at a time wastes available capacity.',
    'Start a bounded number of async workers. Each claims a distinct index synchronously before awaiting its task, then stores the result at that index. JavaScript execution between await points is not interleaved on one thread. This makes the index claim safe here; the same reasoning does not apply to shared memory across worker threads.',
    'Bound API fan-out and migration jobs to respect downstream capacity. Concurrency limits count active operations; rate limits count starts over time. Fail-fast rejection still needs cancellation or draining if resource cleanup depends on the remaining tasks.',
  ],
  'js-retry': [
    'A transient network failure should not fail an entire job, but an invalid request should not be repeated forever. Retrying needs a precise attempt and delay budget.',
    'Wrap each attempt in try/catch, return immediately on success, and rethrow the last failure once the budget is exhausted. Delay only if another attempt remains. Exponential backoff increases the spacing between attempts; production systems commonly add jitter so many clients do not retry together.',
    'Retry transient failures only when the operation is safe to repeat or protected by durable idempotency. Honour Retry-After, cancellation and a total deadline. A retry utility cannot decide whether a payment was already committed.',
  ],
  'js-cancellation': [
    'A request exceeds its UI deadline. Rejecting the wrapper updates the screen, yet the original operation may still hold a connection and later complete.',
    'A timeout races a result against a timer. Clear the timer when the operation settles to release unnecessary work. Promise rejection communicates an outcome; it does not interrupt the losing operation. AbortSignal is a separate cooperative protocol that participating APIs must observe.',
    'Propagate an AbortSignal through fetch calls and request-scoped work. AbortController can ask fetch to stop, but server-side effects may already have happened. Cleanup and stale-result guards remain useful even with cancellation.',
  ],
  'js-lru': [
    'A backend caches compiled templates, but an unbounded Map grows with every distinct customer. Keep a fixed capacity while retaining the templates used most recently.',
    'Map iteration follows insertion order. Refresh a hit by deleting and reinserting its entry. On insertion beyond capacity, evict the first key. has distinguishes a cached undefined value. Capacity and overwrite semantics must be explicit; a read counts as use, not only a write.',
    'Bound template, parser or metadata caches. LRU tracks recency, not expiry or memory size. Large values may need a byte budget, and invalidation may need a version key or TTL in addition to eviction.',
  ],
  'ts-discriminated': [
    'Your API model uses optional data and optional error fields. It allows both to exist or neither to exist, leaving every consumer to guess what happened.',
    'Give each alternative a shared literal property such as ok or status. Checking that property narrows the entire object, including its payload. The correlation lives in the union members; a single object with unrelated union-typed fields does not preserve it. TypeScript erases these types, so validate JSON before trusting the tag.',
    'Model API outcomes, async UI and domain events as tagged alternatives. Keep transport parsing at the boundary. Adding a new variant should force deliberate handling at consumers that claim to be exhaustive.',
  ],
  'ts-api': [
    'A client needs to distinguish a successful payload from a domain error without accidentally accessing data on a failed response.',
    'A generic Result<T> carries T only on the success branch. Consumers branch on the discriminant before reading data or error. A transport status code and a domain result are different layers: parsing an HTTP response is still fallible. Avoid asserting an arbitrary response as Result<T>.',
    'Put typed response helpers behind runtime decoders. Keep authentication, validation and conflict failures distinguishable when the UI can act on them. Do not expose private exception details in public response payloads.',
  ],
  'ts-generics': [
    'A helper picks properties from an object. Returning Record<string, unknown> discards precisely the information its caller needs.',
    'T represents the input object and K extends keyof T restricts keys to properties actually present on T. Pick<T, K> preserves each selected property type. Generics express a relationship; adding a generic parameter used only once usually communicates less than an ordinary concrete type.',
    'Use for typed repositories, collection helpers and API adapters. Keep constraints minimal so callers retain their specific types. Compile-time negative fixtures verify that invalid keys and wrong assignments are rejected.',
  ],
  'ts-exhaustive': [
    'A new task state is added to a domain model. An old switch silently falls into its default branch and renders the wrong UI.',
    'After handling every discriminant, the remaining value narrows to never. Pass it to an assertNever function. Adding a variant makes that call ill-typed until the switch handles it. A default branch returning an ordinary fallback hides the gap instead of proving completeness.',
    'Use for reducers, protocol messages and workflow state machines. Exhaustiveness checks protect known static alternatives; external data still needs validation before it enters the model.',
  ],
  'ts-validation': [
    'JSON.parse returns a value from outside your type system. An annotation cannot stop a string from arriving where an integer is required.',
    'Accept unknown, check that the value is a non-null object, then inspect the required properties and their runtime types. A user-defined type predicate is trusted by the compiler, so its implementation is part of the safety boundary. Check every field promised by the predicate.',
    'Validate at HTTP, message queue and file boundaries. For richer contracts use a schema library and infer the static type from its schema. Validation establishes shape, while authorisation and business rules establish permission and meaning.',
  ],
  'ts-mapped': [
    'You want a form updater whose setter for age accepts a number while its setter for name accepts a string. A dictionary of generic callbacks loses this key-specific relationship.',
    'Iterate over keyof T in a mapped type and use T[K] for each property value. This preserves the connection between an individual key and its value type. Optional and readonly modifiers can be preserved, added or removed deliberately. The type transformation generates no runtime setters by itself.',
    'Use mapped types for configuration, forms and typed event maps. Pair the type with a real implementation. An assertion that a runtime object has every mapped property cannot create missing functions.',
  ],
  'py-collections': [
    'An ingestion job counts event kinds. Repeatedly scanning the input for every distinct kind turns a simple aggregation into quadratic work.',
    'Visit each input once and update its dictionary count. Hash lookup is expected constant time, not a worst-case guarantee. A dictionary preserves insertion order in current Python, but a set does not promise a meaningful sorted order. Empty input should naturally produce an empty result.',
    'Use dictionaries for aggregation, indexes and joins that fit in memory. Streaming inputs need only retain the distinct keys and counts. For unbounded cardinality, consider external aggregation rather than an ever-growing dictionary.',
  ],
  'eng-window': [
    'A log stream needs its longest segment without repeated identifiers. Rechecking every possible segment repeats the same membership work.',
    'Maintain the left boundary and the last index seen for each value. On a repeat, set left to max(left, previous + 1). Moving left backwards would reintroduce a duplicate that was already excluded. After updating the boundary, compare the current width with the best width.',
    'Sliding windows appear in stream analytics, quota tracking and substring processing. Define the window invariant first. Time windows additionally require an explicit clock, boundary policy and handling of out-of-order events.',
  ],
  'eng-binary': [
    'A sorted history contains millions of entries. You need the first matching timestamp, including duplicates, without scanning from the beginning.',
    'Maintain a valid search interval. Comparing the middle item discards one half. When equality is found, record the candidate and continue left if the contract asks for the first occurrence. Update boundaries past the midpoint so the interval shrinks on every iteration.',
    'Use for sorted indexes, configuration thresholds and monotonic predicates. Sorting first costs work and can destroy original order. Binary search requires ordering consistent with the comparator.',
  ],
  'eng-stacks': [
    'A configuration parser sees nested brackets. Equal counts of opening and closing characters do not reject crossed nesting such as ([)].',
    'Push each expected closing delimiter when an opener appears. A closer must match the most recently opened group. Reject an empty stack or a mismatched top; accept only when no pending opener remains. The stack encodes nesting order rather than a count.',
    'Stacks power parsing, expression evaluation, undo operations and explicit depth-first traversal. For very deep input, an explicit stack avoids depending on a language call-stack limit.',
  ],
  'py-generators': [
    'A file iterator is too large to turn into a list, but the database accepts batches. You need to emit a batch before consuming the rest of the file.',
    'A generator pauses at yield with its local state retained. Accumulate at most the batch size, emit it, then allocate a fresh batch. Reusing and clearing the same list can mutate batches already held by the caller. Emit a final partial batch and reject non-positive sizes.',
    'Use for bounded import pipelines and paged processing. A generator is lazy and usually single-pass. Exceptions can occur during iteration rather than when the generator object is created.',
  ],
  'py-functions': [
    'Two requests call a helper with no explicit list argument. Data from the first request unexpectedly appears in the second request.',
    'Python evaluates default argument expressions when the function is defined. A mutable default therefore survives across calls. Use None as the absence marker and allocate a list inside the function. Check is None rather than truthiness so a caller-supplied empty list keeps its intended identity.',
    'Review helpers that accumulate values, dependency defaults and dataclass fields. Dataclasses need default_factory for per-instance mutable values. Shared defaults should be a deliberate cache contract, never an accidental request data store.',
  ],
  'py-decorators': [
    'You add instrumentation around a function and your API documentation now reports every endpoint as wrapper. The behaviour works, but introspection broke.',
    'A decorator accepts a function and returns a replacement. Forward positional and keyword arguments, return its result, and use functools.wraps to preserve metadata and expose __wrapped__. Decorator evaluation happens at definition time; wrapper execution happens at call time.',
    'Use for tracing, timing and policy at explicit boundaries. Async functions need an async wrapper that awaits the wrapped function. A synchronous decorator around a coroutine may measure only coroutine creation.',
  ],
  'py-context': [
    'A processing step raises halfway through using a resource. Cleanup placed after the step never runs, leaking the resource.',
    'A context manager pairs setup with teardown. With contextlib.contextmanager, yield the resource inside try and release it in finally. An exception in the with body is thrown back at the yield point. Do not accidentally suppress it unless suppression is the documented contract.',
    'Use for files, locks, temporary state and database transaction scopes. Async resources use async context managers. Cleanup must be safe after both successful work and partial failure.',
  ],
  'py-concurrency': [
    'A FastAPI service fans out to many slow upstreams. Sequential awaits are slow, while unrestricted gather overloads the dependency.',
    'Wrap each operation in an async with semaphore block and schedule the wrappers together. The semaphore bounds active work, not how many task objects exist. asyncio concurrency overlaps waiting; it does not automatically run CPU-bound Python in parallel. Preserve results in input order.',
    'Use for bounded I/O fan-out with per-request deadlines. For extremely large streams, use a bounded queue and worker tasks so task creation is also bounded. Decide how cancellation and partial failures propagate.',
  ],
  'py-fastapi': [
    'Your users endpoint must reject malformed input, create a new user with 201, and report a duplicate with 409. Returning 200 for every branch makes clients guess what happened.',
    'Pydantic validates the request before the handler runs. Domain checks then distinguish a duplicate from syntactically invalid input. FastAPI TestClient exercises ASGI routing and serialization, so these fixtures verify the actual HTTP contract. Keep storage isolated across independent tests.',
    'Use explicit request and response models at service boundaries. The exercise uses an in-memory store; production uniqueness belongs in a database constraint so concurrent requests cannot bypass a check-then-insert sequence.',
  ],
  'py-pagination': [
    'Returning an entire table makes response time and memory grow with the database. A client needs a bounded page plus enough metadata to request more.',
    'Validate offset and limit before slicing. total describes the whole collection, not the number of items in the current page. An offset past the end is a valid empty page. Bound the maximum limit. Offset pagination can skip or repeat items when concurrent writes change ordering.',
    'Use a stable order and cursor pagination for large changing collections. Include a unique tie-breaker in the sort key. Explain whether counts are exact and what consistency the client can expect between requests.',
  ],
  'react-state': [
    'A button queues three increments, but the counter increases once. All handlers in that render captured the same count.',
    'A render receives a snapshot. Calling setCount(count + 1) three times queues the same replacement value. Functional updates receive the result of the previous queued update, so they compose. Keep updater functions pure because React may invoke them again while checking or preparing work.',
    'Use functional updates when the next state depends on previous state. For several related fields, a reducer can make transitions explicit. State setters schedule rendering; they do not mutate the current closure.',
  ],
  'react-cleanup': [
    'Navigating away from a component leaves its window listener active. Returning later attaches another listener and one event starts firing twice.',
    'An effect sets up a subscription after commit. Return a cleanup function that removes the same callback with the same relevant options. Cleanup runs before the effect is replaced and on unmount. Development Strict Mode can run an extra setup/cleanup cycle to expose missing symmetry.',
    'Use for subscriptions, timers and request lifetimes. Do not put a user-triggered purchase or form submission in an effect. Effects synchronise external systems with rendered state.',
  ],
  'react-refs': [
    'An animation needs the previous committed prop while rendering the new one. Updating state just to remember it creates an unnecessary render.',
    'A ref survives renders but changing current does not schedule a render. Read the previously committed value during render and update the ref in an effect after commit. It then becomes the previous value for the next render. This contract is different from updating a ref on every render attempt.',
    'Use refs for DOM handles and mutable bookkeeping that does not determine displayed output. Values that should update the UI belong in state. Avoid reading or writing arbitrary mutable refs during rendering.',
  ],
  'react-derived': [
    'A cart total is copied into state when the component mounts. When the cart prop changes, the displayed total remains stale.',
    'Derive the total from current props during rendering. A useState initialiser runs for initial state, not every prop change. Adding an effect to synchronise duplicate state creates an intermediate stale render and another update. If the calculation is expensive, measure before introducing useMemo.',
    'Use derived values for filtered lists, validation summaries and totals. Store the smallest source state needed to explain the UI. Memoisation is a performance tool, not a correctness requirement.',
  ],
  'react-races': [
    'A slow search for “re” resolves after a faster search for “react”. The old response replaces the correct results even though requests were debounced.',
    'Give each effect setup an active flag and turn it off in cleanup. Only the active setup may commit its result. AbortController can additionally stop supported I/O. Guard success, failure and loading updates: an obsolete finally block can incorrectly clear a newer request’s loading state.',
    'Use for search, route changes and dependent selects. Abort is cooperative and does not undo server effects. Pair cancellation with result ownership, and test intentionally reordered responses instead of relying on normal network timing.',
  ],
  'go-pointers': [
    'A helper increments a value but the caller still sees the old number. Passing an int copied it; the helper changed only its local parameter.',
    'Pass *int to share access to the caller-owned integer. The pointer itself is copied, but both pointer values refer to the same storage. Dereference it to update that storage. A nil pointer is a valid pointer value and must be handled if the contract permits it.',
    'Use pointer receivers for methods that mutate their receiver. Sharing access also shares responsibility: concurrent mutation requires synchronisation. A pointer is not an ownership guarantee like Rust’s exclusive mutable borrow.',
  ],
  'go-slices': [
    'An API must remove duplicate IDs while preserving first-seen order and leaving the caller’s input unchanged.',
    'Track membership in a map and append unseen values to a separate output slice. A slice is a descriptor over a backing array; copying a slice does not copy its elements. Reusing the input capacity for output could overwrite data visible to the caller. A nil input has length zero.',
    'Use for stable ingestion and batch lookup preparation. Do not rely on map iteration for output order. When retaining a small subslice of a very large allocation, consider copying to avoid keeping the full backing array alive.',
  ],
  'go-workers': [
    'A service receives a burst of jobs. Spawning unbounded goroutines moves the overload to the database; using one worker ignores available capacity.',
    'Start a fixed number of workers consuming jobs from a channel. Keep job identity so result ordering can match the input. The sender closes the jobs channel when no more jobs will be sent. Ensure result collection and channel closure cannot deadlock. Goroutines run concurrently; actual parallel execution depends on the runtime and available CPUs.',
    'Use bounded pools around limited downstream resources. Thread context cancellation through blocking sends, receives and I/O. A pool needs a shutdown policy so abandoned requests do not leave goroutines waiting forever.',
  ],
  'go-http': [
    'You want to verify an endpoint’s status and JSON contract without binding a real TCP port for each test.',
    'A handler receives a ResponseWriter and Request. Write headers before the body because the first body write commits the status. httptest.NewRecorder captures the response and NewRequest constructs input. This tests actual handler behaviour while avoiding socket setup.',
    'Keep parsing, validation and domain work separate enough to test failure branches. Production servers need request deadlines, body-size limits and shutdown handling in addition to a correct handler function.',
  ],
  'rust-borrowing': [
    'A reporting function consumes a Vec just to read its values. The caller then cannot reuse the collection without cloning it.',
    'Accept a borrowed slice, &[T], when the algorithm only needs to inspect elements. The caller retains ownership; the shared borrow grants temporary read access. Rust prevents conflicting mutable access while shared references are still used. A slice also accepts arrays and subsections without allocation.',
    'Prefer borrowed parameters for read-only parsers and aggregators. Use owned parameters when ownership transfer is part of the API. Cloning may be correct, but it should be a deliberate allocation and copying decision.',
  ],
  'rust-option': [
    'A collection lookup may find nothing. Returning zero as a sentinel would make an actual zero indistinguishable from absence.',
    'Option<T> has Some(T) and None variants. Matching forces the caller to consider absence. Combinators such as map transform the contained value without inventing one. Avoid unwrap on values whose absence is expected input rather than a programming invariant.',
    'Use for lookups and optional configuration. Use Result when a caller needs an explanation for failure. Option says that a value may be absent, not why it is absent.',
  ],
  'rust-result': [
    'A configuration port may be malformed or out of range. The caller needs a useful failure instead of a panic.',
    'Parse into a numeric type, map the parse error into the function’s error type, then validate the permitted range. The ? operator returns early on Err while extracting the success value on Ok. Parsing alone does not establish the domain range.',
    'Use Result across fallible application boundaries and preserve causes when they aid diagnosis. A CLI can translate a domain error into a message and exit code at its outer boundary.',
  ],
  'eng-dependencies': [
    'A build tool must execute dependencies before their consumers. Shared dependencies are valid, but a cycle makes a valid order impossible.',
    'Use three traversal states: unseen, visiting and complete. Encountering visiting indicates a cycle in the current path. Encountering complete indicates reusable finished work. Append a node after visiting its dependencies. A single visited boolean cannot distinguish cycles from shared subgraphs.',
    'Use for build systems, migrations and prerequisite maps. Report a cycle rather than displaying an invented order. For very large graphs, use iterative traversal or indegree-based scheduling to avoid call-stack limits.',
  ],
  'eng-rate': [
    'A backend permits a fixed number of accepted requests in a rolling interval. Rejected requests must not keep a client blocked forever.',
    'Remove timestamps outside the active window, compare the remaining count to capacity, and append now only when accepting. Define the boundary precisely: a timestamp exactly one window old is expired in this contract. An injected clock makes boundary tests deterministic.',
    'Use per-client limits around scarce resources. A process-local limiter cannot enforce one global quota across replicas. Distributed enforcement needs shared atomic state and an explicit policy for unavailable storage.',
  ],
  'eng-idempotency': [
    'Two callers request the same remote resource before the first request completes. They should share one in-flight operation.',
    'Store the pending promise by key before returning it. Both success and failure must release the entry so later calls can try again. Preserve the promise’s rejection semantics and avoid introducing an unobserved rejected cleanup promise. This is coalescing, not persistent caching.',
    'Use to reduce overlapping metadata fetches within one process. Durable payment idempotency additionally needs a persistent key, atomic ownership of the operation and stored outcomes that survive retries and restarts.',
  ],
};
