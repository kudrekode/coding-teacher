import { register } from './exercises';
import { exerciseConcepts } from './concepts';
type Spec = Parameters<typeof register>[0][number];
const specs: (Spec & { concepts: string[] })[] = [
  {
    id: 'js-debug-debounce-lifetime',
    title: 'Debug a timer that never cancels',
    topic: 'Closures & timers',
    mode: 'Debug',
    concepts: ['js-debounce', 'js-closures'],
    explanation:
      'A timer declared inside the wrapper is recreated on every event. clearTimeout receives undefined instead of the previous handle, so every scheduled callback survives. Retain one handle in the factory closure.',
    problem:
      'Fix debounce(fn, wait) so a burst invokes only the latest call after its quiet interval. Preserve arguments and the receiver.',
    starter:
      'function debounce(fn,wait){return function(...args){let timer;clearTimeout(timer);timer=setTimeout(()=>fn.apply(this,args),wait)}}',
    solution:
      'function debounce(fn,wait){let timer;return function(...args){clearTimeout(timer);timer=setTimeout(()=>fn.apply(this,args),wait)}}',
    tests: [
      [
        'Cancels previous invocations',
        'let a=[];let f=debounce(x=>a.push(x),20);f(1);clock.tick(10);f(2);clock.tick(10);equal(a,[]);clock.tick(10);equal(a,[2]);',
      ],
      [
        'Separate wrappers have separate timers',
        'let a=0,b=0;let f=debounce(()=>a++,10),g=debounce(()=>b++,10);f();g();f();clock.tick(10);equal([a,b],[1,1]);',
      ],
    ],
    hints: ['Move the handle into the factory scope.', 'Keep each factory call independent.'],
    example: ['f(1); f(2); wait', 'one callback with 2'],
  },
  {
    id: 'js-debug-debounce-values',
    title: 'Debug lost debounce arguments',
    topic: 'Closures & timers',
    mode: 'Debug',
    concepts: ['js-debounce', 'js-this'],
    explanation:
      'Cancelling correctly is only half of a wrapper contract. The eventual callback must receive the latest arguments and the receiver from the latest call. A normal wrapper and an arrow timeout callback can retain both.',
    problem:
      'Fix debounce(fn, wait), preserving every argument and this from the latest invocation.',
    starter:
      'function debounce(fn,wait){let timer;return function(...args){clearTimeout(timer);timer=setTimeout(()=>fn(),wait)}}',
    solution:
      'function debounce(fn,wait){let timer;return function(...args){clearTimeout(timer);timer=setTimeout(()=>fn.apply(this,args),wait)}}',
    tests: [
      [
        'Forwards latest arguments',
        'let a=[];let f=debounce((...x)=>a.push(x),10);f(1,2);f(3,4);clock.tick(10);equal(a,[[3,4]]);',
      ],
      [
        'Uses latest receiver',
        'let a={n:2},b={n:9},out=[];let f=debounce(function(x){out.push(this.n+x)},10);f.call(a,1);f.call(b,3);clock.tick(10);equal(out,[12]);',
      ],
    ],
    hints: [
      'Forward the rest arguments with apply.',
      'Use a normal wrapper to obtain the call-site receiver.',
    ],
    example: ['f.call({n:9}, 3)', 'callback receives this.n === 9 and x === 3'],
  },
  {
    id: 'js-debounce-cancel',
    title: 'Give debounce a cancellation contract',
    topic: 'Closures & timers',
    concepts: ['js-debounce', 'js-cancellation'],
    explanation:
      'An unmounted component must release a pending callback. Expose cancel on the returned function, clear the handle, and reset internal state so cancellation is idempotent and future calls still work.',
    problem:
      'Implement debounce(fn,wait) returning a callable with cancel(). Cancel discards pending work and remains safe before or after execution. Preserve arguments and this.',
    starter:
      'function debounce(fn,wait){function run(...args){setTimeout(()=>fn.apply(this,args),wait)}run.cancel=()=>{};return run}',
    solution:
      'function debounce(fn,wait){let timer;function run(...args){clearTimeout(timer);timer=setTimeout(()=>{timer=undefined;fn.apply(this,args)},wait)}run.cancel=()=>{clearTimeout(timer);timer=undefined};return run}',
    tests: [
      [
        'Cancels without invoking',
        'let n=0,f=debounce(()=>n++,20);f();f.cancel();f.cancel();clock.tick(50);equal(n,0);equal(clock.pending(),0);',
      ],
      [
        'Can be reused after cancellation',
        'let o={n:0,f:debounce(function(x){this.n+=x},10)};o.f(2);o.f.cancel();o.f(4);clock.tick(10);equal(o.n,4);',
      ],
    ],
    hints: [
      'The cancel method must access the same timer binding.',
      'Cancellation must not permanently disable the wrapper.',
    ],
    example: ['save(); save.cancel()', 'no save callback'],
  },
  {
    id: 'js-debounce-flush',
    title: 'Flush pending debounce work',
    topic: 'Closures & timers',
    difficulty: 'Advanced',
    concepts: ['js-debounce'],
    explanation:
      'A save-on-blur interaction may need to execute pending work immediately. Flush must cancel the scheduled timer before invoking, consume the saved arguments once and return the callback result. No pending call means undefined.',
    problem:
      'Implement debounce(fn,wait) with flush(). Flush invokes pending work immediately once, returns its result, and otherwise returns undefined. Preserve the latest arguments and receiver.',
    starter:
      'function debounce(fn,wait){function f(...args){setTimeout(()=>fn.apply(this,args),wait)}f.flush=()=>undefined;return f}',
    solution:
      'function debounce(fn,wait){let timer,args,receiver;function invoke(){if(!args)return;const a=args,r=receiver;args=receiver=undefined;timer=undefined;return fn.apply(r,a)}function f(...a){clearTimeout(timer);args=a;receiver=this;timer=setTimeout(invoke,wait)}f.flush=()=>{clearTimeout(timer);return invoke()};return f}',
    tests: [
      [
        'Flushes latest exactly once',
        'let a=[],f=debounce(x=>{a.push(x);return x*2},20);f(2);f(3);equal(f.flush(),6);equal(f.flush(),undefined);clock.tick(40);equal(a,[3]);',
      ],
      [
        'Preserves receiver and handles natural expiry',
        'let o={n:5,f:debounce(function(x){return this.n+x},10)};o.f(2);equal(o.f.flush(),7);o.f(1);clock.tick(10);equal(o.f.flush(),undefined);',
      ],
    ],
    hints: [
      'Retain pending arguments separately from the timer.',
      'Clear pending state before calling user code to allow re-entrant calls.',
    ],
    example: ['f(3); f.flush()', 'callback executes immediately and returns its result'],
  },
  {
    id: 'js-debounce-options',
    title: 'Define leading and trailing debounce',
    topic: 'Closures & timers',
    difficulty: 'Advanced',
    concepts: ['js-debounce', 'js-throttle'],
    explanation:
      'Leading debounce invokes at burst start; trailing debounce invokes after silence. With both enabled, one isolated call runs only once. Additional calls within the interval create one trailing invocation using the latest arguments.',
    problem:
      'Implement debounce(fn,wait,{leading=false,trailing=true}={}). Reset the quiet timer on every call. With both options true, run trailing only if another call followed the leading call. Preserve arguments and this.',
    starter:
      'function debounce(fn,wait,{leading=false,trailing=true}={}){return function(...args){fn.apply(this,args)}}',
    solution:
      'function debounce(fn,wait,{leading=false,trailing=true}={}){let timer,latest,receiver,repeat=false;return function(...args){const first=timer===undefined;latest=args;receiver=this;if(!first)repeat=true;clearTimeout(timer);timer=setTimeout(()=>{const run=trailing&&(!leading||repeat),a=latest,r=receiver;timer=undefined;repeat=false;latest=receiver=undefined;if(run)fn.apply(r,a)},wait);if(first&&leading)fn.apply(this,args)}}',
    tests: [
      [
        'Leading plus trailing avoids double single call',
        'let a=[],f=debounce(x=>a.push(x),20,{leading:true,trailing:true});f(1);equal(a,[1]);clock.tick(20);equal(a,[1]);f(2);clock.tick(5);f(3);clock.tick(20);equal(a,[1,2,3]);',
      ],
      [
        'Trailing default, leading-only and disabled modes',
        'let a=[],f=debounce(x=>a.push(x),10);f(1);f(2);clock.tick(10);equal(a,[2]);let g=debounce(x=>a.push(x),10,{leading:true,trailing:false});g(3);g(4);clock.tick(10);equal(a,[2,3]);let h=debounce(()=>a.push(9),10,{trailing:false});h();clock.tick(10);equal(a,[2,3]);',
      ],
    ],
    hints: [
      'Track whether the burst received another call after its leading edge.',
      'Reset internal burst state before invoking the trailing callback.',
    ],
    example: ['leading+trailing; f(1); f(2); pause', 'callbacks with 1, then 2'],
  },
  {
    id: 'js-backoff',
    title: 'Plan bounded exponential backoff',
    topic: 'Retry scheduling',
    concepts: ['js-retry', 'eng-jobs'],
    explanation:
      'A retry scheduler should calculate spacing independently from sleeping. Exponential growth needs a cap, and injected randomness makes full jitter deterministic in tests. Attempt zero uses the base delay.',
    problem:
      'Implement backoff(attempt,base,cap,random=Math.random). Return floor(random()*min(cap,base*2**attempt)). Inputs are nonnegative finite values and random returns a value in [0,1).',
    starter: 'function backoff(attempt,base,cap,random=Math.random){return base}',
    solution:
      'function backoff(attempt,base,cap,random=Math.random){return Math.floor(random()*Math.min(cap,base*2**attempt))}',
    tests: [
      [
        'Grows with attempts',
        'equal(backoff(0,100,1000,()=>0.5),50);equal(backoff(2,100,1000,()=>0.5),200);',
      ],
      [
        'Caps before jitter and handles zero',
        'equal(backoff(20,100,1000,()=>0.75),750);equal(backoff(4,0,100,()=>0.5),0);equal(backoff(2,100,0,()=>0.5),0);',
      ],
    ],
    hints: [
      'Compute the capped ceiling before applying jitter.',
      'Inject randomness rather than asserting on unpredictable values.',
    ],
    example: ['backoff(2,100,1000,()=>0.5)', '200'],
  },
  {
    id: 'js-ttl-cache',
    title: 'Expire cached values with an injected clock',
    topic: 'Cache invalidation',
    concepts: ['js-memoize', 'eng-caching'],
    explanation:
      'Recency eviction and expiry solve different problems. A TTL cache checks the timestamp on each read. At the expiry instant the entry is stale. has must distinguish cached undefined from absence.',
    problem:
      'Implement createTTL(ttl,now=Date.now) with set(key,value), get(key) and has(key). Values expire when now() >= insertion time + ttl; overwriting restarts the TTL.',
    starter:
      'function createTTL(ttl,now=Date.now){let m=new Map();return {set:(k,v)=>m.set(k,v),get:k=>m.get(k),has:k=>m.has(k)}}',
    solution:
      'function createTTL(ttl,now=Date.now){const m=new Map();function has(k){if(!m.has(k))return false;if(now()>=m.get(k).expires){m.delete(k);return false}return true}return {set(k,v){m.set(k,{value:v,expires:now()+ttl})},has,get(k){return has(k)?m.get(k).value:undefined}}}',
    tests: [
      [
        'Expires at the exact boundary',
        'let t=0,c=createTTL(10,()=>t);c.set("x",4);t=9;equal(c.get("x"),4);t=10;equal(c.has("x"),false);equal(c.get("x"),undefined);',
      ],
      [
        'Retains undefined and refreshes overwritten keys',
        'let t=0,c=createTTL(10,()=>t);c.set("x",undefined);equal(c.has("x"),true);t=8;c.set("x",0);t=11;equal(c.get("x"),0);t=18;equal(c.has("x"),false);',
      ],
    ],
    hints: [
      'Store value and expires separately.',
      'Use an injected clock and check the inclusive expiry boundary.',
    ],
    example: ['set("x",4); advance to expiry; has("x")', 'false'],
  },
  {
    id: 'ts-identity',
    title: 'Preserve a type through a generic function',
    language: 'typescript',
    topic: 'Generics',
    difficulty: 'Foundation',
    concepts: ['ts-generics'],
    explanation:
      'A generic identity function returns exactly the type its caller supplied. any accepts everything but discards this relationship. Positive and negative compiler fixtures establish that return types remain precise.',
    problem:
      'Implement identity<T>(value:T):T without using any. Preserve the caller’s literal and object types.',
    starter: 'function identity(value: any): any { return value; }',
    solution: 'function identity<T>(value:T):T{return value}',
    tests: [
      [
        'Retains literals',
        'const n: 3=identity(3 as const);equal(n,3);const s:string=identity("a");equal(s,"a");',
      ],
      [
        'Rejects incompatible result assignments',
        'const v=identity({name:"Ada"});const n:string=v.name;equal(n,"Ada");\n// @ts-expect-error identity must not erase the input type\nconst bad:number=identity("text");',
      ],
    ],
    hints: [
      'Use one generic parameter in both parameter and return positions.',
      'An unused @ts-expect-error indicates an invalid assignment was accepted.',
    ],
    example: ['identity({name:"Ada"})', '{name:string}'],
  },
  {
    id: 'ts-group-by',
    title: 'Group domain values with generic keys',
    language: 'typescript',
    topic: 'Generic constraints',
    concepts: ['ts-generics', 'ts-constraints'],
    explanation:
      'A grouping helper must retain its element type and restrict produced keys to PropertyKey. Map avoids string coercion and prototype-key hazards while preserving key identity.',
    problem:
      'Implement groupBy<T,K extends PropertyKey>(items:T[],key:(item:T)=>K):Map<K,T[]>, retaining input order within each group.',
    starter:
      'function groupBy<T,K extends PropertyKey>(items:T[],key:(item:T)=>K):Map<K,T[]>{return new Map()}',
    solution:
      'function groupBy<T,K extends PropertyKey>(items:T[],key:(item:T)=>K):Map<K,T[]>{const out=new Map<K,T[]>();for(const item of items){const k=key(item);const values=out.get(k)??[];values.push(item);out.set(k,values)}return out}',
    tests: [
      [
        'Retains typed values and grouping order',
        'const m=groupBy([{kind:"a",n:1},{kind:"a",n:2},{kind:"b",n:3}],x=>x.kind);equal(m.get("a")?.map(x=>x.n),[1,2]);',
      ],
      [
        'Handles empty input and rejects object keys',
        'equal(groupBy([] as number[],x=>x).size,0);\n// @ts-expect-error object is not PropertyKey\ngroupBy([1],x=>({x}));',
      ],
    ],
    hints: [
      'Keep the group element type T rather than unknown.',
      'Use Map<K,T[]> and append to the group associated with each key.',
    ],
    example: ['groupBy([1,2,3], n=>n%2)', 'Map: 1 → [1,3], 0 → [2]'],
  },
  {
    id: 'ts-api-state',
    title: 'Model an async API state machine',
    language: 'typescript',
    topic: 'Discriminated unions',
    concepts: ['ts-api', 'ts-discriminated'],
    explanation:
      'An async UI has mutually exclusive idle, loading, success and error states. Tagged alternatives attach data only to success and a message only to error, preventing contradictory combinations.',
    problem:
      'Define LoadState<T> with status idle/loading/success/error. Success has data:T; error has message:string. Implement label(state:LoadState<string>):string returning Ready, Loading, the success data, or the error message respectively.',
    starter:
      'type LoadState<T>={status:string;data?:T;message?:string};\nfunction label(state:LoadState<string>):string{return "Ready"}',
    solution:
      'type LoadState<T>={status:"idle"}|{status:"loading"}|{status:"success";data:T}|{status:"error";message:string};\nfunction label(state:LoadState<string>):string{switch(state.status){case "idle":return "Ready";case "loading":return "Loading";case "success":return state.data;case "error":return state.message}}',
    tests: [
      [
        'Renders each valid state',
        'equal(label({status:"idle"}),"Ready");equal(label({status:"loading"}),"Loading");equal(label({status:"success",data:"Ada"}),"Ada");equal(label({status:"error",message:"Offline"}),"Offline");',
      ],
      [
        'Rejects contradictory or incomplete states',
        '// @ts-expect-error success requires data\nconst bad:LoadState<number>={status:"success"};\n// @ts-expect-error loading must not carry success data\nconst invalid:LoadState<number>={status:"loading",data:3};\nconst s:LoadState<number>={status:"success",data:3};if(s.status==="success"){const n:number=s.data;equal(n,3)}',
      ],
    ],
    hints: [
      'Use a union of object types, not one object with optional fields.',
      'Narrow by the literal status before reading its payload.',
    ],
    example: ['{status:"success",data:"Ada"}', 'Ada'],
  },
  {
    id: 'py-bfs',
    title: 'Traverse a service dependency graph breadth-first',
    language: 'python',
    track: 'engineering',
    topic: 'Graph traversal',
    concepts: ['eng-graphs', 'eng-queues'],
    explanation:
      'Breadth-first traversal visits the nearest dependency layer first. A deque provides efficient removal from the front. Mark a node when enqueuing it, not when removing it, to prevent repeated queue entries in cyclic graphs.',
    problem:
      'Implement bfs(graph,start), returning reachable nodes in breadth-first order, preserving each adjacency list’s order. Missing keys have no outgoing edges. Include start and visit each node once.',
    starter: 'def bfs(graph, start):\n    return [start]',
    solution:
      'from collections import deque\ndef bfs(graph,start):\n    seen={start};queue=deque([start]);out=[]\n    while queue:\n        node=queue.popleft();out.append(node)\n        for child in graph.get(node,[]):\n            if child not in seen:\n                seen.add(child);queue.append(child)\n    return out',
    tests: [
      [
        'Visits in layers',
        'assert bfs({"a":["b","c"],"b":["d"],"c":["e"]},"a")==["a","b","c","d","e"]',
      ],
      [
        'Handles cycles, shared children and absent keys',
        'assert bfs({"a":["b","b"],"b":["a","c"]},"a")==["a","b","c"]\nassert bfs({},"missing")==["missing"]',
      ],
    ],
    hints: ['Use deque.popleft rather than list.pop(0).', 'Mark nodes when they enter the queue.'],
    example: ['a → b,c; b → d', '[a,b,c,d]'],
  },
  {
    id: 'py-priority',
    title: 'Schedule jobs by stable priority',
    language: 'python',
    track: 'engineering',
    topic: 'Priority queues',
    concepts: ['eng-heaps', 'eng-jobs'],
    explanation:
      'A heap selects the next smallest priority without sorting after every removal. Pair priority with the original index so equal priorities are stable and job objects never need to be compared.',
    problem:
      'Implement schedule(jobs), where jobs is a list of (priority,payload) pairs. Return payloads from lowest priority number to highest, preserving input order for ties. Do not mutate jobs.',
    starter: 'def schedule(jobs):\n    return [payload for priority,payload in jobs]',
    solution:
      'import heapq\ndef schedule(jobs):\n    heap=[(p,i,value) for i,(p,value) in enumerate(jobs)]\n    heapq.heapify(heap)\n    return [heapq.heappop(heap)[2] for _ in range(len(heap))]',
    tests: [
      [
        'Orders priorities with stable ties',
        'assert schedule([(3,"c"),(1,"a"),(1,"b")])==["a","b","c"]',
      ],
      [
        'Supports incomparable payloads and empty input',
        'a={"id":1};b={"id":2};jobs=[(0,a),(0,b)]\nassert schedule(jobs)==[a,b]\nassert jobs==[(0,a),(0,b)]\nassert schedule([])==[]',
      ],
    ],
    hints: [
      'Put the original index before the payload in each heap tuple.',
      'Build a new heap so the caller’s list is unchanged.',
    ],
    example: ['[(3,"c"),(1,"a"),(1,"b")]', '["a","b","c"]'],
  },
  {
    id: 'py-dataclass',
    title: 'Give each dataclass its own collection',
    language: 'python',
    topic: 'Dataclasses',
    mode: 'Debug',
    concepts: ['py-dataclasses', 'py-functions'],
    explanation:
      'A dataclass collection needs a per-instance factory. A ClassVar list is shared across instances, while field(default_factory=list) allocates independent instance data. Preserve the supplied name field and append events in order.',
    problem:
      'Fix Job(name) so each instance owns an independent events list and add(event) appends to that instance only.',
    starter:
      'from dataclasses import dataclass\nfrom typing import ClassVar\n@dataclass\nclass Job:\n    name: str\n    events: ClassVar[list] = []\n    def add(self,event):\n        self.events.append(event)',
    solution:
      'from dataclasses import dataclass,field\n@dataclass\nclass Job:\n    name: str\n    events: list = field(default_factory=list)\n    def add(self,event):\n        self.events.append(event)',
    tests: [
      [
        'Retains ordered instance events',
        'j=Job("import");j.add("start");j.add("done");assert j.name=="import" and j.events==["start","done"]',
      ],
      [
        'Does not leak events across instances',
        'a=Job("a");b=Job("b");a.add("private");assert b.events==[] and a.events==["private"]',
      ],
    ],
    hints: ['Declare events as an instance field.', 'Use dataclasses.field(default_factory=list).'],
    example: ['a.add("start"); b.events', '[]'],
  },
  {
    id: 'go-interface',
    title: 'Consume an implicit interface',
    language: 'go',
    topic: 'Interfaces',
    concepts: ['go-interfaces'],
    explanation:
      'Go interfaces are satisfied implicitly by method sets. The consumer can depend on Size() int without requiring each concrete packet type to declare an inheritance relationship. Keep the interface as small as the consuming algorithm needs.',
    problem:
      'Define Sizer with Size() int, Packet with Bytes int and a value receiver Size(). Implement TotalSize([]Sizer) int summing every size.',
    starter:
      'package main\ntype Sizer interface{Size() int}\ntype Packet struct{Bytes int}\nfunc(p Packet)Size()int{return p.Bytes}\nfunc TotalSize(items []Sizer)int{return 0}',
    solution:
      'package main\ntype Sizer interface{Size() int}\ntype Packet struct{Bytes int}\nfunc(p Packet)Size()int{return p.Bytes}\nfunc TotalSize(items []Sizer)int{total:=0;for _,item:=range items{total+=item.Size()};return total}',
    tests: [
      [
        'Sums through interface values',
        'if TotalSize([]Sizer{Packet{3},Packet{5}})!=8{t.Fatal("expected eight bytes")}',
      ],
      [
        'Handles nil slice and zero-sized values',
        'if TotalSize(nil)!=0||TotalSize([]Sizer{Packet{0},Packet{2}})!=2{t.Fatal("wrong zero handling")}',
      ],
    ],
    hints: [
      'Define behaviour on the value receiver so Packet satisfies Sizer.',
      'Iterate over interface values and call their method.',
    ],
    example: ['TotalSize([]Sizer{Packet{3},Packet{5}})', '8'],
  },
  {
    id: 'go-errors',
    title: 'Return an explicit parse error',
    language: 'go',
    topic: 'Errors',
    concepts: ['go-errors'],
    explanation:
      'Parsing a number and validating its domain are separate steps. Return an error instead of a sentinel port so the caller cannot confuse malformed input with a valid value. Numeric parsing should not accept trailing junk.',
    problem:
      'Implement ParsePort(string)(int,error), accepting decimal integers in 1..65535 and returning an error for malformed or out-of-range input.',
    starter: 'package main\nfunc ParsePort(text string)(int,error){return 8080,nil}',
    solution:
      'package main\nimport("strconv";"fmt")\nfunc ParsePort(text string)(int,error){n,err:=strconv.Atoi(text);if err!=nil||n<1||n>65535{return 0,fmt.Errorf("invalid port %q",text)};return n,nil}',
    tests: [
      [
        'Parses valid boundary values',
        'for _,input:=range []string{"1","8080","65535"}{v,err:=ParsePort(input);if err!=nil||v<1||v>65535{t.Fatal("valid port rejected")}}',
      ],
      [
        'Rejects malformed and invalid ports',
        'for _,input:=range []string{"x","0","65536","80x",""}{if _,err:=ParsePort(input);err==nil{t.Fatalf("accepted %q",input)}}',
      ],
    ],
    hints: [
      'Use strconv.Atoi for complete numeric parsing.',
      'Validate bounds after parsing and return a non-nil error.',
    ],
    example: ['ParsePort("8080")', '8080, nil'],
  },
  {
    id: 'rust-mutable',
    title: 'Update caller data through an exclusive borrow',
    language: 'rust',
    topic: 'Mutable references',
    concepts: ['rust-mutable'],
    explanation:
      'A mutable slice grants temporary exclusive access without moving ownership of the vector. Updating elements through iter_mut changes the caller’s allocation and avoids a clone. The caller regains access after the borrow’s last use.',
    problem:
      'Implement add_offset(values:&mut [i32], offset:i32), adding offset to each element in place. Inputs are chosen so addition does not overflow.',
    starter: 'fn add_offset(values:&mut [i32],offset:i32){}',
    solution:
      'fn add_offset(values:&mut [i32],offset:i32){for value in values.iter_mut(){*value+=offset;}}',
    tests: [
      [
        'Mutates without consuming ownership',
        'let mut values=vec![1,2,3];add_offset(&mut values,4);assert_eq!(values,vec![5,6,7]);',
      ],
      [
        'Supports slices, negatives and empty input',
        'let mut a=[2,4,6];add_offset(&mut a[1..],-2);assert_eq!(a,[2,2,4]);add_offset(&mut [],5);',
      ],
    ],
    hints: [
      'Iterate over mutable references.',
      'Dereference each element before assigning its new value.',
    ],
    example: ['[1,2,3], offset 4', '[5,6,7] in the same allocation'],
  },
  {
    id: 'rust-trait',
    title: 'Use a trait-bound generic function',
    language: 'rust',
    topic: 'Traits & generics',
    concepts: ['rust-traits', 'rust-generics'],
    explanation:
      'A trait states behaviour shared by concrete types. A generic function constrained by that trait can call its methods while retaining static dispatch. Borrow the input so describing a value does not consume it.',
    problem:
      'Define trait Named with name(&self)->&str, struct User{name:String}, its Named implementation, and generic greet<T:Named>(&T)->String returning "Hello, NAME!".',
    starter:
      'trait Named{fn name(&self)->&str;}\nstruct User{name:String}\nimpl Named for User{fn name(&self)->&str{&self.name}}\nfn greet<T:Named>(value:&T)->String{String::new()}',
    solution:
      'trait Named{fn name(&self)->&str;}\nstruct User{name:String}\nimpl Named for User{fn name(&self)->&str{&self.name}}\nfn greet<T:Named>(value:&T)->String{format!("Hello, {}!",value.name())}',
    tests: [
      [
        'Greets without moving the value',
        'let u=User{name:String::from("Ada")};assert_eq!(greet(&u),"Hello, Ada!");assert_eq!(u.name,"Ada");',
      ],
      [
        'Works with another implementing type',
        'struct Team;impl Named for Team{fn name(&self)->&str{"Forge"}}assert_eq!(greet(&Team),"Hello, Forge!");',
      ],
    ],
    hints: [
      'The trait method borrows self and returns a borrowed string.',
      'Use a trait bound on T and borrow the caller’s value.',
    ],
    example: ['greet(&User{name:"Ada".into()})', 'Hello, Ada!'],
  },
];
for (const { concepts, ...spec } of specs) {
  exerciseConcepts[spec.id] = concepts;
  register([spec]);
}
