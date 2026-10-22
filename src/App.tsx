import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import type { OnMount } from '@monaco-editor/react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  Command,
  ExternalLink,
  FolderCode,
  Lightbulb,
  LoaderCircle,
  Menu,
  Moon,
  Network,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Target,
  Terminal,
  X,
} from 'lucide-react';
import type { Capability, PublicExercise, RunResult } from '../curriculum/schema';
import { checkRuntimes, getCurriculum, getRuntimes, getSolution, runCode, type Track } from './api';
import {
  emptyProgress,
  importProgress,
  loadProgress,
  recordAttempt,
  saveProgress,
  type Progress,
} from './persistence';
import { Visualizer } from './visualizations';
import { knowledgeFor } from '../curriculum/knowledge';
const Editor = lazy(() => import('./CodeEditor'));

import { Context, useForge, type Session } from './atlas-context';
import { Atlas } from './Atlas';
import { ConceptLesson } from './ConceptLesson';
import type { Concept } from '../curriculum/concepts';
const nav = [
  ['/explore', 'Explore', Network],
  ['/practice', 'Practice', Code2],
  ['/visualizations', 'Experiments', Lightbulb],
  ['/projects', 'Projects', FolderCode],
  ['/settings', 'Settings', Settings2],
] as const;
function Mark() {
  return (
    <span className="forge-mark">
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M7 24L16 6l9 18M11 18h10M7 24h18"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M16 1v3M28 8l-3 2M4 8l3 2" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
  );
}
function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function Difficulty({ value }: { value: string }) {
  return (
    <span className={`difficulty ${value.toLowerCase()}`}>
      <span />
      {value}
    </span>
  );
}
export function App() {
  const [data, setData] = useState<{
      exercises: PublicExercise[];
      tracks: Track[];
      concepts: Concept[];
    } | null>(null),
    [capabilities, setCaps] = useState<Capability[]>([]),
    [fastapi, setFastapi] = useState(false),
    [error, setError] = useState('');
  const [progress, setProgress] = useState(loadProgress),
    [toast, setToast] = useState(''),
    [mobile, setMobile] = useState(false);
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem('forge.session') ?? 'null');
      return s &&
        Array.isArray(s.ids) &&
        s.ids.every((id: unknown) => typeof id === 'string') &&
        typeof s.index === 'number' &&
        (s.deadline === null || typeof s.deadline === 'number')
        ? s
        : null;
    } catch {
      return null;
    }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const load = () => {
    setError('');
    getCurriculum()
      .then(setData)
      .catch((e) => setError(e.message));
    getRuntimes()
      .then((r) => {
        setCaps(r.capabilities);
        setFastapi(r.fastapi);
      })
      .catch(() => {});
  };
  useEffect(load, []);
  useEffect(() => {
    const refresh = () => {
      getRuntimes()
        .then((r) => {
          setCaps(r.capabilities);
          setFastapi(r.fastapi);
        })
        .catch(() => {});
    };
    window.addEventListener('forge:runtimes-checked', refresh);
    return () => window.removeEventListener('forge:runtimes-checked', refresh);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        navigate('/explore/javascript');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);
  useEffect(() => {
    try {
      saveProgress(progress);
    } catch {
      setToast(
        'Could not save: browser storage is full or unavailable. Export your progress in Settings.',
      );
    }
    document.documentElement.dataset.theme = progress.theme;
  }, [progress]);
  useEffect(() => {
    sessionStorage.setItem('forge.session', JSON.stringify(session));
  }, [session]);
  useEffect(() => {
    setMobile(false);
  }, [location.pathname]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(''), 5000);
      return () => clearTimeout(id);
    }
  }, [toast]);
  if (!data)
    return (
      <div className="boot">
        <Mark />
        <h1>Forge</h1>
        {error ? (
          <>
            <p>Could not reach the local execution service.</p>
            <code>{error}</code>
            <button className="button primary" onClick={load}>
              Retry connection
            </button>
            <small>Start both services with npm run dev.</small>
          </>
        ) : (
          <p>
            <LoaderCircle className="spin" size={18} /> Preparing your workshop…
          </p>
        )}
      </div>
    );
  const context = {
    ...data,
    capabilities,
    fastapi,
    progress,
    setProgress,
    notify: setToast,
    session,
    setSession,
  };
  const activeNav = nav.find(([url]) => location.pathname.startsWith(url));
  return (
    <Context.Provider value={context}>
      <div className="app-shell">
        <aside className={`sidebar ${mobile ? 'open' : ''}`}>
          <Link to="/" className="brand">
            <Mark />
            <span>
              forge<span className="brand-dot">.</span>
            </span>
          </Link>
          <div className="workspace-switch atlas-edition">
            <span className="workspace-avatar">P</span>
            <span>
              ENGINEERING ATLAS<small>Volume 02 · Local edition</small>
            </span>
            <ChevronDown size={14} />
          </div>
          <span className="nav-label">THE WORKSHOP</span>
          <nav aria-label="Primary navigation">
            {nav.map(([url, label, Icon]) => (
              <NavLink
                to={url}
                end={false}
                key={url}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
                {url === '/explore' && <kbd aria-hidden="true">⌘ K</kbd>}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-note">
            <span className="note-symbol">✳</span>
            <h4>Follow the connections.</h4>
            <p>
              Understand. Experiment.
              <br />
              Then make it work.
            </p>
            <Link to="/paths">
              Explore the atlas <ArrowRight size={14} />
            </Link>
          </div>
          <div className="sidebar-user">
            <span className="user-avatar">{progress.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{progress.name}</strong>
              <small>Your local learning space</small>
            </div>
            <Link to="/settings" aria-label="Open settings">
              <Settings2 size={17} />
            </Link>
          </div>
        </aside>
        <div className="app-body">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="mobile-toggle icon-button"
                aria-label="Toggle navigation"
                onClick={() => setMobile(!mobile)}
              >
                <Menu size={20} />
              </button>
              <span>Forge</span>
              <ChevronRight size={13} />
              <strong>
                {activeNav?.[1] ?? (location.pathname.startsWith('/learn') ? 'Learn' : 'Practice')}
              </strong>
            </div>
            <div className="topbar-right">
              <span className="local-status">
                <i /> Local-first learning
              </span>
              <span className="top-divider" />
              <Link to="/settings" className="avatar-small" aria-label="Your profile">
                {progress.name.slice(0, 1).toUpperCase()}
              </Link>
            </div>
          </header>
          <main id="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/explore/javascript" replace />} />
              <Route path="/explore" element={<Navigate to="/explore/javascript" replace />} />
              <Route path="/explore/:trackId" element={<Atlas />} />
              <Route path="/learn/:id" element={<ConceptLesson />} />
              <Route path="/paths" element={<Navigate to="/explore/javascript" replace />} />
              <Route path="/paths/:trackId" element={<PathRedirect />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/visualizations" element={<Visualizations />} />
              <Route path="/progress" element={<Navigate to="/settings" replace />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/exercise/:id" element={<ExerciseWorkspace />} />
              <Route
                path="*"
                element={
                  <div className="page">
                    <h1>That page isn’t in the workshop.</h1>
                    <Link to="/">Back to the atlas</Link>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
        {toast && (
          <div className="toast" role="status">
            <CheckCircle2 size={17} />
            {toast}
            <button aria-label="Dismiss notification" onClick={() => setToast('')}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </Context.Provider>
  );
}

function ExerciseRow({ exercise: e }: { exercise: PublicExercise }) {
  const { progress, tracks } = useForge();
  return (
    <Link className="exercise-row" to={`/exercise/${e.id}`}>
      <span className={`row-status ${progress.completed[e.id] ? 'solved' : ''}`}>
        {progress.completed[e.id] ? <CheckCircle2 size={18} /> : <Code2 size={17} />}
      </span>
      <div className="row-name">
        <strong>{e.title}</strong>
        <small>
          {tracks.find((t) => t.id === e.track)?.name} <span>·</span> {e.topic}
        </small>
      </div>
      <Difficulty value={e.difficulty} />
      <span className="row-mode">{e.mode}</span>
      <ChevronRight size={16} />
    </Link>
  );
}
function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
function SearchBox({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <label className="search-box">
      <Search size={15} />
      <input
        aria-label="Search exercises"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Find a challenge…"
      />
    </label>
  );
}
function NotFound() {
  return (
    <div className="page">
      <h1>Exercise not found.</h1>
      <Link to="/paths">Browse learning paths</Link>
    </div>
  );
}

function Practice() {
  const { exercises, tracks, progress, session, setSession } = useForge();
  const navigate = useNavigate();
  const [language, setLanguage] = useState('all'),
    [difficulty, setDifficulty] = useState('all'),
    [topic, setTopic] = useState('all'),
    [mode, setMode] = useState('all'),
    [query, setQuery] = useState(''),
    [count, setCount] = useState(3),
    [timed, setTimed] = useState(false),
    [minutes, setMinutes] = useState(30);
  const topics = [
    ...new Set(
      exercises.filter((e) => language === 'all' || e.language === language).map((e) => e.topic),
    ),
  ];
  const filtered = exercises.filter(
    (e) =>
      (language === 'all' || e.language === language) &&
      (difficulty === 'all' || e.difficulty === difficulty) &&
      (topic === 'all' || e.topic === topic) &&
      (mode === 'all' || e.mode === mode) &&
      (e.title + ' ' + e.topic).toLowerCase().includes(query.toLowerCase()),
  );
  const start = () => {
    const sorted = [...filtered].sort(
      (a, b) => Number(!!progress.completed[a.id]) - Number(!!progress.completed[b.id]),
    );
    const ids = sorted.slice(0, count).map((e) => e.id);
    setSession({
      ids,
      index: 0,
      startedAt: Date.now(),
      deadline: timed ? Date.now() + minutes * 60000 : null,
      finished: false,
    });
    navigate(`/exercise/${ids[0]}`);
  };
  return (
    <div className="page">
      <PageTitle
        eyebrow="DELIBERATE PRACTICE"
        title="Make it second nature."
        description="Choose your focus. Write it from memory. Test what you understand."
      />
      {session && <SessionSummary />}
      <section className="practice-builder panel">
        <div>
          <Badge tone="orange">
            <Target size={12} /> FOCUSED SESSION
          </Badge>
          <h2>A little structure. A lot of progress.</h2>
          <p>Unsolved exercises come first. You can still practise completed challenges.</p>
        </div>
        <div className="session-options">
          <label>
            Questions
            <select value={count} onChange={(e) => setCount(+e.target.value)}>
              {[1, 3, 5, 10].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
            Timed interview
          </label>
          {timed && (
            <label>
              Minutes
              <select value={minutes} onChange={(e) => setMinutes(+e.target.value)}>
                {[15, 30, 45, 60].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          )}
          <button className="button primary" disabled={!filtered.length} onClick={start}>
            Start {Math.min(count, filtered.length)}{' '}
            {timed ? 'question interview' : 'question session'} <ArrowRight size={16} />
          </button>
        </div>
      </section>
      <div className="filter-bar">
        <SearchBox value={query} onChange={setQuery} />
        <select
          aria-label="Language"
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setTopic('all');
          }}
        >
          <option value="all">All languages</option>
          {['javascript', 'typescript', 'python', 'react', 'go', 'rust'].map((l) => (
            <option value={l} key={l}>
              {l === 'javascript'
                ? 'JavaScript'
                : l === 'typescript'
                  ? 'TypeScript'
                  : (tracks.find((t) => t.id === l)?.name ?? l)}
            </option>
          ))}
        </select>
        <select
          aria-label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="all">All difficulties</option>
          {['Foundation', 'Intermediate', 'Advanced'].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select aria-label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select aria-label="Exercise type" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="all">All modes</option>
          {['Implement', 'Debug', 'Build'].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="list-label">
        {filtered.length} CHALLENGES <span>Honest feedback. Real execution.</span>
      </div>
      <div className="exercise-table">
        {filtered.map((e) => (
          <ExerciseRow key={e.id} exercise={e} />
        ))}
        {!filtered.length && (
          <div className="empty-state">
            <Search size={28} />
            <h3>No matches in this workshop.</h3>
            <p>Try another topic or widen your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
function SessionSummary() {
  const { session, setSession, progress, exercises } = useForge();
  if (!session) return null;
  const attempts = progress.attempts.filter(
      (a) =>
        session.ids.includes(a.exerciseId) &&
        a.action === 'submit' &&
        Date.parse(a.date) >= session.startedAt &&
        Date.parse(a.date) <= (session.endedAt ?? Infinity),
    ),
    solved = new Set(attempts.filter((a) => a.passed).map((a) => a.exerciseId));
  return (
    <div className="session-summary panel">
      <div>
        <Badge>{session.finished ? 'SESSION COMPLETE' : 'ACTIVE SESSION'}</Badge>
        <h3>
          {solved.size} / {session.ids.length} challenges solved
        </h3>
        <p>
          {attempts.length} recorded submissions in this session. Results reflect test outcomes;
          communication and style are not automatically assessed.
        </p>
        <div className="session-links">
          {session.ids.map((id) => (
            <Link key={id} to={`/exercise/${id}`}>
              {solved.has(id) ? <CheckCircle2 size={14} /> : <Circle size={14} />}{' '}
              {exercises.find((e) => e.id === id)?.title}
            </Link>
          ))}
        </div>
      </div>
      <button className="button secondary" onClick={() => setSession(null)}>
        Dismiss session
      </button>
    </div>
  );
}
function Projects() {
  const { exercises } = useForge();
  return (
    <div className="page">
      <PageTitle
        eyebrow="THE BUILD LAB"
        title="Small projects. Real engineering."
        description="Build an API, a worker pool or an interactive UI against runnable acceptance tests."
      />
      <div className="project-grid">
        {exercises
          .filter((e) => e.mode === 'Build')
          .map((e, i) => (
            <Link to={`/exercise/${e.id}`} className="project-card" key={e.id}>
              <div className="project-art">
                <FolderCode size={44} />
                <span>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div>
                <Badge>{e.language.toUpperCase()}</Badge>
                <h2>{e.title}</h2>
                <p>{e.problem}</p>
                <div className="project-bottom">
                  <Difficulty value={e.difficulty} />
                  <span>
                    Open project <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
      </div>
      <p className="micro">
        Projects have one editable implementation file with optional read-only context files. A
        general multi-file project runner is not yet included.
      </p>
    </div>
  );
}
function Visualizations() {
  return (
    <div className="page">
      <PageTitle
        eyebrow="INTERACTIVE LAB"
        title="Make the invisible visible."
        description="Explore a model one step at a time. Then implement it yourself."
      />
      <Visualizer />
    </div>
  );
}

function ExerciseWorkspace() {
  const { id } = useParams();
  const {
    exercises,
    tracks,
    progress,
    setProgress,
    capabilities,
    fastapi,
    notify,
    session,
    setSession,
  } = useForge();
  const e = exercises.find((e) => e.id === id);
  const [tab, setTab] = useState('problem'),
    [result, setResult] = useState<RunResult | null>(null),
    [busy, setBusy] = useState(false),
    [action, setAction] = useState<'run' | 'submit'>('run'),
    [hint, setHint] = useState(0),
    [solution, setSolution] = useState(''),
    [file, setFile] = useState(''),
    [now, setNow] = useState(Date.now()),
    [knowledge, setKnowledge] = useState('');
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const conceptId = new URLSearchParams(location.search).get('concept');
  const { concepts } = useForge();
  const linkedConcept =
    concepts.find((c) => c.id === conceptId && c.exercises.includes(id ?? '')) ??
    concepts.find((c) => c.id === id && c.exercises.includes(id ?? '')) ??
    concepts.find((c) => c.exercises.includes(id ?? ''));
  useEffect(() => {
    setTab('problem');
    setResult(null);
    setHint(0);
    setSolution('');
    setFile('');
    setKnowledge('');
  }, [id]);
  useEffect(() => {
    if (!session?.deadline || session.finished) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [session]);
  const timedOut = !!session?.deadline && now >= session.deadline;
  useEffect(() => {
    if (timedOut && session && !session.finished) {
      setSession({ ...session, finished: true, endedAt: session.deadline ?? Date.now() });
      notify('Interview time is up. Your draft is saved; view the result summary in Practice.');
    }
  }, [timedOut, session, setSession, notify]);
  if (!e) return <NotFound />;
  const ex = e,
    check = knowledgeFor(ex),
    source = progress.drafts[ex.id] ?? ex.starter,
    completed = !!progress.completed[ex.id],
    cap = capabilities.find((c) => c.language === ex.language),
    available = !!cap?.available && (!ex.framework || fastapi),
    activeSession = session?.ids.includes(ex.id) && !session.finished;
  const updateSource = (value: string) =>
    setProgress((p) => ({ ...p, drafts: { ...p.drafts, [ex.id]: value } }));
  const execute = async (kind: 'run' | 'submit') => {
    if (busy || !available || (timedOut && activeSession)) return;
    setBusy(true);
    setAction(kind);
    try {
      const r = await runCode(ex.id, source, kind);
      setResult(r);
      setProgress((p) =>
        recordAttempt(p, {
          exerciseId: ex.id,
          passed: r.passed,
          action: kind,
          duration: r.duration,
          passedTests: r.results.filter((t) => t.passed).length,
          totalTests:
            kind === 'submit' ? ex.tests.length : ex.tests.filter((t) => !t.hidden).length,
        }),
      );
      if (r.passed && kind === 'submit')
        notify(
          completed ? 'All tests passed. Good practice.' : 'All tests passed. Completion saved.',
        );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Execution failed');
    } finally {
      setBusy(false);
    }
  };
  const mount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addAction({
      id: 'forge-run',
      label: 'Run example tests',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => document.getElementById('run-code')?.click(),
    });
    editor.addAction({
      id: 'forge-submit',
      label: 'Submit all tests',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
      run: () => document.getElementById('submit-code')?.click(),
    });
  };
  const reveal = async () => {
    try {
      setSolution((await getSolution(ex.id)).solution);
    } catch {
      notify('Could not load the reference solution.');
    }
  };
  return (
    <div className="exercise-page">
      <div className="exercise-header">
        <div>
          <Link
            to={
              linkedConcept
                ? `/learn/${linkedConcept.id}${location.search}`
                : `/explore/${ex.track}`
            }
            className="back-link"
          >
            ← {linkedConcept?.title ?? tracks.find((t) => t.id === ex.track)?.name}
          </Link>
          <h1>
            {ex.title}
            {completed && <CheckCircle2 size={23} className="success" />}
          </h1>
          <div className="exercise-tags">
            <Difficulty value={ex.difficulty} />
            <Badge>{ex.mode}</Badge>
            <span>{ex.topic}</span>
          </div>
        </div>
        <div className="exercise-header-right">
          {activeSession && session && (
            <span className="timer">
              <Clock3 size={16} />
              {session.deadline
                ? `${Math.max(0, Math.floor((session.deadline - now) / 60000))}:${String(Math.max(0, Math.floor((session.deadline - now) / 1000) % 60)).padStart(2, '0')}`
                : `${session.ids.indexOf(ex.id) + 1} / ${session.ids.length}`}
            </span>
          )}
          <Badge tone={available ? 'green' : 'orange'}>
            <i className="tiny-dot" />
            {available ? 'Runtime ready' : 'Runtime unavailable'}
          </Badge>
          <span className="saved-label">
            <Check size={13} /> Draft saved locally
          </span>
        </div>
      </div>
      {activeSession && (
        <div className="session-banner">
          <span>
            Focused session · {session!.ids.indexOf(ex.id) + 1} of {session!.ids.length}
          </span>
          <button
            onClick={() => {
              const i = session!.ids.indexOf(ex.id);
              if (i < session!.ids.length - 1) {
                setSession({ ...session!, index: i + 1 });
                navigate(`/exercise/${session!.ids[i + 1]}`);
              } else {
                setSession({ ...session!, finished: true, endedAt: Date.now() });
                navigate('/practice');
              }
            }}
          >
            {session!.ids.indexOf(ex.id) === session!.ids.length - 1
              ? 'Finish session'
              : 'Next question'}{' '}
            <ArrowRight size={14} />
          </button>
        </div>
      )}
      <div className="exercise-panels">
        <section className="lesson-panel">
          <div className="workspace-tabs" role="tablist" aria-label="Exercise information">
            {[
              ['problem', 'Challenge'],
              ['learn', 'Learn'],
              ['explanation', 'Review'],
              ...(ex.visualization ? [['visual', 'Visualise']] : []),
            ].map(([value, title]) => (
              <button
                role="tab"
                aria-selected={tab === value}
                key={value}
                onClick={() => setTab(value)}
              >
                {title}
              </button>
            ))}
          </div>
          <div className="lesson-content">
            {tab === 'problem' && (
              <>
                <span className="eyebrow">THE CHALLENGE</span>
                <h2>{ex.title}</h2>
                <p>{ex.problem}</p>
                <h3>What you’ll learn</h3>
                <ul>
                  {ex.objectives.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
                <h3>Examples</h3>
                {ex.examples.map((example, i) => (
                  <div className="example-box" key={i}>
                    <span>INPUT</span>
                    <pre>{example.input}</pre>
                    <span>EXPECTED BEHAVIOUR</span>
                    <pre>{example.output}</pre>
                  </div>
                ))}
                <h3>Constraints</h3>
                <ul>
                  {ex.constraints.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                {ex.prerequisites.length > 0 && (
                  <>
                    <h3>Suggested preparation</h3>
                    {ex.prerequisites.map((p) => (
                      <Link className="prereq-link" key={p} to={`/exercise/${p}`}>
                        {progress.completed[p] ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <BookOpen size={14} />
                        )}{' '}
                        {exercises.find((x) => x.id === p)?.title}
                      </Link>
                    ))}
                  </>
                )}
                <div className="hints-block">
                  <div>
                    <h3>
                      <Lightbulb size={16} /> Need a nudge?
                    </h3>
                    <span>
                      {hint} / {ex.hints.length}
                    </span>
                  </div>
                  {ex.hints.slice(0, hint).map((h, i) => (
                    <p key={h}>
                      <strong>{i + 1}.</strong> {h}
                    </p>
                  ))}
                  <button
                    className="button secondary"
                    disabled={hint >= ex.hints.length}
                    onClick={() => setHint((h) => h + 1)}
                  >
                    {hint === ex.hints.length ? 'All hints revealed' : 'Reveal a hint'}{' '}
                    <Plus size={13} />
                  </button>
                </div>
              </>
            )}
            {tab === 'learn' && (
              <>
                <span className="eyebrow">BUILD THE MENTAL MODEL</span>
                <h2>{ex.topic}</h2>
                <p className="lesson-lead">{ex.explanation}</p>
                <h3>Why this matters</h3>
                <p>{ex.problem}</p>
                <h3>Before you code</h3>
                <p>
                  Predict what the example will produce. Identify the state you need to retain and
                  which edge cases could invalidate your approach.
                </p>
                <div className="knowledge-check">
                  <h3>Quick check</h3>
                  <p>{check.question}</p>
                  <div>
                    <button
                      className="button secondary"
                      onClick={() =>
                        setKnowledge(
                          check.answer
                            ? check.explanation
                            : 'Try again. Think about what the runtime actually guarantees.',
                        )
                      }
                    >
                      Yes
                    </button>
                    <button
                      className="button secondary"
                      onClick={() =>
                        setKnowledge(
                          !check.answer
                            ? check.explanation
                            : 'Try again. Think about what the runtime actually guarantees.',
                        )
                      }
                    >
                      No
                    </button>
                  </div>
                  {knowledge && <p role="status">{knowledge}</p>}
                </div>
                <button
                  className="button primary"
                  onClick={() => {
                    setProgress((p) => ({
                      ...p,
                      lessons: { ...p.lessons, [ex.id]: new Date().toISOString() },
                    }));
                    notify('Lesson marked as read. Solve and submit to earn completion.');
                    setTab('problem');
                  }}
                >
                  <Check size={15} />
                  {progress.lessons[ex.id]
                    ? 'Lesson read · start coding'
                    : 'Mark as read & start coding'}
                </button>
              </>
            )}
            {tab === 'explanation' && (
              <>
                <span className="eyebrow">REFLECT & IMPROVE</span>
                <h2>{completed ? 'A solution worth understanding.' : 'Earn the explanation.'}</h2>
                <h3>Complexity target</h3>
                <p>{ex.complexity}</p>
                <h3>Common mistakes</h3>
                <ul>
                  {ex.mistakes.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
                {completed ? (
                  <>
                    <p>
                      Compare approaches after your successful submission. The reference is one
                      correct implementation, not the only one.
                    </p>
                    <button className="button secondary" onClick={reveal}>
                      <BookOpen size={15} />
                      Read reference solution
                    </button>
                    {solution && <pre className="solution-code">{solution}</pre>}
                  </>
                ) : (
                  <div className="notice">
                    <Award size={20} />
                    <p>The reference solution unlocks after all submission tests pass.</p>
                  </div>
                )}
              </>
            )}
            {tab === 'visual' && ex.visualization && (
              <Visualizer initial={ex.visualization} compact />
            )}
          </div>
        </section>
        <section className="code-panel">
          <div className="file-bar">
            <div className="file-tabs">
              <button className={!file ? 'selected' : ''} onClick={() => setFile('')}>
                <span className="file-icon">
                  {ex.language === 'python'
                    ? 'Py'
                    : ex.language === 'typescript'
                      ? 'TS'
                      : ex.language === 'react'
                        ? 'Rx'
                        : '{ }'}
                </span>
                {ex.filename}
              </button>
              {Object.keys(ex.files ?? {}).map((f) => (
                <button className={file === f ? 'selected' : ''} key={f} onClick={() => setFile(f)}>
                  {f}
                  <small>read-only</small>
                </button>
              ))}
            </div>
            <div className="editor-tools">
              <button
                className="icon-button"
                aria-label="Format code"
                title="Format code (JS/TS/React)"
                disabled={!['javascript', 'typescript', 'react'].includes(ex.language) || !!file}
                onClick={() => editorRef.current?.getAction('editor.action.formatDocument')?.run()}
              >
                <Code2 size={16} />
              </button>
              <button
                className="icon-button"
                aria-label="Reset starter code"
                title="Reset starter code"
                disabled={busy}
                onClick={() => {
                  updateSource(ex.starter);
                  setResult(null);
                  notify('Starter code restored.');
                }}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
          <div className="editor-host">
            <Suspense
              fallback={
                <div className="results-empty">
                  <LoaderCircle className="spin" size={20} />
                  <p>Opening your editor?</p>
                </div>
              }
            >
              <Editor
                key={`${ex.id}:${file}`}
                path={ex.id + '/' + (file || ex.filename)}
                height="100%"
                language={file ? 'plaintext' : ex.language === 'react' ? 'typescript' : ex.language}
                theme={progress.theme === 'light' ? 'light' : 'vs-dark'}
                value={file ? ex.files?.[file] : source}
                onChange={(value) => {
                  if (value !== undefined && !file) updateSource(value);
                }}
                onMount={mount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'Cascadia Code', 'SFMono-Regular', Consolas, monospace",
                  lineHeight: 23,
                  padding: { top: 20 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: ex.language === 'python' ? 4 : 2,
                  readOnly: !!file || busy,
                  wordWrap: 'on',
                  renderLineHighlight: 'gutter',
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  bracketPairColorization: { enabled: true },
                }}
              />
            </Suspense>
          </div>
          {!available && (
            <div className="runtime-notice">
              <Terminal size={18} />
              <div>
                <strong>
                  {ex.framework && !fastapi
                    ? 'FastAPI dependencies missing'
                    : `${ex.language} runtime unavailable`}
                </strong>
                <p>
                  {ex.framework
                    ? 'Run python -m pip install -r requirements.txt'
                    : (cap?.install ?? 'Checking local toolchain…')}
                </p>
                <small>
                  {['go', 'rust'].includes(ex.language)
                    ? 'Check Settings for compiler discovery and the latest execution self-check.'
                    : 'Start the local execution service to enable grading.'}
                </small>
              </div>
            </div>
          )}
          <div className="editor-action-bar">
            <span>
              <Command size={12} /> Enter to run <span>·</span> ⇧ Enter to submit
            </span>
            <div>
              <button
                id="run-code"
                className="button secondary"
                disabled={busy || !available}
                onClick={() => execute('run')}
              >
                {busy && action === 'run' ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <Play size={14} />
                )}
                Run tests
              </button>
              <button
                id="submit-code"
                className="button primary"
                disabled={busy || !available}
                onClick={() => execute('submit')}
              >
                {busy && action === 'submit' ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <ArrowRight size={15} />
                )}
                Submit
              </button>
            </div>
          </div>
          <div className="results-panel">
            <div className="results-heading">
              <span>
                <Terminal size={15} /> Test results
              </span>
              {result && (
                <span>
                  {result.duration} ms <i />{' '}
                  {action === 'submit' ? 'Full submission' : 'Visible tests'}
                </span>
              )}
            </div>
            {busy ? (
              <div className="results-empty">
                <LoaderCircle size={22} className="spin" />
                <p>Executing real {ex.language} tests…</p>
              </div>
            ) : !result ? (
              <div className="results-empty">
                <Terminal size={25} />
                <h3>Your thinking, put to the test.</h3>
                <p>Run the visible tests, then submit against the full suite.</p>
                <small>Hidden fixtures are local and inspectable. No AI grading.</small>
              </div>
            ) : (
              <div className="result-content">
                <div className={`result-status ${result.passed ? 'passed' : 'failed'}`}>
                  {result.passed ? <CheckCircle2 size={19} /> : <X size={19} />}
                  <strong>
                    {result.passed
                      ? action === 'submit'
                        ? 'All tests passed · challenge complete'
                        : 'Visible tests passed · submit to complete'
                      : 'Needs another look'}
                  </strong>
                  <span>
                    {result.results.filter((t) => t.passed).length} /{' '}
                    {action === 'submit'
                      ? ex.tests.length
                      : ex.tests.filter((t) => !t.hidden).length}{' '}
                    tests
                  </span>
                </div>
                {result.diagnostics.map((d, i) => (
                  <pre className="diagnostic" key={i}>
                    {d}
                  </pre>
                ))}
                {result.results.map((t, i) => (
                  <details
                    key={i}
                    className={`test-result ${t.passed ? 'passed' : 'failed'}`}
                    open={!t.passed}
                  >
                    <summary>
                      {t.passed ? <CheckCircle2 size={15} /> : <X size={15} />}
                      <span>{t.name}</span>
                      {t.hidden && <Badge>HIDDEN</Badge>}
                    </summary>
                    {t.error && <pre>{t.error}</pre>}
                    {t.expected && (
                      <div className="expected-actual">
                        <div>
                          <small>EXPECTED</small>
                          <code>{t.expected}</code>
                        </div>
                        <div>
                          <small>ACTUAL</small>
                          <code>{t.actual}</code>
                        </div>
                      </div>
                    )}
                  </details>
                ))}
                {result.output.length > 0 && (
                  <div className="console-output">
                    <span>CONSOLE OUTPUT</span>
                    <pre>{result.output.join('\n')}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="editor-status">
            <span>
              <span className="tiny-dot green" />
              {ex.language} · UTF-8
            </span>
            <span>
              Trusted local execution{' '}
              <Link to="/settings">
                Runtime details <ExternalLink size={10} />
              </Link>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingsPage() {
  const { progress, setProgress, capabilities, fastapi, notify } = useForge();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Progress | null>(null),
    [reset, setReset] = useState(false);
  const [checkingRuntimes, setCheckingRuntimes] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    capabilities: Capability[];
    fastapi: boolean;
  } | null>(null);
  const runtimeCaps = diagnostics?.capabilities ?? capabilities;
  const exportData = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forge-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Progress exported, including drafts and attempt history.');
  };
  return (
    <div className="page settings-page">
      <PageTitle
        eyebrow="YOUR WORKSPACE"
        title="Make yourself at home."
        description="Local by default. Portable when you need it."
      />
      <section className="panel settings-section">
        <h2>Personal preferences</h2>
        <label>
          Display name
          <input
            value={progress.name}
            maxLength={40}
            onChange={(e) => setProgress((p) => ({ ...p, name: e.target.value }))}
          />
        </label>
        <label>
          Appearance
          <select
            value={progress.theme}
            onChange={(e) =>
              setProgress((p) => ({ ...p, theme: e.target.value as Progress['theme'] }))
            }
          >
            <option value="dark">Forge dark</option>
            <option value="light">Workshop light</option>
          </select>
        </label>
        <p className="micro">
          <Moon size={13} /> Preferences and code drafts are saved in this browser.
        </p>
      </section>
      <section className="panel settings-section">
        <h2>Your learning data</h2>
        <p>
          Export your solved challenges, drafts, lesson history and attempts. Imports are validated
          before replacing current progress.
        </p>
        <div className="button-row">
          <button className="button secondary" onClick={exportData}>
            <ArrowDownToLine size={16} />
            Export progress
          </button>
          <button className="button secondary" onClick={() => input.current?.click()}>
            <ArrowUpFromLine size={16} />
            Import progress
          </button>
          <input
            ref={input}
            aria-label="Import progress file"
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 5_000_000) throw Error('File exceeds 5 MB');
                setPending(importProgress(await file.text()));
              } catch {
                notify('Import rejected: select a valid Forge v1 progress JSON file.');
              }
              e.target.value = '';
            }}
          />
        </div>
        {pending && (
          <div className="import-preview">
            <p>
              Ready to replace current progress with{' '}
              <strong>{Object.keys(pending.completed).length} completions</strong>,{' '}
              {Object.keys(pending.drafts).length} drafts and {pending.attempts.length} attempts.
            </p>
            <button
              className="button primary"
              onClick={() => {
                setProgress(pending);
                setPending(null);
                notify('Progress imported.');
              }}
            >
              Replace with imported progress
            </button>
            <button className="button secondary" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        )}
      </section>
      <section className="panel settings-section">
        <div className="card-title">
          <h2>Runtime Diagnostics</h2>
          <button
            className="button secondary"
            disabled={checkingRuntimes}
            onClick={async () => {
              setCheckingRuntimes(true);
              try {
                const result = await checkRuntimes();
                setDiagnostics(result);
                window.dispatchEvent(new Event('forge:runtimes-checked'));
              } catch (e) {
                notify(e instanceof Error ? e.message : 'Self-check failed');
              } finally {
                setCheckingRuntimes(false);
              }
            }}
          >
            {checkingRuntimes ? 'Running self-check?' : 'Run self-check'}
          </button>
        </div>
        <p>
          JavaScript runs in a separate Node process and VM context. TypeScript uses the real
          TypeScript compiler. Python uses your installed interpreter; React tests mount actual
          components in jsdom.
        </p>
        <div className="runtime-list">
          {runtimeCaps.map((c) => (
            <div className="runtime-item" key={c.language}>
              <div>
                <strong>
                  {c.language === 'react'
                    ? 'React components'
                    : c.language[0].toUpperCase() + c.language.slice(1)}
                </strong>
                <Badge tone={c.available ? 'green' : 'orange'}>
                  {c.available ? 'Self-check passed' : 'Unavailable'}
                </Badge>
              </div>
              <code>{c.version}</code>
              {c.diagnostics && <pre className="runtime-diagnostic">{c.diagnostics}</pre>}
              {c.checkedAt && <small>Checked: {new Date(c.checkedAt).toLocaleString()}</small>}
              <div className="runtime-flags">
                <span>Compile: {c.compilation && c.available ? 'yes' : 'no'}</span>
                <span>Execute: {c.execution ? 'yes' : 'no'}</span>
                <span>Tests: {c.tests ? 'yes' : 'no'}</span>
              </div>
              <small>Dependencies: {c.dependencies.join(', ')}</small>
              {!c.available && <p>{c.install}</p>}
            </div>
          ))}
        </div>
        <div className="notice">
          <strong>
            FastAPI HTTP testing:{' '}
            {(diagnostics?.fastapi ?? fastapi) ? 'self-check passed' : 'self-check failed'}
          </strong>
          {!fastapi && <code>python -m pip install -r requirements.txt</code>}
        </div>
        <div className="security-note">
          <Terminal size={20} />
          <div>
            <strong>Designed for trusted local practice</strong>
            <p>
              The service binds to 127.0.0.1 and rejects foreign origins. Process timeouts, output
              caps and temporary working directories limit runaway work. This is not an OS security
              sandbox: Python and native code can access your files and network with your user
              permissions. Run only code you trust, and do not expose the service publicly.
            </p>
          </div>
        </div>
      </section>
      <section className="panel settings-section">
        <h2>Keyboard shortcuts</h2>
        <div className="shortcut-row">
          <span>Run visible tests (editor focused)</span>
          <kbd>Ctrl / ⌘ Enter</kbd>
        </div>
        <div className="shortcut-row">
          <span>Submit all tests</span>
          <kbd>Ctrl / ⌘ Shift Enter</kbd>
        </div>
      </section>
      <section className="panel settings-section">
        <h2>Reset this browser’s progress</h2>
        <p>
          Export a backup first. Reset removes drafts, attempts and completion history from this
          browser.
        </p>
        {reset ? (
          <div className="button-row">
            <button
              className="button danger"
              onClick={() => {
                setProgress(emptyProgress());
                setReset(false);
                notify('Local progress reset.');
              }}
            >
              Confirm reset
            </button>
            <button className="button secondary" onClick={() => setReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="button secondary" onClick={() => setReset(true)}>
            Reset local progress
          </button>
        )}
      </section>
    </div>
  );
}

function PathRedirect() {
  const { trackId } = useParams();
  return <Navigate to={`/explore/${trackId}`} replace />;
}
