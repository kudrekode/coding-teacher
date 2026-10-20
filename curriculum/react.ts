import { register } from './exercises';
register([
  {
    id: 'react-stale',
    language: 'react',
    title: 'Fix a stale state update',
    topic: 'State & batching',
    mode: 'Debug',
    explanation:
      'React batches state updates triggered during an event. Reading count twice in one handler reads the same render snapshot, so two setCount(count+1) calls only add one. Functional updates receive the latest queued value and compose correctly.',
    problem:
      'Repair the default Counter component so its Add two button increments the displayed count by exactly two each click.',
    starter:
      "import {useState} from 'react';\nexport default function Counter(){\n const [count,setCount]=useState(0);\n return <button onClick={()=>{setCount(count+1);setCount(count+1)}}>Count: {count}</button>;\n}",
    solution:
      "import {useState} from 'react';\nexport default function Counter(){const [count,setCount]=useState(0);return <button onClick={()=>{setCount(c=>c+1);setCount(c=>c+1)}}>Count: {count}</button>}",
    tests: [
      [
        'Adds two on one actual click',
        "const c=await mount();await click(c.querySelector('button'));equal(c.textContent,'Count: 2');",
      ],
      [
        'Composes repeated events',
        "const c=await mount();await click(c.querySelector('button'));await click(c.querySelector('button'));equal(c.textContent,'Count: 4');",
      ],
    ],
    hints: [
      'Both count reads refer to the same render snapshot.',
      'Pass a function to setCount so queued updates compose.',
    ],
    example: ['two clicks', 'Count: 4'],
  },
  {
    id: 'react-cleanup',
    language: 'react',
    title: 'Clean up a browser subscription',
    topic: 'Effects & cleanup',
    mode: 'Debug',
    explanation:
      'Effects synchronise a component with external systems. When dependencies change, React cleans up the old effect before installing the new one. Removing the exact original listener prevents duplicate dispatch and stale closures.',
    problem:
      'Repair Listener({label}): listen for window forge-tick events and increment once per event. Changing label must not accumulate listeners. Render label: count.',
    starter:
      "import {useEffect,useState} from 'react';\nexport default function Listener({label}){const [count,setCount]=useState(0);useEffect(()=>{window.addEventListener('forge-tick',()=>setCount(c=>c+1))},[label]);return <p>{label}: {count}</p>}",
    solution:
      "import {useEffect,useState} from 'react';\nexport default function Listener({label}){const [count,setCount]=useState(0);useEffect(()=>{const listener=()=>setCount(c=>c+1);window.addEventListener('forge-tick',listener);return ()=>window.removeEventListener('forge-tick',listener)},[label]);return <p>{label}: {count}</p>}",
    tests: [
      [
        'Responds to actual window events',
        "const c=await mount({label:'A'});await event('forge-tick');equal(c.textContent,'A: 1');",
      ],
      [
        'Does not accumulate listeners',
        "const c=await mount({label:'A'});await rerender({label:'B'});await rerender({label:'C'});await event('forge-tick');equal(c.textContent,'C: 1');",
      ],
    ],
    hints: [
      'Keep the listener function in a variable inside the effect.',
      'Return cleanup using that exact function reference.',
    ],
    example: ['label changes twice, then one event', 'count increments once'],
    prerequisites: ['react-stale'],
  },
  {
    id: 'react-previous',
    language: 'react',
    title: 'Remember the previous render',
    topic: 'Refs & effects',
    explanation:
      'A ref persists between renders without triggering another render. Reading it during render and updating it after commit lets a hook expose the previous committed value. Setting the ref during render would replace the old value too early.',
    problem:
      'Implement usePrevious(value) and default Previous({value}) showing previous: none initially, then the previous committed prop.',
    starter:
      "import {useRef,useEffect} from 'react';\nfunction usePrevious(value){return value}\nexport default function Previous({value}){const previous=usePrevious(value);return <p>previous: {previous ?? 'none'}</p>}",
    solution:
      "import {useRef,useEffect} from 'react';\nfunction usePrevious(value){const ref=useRef();useEffect(()=>{ref.current=value},[value]);return ref.current}\nexport default function Previous({value}){const previous=usePrevious(value);return <p>previous: {previous ?? 'none'}</p>}",
    tests: [
      [
        'Starts without a previous value',
        "const c=await mount({value:10});equal(c.textContent,'previous: none');",
      ],
      [
        'Keeps the previous committed prop',
        "const c=await mount({value:10});await rerender({value:20});equal(c.textContent,'previous: 10');await rerender({value:0});equal(c.textContent,'previous: 20');",
      ],
    ],
    hints: [
      'Store the committed value in useRef.',
      'Update the ref inside useEffect after render.',
    ],
    example: ['props 10 → 20 → 30', 'previous: none → 10 → 20'],
  },
  {
    id: 'react-derived',
    language: 'react',
    title: 'Remove stale derived state',
    topic: 'Rendering & props',
    mode: 'Debug',
    explanation:
      'Copying a prop into initial state creates two sources of truth. The initialiser is only used on the first render, so later prop updates do not update the copy. If a value is fully derived from current props, calculate it during render.',
    problem:
      'Fix Total({items}) to render Total: N from the sum of item.price, updating whenever items changes.',
    starter:
      "import {useState} from 'react';\nexport default function Total({items}){const [total]=useState(items.reduce((n,item)=>n+item.price,0));return <p>Total: {total}</p>}",
    solution:
      'export default function Total({items}){const total=items.reduce((n,item)=>n+item.price,0);return <p>Total: {total}</p>}',
    tests: [
      [
        'Computes the initial total',
        "const c=await mount({items:[{price:2},{price:3}]});equal(c.textContent,'Total: 5');",
      ],
      [
        'Updates when parent data changes',
        "const c=await mount({items:[{price:1}]});await rerender({items:[{price:7},{price:3}]});equal(c.textContent,'Total: 10');await rerender({items:[]});equal(c.textContent,'Total: 0');",
      ],
    ],
    hints: [
      'State initialisers do not run again when props change.',
      'Compute a derived value from current props during render.',
    ],
    example: ['items change from [1] to [7,3]', 'Total: 10'],
  },
  {
    id: 'react-race',
    language: 'react',
    title: 'Ignore an outdated API response',
    topic: 'Async effects',
    difficulty: 'Advanced',
    mode: 'Debug',
    prerequisites: ['react-cleanup'],
    explanation:
      'Requests can finish out of order. A response for an old query must not overwrite newer state. An effect-local active flag becomes false during cleanup, allowing each completion to decide whether it still belongs to the current query. This guards state; it does not cancel network activity.',
    problem:
      'Fix Search({query,load}) so only the latest query result is displayed. load(query) returns a promise of a string; render Loading while waiting.',
    starter:
      "import {useState,useEffect} from 'react';\nexport default function Search({query,load}){const [text,setText]=useState('Loading');useEffect(()=>{load(query).then(setText)},[query,load]);return <p>{text}</p>}",
    solution:
      "import {useState,useEffect} from 'react';\nexport default function Search({query,load}){const [text,setText]=useState('Loading');useEffect(()=>{let active=true;setText('Loading');load(query).then(value=>{if(active)setText(value)});return ()=>{active=false}},[query,load]);return <p>{text}</p>}",
    tests: [
      [
        'Displays a resolved request',
        "const c=await mount({query:'a',load:async q=>q.toUpperCase()});await flush();equal(c.textContent,'A');",
      ],
      [
        'Rejects stale completion order',
        "const pending={};const load=q=>new Promise(resolve=>pending[q]=resolve);const c=await mount({query:'old',load});await rerender({query:'new',load});await resolvePromise(()=>pending.new('NEW'));equal(c.textContent,'NEW');await resolvePromise(()=>pending.old('OLD'));equal(c.textContent,'NEW');",
      ],
    ],
    hints: [
      'Give each effect invocation its own active flag.',
      'Set active=false during cleanup before the next query effect runs.',
    ],
    example: ['old request completes after new', 'new result remains visible'],
  },
  {
    id: 'react-project',
    language: 'react',
    title: 'Build a filterable issue list',
    topic: 'State & composition',
    mode: 'Build',
    explanation:
      'A small interactive list combines state, derived data and stable identity. Keep only the filter choice in state; derive visible items from props on each render. This prevents stale results when new issues arrive from the parent.',
    problem:
      'Build default Issues({items}), where items have id,title,open. Render All and Open buttons, initially all issues as li elements, then filter to open issues when Open is clicked.',
    starter:
      "import {useState} from 'react';\nexport default function Issues({items}){return <section><button>All</button><button>Open</button><ul>{items.map(item=><li key={item.id}>{item.title}</li>)}</ul></section>}",
    solution:
      "import {useState} from 'react';\nexport default function Issues({items}){const [onlyOpen,setOnlyOpen]=useState(false);const visible=onlyOpen?items.filter(x=>x.open):items;return <section><button onClick={()=>setOnlyOpen(false)}>All</button><button onClick={()=>setOnlyOpen(true)}>Open</button><ul>{visible.map(item=><li key={item.id}>{item.title}</li>)}</ul></section>}",
    tests: [
      [
        'Filters with real button events',
        "const c=await mount({items:[{id:1,title:'A',open:true},{id:2,title:'B',open:false}]});equal(c.querySelectorAll('li').length,2);await click(c.querySelectorAll('button')[1]);equal([...c.querySelectorAll('li')].map(x=>x.textContent),['A']);await click(c.querySelectorAll('button')[0]);equal(c.querySelectorAll('li').length,2);",
      ],
      [
        'Maintains filter across prop updates',
        "const c=await mount({items:[]});await click(c.querySelectorAll('button')[1]);await rerender({items:[{id:1,title:'Closed',open:false}]});equal(c.querySelectorAll('li').length,0);",
      ],
    ],
    hints: [
      'Keep the selected filter in state.',
      'Derive visible items from current props, not a copied initial list.',
    ],
    example: ['Open clicked on mixed issues', 'only open issues are rendered'],
    files: {
      'contracts.ts': 'type Issue={id:number;title:string;open:boolean};',
      'README.md':
        'Only Component.tsx is editable. The acceptance runner mounts the actual React component in jsdom.',
    },
  },
]);
