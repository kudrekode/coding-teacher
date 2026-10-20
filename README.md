# Forge

A local-first software engineering academy for developers who want to understand, implement and debug real systems. React, TypeScript, Vite, Tailwind, Monaco, an Express loopback runner, and browser-local progress. No accounts, API keys, external grading services or editor CDN.

## Install and run

Use Node.js 22 (22.13+ recommended) and Python 3.11+. The initial validation used Node 22.12 and Python 3.12 on Windows. Run these commands in this repository:

```powershell
npm ci
python -m pip install -r requirements.txt
npm run dev
```

Open **http://127.0.0.1:5174**. The execution service binds to **127.0.0.1:4318**. Both processes must run; `npm run dev` starts and stops them together. On PowerShell installations that block npm.ps1, use `npm.cmd` instead of `npm`.

An optional Python virtual environment keeps dependencies separate:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:FORGE_PYTHON = (Resolve-Path .\.venv\Scripts\python.exe).Path
npm run dev
```

For macOS/Linux, set `FORGE_PYTHON` to your Python executable if `python` is unavailable (for example `FORGE_PYTHON=python3 npm run dev`). Native adapters use `go`, `rustc`, and `swift` from PATH. Install their official toolchains and restart Forge; Settings shows detection, versions, dependencies and limitations.

To serve the production bundle locally:

```powershell
npm run build
npm start
```

Then open **http://127.0.0.1:4318**. Production start still requires the repository and Node dependencies because code execution is local. It is not a static-only deployment.

With production running in another terminal, `npm run test:production` checks all seven navigation routes, light theme, Monaco, a real submission, and reload persistence against the built application.

## What works

- Seven learning paths, searchable and filterable practice, project challenges, and a dashboard that recommends unfinished work.
- Lessons, examples, objectives, hints, prerequisite links, complexity discussions and post-completion reference solutions.
- Monaco with bundled language workers, syntax highlighting, JS/TS formatting, editable implementations and read-only project context files. Lesson and editor panes can be resized.
- **Run** executes visible tests. **Submit** executes the full independent fixture suite. Only a successful Submit records completion and first-solve XP. Compiler errors, runtime exceptions, timeouts, assertion differences, console output and measured elapsed time are displayed.
- Browser-local drafts, completions, lesson reads, attempt history, XP, streaks, achievements and topic coverage estimates. Validated JSON export/import includes drafts and history. Navigation and reload preserve code.
- Focused practice filters by language, difficulty, topic and mode. Timed interviews have a countdown and session-specific test-outcome summaries. No subjective AI assessment.
- Four guided visualisations: binary search, bounded task scheduling, a delimiter stack and the JavaScript event loop. Each supports next/previous, play/pause, speed and reset. These are conceptual step models, **not traces of arbitrary submitted code**.
- Responsive dark and light themes, labelled controls, visible focus, reduced-motion handling, and keyboard shortcuts. With the editor focused: Ctrl/Cmd+Enter runs, Ctrl/Cmd+Shift+Enter submits. Ctrl/Cmd+K opens Practice.

## Curriculum and execution status

| Track                | Definitions | Verified on this machine | Execution                                                                                   |
| -------------------- | ----------: | -----------------------: | ------------------------------------------------------------------------------------------- |
| JavaScript           |          11 |                       11 | Separate Node process and VM context; deterministic virtual timers                          |
| TypeScript           |           5 |                        5 | Actual strict TypeScript compiler, positive/negative type fixtures, then runtime assertions |
| Python / FastAPI     |          12 |                       12 | Local CPython, including 2 real FastAPI/TestClient exercises                                |
| React                |           6 |                        6 | Actual React render/effect/event tests in jsdom in a child process                          |
| Go                   |           5 |                        0 | Local `go test` adapter; compiler missing here                                              |
| Rust                 |           5 |                        0 | Local `rustc` compile/run adapter; compiler missing here                                    |
| Swift                |           3 |                        0 | Local Swift interpreter/compiler adapter; toolchain missing here                            |
| Software engineering |           3 |                        3 | JavaScript: sliding-window limiting, graph dependencies and request deduplication           |
| **Total**            |      **50** |                   **37** | **13 native definitions await toolchain validation**                                        |

For all **37 verified exercises**, the reference passed every fixture and the starter failed at least one. The 13 native reference solutions are structurally validated and have fixtures, but **have not been compiled or executed on this machine**. Their execution controls are disabled when the toolchain is unavailable. Future roadmap topics are explicitly distinguished from playable exercises.

## Safety model and limits

**Run trusted code on your own machine only.** This is not an OS security sandbox or a multi-user code execution platform. Python and native programs inherit your filesystem/network permissions. Node VM contexts are a convenience isolation mechanism, not a security boundary. Do not paste hostile code or expose the runner through a tunnel, reverse proxy or public interface.

The service binds only to loopback, validates Host/Origin, accepts known exercise IDs rather than arbitrary fixture definitions, limits request and output sizes, serialises API execution, creates disposable working directories and enforces process deadlines. JS workers have a 128 MB V8 heap limit, 1.2 s synchronous VM limits, 1.5 s asynchronous test limits, a 5 s execution deadline and a separate 30 s startup allowance. Python has a 15 s process deadline including imports. Native compile/test commands have 15 s deadlines; Rust executables have 3 s. Duration includes startup/compilation; it is not a reliable algorithm benchmark.

There is no container-level filesystem or network isolation, no hard Python/native memory quota, and no guaranteed descendant-process containment. Local fixtures can be inspected. Reference endpoints are not a security boundary: UI unlocking is a learning convention.

Other intentional limits:

- Projects have one editable source file and optional read-only context files; arbitrary multi-file imports are not supported.
- React tests run in jsdom, with events and effects, rather than an interactive visual component preview. TSX is transpiled; React exercises do not claim full semantic TypeScript checking. The separate TypeScript exercises do perform semantic compiler checks.
- JS/TS submissions use standard language APIs, virtual timers, and provided test helpers. Arbitrary Node imports, real HTTP servers and package installation inside exercises are not supported.
- Native samples are standard-library exercises. Go/Rust/Swift compiler-error and successful-grading journeys remain unverified until the toolchains are installed.
- Python uses local CPython, not Pyodide. FastAPI requests use actual ASGI TestClient HTTP request/response handling, without starting an external web server.
- Progress is per browser origin. Development (5174) and production (4318) have separate local storage; export/import moves data between them. Clearing browser data removes progress. There is no cloud sync or authentication.
- Streaks use local calendar days and successful first completions. Mastery displays exercise coverage, not a psychometric estimate. Repeat solves do not farm XP.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run validate:curriculum
npx playwright install chromium
npm run test:e2e
npm run build
npm audit
```

`validate:curriculum` executes every available reference **and starter**, and reports unavailable toolchains separately. Vitest covers schemas, prerequisite graphs, registration, grading, real compiler diagnostics, exceptions, loop interruption, persistence, import validation, runtime capability reporting, React events and FastAPI requests. Playwright uses real editor pasting and actual API submissions for the core learning journeys, plus draft retention, reset, filters, mobile navigation, export/import, countdown expiry and origin protection.

See [COMPLETION.md](COMPLETION.md) for the final observed results and unverified scope.

## Architecture and extension

```text
curriculum/       Zod schema, exercise definitions, roadmaps and graph validation
server/           Loopback API, adapters, compiler integration, child-process runner
src/              React screens, lazy Monaco editor, persistence, visualisation engine
tests/            Vitest unit/runtime tests and Playwright browser journeys
```

To add an exercise, use the `register([...])` structure in a curriculum module and import the module from `curriculum/index.ts`. Supply every schema field: stable ID, language/track/topic, prerequisites, objectives, explanation/problem, meaningful starter, reference, examples, constraints, hints, common mistakes, complexity and at least two named fixtures. `hidden:false` fixtures are used by Run; Submit includes all fixtures. Native fixture bodies are compiler-language code, Python fixtures use assertions, and JS/TS fixtures use `assert` and `equal`. JavaScript timer exercises use the injected deterministic `clock.tick(ms)` helper. React fixtures can use `mount`, `rerender`, `click`, `event`, `flush` and `resolvePromise`.

Always run the full curriculum validator: a reference must pass and its starter must fail. Add prerequisites only to existing IDs; cycles and duplicates fail validation. A new unavailable-language exercise is **not verified** merely because its schema passes.

To add a runtime, extend `Language`/`languages` in `curriculum/schema.ts`, provide truthful detection/capability metadata and an adapter in `server/runtime.ts`, then add correct, incorrect, compiler-error and timeout tests. Commands must be argument arrays with `shell:false`; never interpolate submissions into shell commands. Keep grading fixtures server-owned and preserve deadlines, temporary-directory cleanup and diagnostic reporting. Do not mark a language runnable until real execution has been demonstrated.
