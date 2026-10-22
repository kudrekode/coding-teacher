# Forge v2 - The Software Engineering Atlas

A local-first learning environment for working developers: explore a connected concept map, read a technical lesson, experiment, and implement against real tests. Built incrementally on the original Forge execution system. No accounts, paid API or remote grading service.

## Run Forge

From this repository in PowerShell:

```powershell
npm.cmd ci
python -m pip install -r requirements.txt
npm.cmd run dev
```

Open **http://127.0.0.1:5174**. The execution API binds to **127.0.0.1:4318**. `npm.cmd run dev` starts both services. Use `npm` instead of `npm.cmd` on systems where appropriate.

The dependencies and Windows Go/Rust toolchains are already installed on this machine. Node 22.13+ is recommended; this delivery also runs on the existing Node 22.12.0 installation. Python 3.11+ is required for Python and FastAPI exercises.

To run the production bundle locally:

```powershell
npm.cmd run build
npm.cmd start
```

Open **http://127.0.0.1:4318**. Keep the repository and its Node dependencies: the runner is a local service, not a static-host-only deployment.

## Explore, learn, practise

- **Explore:** React Flow maps for JavaScript, TypeScript/Node.js, Python/FastAPI, React, Go, Rust, and cross-language DSA/engineering. Pan, zoom, fit, search, filter, select concepts and use a keyboard-accessible list. Required, recommended and related connections have distinct treatments. No prerequisite locks.
- **Learn:** problem-first concept pages with mechanisms, worked code, objectives, mistakes, debugging, practical applications and next concepts. Full lessons, shorter guides and planned topics are explicitly distinguished.
- **Practice:** the existing locally bundled Monaco editor, independent grading fixtures, real diagnostics and persistent drafts. Run uses visible fixtures; Submit uses the complete suite. Only a passing submission records an exercise completion.
- **Debounce:** real input/timer/cancellation/callback timeline, shared throttle comparison, playback/reset, two debugging exercises, cancel/flush/leading-trailing variants, and an actual React search component with abortable simulated I/O and stale-result protection.
- **Settings:** theme, validated progress export/import, and executable Runtime Diagnostics. Availability requires a passing reference fixture, not merely a version command. FastAPI readiness uses an actual TestClient request.

The catalog contains **135 concepts: 53 concept lessons, 34 short guides and 48 planned topics**. There are **64 executable exercise definitions**, including 17 new challenges. Planned topics have summaries and relationships but are not counted as delivered lessons. See `FORGE_V2_REPORT.md` and the generated audit for the final observed validation results.

There are eight distinct demonstration scenarios/components: the four original guided models (binary search, task queue, delimiter stack, event loop), the shared debounce/throttle timing lab, union-state explorer, ownership explorer and React search demonstration. Guided diagrams are labelled illustrative models, not traces of arbitrary submitted code. The search demo uses local data and real, abortable delays; it does not claim to contact an external API.

## Navigation and progress compatibility

The atlas is the homepage. A lesson's map URL and per-track viewport survive the lesson/practice round trip in session storage. Concept search/filter/selection also live in the URL. Mobile starts with the accessible list and can switch to the map.

Existing stable exercise IDs are retained for all 47 active original exercises. The original `forge.progress.v1` storage key and version-1 JSON schema remain compatible. Existing drafts, completions, lesson history and attempts are preserved. New concept reading entries use namespaced `concept:<id>` keys in the existing lessons record. Archived data for retired content is retained on import and load, without exposing a retired track.

Concept states reflect recorded activities: Not started, Exploring, Practised and Completed. Reading and passing submissions are distinct. XP, streaks, achievements and productivity analytics are absent from the primary experience; legacy calculation helpers remain for compatibility with existing tests and data.

## Windows runtimes

This machine was checked as Windows x64 with Visual Studio Build Tools 2022 and its x64 C++ tools already present. No working Node/Python installation or C++ workload was reinstalled.

Installed and executed:

- Go **1.27.3**, using the official Windows amd64 ZIP, checked against the SHA-256 published by `go.dev/dl/?mode=json`. Installation: `%LOCALAPPDATA%\Programs\ForgeToolchains\go`. GOROOT is that directory; GOPATH is `%USERPROFILE%\go`.
- Rust **1.99.1**, Cargo **1.99.1**, installed through the official rustup installer, stable `x86_64-pc-windows-msvc`. Rustup home: `%USERPROFILE%\.rustup`; proxies: `%USERPROFILE%\.cargo\bin`.

Both bin directories were added to the user PATH. Existing terminals do not automatically inherit PATH updates. Forge also discovers these local locations directly, as well as the standard `C:\Program Files\Go` installation.

Optional explicit executable configuration:

```powershell
$env:FORGE_GO = "$env:LOCALAPPDATA\Programs\ForgeToolchains\go\bin\go.exe"
$env:FORGE_RUST = "$env:USERPROFILE\.cargo\bin\rustc.exe"
$env:FORGE_PYTHON = "C:\path\to\.venv\Scripts\python.exe"
npm.cmd run dev
```

Verify independently:

```powershell
& "$env:LOCALAPPDATA\Programs\ForgeToolchains\go\bin\go.exe" version
& "$env:LOCALAPPDATA\Programs\ForgeToolchains\go\bin\go.exe" env GOROOT GOPATH
& "$env:USERPROFILE\.cargo\bin\rustc.exe" --version
& "$env:USERPROFILE\.cargo\bin\cargo.exe" --version
& "$env:USERPROFILE\.cargo\bin\rustup.exe" show
```

If Go is detected but the first test self-check times out, a cold standard-library build cache may be responsible. Run a small `go test` normally once, then use Settings > Run self-check. Native runtime deadlines were not extended to hide cold-start failures. Diagnostics distinguish detection from successful execution.

For another Windows machine use the [official Go downloads](https://go.dev/dl/), [official rustup installer](https://rustup.rs/) and the [Rust MSVC prerequisites](https://rust-lang.org/tools/install/). Install the x64 C++ build tools and Windows SDK if rustc reports a missing linker. Compiler versions alone are not proof that linking or grading works.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run validate:curriculum
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run build
```

With the production service running separately:

```powershell
npm.cmd run test:production
```

The curriculum audit executes every available reference and starter. A reference must pass all independent fixtures and its starter must fail at least one. Unavailable toolchains are reported with their actual self-check diagnostics. Go/Rust use real compilers. TypeScript uses the actual strict compiler with positive/negative fixtures, and maps diagnostics to visible source or named fixture lines.

Vitest covers schemas, graph cycles/links/layout, persistence compatibility, activity semantics, all original language regressions, native compiler errors, the Rust move checker, panics and timeouts. Playwright covers concept selection, the timing lab, lessons, Monaco submissions, return-to-map context, reload persistence, tracks, search, themes, mobile overflow and native browser journeys. Screenshots and the execution audit are written under ignored `artifacts/`.

## Architecture

```text
curriculum/concepts.ts            Concept schema, catalog, associations and validation
curriculum/lesson-notes.ts        Problem/mechanism/application editorial content
curriculum/foundation-lessons.ts  Standalone foundational concept lessons
curriculum/layout.ts              Deterministic prerequisite layout
curriculum/expanded.ts            New independently graded exercises
curriculum/exercises.ts           Original stable exercise registry
src/Atlas.tsx                     Map, inspector, list and navigation context
src/ConceptLesson.tsx             Interactive textbook surface
src/DebounceLab.tsx               Timer lab and real React search demonstration
src/atlas-context.ts              Shared app context and concept activity states
src/App.tsx                      Preserved practice/editor, settings and application shell
server/runtime.ts                Real runtimes, discovery, self-checks and diagnostics
server/index.ts                  Loopback execution API and production SPA serving
```

React Flow (`@xyflow/react`) is the only new UI dependency. Existing React, Router, Tailwind, Lucide and Monaco remain in use. Layout is deterministic; an additional layout engine or animation package was unnecessary. Integration follows the [official React Flow documentation](https://reactflow.dev/learn/customization/custom-nodes).

## Trusted local execution and limits

Run only trusted code on your own machine. This is not an OS sandbox or a public multi-user executor. Python/native programs inherit your filesystem/network permissions; Node VM contexts are not a security boundary.

The service retains loopback binding, Host/Origin checks, server-owned fixtures, source/output caps, serial API submissions, disposable working directories, the JS heap bound and existing execution deadlines. JS uses virtual timer fixtures and separate worker processes. Python has a 15-second deadline including imports. Native compile/test commands have 15 seconds; Rust executables have 3 seconds. Windows termination also requests descendant termination, and temporary-directory cleanup handles transient file locks within a checked Forge temp boundary. OS-level memory/network isolation and escape-proof descendant containment are not claimed.

Projects still use one editable file plus optional read-only context. React tests mount actual components in jsdom; TSX is transpiled and does not claim the semantic checks of the separate TypeScript exercises. Browser progress is origin-specific: development and production require export/import to move progress. Only Chromium has been exercised here. Some explanatory snippets assume surrounding imports or a function body; they are teaching examples, not a general multi-file project system.

The 90-120 exercise expansion remains future work. The current delivery prioritises validated execution over the larger numerical target. Historical `COMPLETION.md` describes the previous delivery and is not the v2 acceptance report.
