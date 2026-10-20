import type { Concept } from './concepts';
type Lesson = NonNullable<Concept['lesson']>;
const lessons: Record<string, Lesson> = {
  'js-functions': {
    problem:
      'A request handler needs to separate parsing from domain work. Moving each step into a function gives it a contract you can test independently.',
    explanation: [
      'A function receives values through parameters, executes in a new local scope and returns a value. A declaration creates a callable binding; calling it creates a new invocation with its own local variables.',
      'A function is also a value. Passing it without parentheses passes behaviour; adding parentheses executes it immediately. This distinction matters when registering event listeners or scheduling timers. Scope is lexical: the location where the function is written determines which outer bindings it can access.',
    ],
    code: 'function parseLimit(text) {\n  const value = Number(text);\n  if (!Number.isInteger(value) || value < 1) {\n    throw new Error("limit must be a positive integer");\n  }\n  return value;\n}\nconst limit = parseLimit("25");',
    walkthrough: [
      'Number converts input; the subsequent checks establish the domain contract.',
      'Return communicates a result. Throw communicates failure to the caller.',
    ],
    mistakes: [
      'Passing parseLimit() where a callback is expected executes it during registration.',
      'An outer mutable binding is shared; a local variable is recreated on each call.',
    ],
    application:
      'Keep parsing and deterministic domain decisions separate from I/O. Test the former directly; inject the latter when testing request orchestration.',
  },
  'js-closures': {
    problem:
      'Two independent search boxes need separate timer state. A global timer makes typing in one box cancel work in the other.',
    explanation: [
      'A closure is a function together with access to the lexical environment where it was created. Returning a function does not discard the bindings it still needs. Each call to a factory creates a fresh environment.',
      'A closure retains access to bindings, not a frozen copy of every value. Multiple returned functions can share one changing binding. This is why a debounce wrapper can replace its pending timer and a React callback can still refer to the snapshot from a particular render.',
    ],
    code: 'function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst a = makeCounter();\nconst b = makeCounter();\na(); // 1\na(); // 2\nb(); // 1: a different environment',
    walkthrough: [
      'The factory runs once per counter; the returned callback runs once per increment.',
      'The binding count remains reachable through its callback.',
    ],
    mistakes: [
      'Declaring count inside the returned callback resets it on every call.',
      'A retained closure can also keep large referenced objects alive.',
    ],
    application:
      'Use closures for private caches, event wrappers and injected dependencies. Give long-lived subscriptions a disposal path so obsolete environments can be collected.',
  },
  'js-higher-order': {
    problem:
      'Several handlers need the same policy but perform different work. Copying policy into each handler makes fixes inconsistent.',
    explanation: [
      'A higher-order function accepts a function or returns a function. It separates a reusable policy from the operation governed by that policy. Array.map accepts a transformation; debounce returns a timing wrapper.',
      'Composition must preserve the operation’s contract. Forwarding arguments, return values, receiver and errors matters. A synchronous decorator and an async decorator may need different implementations, especially when handling rejection or measuring duration.',
    ],
    code: 'function withPrefix(prefix, write) {\n  return message => write(`${prefix}: ${message}`);\n}\nconst logError = withPrefix("error", console.log);\nlogError("connection lost");',
    walkthrough: [
      'withPrefix configures the wrapper once.',
      'The returned callback supplies a message later and delegates to the injected writer.',
    ],
    mistakes: [
      'Invoking the callback while configuring the wrapper changes when work occurs.',
      'Swallowing errors in a wrapper silently changes the caller’s contract.',
    ],
    application:
      'Use for retry policies, concurrency limits, logging and resource management. Prefer an explicit small contract over a wrapper that tries to intercept every possible behaviour.',
  },
  'js-timers': {
    problem:
      'A draft should save after a pause. If the user resumes typing, the pending save must be cancelled before it runs.',
    explanation: [
      'setTimeout schedules a callback after at least the requested delay and returns a handle. clearTimeout cancels a pending timer identified by that handle. Cancellation after the callback has already run cannot undo its effects.',
      'Timers do not run in parallel with the current JavaScript stack. The callback becomes eligible after the delay, then waits for the host to dispatch it. Nested timers, inactive tabs and busy work can increase the delay. Deterministic test clocks model scheduling without relying on wall-clock sleeps.',
    ],
    code: 'const timer = setTimeout(() => saveDraft(), 500);\n// The user typed again before the save ran.\nclearTimeout(timer);',
    walkthrough: [
      'Keep the handle somewhere whose lifetime covers all calls that need to cancel it.',
      'A zero delay still schedules future work; it does not invoke inline.',
    ],
    mistakes: [
      'A newly created local handle cannot cancel the previous invocation’s timer.',
      'Cancelling a timer does not cancel network work that its callback already started.',
    ],
    application:
      'Use for quiet intervals and approximate scheduling. For server deadlines propagate cancellation; for animation use a paint-aware API. Always clean up timers owned by a component or request.',
  },
  'js-event-loop': {
    problem:
      'A timer scheduled before a resolved promise logs later. The source order alone does not explain the output.',
    explanation: [
      'The current stack runs to completion. Promise reactions run as microtasks at a microtask checkpoint, while a timer callback is a later task. In this example, synchronous logs precede the promise reaction, which precedes the eligible timer.',
      'This visual model illustrates browser scheduling for the given program. It does not trace arbitrary submitted code or describe every Node event-loop phase. Long synchronous work blocks progress; an endlessly replenished microtask queue can also delay tasks and rendering.',
    ],
    code: 'console.log("start");\nsetTimeout(() => console.log("timer"), 0);\nPromise.resolve().then(() => console.log("promise"));\nconsole.log("end");\n// start, end, promise, timer',
    walkthrough: [
      'Both scheduling calls register work and return immediately.',
      'The stack completes before the promise reaction runs.',
    ],
    mistakes: [
      'Assuming a zero timer delay means immediate execution.',
      'Treating async as proof that CPU work happens in parallel.',
    ],
    application:
      'Use scheduling knowledge when investigating delayed interaction, starvation and test ordering. Split expensive work or move it to an appropriate worker when it blocks responsiveness.',
    demo: 'event-loop',
  },
  'ts-unions': {
    problem:
      'A configuration field accepts either a fixed number or the literal “auto”. An optional property cannot express that contract precisely.',
    explanation: [
      'A union A | B permits values assignable to either alternative. Before narrowing, operations must be valid for every remaining possibility. A string-or-number value cannot safely call a string-only method.',
      'Literal types describe individual values, such as "auto". Use unions to represent alternatives rather than forcing unrelated shapes into a wide object. Union types are erased; accepting external JSON still requires runtime evidence.',
    ],
    code: 'type Size = number | "auto";\nfunction describe(size: Size): string {\n  return size === "auto" ? "fit content" : `${size}px`;\n}',
    walkthrough: [
      'The equality check isolates the literal alternative.',
      'The other branch knows size is a number.',
    ],
    mistakes: [
      'Treating a union as an object with all members’ properties.',
      'Using a type assertion to conceal an unhandled alternative.',
    ],
    application:
      'Model finite configuration choices and domain alternatives. As payloads become state-dependent, use a discriminated union so each tag determines its valid fields.',
    demo: 'union',
  },
  'ts-narrowing': {
    problem:
      'A parser receives unknown input. You need to safely use a field only after establishing its type.',
    explanation: [
      'TypeScript follows control flow to refine types after checks such as typeof, equality and property presence. Returning early on an invalid branch leaves the remaining code with stronger information.',
      'A truthiness check may remove valid values such as zero or an empty string. Check the actual contract rather than using truthiness as a universal validation shortcut. User-defined predicates are trusted declarations, so an incorrect predicate can undermine downstream safety.',
    ],
    code: 'function lengthOf(value: unknown): number {\n  if (typeof value !== "string") {\n    throw new Error("expected a string");\n  }\n  return value.length;\n}',
    walkthrough: [
      'unknown forbids use without evidence.',
      'The guard exits the non-string branch, leaving a string for the return expression.',
    ],
    mistakes: [
      'typeof null is "object", so object guards must exclude null.',
      'Assertions change what the compiler believes without checking the value.',
    ],
    application:
      'Narrow unknown data at boundaries and use tagged alternatives inside the domain. Keep runtime guards and their claimed types aligned with negative tests.',
    demo: 'union',
  },
  'ts-structural': {
    problem:
      'A test double has the same send method as the production mailer. You want to inject it without inheriting a concrete class.',
    explanation: [
      'TypeScript generally compares structures. A value that has the required members with compatible types satisfies an object contract even if it never declares that interface.',
      'Extra-property checks on fresh object literals catch some likely mistakes, but they do not make every object type exact. Structural compatibility is a static relationship and does not validate data at runtime. Class private members and other language details can impose additional compatibility rules.',
    ],
    code: 'interface Mailer { send(to: string): Promise<void> }\nasync function notify(mailer: Mailer) {\n  await mailer.send("team@example.test");\n}\nnotify({ send: async (_to: string) => {} });',
    walkthrough: [
      'The consumer asks for behaviour, not a particular constructor.',
      'A small contract makes a focused test double possible.',
    ],
    mistakes: [
      'Assuming an interface emits runtime validation.',
      'Adding unrelated methods makes every implementation harder to substitute.',
    ],
    application:
      'Use small structural contracts around I/O dependencies. Validate external representations before constructing values that satisfy domain contracts.',
  },
  'react-render': {
    problem:
      'A callback logs an older count even after a setter ran. It belongs to a render that computed the UI from an earlier state snapshot.',
    explanation: [
      'React calls a component to calculate UI from props and state. Each render creates its own values and closures. A state setter requests an update; it does not rewrite local variables in a render that already ran.',
      'Rendering must be pure because React can prepare or repeat work before committing. External subscriptions belong in effects and user actions belong in event handlers. Effects run after commit, so they do not provide a general substitute for calculating values during render.',
    ],
    code: 'function Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(n => n + 1)}>\n    {count}\n  </button>;\n}',
    walkthrough: [
      'The displayed count comes from this render’s snapshot.',
      'The updater composes with other queued updates.',
    ],
    mistakes: [
      'Mutating props or state during render breaks repeatability.',
      'Copying derived values into state creates synchronisation work.',
    ],
    application:
      'Use the snapshot model to reason about effects, async callbacks and stale closures. Keep source state minimal and derive the UI from its current values.',
  },
  'rust-ownership': {
    problem:
      'Passing a String into a helper makes later use fail to compile. The helper took ownership of the allocation.',
    explanation: [
      'Each value has an owner responsible for dropping it. Assigning or passing a non-Copy value by value moves ownership, making the old binding unavailable. A move of String transfers its handle; it does not require copying the character allocation.',
      'Borrowing lets a function access data while the caller retains ownership. A shared reference permits reading; a mutable reference grants exclusive access for its active use. Lifetimes describe validity relationships and never extend storage.',
    ],
    code: 'fn size(text: &str) -> usize { text.len() }\nlet title = String::from("Forge");\nlet n = size(&title);\nprintln!("{title}: {n}"); // caller still owns title',
    walkthrough: [
      '&title borrows instead of transferring the String.',
      'The compiler rejects use after a move before the program runs.',
    ],
    mistakes: [
      'Adding clone everywhere can hide an API that should borrow.',
      'A lifetime annotation cannot keep a local value alive after its scope ends.',
    ],
    application:
      'Choose borrowed parameters for read-only algorithms and owned parameters for transfer. Ownership also governs files, locks and other resources released by Drop.',
    demo: 'ownership',
  },
};
export function addFoundationLessons(concepts: Concept[]) {
  for (const [id, lesson] of Object.entries(lessons)) {
    const c = concepts.find((c) => c.id === id)!;
    c.lesson = lesson;
    c.status = 'lesson';
    c.objectives = [c.summary, ...lesson.walkthrough];
  }
  for (const [id, demo] of Object.entries({
    'js-debounce': 'debounce',
    'ts-discriminated': 'union',
    'ts-api': 'union',
    'eng-binary': 'binary',
    'eng-stacks': 'stack',
    'js-pool': 'queue',
    'go-workers': 'queue',
    'rust-borrowing': 'ownership',
  } as const))
    concepts.find((c) => c.id === id)!.lesson!.demo = demo;
}
