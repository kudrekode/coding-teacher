import { register } from './exercises';
register([
  {
    id: 'py-frequency',
    language: 'python',
    title: 'Count events by key',
    topic: 'Dictionaries',
    explanation:
      'A frequency table turns a stream into a compact summary. Dictionary lookups are expected constant time, so a single pass scales better than repeatedly counting each distinct value. An empty stream naturally produces an empty dictionary.',
    problem: 'Implement frequencies(items), returning counts for hashable values.',
    starter: 'def frequencies(items):\n    return {}',
    solution:
      'def frequencies(items):\n    counts={}\n    for item in items:\n        counts[item]=counts.get(item,0)+1\n    return counts',
    tests: [
      ['Counts repeated events', "assert frequencies(['a','b','a'])=={'a':2,'b':1}"],
      [
        'Handles empty and falsy keys',
        "assert frequencies([])=={}\nassert frequencies([0,0,''])=={0:2,'':1}",
      ],
    ],
    hints: [
      'Use dict.get(key,0) to initialise a count.',
      'Update counts in one pass rather than repeatedly calling list.count.',
    ],
    example: ["['read','write','read']", "{'read':2,'write':1}"],
  },
  {
    id: 'py-window',
    language: 'python',
    title: 'Find the longest unique window',
    topic: 'Sliding windows',
    difficulty: 'Advanced',
    prerequisites: ['py-frequency'],
    explanation:
      'A sliding window maintains a contiguous region satisfying an invariant. When a repeat arrives, move the left edge past its previous position, but never backwards. This avoids scanning every possible substring and connects to rolling request limits.',
    problem:
      'Implement longest_unique(text), the length of the longest substring with no repeated character.',
    starter: 'def longest_unique(text):\n    return len(text)',
    solution:
      'def longest_unique(text):\n    last={}\n    left=best=0\n    for right,char in enumerate(text):\n        left=max(left,last.get(char,-1)+1)\n        last[char]=right\n        best=max(best,right-left+1)\n    return best',
    tests: [
      [
        'Finds a moving window',
        "assert longest_unique('abcabcbb')==3\nassert longest_unique('pwwkew')==3",
      ],
      [
        'Never moves left backwards',
        "assert longest_unique('abba')==2\nassert longest_unique('')==0\nassert longest_unique('aaaa')==1",
      ],
    ],
    hints: [
      'Remember the latest index of every character.',
      'Use max(left,previous+1) so stale repeats cannot expand the window.',
    ],
    example: ["'abba'", '2'],
    complexity: 'O(n) time, O(k) space for k distinct characters.',
  },
  {
    id: 'py-two-sum',
    language: 'python',
    title: 'Match a pair in one pass',
    topic: 'Hash maps',
    prerequisites: ['py-frequency'],
    explanation:
      'Store earlier values and look up the complement of each new item. Looking up before inserting prevents an element from matching itself. Returning indices preserves identity when duplicate numbers appear.',
    problem:
      'Implement two_sum(nums,target), returning the first discovered pair of distinct indices as a list, or [] if no pair exists.',
    starter: 'def two_sum(nums,target):\n    return []',
    solution:
      'def two_sum(nums,target):\n    seen={}\n    for i,n in enumerate(nums):\n        if target-n in seen: return [seen[target-n],i]\n        seen[n]=i\n    return []',
    tests: [
      ['Finds complementary indices', 'assert two_sum([2,7,11,15],9)==[0,1]'],
      [
        'Handles duplicates and no matches',
        'assert two_sum([3,3],6)==[0,1]\nassert two_sum([3],6)==[]\nassert two_sum([],0)==[]',
      ],
    ],
    hints: [
      'Look up target minus the current value.',
      'Check the earlier-values map before inserting the current element.',
    ],
    example: ['[2,7,11], target=9', '[0,1]'],
    complexity: 'O(n) time and O(n) space.',
  },
  {
    id: 'py-binary',
    language: 'python',
    title: 'Find the first matching index',
    topic: 'Binary search',
    explanation:
      'Binary search halves a sorted search range. Finding the first duplicate means continuing left after equality rather than returning immediately. Half-open intervals make empty arrays and insertion boundaries easier to reason about.',
    problem:
      'Implement first_index(nums,target) for ascending sorted integers, returning the first matching index or -1.',
    starter: 'def first_index(nums,target):\n    return -1',
    solution:
      'def first_index(nums,target):\n    lo,hi=0,len(nums)\n    while lo<hi:\n        mid=(lo+hi)//2\n        if nums[mid]<target: lo=mid+1\n        else: hi=mid\n    return lo if lo<len(nums) and nums[lo]==target else -1',
    tests: [
      ['Finds first duplicate', 'assert first_index([1,2,2,2,4],2)==1'],
      [
        'Handles missing and boundary values',
        'assert first_index([],3)==-1\nassert first_index([1,3],2)==-1\nassert first_index([1],1)==0',
      ],
    ],
    hints: [
      'Maintain a half-open interval [lo,hi).',
      'On equality move hi to mid to keep searching left.',
    ],
    example: ['[1,2,2,4], target=2', '1'],
    complexity: 'O(log n) time and O(1) space.',
    visualization: 'binary',
  },
  {
    id: 'py-stack',
    language: 'python',
    title: 'Validate nested delimiters',
    topic: 'Stacks',
    explanation:
      'A stack models nested unfinished work: the most recently opened delimiter must close first. Counts alone cannot detect crossed nesting such as ([)]. Ordinary characters can be ignored, but unfinished opening delimiters must fail at the end.',
    problem: 'Implement balanced(text) for (), [] and {} delimiters, ignoring other characters.',
    starter: 'def balanced(text):\n    return True',
    solution:
      "def balanced(text):\n    stack=[]\n    pairs={')':'(',']':'[','}':'{'}\n    for char in text:\n        if char in '([{': stack.append(char)\n        elif char in pairs:\n            if not stack or stack.pop()!=pairs[char]: return False\n    return not stack",
    tests: [
      [
        'Accepts nested expressions',
        "assert balanced('a{b[c](d)}') is True\nassert balanced('') is True",
      ],
      [
        'Rejects crossed and unfinished nesting',
        "assert balanced('([)]') is False\nassert balanced('(()') is False\nassert balanced(']') is False",
      ],
    ],
    hints: [
      'Match closing delimiters against the latest opening.',
      'The stack must be empty after the scan.',
    ],
    example: ["'([)]'", 'False'],
    visualization: 'stack',
  },
  {
    id: 'py-chunks',
    language: 'python',
    title: 'Stream data in bounded batches',
    topic: 'Generators',
    explanation:
      'Generators yield lazily rather than materialising every result. Batching is useful for database writes and paginated APIs. Emit the last short batch, and reject invalid sizes instead of risking a non-terminating iterator.',
    problem:
      'Implement chunks(items,size) as a generator supporting any iterable, yielding lists of at most size items. Reject size < 1.',
    starter: 'def chunks(items,size):\n    yield list(items)',
    solution:
      'def chunks(items,size):\n    if size<1: raise ValueError("size must be positive")\n    batch=[]\n    for item in items:\n        batch.append(item)\n        if len(batch)==size:\n            yield batch\n            batch=[]\n    if batch: yield batch',
    tests: [
      ['Emits the final short batch', 'assert list(chunks(range(5),2))==[[0,1],[2,3],[4]]'],
      [
        'Handles empty iterators and invalid sizes',
        "assert list(chunks(iter([]),3))==[]\ntry:\n    list(chunks([1],0))\n    assert False, 'Expected ValueError'\nexcept ValueError: pass",
      ],
    ],
    hints: [
      'Yield one batch, then create a fresh list.',
      'Generator validation runs when iteration begins.',
    ],
    example: ['chunks(range(5),2)', '[[0,1],[2,3],[4]]'],
  },
  {
    id: 'py-defaults',
    language: 'python',
    title: 'Repair a shared mutable default',
    topic: 'Function defaults',
    mode: 'Debug',
    explanation:
      'Python evaluates default arguments at function definition time. A list default leaks state across independent requests. Use None for an omitted argument, while preserving an explicitly supplied list by identity.',
    problem:
      'Fix add_tag(tag,tags=None): independent calls get independent lists; a supplied list is updated and returned.',
    starter: 'def add_tag(tag,tags=[]):\n    tags.append(tag)\n    return tags',
    solution:
      'def add_tag(tag,tags=None):\n    if tags is None: tags=[]\n    tags.append(tag)\n    return tags',
    tests: [
      [
        'Independent calls do not share state',
        "assert add_tag('a')==['a']\nassert add_tag('b')==['b']",
      ],
      [
        'Preserves supplied empty lists',
        "tags=[]\nassert add_tag('x',tags) is tags\nassert tags==['x']",
      ],
    ],
    hints: ['Replace the mutable default with None.', 'Check is None, not truthiness.'],
    example: ["add_tag('a'); add_tag('b')", "['a']; ['b']"],
  },
  {
    id: 'py-decorator',
    language: 'python',
    title: 'Write a transparent tracing decorator',
    topic: 'Decorators',
    explanation:
      'A decorator replaces a callable with a wrapper. It must forward positional and keyword arguments, return the result, and preserve metadata used by introspection. functools.wraps copies the name and docstring and exposes __wrapped__.',
    problem:
      'Implement counted(fn), adding wrapper.calls and incrementing it on every invocation. Preserve name, arguments and return values.',
    starter: 'def counted(fn):\n    return fn',
    solution:
      'import functools\ndef counted(fn):\n    @functools.wraps(fn)\n    def wrapper(*args,**kwargs):\n        wrapper.calls+=1\n        return fn(*args,**kwargs)\n    wrapper.calls=0\n    return wrapper',
    tests: [
      [
        'Counts calls and forwards keywords',
        '@counted\ndef add(a,b=1): return a+b\nassert add(2,b=3)==5\nassert add(1)==2\nassert add.calls==2',
      ],
      [
        'Preserves metadata',
        "@counted\ndef original():\n    'Helpful documentation.'\n    return None\nassert original.__name__=='original'\nassert original.__doc__=='Helpful documentation.'",
      ],
    ],
    hints: [
      'Store calls on the returned wrapper.',
      'Use functools.wraps to preserve callable metadata.',
    ],
    example: ['@counted def add(a,b): return a+b', 'add.calls counts invocations'],
  },
  {
    id: 'py-context',
    language: 'python',
    title: 'Guarantee resource cleanup',
    topic: 'Context managers',
    explanation:
      'Context managers pair resource use with cleanup. A finally block runs on normal completion and exceptions, so release does not depend on the happy path. A context manager should usually propagate the body error after releasing resources.',
    problem:
      'Implement managed(resource), yielding resource and calling resource.close() exactly once on exit, including exceptional exits.',
    starter:
      'from contextlib import contextmanager\n@contextmanager\ndef managed(resource):\n    yield resource',
    solution:
      'from contextlib import contextmanager\n@contextmanager\ndef managed(resource):\n    try:\n        yield resource\n    finally:\n        resource.close()',
    tests: [
      [
        'Closes after normal use',
        'class R:\n    closed=0\n    def close(self): self.closed+=1\nr=R()\nwith managed(r) as value: assert value is r\nassert r.closed==1',
      ],
      [
        'Cleans up and propagates errors',
        "class R:\n    closed=0\n    def close(self): self.closed+=1\nr=R()\ntry:\n    with managed(r): raise ValueError('boom')\nexcept ValueError: pass\nelse: assert False, 'Error swallowed'\nassert r.closed==1",
      ],
    ],
    hints: [
      'Place yield inside try and close in finally.',
      'Do not catch the body error unless changing its semantics.',
    ],
    example: ['with managed(connection) as conn: ...', 'close runs even when the body raises'],
  },
  {
    id: 'py-async',
    language: 'python',
    title: 'Gather asynchronous work in order',
    topic: 'Asyncio',
    difficulty: 'Advanced',
    explanation:
      'Asyncio overlaps waiting rather than CPU-bound work. gather schedules awaitables concurrently and preserves input order. A semaphore around each task limits pressure on upstream services. Awaiting every task sequentially loses useful concurrency.',
    problem:
      'Implement async gather_limited(factories,limit), bounding active async factory calls and returning ordered results. Reject nonpositive limits.',
    starter:
      'async def gather_limited(factories,limit):\n    return [await factory() for factory in factories]',
    solution:
      'import asyncio\nasync def gather_limited(factories,limit):\n    if limit<1: raise ValueError("limit must be positive")\n    sem=asyncio.Semaphore(limit)\n    async def run(factory):\n        async with sem: return await factory()\n    return await asyncio.gather(*(run(f) for f in factories))',
    tests: [
      [
        'Overlaps work within the bound',
        "import asyncio\nasync def check():\n    active=0\n    peak=0\n    def factory(i):\n        async def task():\n            nonlocal active,peak\n            active+=1\n            peak=max(peak,active)\n            await asyncio.sleep(0)\n            active-=1\n            return i\n        return task\n    result=await gather_limited([factory(i) for i in range(6)],2)\n    assert result==list(range(6))\n    assert peak==2, f'Expected two overlapping tasks, got {peak}'\nasyncio.run(check())",
      ],
      [
        'Rejects invalid bounds',
        "import asyncio\ntry:\n    asyncio.run(gather_limited([],0))\nexcept ValueError: pass\nelse: assert False, 'Expected ValueError'",
      ],
    ],
    hints: [
      'Acquire a semaphore around each factory invocation.',
      'Use gather over wrappers to preserve input order.',
    ],
    example: ['six tasks, limit=2', 'two overlapping calls; ordered results'],
  },
  {
    id: 'py-fastapi-users',
    language: 'python',
    title: 'Build a validated users endpoint',
    topic: 'FastAPI & validation',
    mode: 'Build',
    framework: 'fastapi',
    prerequisites: ['py-frequency'],
    explanation:
      'Pydantic models validate JSON before FastAPI route logic runs. A create endpoint distinguishes invalid input (422), duplicates (409), and creation (201). TestClient sends actual ASGI HTTP requests through validation, routing and serialisation.',
    problem:
      'Create app: POST /users accepts nonempty name and email containing @, returns id,name,email with 201, rejects duplicate email with 409. GET /users lists users.',
    starter:
      'from fastapi import FastAPI\napp=FastAPI()\n\n# Define a request model and implement GET/POST /users.\n',
    solution:
      'from fastapi import FastAPI,HTTPException\nfrom pydantic import BaseModel,Field,field_validator\napp=FastAPI()\nusers=[]\nclass UserIn(BaseModel):\n    name:str=Field(min_length=1)\n    email:str\n    @field_validator("email")\n    @classmethod\n    def valid_email(cls,value):\n        if "@" not in value: raise ValueError("Invalid email")\n        return value\n@app.post("/users",status_code=201)\ndef create_user(data:UserIn):\n    if any(u["email"]==data.email for u in users): raise HTTPException(409,"Duplicate email")\n    user={"id":len(users)+1,**data.model_dump()}\n    users.append(user)\n    return user\n@app.get("/users")\ndef list_users(): return users',
    tests: [
      [
        'Creates and lists through HTTP',
        "from fastapi.testclient import TestClient\nwith TestClient(app) as c:\n    r=c.post('/users',json={'name':'Ada','email':'ada@example.com'})\n    assert r.status_code==201,r.text\n    assert r.json()=={'id':1,'name':'Ada','email':'ada@example.com'}\n    assert c.get('/users').json()==[r.json()]",
      ],
      [
        'Validates payloads and detects duplicates',
        "from fastapi.testclient import TestClient\nwith TestClient(app) as c:\n    assert c.post('/users',json={'name':'','email':'invalid'}).status_code==422\n    p={'name':'Grace','email':'grace@example.com'}\n    assert c.post('/users',json=p).status_code==201\n    assert c.post('/users',json=p).status_code==409",
      ],
    ],
    hints: [
      'Use a Pydantic BaseModel instead of an unvalidated dictionary.',
      'Raise HTTPException before appending a duplicate.',
    ],
    example: ["POST /users {name:'Ada',email:'ada@example.com'}", '201; {id:1,name:...,email:...}'],
    files: {
      'requirements.txt': 'fastapi\nhttpx',
      'README.md':
        'Only solution.py is editable. Each acceptance test starts a fresh real ASGI app.',
    },
  },
  {
    id: 'py-fastapi-pagination',
    language: 'python',
    title: 'Validate API pagination',
    topic: 'FastAPI & pagination',
    framework: 'fastapi',
    prerequisites: ['py-fastapi-users'],
    explanation:
      'Query parameters arrive as text and need coercion plus bounds validation. FastAPI Query constraints return a structured 422 before handler execution. The total should describe the full collection independently of page length.',
    problem:
      'Create GET /items: offset >= 0 default 0, limit 1..5 default 3. Return {items:[...],total:10} from integers 0 through 9.',
    starter:
      'from fastapi import FastAPI\napp=FastAPI()\n@app.get("/items")\ndef items():\n    return {"items":[],"total":0}',
    solution:
      'from fastapi import FastAPI,Query\napp=FastAPI()\n@app.get("/items")\ndef items(offset:int=Query(0,ge=0),limit:int=Query(3,ge=1,le=5)):\n    data=list(range(10))\n    return {"items":data[offset:offset+limit],"total":len(data)}',
    tests: [
      [
        'Slices and reports full total',
        "from fastapi.testclient import TestClient\nc=TestClient(app)\nassert c.get('/items?offset=2&limit=2').json()=={'items':[2,3],'total':10}\nassert c.get('/items').json()=={'items':[0,1,2],'total':10}",
      ],
      [
        'Rejects bounds and handles exhausted pages',
        "from fastapi.testclient import TestClient\nc=TestClient(app)\nassert c.get('/items?limit=0').status_code==422\nassert c.get('/items?offset=-1').status_code==422\nassert c.get('/items?limit=6').status_code==422\nassert c.get('/items?offset=99').json()=={'items':[],'total':10}",
      ],
    ],
    hints: [
      'Use Query constraints for bounds validation.',
      'Compute total before slicing the data.',
    ],
    example: ['GET /items?offset=2&limit=2', '{items:[2,3],total:10}'],
  },
]);
