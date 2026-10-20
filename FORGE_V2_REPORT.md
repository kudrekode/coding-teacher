# Forge v2 delivery report

Verified on 20 October 2026 on Windows x64. Implemented in the existing repository, preserving the real execution pipeline and version-1 browser progress format.

## Delivered experience

The homepage is now an interactive software engineering atlas. Seven tracks connect concepts through required prerequisites, recommended foundations and related ideas. Maps support pan, zoom, fit, search, subject/difficulty filters, an inspector and an accessible list. Per-track viewports and the originating map URL survive the lesson/practice round trip; the browser suite verifies the exact saved viewport.

Concept lessons use a problem-first textbook structure: motivation, mechanism, worked code, experiments where available, implementation, debugging, production applications and next concepts. The primary navigation no longer contains the dashboard, XP, streaks, achievements or productivity analytics. Dark and light themes and desktop/mobile layouts were inspected from actual browser screenshots.

The Debounce flagship includes actual browser timers, timeout scheduling/cancellation, callback counts, a remaining-time indicator, four delay settings, playback/reset and a shared leading-throttle comparison. It links six executable challenges: the original implementation, two distinct debugging exercises, cancellation, flush, and leading/trailing behaviour. Its real React search component demonstrates loading, abortable simulated I/O, cleanup and obsolete-response protection. The lesson explicitly distinguishes debouncing from fixing request races.

The TypeScript journey connects unions, narrowing, discriminated unions and API response modelling, ending in an independently compiled state-machine exercise. Go and Rust browser journeys compile real submissions. A Rust use-after-move example produces the actual E0382 compiler diagnostic.

## Inventory and validation

| Item                                        | Delivered and verified |
| ------------------------------------------- | ---------------------: |
| Tracks with maps                            |                      7 |
| Concept nodes                               |                    135 |
| Structured concept lessons                  |                     53 |
| Additional short guides                     |                     34 |
| Clearly marked planned topics               |                     48 |
| Distinct demonstration scenarios/components |                      8 |
| Executable exercise definitions             |                     64 |
| Reference solutions passing every fixture   |                     64 |
| Starters failing their independent suite    |                     64 |
| Unavailable exercises in final audit        |                      0 |
| Failed exercises in final audit             |                      0 |

The 53 lessons include ten standalone foundational lessons and 43 expanded concept lessons with concrete problem/mechanism/application writing around validated implementations. Short guides and planned nodes are excluded from that count. Planned topics have summaries and relationships, rather than a claim that a completed lesson exists.

The eight demonstrations are binary search, bounded task scheduling, delimiter stack, event loop, the debounce/throttle timing lab, union-state explorer, ownership explorer and React search. Guided diagrams explicitly identify themselves as models. They do not pretend to trace arbitrary source code. The search demo identifies its local data and simulated network latency.

All 47 active original exercises retain their stable identifiers. Seventeen additional challenges bring the total to 64. All ten original Go/Rust exercises, plus four additional native exercises, have been compiled and validated. Swift's three definitions are retired.

Full execution evidence: [curriculum audit](artifacts/v2-curriculum-validation.txt).

## Architecture and dependencies

- Added **@xyflow/react 12.12.0**. Existing React, Router, Tailwind, Lucide and Monaco remain in use. No new Vite project or paid service was introduced. Additional component/layout/animation dependencies were unnecessary.
- Added the first-class Zod Concept model, a seven-track catalog, many-to-many exercise associations, standalone foundational lessons and expanded editorial content. Validation rejects duplicate IDs, missing references, required prerequisite cycles, broken exercise links, empty delivered lessons and inconsistent topic/unlock assignments.
- Added deterministic prerequisite layout and tests for non-overlap and forward required edges. React Flow nodes have explicit initial dimensions to avoid an observed intermittent blank-canvas measurement race.
- Split the atlas, concept lesson, teaching labs and shared context into dedicated modules. The existing Monaco workspace, source editing, fixtures, submission flow and settings remain integrated.
- Retained `forge.progress.v1` and its schema. Concept reading uses namespaced entries in the existing lessons record. Existing exercise drafts, completion timestamps, attempts and legacy lesson reads remain meaningful. Import/load preserve archived retired-content data without showing it as active curriculum.
- Added compiler path discovery/configuration, executable runtime self-checks, an actual FastAPI TestClient readiness check, source-versus-fixture TypeScript diagnostic locations, native output capture and Windows process-tree termination on deadlines. Checked temporary-directory cleanup handles transient Windows file locks without discarding a valid grading result.

Implementation entry points: [concept model](curriculum/concepts.ts), [content](curriculum/lesson-notes.ts), [new exercises](curriculum/expanded.ts), [atlas](src/Atlas.tsx), [lessons](src/ConceptLesson.tsx), [timer/search labs](src/DebounceLab.tsx), [runtimes](server/runtime.ts).

## Windows toolchains

The environment was detected as Windows x64, build 26300, with Node 22.12.0 and Python 3.12.8. Visual Studio Build Tools 2022 and the x64 C++ components were already installed. Working dependencies and C++ tools were not reinstalled.

| Toolchain | Actual observed status                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Go        | **go1.27.3 windows/amd64**; official ZIP checked against the official SHA-256; real `go test` grading passes |
| GOROOT    | `C:\Users\jadcr\AppData\Local\Programs\ForgeToolchains\go`                                                   |
| GOPATH    | `C:\Users\jadcr\go`                                                                                          |
| Rust      | **rustc 1.99.1**, stable `x86_64-pc-windows-msvc`; real compilation, linking and execution pass              |
| Cargo     | **1.99.1**                                                                                                   |
| Rustup    | Stable MSVC toolchain active; home `C:\Users\jadcr\.rustup`                                                  |
| User PATH | Both the Go bin folder and `C:\Users\jadcr\.cargo\bin` were persisted and read back successfully             |

Go was downloaded from the [official Go distribution](https://go.dev/dl/) and Rust through [official rustup](https://rustup.rs/). Forge also discovers the installed absolute locations, so an older terminal's PATH snapshot does not prevent execution. `FORGE_GO`, `FORGE_RUST` and `FORGE_PYTHON` allow explicit executable configuration. Runtime Diagnostics reruns discovery and a real reference fixture; a version command alone never marks a language operational.

Cold Go standard-library compilation initially exceeded the existing deadline, especially for HTTP imports. Those dependencies were warmed through real compilation outside the runner. The final complete audit passes with the original 15-second native compile/test deadline and 3-second Rust execution deadline. Missing-toolchain states and cold-start failures were never reported as validated exercises.

Swift is absent from active navigation, tracks, concepts, exercise registration, adapter/detection code, runtime settings and Monaco language contributions. Existing archived progress is retained. The pre-existing, user-modified `COMPLETION.md` is historical and was left intact; this report and README describe current support.

## Final checks

| Check                                               | Observed result                                                                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| TypeScript checking                                 | Passed; also runs inside the final production build                                                                                        |
| ESLint                                              | Passed                                                                                                                                     |
| Prettier verification                               | Passed                                                                                                                                     |
| Vitest                                              | **24 passed**, four files; final run 33.42 seconds                                                                                         |
| Curriculum schema, registry and prerequisite checks | Passed                                                                                                                                     |
| Complete reference/starter audit                    | **64 verified, 0 unavailable, 0 failed**                                                                                                   |
| Go reference/starter validation                     | **7 of 7**, including all five originals                                                                                                   |
| Rust reference/starter validation                   | **7 of 7**, including all five originals                                                                                                   |
| Playwright Chromium                                 | **21 passed**; final complete run 1.8 minutes                                                                                              |
| Production build                                    | Passed; final Vite build 32.51 seconds                                                                                                     |
| Production browser smoke                            | Passed: atlas/lesson/practice routes, light theme, Monaco, real failing starter, successful submission, reload persistence, no page errors |
| Patch whitespace                                    | `git diff --check` passed                                                                                                                  |

The browser tests include desktop/mobile overflow checks, all seven tracks, concept selection/search, timer behaviour, debugging, TypeScript modelling, successful Go/Rust grading, a meaningful Rust compiler failure, progress export/import and origin protection. Actual JavaScript, Python, React and FastAPI regressions pass. The final unit tests also verify source-line diagnostic mapping, native compiler errors, panic reporting and interruption of a Rust infinite loop.

The initial baseline had 16 passing Vitest tests and a clean type/lint check. Its browser run had ten passes and two runtime timeouts while installation and compilation were competing for resources. The final suite passes all original regression journeys after the atlas migration, plus the new acceptance tests. Windows cleanup locking, initial map measurement, accessible navigation names, changed filter cardinality and mobile visual issues found during testing were corrected.

The initial application JavaScript is approximately **185.27 kB gzip**. Monaco remains a separate lazy-loaded chunk, approximately **844.88 kB gzip**, with bundled workers and language assets.

Build and browser evidence: [build output](artifacts/v2-build.txt), [Playwright results](artifacts/v2-playwright.txt), [production smoke](artifacts/v2-production-smoke.txt).

## Inspected screenshots

All paths below are real browser captures under this repository's ignored `artifacts/` directory.

- [Desktop atlas](artifacts/v2-atlas-desktop.png)
- [Desktop lesson at normal viewport](artifacts/v2-lesson-desktop.png)
- [Complete Debounce lesson](artifacts/v2-debounce-lesson.png)
- [Debounce/throttle timeline after playback](artifacts/v2-debounce-timeline.png)
- [Monaco practice workspace](artifacts/v2-workspace.png)
- [Light-theme TypeScript map](artifacts/v2-atlas-light.png)
- [Mobile atlas](artifacts/v2-atlas-mobile.png)
- [Mobile timing lab](artifacts/v2-debounce-mobile.png)
- [Actual Rust E0382 compiler failure](artifacts/v2-rust-compiler-error.png)
- [Runtime self-check results](artifacts/v2-runtime-diagnostics.png)
- [Production light theme](artifacts/v2-production-light.png)

The desktop, lesson, timeline, workspace, diagnostics, compiler-error, light and mobile captures were opened and inspected. The mobile timing chart retains readable labels through internal horizontal scrolling; it does not expand the page width. The mobile inspector appears before the accessible concept list.

## Remaining scope and limits

- The 48 planned concepts are unfinished lesson work. The 34 short guides are intentionally lighter than the full concept lessons.
- The executable curriculum is **64**, below the optional 90-120 exercise ambition. No placeholders or unavailable runtimes are included in the validated count.
- The flagship is deeper than secondary lessons. Not every concept has every activity or a custom interactive demonstration. Some worked examples reuse the independently validated reference implementations.
- Projects retain one editable implementation file plus optional read-only context. A general multi-file package/project environment is not implemented.
- React exercises use real React in jsdom. TSX is transpiled; the semantic compiler guarantees belong to the separate TypeScript exercises. No arbitrary-code visual tracing is claimed.
- This remains trusted local execution, with the original loopback/origin restrictions, fixture ownership, caps and deadlines. OS-level filesystem/network isolation, hard native/Python memory quotas and escape-proof descendant containment are not claimed.
- Chromium desktop/mobile was exercised on Windows. Firefox, WebKit, other operating systems and a formal accessibility audit remain unverified.

## Exact run commands

In `C:\Users\jadcr\Documents\Code\coding-platform`:

```powershell
npm.cmd run dev
```

Open **http://127.0.0.1:5174**. This starts both the Vite application and the local execution API.

For a fresh dependency installation, first run:

```powershell
npm.cmd ci
python -m pip install -r requirements.txt
```

For production locally:

```powershell
npm.cmd run build
npm.cmd start
```

Open **http://127.0.0.1:4318**. Development and production share the API port, so run one mode at a time. QA servers were stopped after verification.
