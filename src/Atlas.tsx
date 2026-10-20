import { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  type NodeProps,
  type Node,
  type ReactFlowInstance,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Compass,
  GitBranch,
  List,
  Map,
  Search,
  X,
} from 'lucide-react';
import type { Concept } from '../curriculum/concepts';
import { layoutConcepts } from '../curriculum/layout';
import { conceptState, useForge } from './atlas-context';

type ConceptNode = Node<
  { concept: Concept; selected: boolean; dimmed: boolean; state: string },
  'concept'
>;
function KnowledgeNode({ data }: NodeProps<ConceptNode>) {
  const c = data.concept;
  return (
    <div
      className={`knowledge-node ${data.selected ? 'is-selected' : ''} ${data.dimmed ? 'dimmed' : ''} ${c.status === 'planned' ? 'is-planned' : ''}`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="node-eyebrow">
        <span>{c.topic}</span>
        {data.state === 'Completed' && <Check size={13} />}
      </div>
      <strong>{c.title}</strong>
      <div className="node-bottom">
        <span className={`node-level ${c.difficulty.toLowerCase()}`}>
          <i />
          {c.difficulty}
        </span>
        <span>
          {c.lesson ? <BookOpen size={12} /> : 'PLANNED'}
          {c.exercises.length > 0 && (
            <>
              <Code2 size={12} />
              {c.exercises.length}
            </>
          )}
        </span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { concept: KnowledgeNode };
function readViewport(key: string): Viewport | undefined {
  try {
    const v = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (v && [v.x, v.y, v.zoom].every(Number.isFinite) && v.zoom > 0) return v;
  } catch {
    /* An unavailable store should not block the atlas. */
  }
}

export function Atlas() {
  const { trackId = 'javascript' } = useParams();
  const { tracks, concepts, progress } = useForge();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [list, setList] = useState(() => window.matchMedia('(max-width:760px)').matches);
  const instance = useRef<ReactFlowInstance<ConceptNode> | null>(null);
  const track = tracks.find((t) => t.id === trackId);
  const all = useMemo(() => concepts.filter((c) => c.track === trackId), [concepts, trackId]);
  const preferred =
    trackId === 'javascript'
      ? 'js-debounce'
      : trackId === 'typescript'
        ? 'ts-discriminated'
        : all.find((c) => c.status === 'lesson')?.id;
  const selected =
    all.find((c) => c.id === params.get('concept')) ??
    all.find((c) => c.id === preferred) ??
    all[0];
  const query = params.get('q') ?? '',
    topic = params.get('topic') ?? 'all',
    level = params.get('level') ?? 'all';
  const matches = (c: Concept) =>
    `${c.title} ${c.summary} ${c.topic}`.toLowerCase().includes(query.toLowerCase()) &&
    (topic === 'all' || c.topic === topic) &&
    (level === 'all' || c.difficulty === level);
  const visible = all.filter(matches);
  const update = (key: string, value: string) => {
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (value && value !== 'all') next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };
  const select = (c: Concept, center = false) => {
    update('concept', c.id);
    if (center) {
      const pos = layoutConcepts(all).find((n) => n.id === c.id)!;
      instance.current?.setCenter(pos.x + 120, pos.y + 55, { zoom: 0.9, duration: 350 });
    }
  };
  const positions = layoutConcepts(all);
  const nodes: ConceptNode[] = all.map((c) => ({
    id: c.id,
    type: 'concept',
    position: positions.find((p) => p.id === c.id)!,
    initialWidth: 240,
    initialHeight: 120,
    data: {
      concept: c,
      selected: selected?.id === c.id,
      dimmed: !matches(c),
      state: conceptState(c, progress),
    },
    ariaLabel: `${c.title}, ${c.difficulty}, ${c.status}`,
    style: { width: 240, height: 120 },
    draggable: false,
  }));
  const edges = all.flatMap((c) => [
    ...c.prerequisites
      .filter((p) => all.some((n) => n.id === p))
      .map((p) => ({
        id: `${p}-${c.id}`,
        source: p,
        target: c.id,
        type: 'smoothstep',
        style: {
          stroke:
            selected?.id === c.id || selected?.id === p
              ? progress.theme === 'light'
                ? '#4b7157'
                : '#a8c6b4'
              : '#3b4548',
          strokeWidth: 1.5,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#697a76' },
      })),
    ...c.recommended
      .filter((p) => all.some((n) => n.id === p))
      .map((p) => ({
        id: `rec-${p}-${c.id}`,
        source: p,
        target: c.id,
        type: 'smoothstep',
        style: { stroke: '#7e8b91', strokeDasharray: '6 5' },
      })),
    ...c.related
      .filter((p) => c.id < p && all.some((n) => n.id === p))
      .map((p) => ({
        id: `rel-${c.id}-${p}`,
        source: c.id,
        target: p,
        type: 'bezier',
        style: { stroke: '#7e78a3', strokeDasharray: '2 7' },
      })),
  ]);
  if (!track || !selected)
    return (
      <div className="page">
        <h1>Track not found</h1>
        <Link to="/explore/javascript">Explore JavaScript</Link>
      </div>
    );
  const viewportKey = `forge.map.${trackId}`;
  const mapUrl = `/explore/${trackId}${location.search}`;
  const learnUrl = `/learn/${selected.id}?map=${encodeURIComponent(mapUrl)}`;
  const ready = all.filter((c) => c.lesson).length;
  return (
    <div className="atlas-page">
      <header className="atlas-intro">
        <div>
          <div className="eyebrow">
            THE SOFTWARE ENGINEERING ATLAS <span>VOL. 02</span>
          </div>
          <h1>
            Follow your curiosity<span>.</span>
          </h1>
          <p>See the connections. Understand the ideas. Build something that works.</p>
        </div>
        <div className="atlas-index">
          <Compass size={25} />
          <span>
            {concepts.length}
            <small>connected concepts</small>
          </span>
        </div>
      </header>
      <nav className="atlas-tracks" aria-label="Learning tracks">
        {tracks.map((t) => (
          <Link key={t.id} to={`/explore/${t.id}`} className={t.id === trackId ? 'active' : ''}>
            <span style={{ color: t.color }}>{t.short}</span>
            {t.name}
            <span className="track-tab-count">
              {concepts.filter((c) => c.track === t.id).length}
            </span>
          </Link>
        ))}
      </nav>
      <div className="atlas-track-heading">
        <div>
          <span className="eyebrow">EXPLORE THE CONNECTIONS</span>
          <h2>
            {track.name}
            <span className="muted"> / knowledge map</span>
          </h2>
          <p>{track.description}</p>
        </div>
        <div className="track-availability">
          <b>{ready}</b> lessons & guides<span>·</span>
          <b>{all.length - ready}</b> planned
        </div>
      </div>
      <div className="atlas-toolbar">
        <label className="atlas-search">
          <Search size={16} />
          <input
            aria-label="Search concepts"
            placeholder="Find an idea in this map…"
            value={query}
            onChange={(e) => update('q', e.target.value)}
          />
          {query && (
            <button aria-label="Clear concept search" onClick={() => update('q', '')}>
              <X size={14} />
            </button>
          )}
        </label>
        <select
          aria-label="Concept subject"
          value={topic}
          onChange={(e) => update('topic', e.target.value)}
        >
          <option value="all">All subjects</option>
          {[...new Set(all.map((c) => c.topic))].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          aria-label="Concept difficulty"
          value={level}
          onChange={(e) => update('level', e.target.value)}
        >
          <option value="all">All levels</option>
          {['Foundation', 'Intermediate', 'Advanced'].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <button className="view-toggle" aria-pressed={list} onClick={() => setList(!list)}>
          {list ? <Map size={16} /> : <List size={16} />}
          <span>{list ? 'Map view' : 'List view'}</span>
        </button>
      </div>
      {(query || topic !== 'all' || level !== 'all') && (
        <div className="atlas-results" role="status">
          {visible.length} matching concepts
          {query && (
            <div>
              {visible.map((c) => (
                <button key={c.id} onClick={() => select(c, true)}>
                  {c.title}
                  <ArrowRight size={12} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className={`atlas-workbench ${list ? 'show-list' : ''}`}>
        <section className="graph-stage" aria-label={`${track.name} knowledge map`}>
          <div className="map-hint">
            <GitBranch size={13} /> Ideas connect. You choose the route.
          </div>
          <ReactFlow<ConceptNode>
            key={trackId}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodesConnectable={false}
            nodesDraggable={false}
            minZoom={0.25}
            maxZoom={1.5}
            colorMode={progress.theme}
            defaultViewport={readViewport(viewportKey) ?? { x: 32, y: 65, zoom: 0.8 }}
            onInit={(flow) => {
              instance.current = flow;
              if (!readViewport(viewportKey)) {
                const pos = positions.find((n) => n.id === selected.id)!;
                flow.setCenter(Math.max(340, pos.x), pos.y + 175, { zoom: 0.82 });
              }
            }}
            onMoveEnd={(_event, viewport) => {
              try {
                sessionStorage.setItem(viewportKey, JSON.stringify(viewport));
              } catch {
                /* optional navigation context */
              }
            }}
            onNodeClick={(_e, node) => select(node.data.concept)}
            fitView={false}
            aria-label="Interactive concept map"
          >
            <Background
              color={progress.theme === 'dark' ? '#343b3b' : '#c8d2cc'}
              gap={22}
              size={1}
            />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => (n.id === selected.id ? '#afd8c2' : '#4d5f5b')}
              maskColor={progress.theme === 'dark' ? '#111716c9' : '#f5f8f4bc'}
            />
          </ReactFlow>
          <div className="map-legend">
            <span>
              <i /> Required
            </span>
            <span>
              <i className="recommended" /> Recommended
            </span>
            <span>
              <i className="related" /> Related
            </span>
          </div>
        </section>
        <section className="concept-list" aria-label="Concept list">
          {visible.map((c) => (
            <button
              key={c.id}
              className={selected.id === c.id ? 'active' : ''}
              onClick={() => select(c)}
            >
              <span className="eyebrow">{c.topic}</span>
              <strong>{c.title}</strong>
              <p>{c.summary}</p>
              <span>
                {c.difficulty} ·{' '}
                {c.status === 'planned'
                  ? 'Planned'
                  : c.status === 'lesson'
                    ? 'Lesson'
                    : 'Short guide'}
                {c.exercises.length > 0 && ` · ${c.exercises.length} exercises`}
              </span>
            </button>
          ))}
          {!visible.length && <p>No concepts match these filters.</p>}
        </section>
        <aside className="concept-inspector" aria-label="Selected concept">
          <div className="inspector-kicker">
            <span>CONCEPT IN FOCUS</span>
            <ArrowDownRight size={17} />
          </div>
          <span className="inspector-category">{selected.topic}</span>
          <h2>{selected.title}</h2>
          <p>{selected.summary}</p>
          <div className="inspector-meta">
            <span className={`node-level ${selected.difficulty.toLowerCase()}`}>
              <i />
              {selected.difficulty}
            </span>
            <span>{conceptState(selected, progress)}</span>
          </div>
          {selected.lesson ? (
            <Link className="button primary inspector-cta" to={learnUrl}>
              Open lesson
              <BookOpen size={16} />
            </Link>
          ) : (
            <div className="planned-note">
              This topic is on the roadmap. A full lesson is planned; explore its connections now.
            </div>
          )}
          <div className="inspector-section">
            <h3>Build on</h3>
            {selected.prerequisites.length ? (
              selected.prerequisites.map((id) => {
                const c = concepts.find((c) => c.id === id)!;
                return (
                  <Link key={id} to={`/explore/${c.track}?concept=${id}`}>
                    {c.title}
                    <ArrowRight size={13} />
                  </Link>
                );
              })
            ) : (
              <p>A starting point in this track.</p>
            )}
          </div>
          {!!selected.enables.length && (
            <div className="inspector-section">
              <h3>Opens the door to</h3>
              {selected.enables.map((id) => {
                const c = concepts.find((c) => c.id === id)!;
                return (
                  <Link key={id} to={`/explore/${c.track}?concept=${id}`}>
                    {c.title}
                    <ArrowRight size={13} />
                  </Link>
                );
              })}
            </div>
          )}
          {!!selected.related.length && (
            <div className="inspector-section">
              <h3>Related ideas</h3>
              {selected.related.map((id) => {
                const c = concepts.find((c) => c.id === id)!;
                return (
                  <Link key={id} to={`/explore/${c.track}?concept=${id}`}>
                    {c.title}
                    <ArrowRight size={13} />
                  </Link>
                );
              })}
            </div>
          )}
          <div className="inspector-footer">
            <Code2 size={17} />
            <span>
              <b>{selected.exercises.length}</b> executable{' '}
              {selected.exercises.length === 1 ? 'exercise' : 'exercises'}
              <small>
                {selected.lesson
                  ? 'Understand → experiment → implement'
                  : 'Free exploration · no prerequisite locks'}
              </small>
            </span>
          </div>
        </aside>
      </div>
      <footer className="atlas-footer">
        <span>
          <span className="live-dot" /> Learn freely. Prerequisites are signposts.
        </span>
        <span>Pan to explore · scroll to zoom · keyboard-accessible list available</span>
      </footer>
    </div>
  );
}
