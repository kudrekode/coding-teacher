import { register } from './exercises';
register([
  {
    id: 'eng-rate',
    track: 'engineering',
    title: 'Enforce a sliding-window rate limit',
    topic: 'Queues & rate limiting',
    difficulty: 'Advanced',
    explanation:
      'A sliding-window limiter stores accepted request timestamps. Before deciding on a new request, evict timestamps at or before now-window. Rejected requests must not consume capacity. Each client needs its own queue to avoid noisy neighbours blocking one another.',
    problem:
      'Implement Limiter(limit,windowMs). allow(key,now) returns true for at most limit accepted requests per key in (now-windowMs,now]. Timestamps are nondecreasing.',
    starter:
      'class Limiter{\n constructor(limit,windowMs){this.limit=limit;this.windowMs=windowMs}\n allow(key,now){return true}\n}',
    solution:
      'class Limiter{constructor(limit,windowMs){this.limit=limit;this.windowMs=windowMs;this.clients=new Map()}allow(key,now){let q=(this.clients.get(key)||[]).filter(t=>t>now-this.windowMs);if(q.length>=this.limit){this.clients.set(key,q);return false}q.push(now);this.clients.set(key,q);return true}}',
    tests: [
      [
        'Enforces and expires the window',
        "let l=new Limiter(2,100);equal(l.allow('a',0),true);equal(l.allow('a',1),true);equal(l.allow('a',99),false);equal(l.allow('a',100),true);",
      ],
      [
        'Isolates clients and rejected calls',
        "let l=new Limiter(1,10);equal(l.allow('a',0),true);equal(l.allow('a',5),false);equal(l.allow('b',5),true);equal(l.allow('a',10),true);",
      ],
    ],
    hints: [
      'Evict expired timestamps before checking capacity.',
      'Do not append rejected requests to the accepted queue.',
    ],
    example: ['limit=2, window=100, calls at 0,1,99,100', 'true,true,false,true'],
    complexity:
      'This array implementation scans O(k) timestamps per call. A deque with a moving head can amortise eviction.',
    visualization: 'queue',
  },
  {
    id: 'eng-deps',
    track: 'engineering',
    title: 'Resolve a dependency graph',
    topic: 'Graphs & architecture',
    difficulty: 'Advanced',
    explanation:
      'Build systems and job schedulers use topological ordering to run dependencies first. Depth-first search needs three states: unseen, visiting and complete. Encountering a visiting node reveals a cycle, while complete nodes can be reused without duplicate work.',
    problem:
      'Implement resolve(graph), returning every node after its dependencies. graph maps names to dependency arrays. Throw on cycles; include dependency-only nodes.',
    starter: 'function resolve(graph){\n return Object.keys(graph);\n}',
    solution:
      'function resolve(graph){const done=new Set(),active=new Set(),out=[];function visit(n){if(active.has(n))throw Error("Cycle");if(done.has(n))return;active.add(n);for(const d of graph[n]||[])visit(d);active.delete(n);done.add(n);out.push(n)}for(const n of Object.keys(graph))visit(n);return out}',
    tests: [
      [
        'Orders dependencies first',
        "const out=resolve({api:['db','cache'],cache:['db']});equal(out,['db','cache','api']);",
      ],
      [
        'Detects cycles and deduplicates nodes',
        "let bad=false;try{resolve({a:['b'],b:['a']})}catch{bad=true}assert(bad,'Reject cycles');equal(resolve({a:['c'],b:['c']}),['c','a','b']);equal(resolve({}),[]);",
      ],
    ],
    hints: [
      'Track currently visiting nodes separately from completed nodes.',
      'Append each node only after visiting its dependencies.',
    ],
    example: ["{api:['db'],db:[]}", "['db','api']"],
    complexity: 'O(V+E) time and O(V) auxiliary space.',
  },
  {
    id: 'eng-idempotency',
    track: 'engineering',
    title: 'Deduplicate in-flight requests',
    topic: 'Idempotency & promises',
    explanation:
      'An in-flight deduplicator shares one promise among callers using the same key. Removing settled entries allows future fresh work and retries after failure. This is request coalescing, not durable payment idempotency: it only applies within one process and one in-flight interval.',
    problem:
      'Implement deduplicator() returning run(key,fn). Concurrent same-key calls share the identical promise. Delete the entry after either success or failure.',
    starter: 'function deduplicator(){\n return (key,fn)=>Promise.resolve().then(fn);\n}',
    solution:
      'function deduplicator(){const pending=new Map();return (key,fn)=>{if(pending.has(key))return pending.get(key);const p=Promise.resolve().then(fn).finally(()=>pending.delete(key));pending.set(key,p);return p}}',
    tests: [
      [
        'Coalesces concurrent calls',
        "const run=deduplicator();let calls=0;const fn=()=>{calls++;return 7};const a=run('k',fn),b=run('k',fn);assert(a===b,'Share the same promise');equal(await a,7);equal(calls,1);",
      ],
      [
        'Releases keys after errors',
        "const run=deduplicator();try{await run('k',()=>{throw Error('fail')})}catch{}equal(await run('k',()=>9),9);",
      ],
    ],
    hints: [
      'Store the promise before invoking work in a microtask.',
      'Delete the entry in finally so failures can be retried.',
    ],
    example: ['two overlapping reads for key A', 'one underlying operation'],
  },
]);
