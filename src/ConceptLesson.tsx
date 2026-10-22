import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, Code2, GitBranch, Lightbulb } from 'lucide-react';
import { conceptState, useForge } from './atlas-context';
import { DebounceLab, ProductionSearch } from './DebounceLab';
import { Visualizer } from './visualizations';

function UnionExperiment() {
  const [status, setStatus] = useState('success');
  const cases: Record<string, { code: string; branch: string }> = {
    success: { code: '{ ok: true, data: { name: "Ada" } }', branch: 'result.data.name → "Ada"' },
    failure: {
      code: '{ ok: false, error: "User not found" }',
      branch: 'result.error → "User not found"',
    },
  };
  return (
    <div className="union-demo">
      <span className="eyebrow">ILLUSTRATIVE TYPE MODEL · NOT A COMPILER TRACE</span>
      <label>
        Choose the runtime value
        <select
          aria-label="API response variant"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </label>
      <div className="union-flow">
        <pre>{cases[status].code}</pre>
        <GitBranch size={24} />
        <div>
          <code>if (result.ok)</code>
          <strong>{cases[status].branch}</strong>
        </div>
      </div>
      <p>
        A literal discriminant selects the matching payload. TypeScript can narrow a validated
        value; it cannot make unvalidated JSON honour this contract.
      </p>
    </div>
  );
}
function OwnershipExperiment() {
  const [mode, setMode] = useState('borrow');
  return (
    <div className="ownership-demo">
      <span className="eyebrow">ILLUSTRATIVE OWNERSHIP MODEL</span>
      <div className="button-row">
        <button
          className={`button ${mode === 'borrow' ? 'primary' : 'secondary'}`}
          onClick={() => setMode('borrow')}
        >
          Borrow &str
        </button>
        <button
          className={`button ${mode === 'move' ? 'primary' : 'secondary'}`}
          onClick={() => setMode('move')}
        >
          Move String
        </button>
      </div>
      <div className="ownership-flow">
        <div>
          <span>CALLER</span>
          <strong className={mode === 'move' ? 'moved' : ''}>title: String</strong>
        </div>
        <ArrowRight size={24} />
        <div>
          <span>FUNCTION</span>
          <strong>{mode === 'borrow' ? '&str · shared access' : 'String · new owner'}</strong>
        </div>
      </div>
      <pre>
        {mode === 'borrow'
          ? 'inspect(&title);\nprintln!("{title}"); // still valid'
          : 'consume(title);\nprintln!("{title}"); // E0382: value borrowed after move'}
      </pre>
      <p>
        {mode === 'borrow'
          ? 'The caller retains ownership. The shared reference must not outlive its referent and excludes conflicting mutable access while in use.'
          : 'Moving a non-Copy value transfers ownership. The compiler rejects subsequent use of the moved binding. Try this failure in the borrowing exercise.'}
      </p>
    </div>
  );
}
const implementation = `function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}`;
const productionCode = `useEffect(() => {
  let active = true;
  const controller = new AbortController();
  const timer = setTimeout(async () => {
    setStatus("loading");
    try {
      const response = await fetch(urlFor(query), {
        signal: controller.signal
      });
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      if (active) { setResults(data); setStatus("ready"); }
    } catch (error) {
      if (active) setStatus("error");
    }
  }, 350);
  return () => {
    active = false;
    clearTimeout(timer);
    controller.abort();
  };
}, [query]);`;

export function ConceptLesson() {
  const { id } = useParams(),
    [params] = useSearchParams();
  const { concepts, tracks, exercises, progress, setProgress } = useForge();
  const c = concepts.find((c) => c.id === id);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  if (!c)
    return (
      <div className="page">
        <h1>Concept not found</h1>
        <Link to="/explore/javascript">Back to the atlas</Link>
      </div>
    );
  const track = tracks.find((t) => t.id === c.track)!;
  const suppliedMap = params.get('map');
  const map = suppliedMap?.startsWith('/explore/')
    ? suppliedMap
    : `/explore/${c.track}?concept=${c.id}`;
  const lesson = c.lesson;
  const associated = c.exercises.map((id) => exercises.find((e) => e.id === id)!);
  const state = conceptState(c, progress),
    read = !!progress.lessons[`concept:${c.id}`];
  const exerciseLink = (id: string) =>
    `/exercise/${id}?concept=${c.id}&map=${encodeURIComponent(map)}`;
  if (!lesson)
    return (
      <div className="page">
        <Link to={map} className="back-link">
          <ArrowLeft size={15} />
          Return to map
        </Link>
        <h1>{c.title}</h1>
        <p>{c.summary}</p>
        <div className="notice">
          This topic is planned. No completed lesson or runnable activity is claimed.
        </div>
      </div>
    );
  const related = [...new Set([...c.enables, ...c.related])];
  const isDebounce = c.id === 'js-debounce';
  const sections = [
    ['problem', 'The problem'],
    ['understand', 'Understand'],
    ...(lesson.demo ? [['experiment', 'Experiment']] : []),
    ['implement', 'Implement'],
    ...(lesson.debugging ? [['debug', 'Debug']] : []),
    ['apply', 'Apply'],
    ['next', 'What next?'],
  ];
  return (
    <div className="concept-lesson">
      <div className="lesson-breadcrumb">
        <Link to={map}>
          <ArrowLeft size={14} />
          Return to map
        </Link>
        <span>/</span>
        <span>{track.name}</span>
        <span>/</span>
        <span>{c.topic}</span>
      </div>
      <header className="concept-hero">
        <div className="eyebrow">
          {c.status === 'guide' ? 'A SHORT FIELD GUIDE' : 'THE ENGINEERING FIELD GUIDE'}{' '}
          <span>{c.difficulty.toUpperCase()}</span>
        </div>
        <h1>
          {c.title}
          <span>.</span>
        </h1>
        <p>{c.summary}</p>
        <div className="concept-hero-meta">
          <BookOpen size={15} />
          <span>{c.status === 'guide' ? 'Concise explanation' : 'Concept lesson'}</span>
          <i />
          <Code2 size={15} />
          <span>
            {associated.length} executable {associated.length === 1 ? 'exercise' : 'exercises'}
          </span>
          <i />
          <span>{state}</span>
        </div>
      </header>
      <div className="lesson-layout">
        <aside className="lesson-outline">
          <span className="eyebrow">IN THIS LESSON</span>
          {sections.map(([id, title], i) => (
            <a href={`#${id}`} key={id}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              {title}
            </a>
          ))}
          <div className="outline-prereqs">
            <h3>Useful foundations</h3>
            {c.prerequisites.map((id) => {
              const pre = concepts.find((c) => c.id === id)!;
              return (
                <Link
                  key={id}
                  to={
                    pre.lesson
                      ? `/learn/${id}?map=${encodeURIComponent(map)}`
                      : `/explore/${pre.track}?concept=${id}`
                  }
                >
                  {pre.title}
                  <ArrowRight size={12} />
                </Link>
              );
            })}
            {!c.prerequisites.length && <p>Start here. No required foundations.</p>}
          </div>
        </aside>
        <article className="lesson-article">
          <section id="problem">
            <div className="section-number">01 / THE PROBLEM</div>
            <h2>
              {isDebounce
                ? 'One intention. Too many requests.'
                : 'Start with an engineering problem.'}
            </h2>
            <p className="lesson-lead">{lesson.problem}</p>
            {isDebounce && (
              <div className="lesson-callout">
                <Lightbulb size={20} />
                <p>
                  Input events arrive as the user types, pastes or edits. Your UI should reflect
                  every edit immediately. The expensive side effect can wait for a pause.
                </p>
              </div>
            )}
          </section>
          <section id="understand">
            <div className="section-number">02 / UNDERSTAND</div>
            <h2>{isDebounce ? 'Keep the latest intention.' : 'The mechanism behind the idea.'}</h2>
            {lesson.explanation.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <div className="lesson-code">
              <div>
                <span>{isDebounce ? 'debounce.js' : 'A worked example'}</span>
                <span>{c.track === 'engineering' ? associated[0]?.language : track.name}</span>
              </div>
              <pre>
                <code>{isDebounce ? implementation : lesson.code}</code>
              </pre>
            </div>
            <ol className="code-walkthrough">
              {lesson.walkthrough.map((p, i) => (
                <li key={p}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <p>{p}</p>
                </li>
              ))}
            </ol>
            <details className="objectives">
              <summary>Learning objectives</summary>
              <ul>
                {c.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </details>
          </section>
          {lesson.demo && (
            <section id="experiment">
              <div className="section-number">03 / EXPERIMENT</div>
              <h2>{isDebounce ? 'Make time visible.' : 'Change something. Observe the result.'}</h2>
              <p>
                {isDebounce
                  ? 'Type quickly, pause, then type again. Compare the same events under three policies. The callback counters change only when callbacks execute.'
                  : 'Use the controls to inspect the model, then verify your understanding with the associated coding exercise.'}
              </p>
              {lesson.demo === 'debounce' ? (
                <DebounceLab />
              ) : lesson.demo === 'union' ? (
                <UnionExperiment />
              ) : lesson.demo === 'ownership' ? (
                <OwnershipExperiment />
              ) : (
                <Visualizer initial={lesson.demo} />
              )}
            </section>
          )}
          <section id="implement">
            <div className="section-number">IMPLEMENT / REAL EXECUTION</div>
            <h2>Turn the idea into working code.</h2>
            <p>
              Work in Monaco and run the actual tests. Run checks visible fixtures; Submit checks
              the complete suite. Completion is recorded only after a passing submission.
            </p>
            <div className="lesson-exercises">
              {associated.map((e, i) => (
                <Link key={e.id} to={exerciseLink(e.id)}>
                  <span className="exercise-order">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{e.title}</strong>
                    <p>
                      {e.mode} · {e.difficulty} · {e.tests.length} independent fixtures
                    </p>
                  </div>
                  {progress.completed[e.id] ? <Check size={18} /> : <ArrowRight size={18} />}
                </Link>
              ))}
              {!associated.length && (
                <p>
                  This lesson has no coding exercise yet. The explanation and demonstration are
                  available to explore.
                </p>
              )}
            </div>
          </section>
          {lesson.debugging && (
            <section id="debug">
              <div className="section-number">DEBUG / EXPLAIN THE FAILURE</div>
              <h2>
                {isDebounce ? 'Two bugs that look almost right.' : 'Find the broken assumption.'}
              </h2>
              <p>
                Read the implementation before expanding the diagnosis. Predict which boundary case
                will fail, then reproduce it in the workspace.
              </p>
              {isDebounce ? (
                <>
                  <DebugExample
                    title="01 · A timer with the wrong lifetime"
                    code={
                      'function debounce(fn, wait) {\n  return (...args) => {\n    let timer; // recreated on every event\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), wait);\n  };\n}'
                    }
                    diagnosis="Type twice before the interval ends. Both callbacks run because each invocation clears a fresh undefined handle. Move the handle to the factory’s lexical scope."
                    link={exerciseLink('js-debug-debounce-lifetime')}
                  />
                  <DebugExample
                    title="02 · The callback forgets the latest arguments"
                    code={
                      'function debounce(fn, wait) {\n  let timer;\n  return function (...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(), wait);\n  };\n}'
                    }
                    diagnosis="The callback runs once but receives no search term. The wrapper must forward the most recent call’s arguments and receiver. Use a normal wrapper function and an arrow callback with fn.apply(this, args)."
                    link={exerciseLink('js-debug-debounce-values')}
                  />
                </>
              ) : (
                <DebugExample
                  title="Inspect the starter"
                  code={lesson.debugging.code}
                  diagnosis={lesson.debugging.diagnosis}
                  link={
                    lesson.debugging.exercise ? exerciseLink(lesson.debugging.exercise) : undefined
                  }
                />
              )}
            </section>
          )}
          <section id="apply">
            <div className="section-number">APPLY / IN REAL SOFTWARE</div>
            <h2>
              {isDebounce ? 'Fewer requests. Correct results.' : 'Take the idea into production.'}
            </h2>
            <p>{lesson.application}</p>
            {isDebounce && (
              <>
                <ProductionSearch />
                <div className="lesson-callout">
                  <GitBranch size={20} />
                  <p>
                    <strong>Debouncing is not a race-condition fix.</strong> An older request can
                    resolve after a newer one. Cleanup cancels supported work, and an active flag
                    prevents an obsolete operation from committing state.
                  </p>
                </div>
                <div className="lesson-code">
                  <div>
                    <span>React · request lifetime</span>
                    <span>Production pattern</span>
                  </div>
                  <pre>
                    <code>{productionCode}</code>
                  </pre>
                </div>
                <h3>Debounce or throttle?</h3>
                <p>
                  Debounce waits until events stop: search suggestions and draft saves. A leading
                  throttle keeps producing bounded updates during continuous events: telemetry and
                  scroll sampling. The shared timeline above uses the same input events for both.
                  Leading and trailing options are separate contracts; practise them in the advanced
                  exercise.
                </p>
              </>
            )}
            <div className="mistake-list">
              <h3>Watch for these mistakes</h3>
              {lesson.mistakes.map((p) => (
                <p key={p}>
                  <span>↳</span>
                  {p}
                </p>
              ))}
            </div>
          </section>
          <section id="next">
            <div className="section-number">CONNECT / WHAT NEXT?</div>
            <h2>Keep following the thread.</h2>
            <div className="next-concepts">
              {related.map((id) => {
                const next = concepts.find((c) => c.id === id)!;
                return (
                  <Link
                    key={id}
                    to={
                      next.lesson
                        ? `/learn/${id}?map=${encodeURIComponent(map)}`
                        : `/explore/${next.track}?concept=${id}`
                    }
                  >
                    <span>
                      {next.title}
                      <small>{next.lesson ? 'Read the lesson' : 'View planned topic on map'}</small>
                    </span>
                    <ArrowRight size={17} />
                  </Link>
                );
              })}
            </div>
            <div className="lesson-finish">
              <button
                className={`button ${read ? 'secondary' : 'primary'}`}
                onClick={() =>
                  setProgress((p) => ({
                    ...p,
                    lessons: { ...p.lessons, [`concept:${c.id}`]: new Date().toISOString() },
                  }))
                }
              >
                <Check size={16} />
                {read ? 'Lesson read' : 'Mark lesson as read'}
              </button>
              <Link to={map} className="button secondary">
                <ArrowLeft size={15} />
                Return to map
              </Link>
            </div>
            <p className="micro">
              Reading and passing exercises are recorded separately. Explore any prerequisite
              freely.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
function DebugExample({
  title,
  code,
  diagnosis,
  link,
}: {
  title: string;
  code: string;
  diagnosis: string;
  link?: string;
}) {
  return (
    <div className="debug-example">
      <h3>{title}</h3>
      <pre>
        <code>{code}</code>
      </pre>
      <details>
        <summary>Reveal the diagnosis</summary>
        <p>{diagnosis}</p>
      </details>
      {link && (
        <Link to={link}>
          Fix it in the coding workspace
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
