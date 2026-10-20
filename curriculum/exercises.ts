import { exerciseSchema, type Exercise } from './schema';

type Spec = {
  id: string;
  title: string;
  language?: Exercise['language'];
  track?: string;
  topic: string;
  difficulty?: Exercise['difficulty'];
  mode?: Exercise['mode'];
  prerequisites?: string[];
  explanation: string;
  problem: string;
  starter: string;
  solution: string;
  tests: [string, string][];
  hints: string[];
  example: [string, string];
  complexity?: string;
  visualization?: Exercise['visualization'];
  framework?: 'fastapi';
  files?: Record<string, string>;
};
function make(s: Spec): Exercise {
  const language = s.language ?? 'javascript';
  const ext: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    react: 'tsx',
    go: 'go',
    rust: 'rs',
    swift: 'swift',
  };
  return exerciseSchema.parse({
    ...s,
    language,
    track: s.track ?? (['javascript', 'typescript'].includes(language) ? 'javascript' : language),
    difficulty: s.difficulty ?? 'Intermediate',
    mode: s.mode ?? 'Implement',
    prerequisites: s.prerequisites ?? [],
    objectives: [s.problem, `Handle ${s.topic.toLowerCase()} boundary cases.`],
    filename: language === 'react' ? 'Component.tsx' : `solution.${ext[language]}`,
    examples: [{ input: s.example[0], output: s.example[1] }],
    constraints: [
      'Preserve the given public function signature and return contract.',
      'Handle empty input and repeated calls where applicable.',
      'Only standard-library code is needed unless imports are provided.',
    ],
    mistakes: [s.hints[0], 'Check boundary cases rather than relying only on the visible example.'],
    complexity:
      s.complexity ?? 'Aim for linear work in input size. Explain any additional storage you use.',
    tests: s.tests.map(([name, code], i) => ({ name, code, hidden: i > 0 })),
    minutes: s.difficulty === 'Advanced' ? 30 : s.mode === 'Build' ? 25 : 15,
  });
}
const specs: Spec[] = [
  {
    id: 'js-debounce',
    title: 'Debounce a search input',
    topic: 'Closures & timers',
    explanation:
      'A search box can produce a request on every keystroke. Debouncing waits for a quiet interval and only invokes the most recent call. The returned function closes over a timer handle. Clearing the previous handle prevents stale work; forwarding both arguments and this keeps the wrapper usable as an object method.',
    problem:
      'Implement debounce(fn, wait). Invoke fn after the latest call has been quiet for wait milliseconds, preserving arguments and this.',
    starter:
      'function debounce(fn, wait) {\n  // Keep track of the pending invocation.\n  return function (...args) {\n    fn.apply(this, args);\n  };\n}',
    solution:
      'function debounce(fn,wait){let timer;return function(...args){clearTimeout(timer);timer=setTimeout(()=>fn.apply(this,args),wait)}}',
    tests: [
      [
        'Coalesces a burst',
        "let calls=[];let f=debounce(x=>calls.push(x),100);f('a');clock.tick(50);f('ab');clock.tick(99);equal(calls,[]);clock.tick(1);equal(calls,['ab']);",
      ],
      [
        'Preserves receiver and supports reuse',
        'const obj={v:7,f:debounce(function(x){this.v+=x},10)};obj.f(3);clock.tick(10);equal(obj.v,10);obj.f(2);clock.tick(10);equal(obj.v,12);',
      ],
      [
        'Zero delay remains deferred',
        'let n=0;debounce(()=>n++,0)();equal(n,0);clock.tick(0);equal(n,1);',
      ],
    ],
    hints: [
      'Store the timer in the outer closure, not inside each invocation.',
      'An arrow inside setTimeout retains the wrapper receiver.',
    ],
    example: [
      "search('f'); search('fo'); search('forge')",
      "one invocation with 'forge' after 300ms",
    ],
    complexity: 'O(1) work and space per call.',
  },
  {
    id: 'js-throttle',
    title: 'Throttle an event stream',
    topic: 'Closures & timers',
    prerequisites: ['js-debounce'],
    explanation:
      'A leading-edge throttle permits one action per interval measured from the last accepted call. Unlike debounce, repeated events do not postpone the next eligible instant. A first call at time zero must still run. This is useful for scroll updates and telemetry.',
    problem:
      'Implement leading-edge throttle(fn,wait), preserving this and arguments. Suppressed calls must not schedule trailing work.',
    starter: 'function throttle(fn,wait){\n  return function(...args){fn.apply(this,args)};\n}',
    solution:
      'function throttle(fn,wait){let last=-Infinity;return function(...args){const now=Date.now();if(now-last>=wait){last=now;return fn.apply(this,args)}}}',
    tests: [
      [
        'Limits a burst',
        'let a=[],f=throttle(x=>a.push(x),100);f(1);f(2);clock.tick(99);f(3);equal(a,[1]);clock.tick(1);f(4);equal(a,[1,4]);',
      ],
      [
        'Preserves receiver',
        'let o={n:0,f:throttle(function(v){this.n+=v},10)};o.f(5);equal(o.n,5);',
      ],
    ],
    hints: [
      'Initialise the last accepted time so the first call is eligible.',
      'Only accepted calls update the timestamp.',
    ],
    example: ['events at 0, 20, 100ms; wait=100', 'accept 0 and 100ms'],
  },
  {
    id: 'js-memoize',
    title: 'Memoise an expensive lookup',
    topic: 'Maps & identity',
    explanation:
      'Memoisation trades memory for repeated computation. A Map distinguishes a missing entry from a cached undefined value and preserves object identity for keys. This cache uses one argument; production caches also need eviction and invalidation policies.',
    problem:
      'Implement memoize(fn) for one argument. Cache undefined results and distinguish object identities.',
    starter: 'function memoize(fn){\n  return key=>fn(key);\n}',
    solution:
      'function memoize(fn){const cache=new Map();return function(key){if(!cache.has(key))cache.set(key,fn.call(this,key));return cache.get(key)}}',
    tests: [
      [
        'Caches repeated work',
        'let n=0,f=memoize(x=>{n++;return x*2});equal(f(4),8);equal(f(4),8);equal(n,1);',
      ],
      [
        'Caches undefined and object identities',
        'let n=0,f=memoize(()=>{n++;return undefined}),a={},b={};f(a);f(a);f(b);equal(n,2);',
      ],
    ],
    hints: [
      'Check Map.has instead of the truthiness of Map.get.',
      'Keep object keys by identity rather than serialising them.',
    ],
    example: ['double(4), called twice', '8, computed once'],
  },
  {
    id: 'js-once',
    title: 'Initialise exactly once',
    topic: 'Closures',
    explanation:
      'One-time initialisers appear in telemetry and lazy resources. Track successful invocation separately from its result, because zero and undefined are legitimate results. If initialisation throws, the caller should be allowed to retry.',
    problem:
      'Implement once(fn), caching the first successful result, preserving this and arguments, and retrying after a thrown error.',
    starter: 'function once(fn){\n  return function(...args){return fn.apply(this,args)};\n}',
    solution:
      'function once(fn){let done=false,value;return function(...args){if(!done){value=fn.apply(this,args);done=true}return value}}',
    tests: [
      [
        'Caches falsy results',
        'let n=0,f=once(()=>{n++;return 0});equal(f(),0);equal(f(),0);equal(n,1);',
      ],
      [
        'Retries failed initialisation',
        "let n=0,f=once(()=>{if(++n===1)throw Error('retry');return 3});try{f()}catch{}equal(f(),3);equal(f(),3);equal(n,2);",
      ],
    ],
    hints: [
      'Use a separate completion boolean.',
      'Set completion only after fn successfully returns.',
    ],
    example: ['initialise called three times', 'one successful initialisation'],
  },
  {
    id: 'js-clone',
    title: 'Clone a cyclic object graph',
    topic: 'References & graphs',
    difficulty: 'Advanced',
    explanation:
      'JSON serialisation drops undefined and cannot represent cycles. A graph clone needs a visited map from source objects to cloned containers. Register each container before descending so back edges find an existing clone. This contract covers arrays and plain objects, not arbitrary class instances.',
    problem:
      'Implement deepClone(value) for primitives, arrays and plain objects, preserving cycles and shared references.',
    starter: 'function deepClone(value){\n  return value;\n}',
    solution:
      'function deepClone(v,seen=new Map()){if(v===null||typeof v!=="object")return v;if(seen.has(v))return seen.get(v);const out=Array.isArray(v)?[]:{};seen.set(v,out);for(const key of Object.keys(v))Object.defineProperty(out,key,{value:deepClone(v[key],seen),enumerable:true,writable:true,configurable:true});return out}',
    tests: [
      [
        'Copies nested containers',
        "let x={a:[1,{b:2}],u:undefined},y=deepClone(x);equal(y,x);assert(y!==x&&y.a!==x.a&&y.a[1]!==x.a[1],'Containers must be independent');",
      ],
      [
        'Preserves graph edges',
        "let a={};a.self=a;let b=deepClone({a,b:a});assert(b.a===b.b&&b.a.self===b.a,'Preserve cycles and shared references');",
      ],
    ],
    hints: [
      'Register the clone in a Map before visiting children.',
      'Return primitive values directly.',
    ],
    example: ['x.self = x; deepClone(x)', 'new object with clone.self === clone'],
    complexity: 'O(V + E) time and O(V) space for the reachable graph.',
  },
  {
    id: 'js-emitter',
    title: 'Build an event emitter',
    topic: 'Event-driven architecture',
    explanation:
      'An event emitter decouples publishers from subscribers. Listeners must be removable; changes during dispatch should not skip other listeners. A snapshot of the listener Set gives explicit semantics while unsubscribe closures support resource cleanup.',
    problem:
      'Implement Emitter.on(event,listener), returning unsubscribe, and emit(event,...args). Duplicate registrations use Set semantics.',
    starter: 'class Emitter{\n  on(event,listener){return ()=>{}}\n  emit(event,...args){}\n}',
    solution:
      'class Emitter{listeners=new Map();on(e,fn){if(!this.listeners.has(e))this.listeners.set(e,new Set());this.listeners.get(e).add(fn);return ()=>this.listeners.get(e)?.delete(fn)}emit(e,...args){for(const fn of [...(this.listeners.get(e)||[])])fn(...args)}}',
    tests: [
      [
        'Subscribes and removes listeners',
        "let e=new Emitter(),a=[];let off=e.on('data',x=>a.push(x));e.emit('data',2);off();e.emit('data',3);equal(a,[2]);e.emit('missing');",
      ],
      [
        'Dispatches a stable snapshot',
        "let e=new Emitter(),a=[],off;e.on('x',()=>{a.push(1);off()});off=e.on('x',()=>a.push(2));e.emit('x');equal(a,[1,2]);",
      ],
    ],
    hints: ['Store a Set of listeners for each event name.', 'Copy the listeners before dispatch.'],
    example: ["on('job',handler); emit('job',42)", 'handler receives 42'],
  },
  {
    id: 'js-promise-all',
    title: 'Collect concurrent results',
    topic: 'Promises',
    explanation:
      'Concurrent operations settle in arbitrary order, but result positions should follow input order. Promise.resolve assimilates values and thenables. Aggregate rejection does not cancel underlying work. The empty input must settle immediately.',
    problem:
      'Implement all(values), matching Promise.all for an array. Do not call Promise.all inside the implementation.',
    starter: 'function all(values){\n  return Promise.resolve([]);\n}',
    solution:
      'function all(values){return new Promise((resolve,reject)=>{const out=new Array(values.length);let left=values.length;if(!left)resolve(out);values.forEach((v,i)=>Promise.resolve(v).then(x=>{out[i]=x;if(--left===0)resolve(out)},reject))})}',
    tests: [
      [
        'Preserves input order',
        'equal(await all([Promise.resolve(3),2,Promise.resolve(1)]),[3,2,1]);equal(await all([]),[]);',
      ],
      [
        'Propagates rejection',
        "let rejected=false;try{await all([Promise.reject(Error('boom'))])}catch(e){rejected=e.message==='boom'}assert(rejected,'Propagate the rejection');",
      ],
    ],
    hints: [
      'Write results into the original index.',
      'Resolve the empty array without waiting for a callback.',
    ],
    example: ['all([Promise.resolve(1),2])', '[1,2]'],
  },
  {
    id: 'js-pool',
    title: 'Build a bounded worker pool',
    topic: 'Concurrency',
    difficulty: 'Advanced',
    mode: 'Build',
    prerequisites: ['js-promise-all'],
    explanation:
      'A worker pool bounds in-flight work without serialising the batch. Each worker claims an index synchronously before awaiting a task. Results indexed by original position separate scheduling from output order. This protects database pools and upstream services.',
    problem:
      'Implement async pool(tasks,limit) for async factory functions. Preserve order, reject invalid limits, and never exceed the active task limit.',
    starter: 'async function pool(tasks,limit){\n  return Promise.all(tasks.map(task=>task()));\n}',
    solution:
      'async function pool(tasks,limit){if(!Number.isInteger(limit)||limit<1)throw Error("Invalid limit");const results=[];let next=0;async function worker(){while(next<tasks.length){const i=next++;results[i]=await tasks[i]()}}await Promise.all(Array.from({length:Math.min(limit,tasks.length)},worker));return results}',
    tests: [
      [
        'Bounds active tasks',
        "let active=0,max=0;const tasks=[0,1,2,3,4].map(i=>async()=>{active++;max=Math.max(max,active);await Promise.resolve();active--;return i*2});equal(await pool(tasks,2),[0,2,4,6,8]);assert(max<=2,'Exceeded concurrency limit');",
      ],
      [
        'Rejects invalid bounds',
        "let bad=false;try{await pool([],0)}catch{bad=true}assert(bad,'Reject zero concurrency');equal(await pool([],2),[]);",
      ],
    ],
    hints: [
      'Claim the next index before awaiting.',
      'Start at most limit workers, not one worker for every task.',
    ],
    example: ['pool([taskA,taskB,taskC],2)', 'at most two active tasks; ordered results'],
    files: {
      'README.md':
        'Acceptance: bound concurrency, preserve input order, reject invalid limits. Only solution.js is editable.',
      'contracts.d.ts': 'type Task<T> = () => Promise<T>;',
    },
    visualization: 'queue',
  },
  {
    id: 'js-retry',
    title: 'Retry with exponential backoff',
    topic: 'Resilience',
    prerequisites: ['js-promise-all'],
    explanation:
      'Retries can recover transient failures but amplify an outage if uncontrolled. An injected sleep function makes the backoff policy deterministic. Three attempts means at most two waits, with no wait after the final failure.',
    problem:
      'Implement retry(fn,attempts,base,sleep). Wait base * 2^retryIndex after failures and rethrow the final error.',
    starter: 'async function retry(fn,attempts,base,sleep){\n  return fn();\n}',
    solution:
      'async function retry(fn,attempts,base,sleep){if(attempts<1)throw Error("Invalid attempts");for(let i=0;i<attempts;i++){try{return await fn()}catch(e){if(i===attempts-1)throw e;await sleep(base*2**i)}}}',
    tests: [
      [
        'Uses exponential delays',
        "let n=0,delays=[];equal(await retry(()=>{if(++n<3)throw Error('busy');return 9},3,10,async d=>delays.push(d)),9);equal(delays,[10,20]);",
      ],
      [
        'Preserves the final error',
        "let delays=[],err=Error('down'),caught;try{await retry(()=>{throw err},2,5,async d=>delays.push(d))}catch(e){caught=e}assert(caught===err,'Preserve final error');equal(delays,[5]);",
      ],
    ],
    hints: [
      'Only wait if another attempt remains.',
      'Inject sleep instead of using real delays in tests.',
    ],
    example: ['two failures; base=100', 'wait 100, wait 200, return result'],
  },
  {
    id: 'js-timeout',
    title: 'Bound a pending operation',
    topic: 'Promises & cleanup',
    explanation:
      'A deadline wrapper races completion with a timeout. Clearing the timer in finally prevents dangling work after fulfilment or rejection. This only stops waiting: cancelling the underlying operation needs a separate AbortSignal-aware API.',
    problem:
      'Implement withTimeout(promise,ms), rejecting with Error("Timed out") on expiry and clearing its timer on settlement.',
    starter: 'function withTimeout(promise,ms){\n  return promise;\n}',
    solution:
      'function withTimeout(promise,ms){let id;const timeout=new Promise((_,reject)=>{id=setTimeout(()=>reject(Error("Timed out")),ms)});return Promise.race([promise,timeout]).finally(()=>clearTimeout(id))}',
    tests: [
      [
        'Rejects at deadline',
        "let p=withTimeout(new Promise(()=>{}),50);clock.tick(50);let message;try{await p}catch(e){message=e.message}equal(message,'Timed out');",
      ],
      [
        'Cleans up after success',
        'equal(await withTimeout(Promise.resolve(4),100),4);equal(clock.pending(),0);',
      ],
    ],
    hints: [
      'Race the input against a rejecting timer.',
      'Use finally for cleanup on either outcome.',
    ],
    example: ['withTimeout(neverSettles,1000)', 'rejects after 1000ms'],
  },
  {
    id: 'js-lru',
    title: 'Implement an LRU cache',
    topic: 'Maps & caching',
    difficulty: 'Advanced',
    explanation:
      'Least-recently-used eviction exploits temporal locality. JavaScript Map preserves insertion order. A read or update refreshes an entry by deleting and reinserting it; evict the first key when capacity is exceeded. A stored zero must still count as a hit.',
    problem:
      'Implement LRU(capacity) with get(key), returning -1 on a miss, and put(key,value). Reads and updates refresh recency; capacity zero stores nothing.',
    starter:
      'class LRU{\n  constructor(capacity){this.capacity=capacity}\n  get(key){return -1}\n  put(key,value){}\n}',
    solution:
      'class LRU{constructor(capacity){this.capacity=capacity;this.m=new Map()}get(k){if(!this.m.has(k))return -1;const v=this.m.get(k);this.m.delete(k);this.m.set(k,v);return v}put(k,v){this.m.delete(k);this.m.set(k,v);if(this.m.size>this.capacity)this.m.delete(this.m.keys().next().value)}}',
    tests: [
      [
        'Evicts least recently used',
        "let c=new LRU(2);c.put('a',1);c.put('b',2);equal(c.get('a'),1);c.put('c',3);equal(c.get('b'),-1);equal(c.get('c'),3);",
      ],
      [
        'Supports updates and zero capacity',
        "let c=new LRU(1);c.put('a',0);equal(c.get('a'),0);c.put('a',2);equal(c.get('a'),2);let z=new LRU(0);z.put('a',1);equal(z.get('a'),-1);",
      ],
    ],
    hints: ['Refresh order with delete then set.', 'Check Map.has before reading a cached value.'],
    example: ['put A, put B, get A, put C; capacity 2', 'B is evicted'],
    complexity: 'Expected O(1) get/put; O(capacity) storage.',
  },
  {
    id: 'ts-result',
    title: 'Model a typed result',
    language: 'typescript',
    topic: 'Discriminated unions',
    explanation:
      'A discriminated union encodes success and failure as distinct shapes. Checking a literal tag narrows accessible properties and makes invalid combinations unrepresentable. The runtime still needs to throw on an explicit failure.',
    problem:
      'Define Result<T> as {ok:true;value:T}|{ok:false;error:string}. Implement unwrap<T>, returning value or throwing the error.',
    starter:
      'type Result<T>={ok:boolean;value?:T;error?:string};\nfunction unwrap<T>(result:Result<T>):T{\n  return result.value;\n}',
    solution:
      'type Result<T>={ok:true;value:T}|{ok:false;error:string};\nfunction unwrap<T>(result:Result<T>):T{if(result.ok)return result.value;throw new Error(result.error)}',
    tests: [
      [
        'Narrows a generic result',
        'const r:Result<number>={ok:true,value:4};const n:number=unwrap(r);equal(n,4);',
      ],
      [
        'Rejects invalid states',
        "// @ts-expect-error missing success value\nconst invalid:Result<number>={ok:true};void invalid;let failed=false;try{unwrap({ok:false,error:'missing'})}catch(e){failed=(e as Error).message==='missing'}assert(failed,'Throw the error');",
      ],
    ],
    hints: [
      'Use two object members with literal boolean tags.',
      'Narrow on ok before accessing value.',
    ],
    example: ['unwrap({ok:true,value:42})', '42; inferred as number'],
  },
  {
    id: 'ts-pick',
    title: 'Constrain a generic property picker',
    language: 'typescript',
    topic: 'Generics & keyof',
    prerequisites: ['ts-result'],
    explanation:
      'A key constrained by keyof T links the requested property to its actual result type. Returning unknown loses information; any hides errors. Indexed access T[K] preserves the relationship across the function boundary.',
    problem:
      'Implement pick<T,K extends keyof T>(object,key):T[K]. Invalid keys must fail compilation and return types must stay precise.',
    starter: 'function pick(object:any,key:string):any{\n  return object[key];\n}',
    solution: 'function pick<T,K extends keyof T>(object:T,key:K):T[K]{return object[key]}',
    tests: [
      [
        'Infers exact property types',
        "const n:number=pick({n:3,label:'x'},'n');equal(n,3);\n// @ts-expect-error number is not string\nconst s:string=pick({n:3},'n');void s;",
      ],
      [
        'Rejects nonexistent keys',
        "// @ts-expect-error invalid key\npick({name:'Ada'},'age');equal(pick({name:'Ada'},'name'),'Ada');",
      ],
    ],
    hints: [
      'Constrain K with K extends keyof T.',
      'Return T[K] instead of a union of all property types.',
    ],
    example: ["pick({name:'Ada',age:32},'age')", '32, type number'],
  },
  {
    id: 'ts-exhaustive',
    title: 'Handle every job state',
    language: 'typescript',
    topic: 'Exhaustive checking',
    mode: 'Debug',
    prerequisites: ['ts-result'],
    explanation:
      'A switch can silently miss a new union variant. Assigning the remaining value to never makes omissions compiler errors. Runtime labels must also preserve failure details rather than accidentally reporting every terminal job as successful.',
    problem:
      'Implement label(job) for queued, running, done and failed: Waiting, Running N%, Complete, and Error: MESSAGE. Include an exhaustive never branch.',
    starter:
      "type Job={state:'queued'}|{state:'running';progress:number}|{state:'done'}|{state:'failed';message:string};\nfunction label(job:Job):string{\n if(job.state==='queued')return 'Waiting';\n return 'Complete';\n}",
    solution:
      "type Job={state:'queued'}|{state:'running';progress:number}|{state:'done'}|{state:'failed';message:string};\nfunction label(job:Job):string{switch(job.state){case 'queued':return 'Waiting';case 'running':return `Running ${job.progress}%`;case 'done':return 'Complete';case 'failed':return `Error: ${job.message}`;default:{const unreachable:never=job;return unreachable}}}",
    tests: [
      [
        'Handles active and terminal states',
        "equal(label({state:'running',progress:42}),'Running 42%');equal(label({state:'done'}),'Complete');",
      ],
      [
        'Preserves failure information',
        "equal(label({state:'failed',message:'disk full'}),'Error: disk full');equal(label({state:'queued'}),'Waiting');",
      ],
    ],
    hints: ['Switch on the state discriminant.', 'Assign the default branch value to never.'],
    example: ["label({state:'running',progress:42})", 'Running 42%'],
  },
  {
    id: 'ts-guard',
    title: 'Validate an unknown API payload',
    language: 'typescript',
    topic: 'Runtime validation',
    explanation:
      'Type annotations disappear at runtime. External JSON needs checks before becoming trusted data. A type predicate communicates a runtime check to the compiler, but its implementation must verify each required field rather than asserting that arbitrary objects are valid.',
    problem:
      'Define User={id:number;name:string}. Implement isUser(value:unknown):value is User, rejecting null, arrays and non-finite IDs.',
    starter:
      'type User={id:number;name:string};\nfunction isUser(value:unknown):value is User{\n return typeof value === "object";\n}',
    solution:
      'type User={id:number;name:string};function isUser(value:unknown):value is User{if(typeof value!=="object"||value===null||Array.isArray(value))return false;const v=value as Record<string,unknown>;return typeof v.id==="number"&&Number.isFinite(v.id)&&typeof v.name==="string"}',
    tests: [
      [
        'Accepts and narrows valid data',
        "const data:unknown={id:1,name:'Ada'};assert(isUser(data),'Valid user');if(isUser(data)){const n:string=data.name;equal(n,'Ada')}",
      ],
      [
        'Rejects malformed payloads',
        "for(const v of [null,[],{}, {id:NaN,name:'A'}, {id:'1',name:'A'}, {id:1,name:2}])equal(isUser(v),false);",
      ],
    ],
    hints: [
      'Exclude null and arrays before inspecting properties.',
      'Verify every field promised by the type predicate.',
    ],
    example: ["isUser({id:1,name:'Ada'})", 'true'],
  },
  {
    id: 'ts-mapped',
    title: 'Derive a safe patch type',
    language: 'typescript',
    topic: 'Mapped types',
    difficulty: 'Advanced',
    prerequisites: ['ts-pick'],
    explanation:
      'Mapped types transform keys without duplicating a model. A patch makes editable fields optional while excluding the immutable identifier. Remapping a key to never removes it from the resulting type, allowing the compiler to reject forbidden updates.',
    problem:
      'Define Patch<T extends {id:unknown}> excluding id and making other fields optional. Implement merge<T>(original,patch):T, preserving id.',
    starter:
      'type Patch<T extends {id:unknown}>=Partial<T>;\nfunction merge<T extends {id:unknown}>(original:T,patch:Patch<T>):T{return {...original,...patch}}',
    solution:
      'type Patch<T extends {id:unknown}>={[K in keyof T as K extends "id"?never:K]?:T[K]};\nfunction merge<T extends {id:unknown}>(original:T,patch:Patch<T>):T{return {...original,...patch,id:original.id}}',
    tests: [
      [
        'Preserves model properties',
        "const u=merge({id:1,name:'Ada',active:true},{name:'Grace'});equal(u,{id:1,name:'Grace',active:true});const n:number=u.id;void n;",
      ],
      [
        'Rejects immutable or wrongly typed fields',
        '// @ts-expect-error id is immutable\nconst p:Patch<{id:number;name:string}>={id:2};\n// @ts-expect-error wrong type\nconst q:Patch<{id:number;name:string}>={name:2};void p;void q;',
      ],
    ],
    hints: [
      'Remap id to never in the mapped key clause.',
      'Use the optional modifier on every remaining field.',
    ],
    example: ["merge({id:1,name:'Ada'},{name:'Grace'})", "{id:1,name:'Grace'}"],
  },
];
export const exercises: Exercise[] = specs.map(make);
export function register(items: Spec[]) {
  exercises.push(...items.map(make));
}
