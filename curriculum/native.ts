import { register } from './exercises';
register([
  {
    id: 'go-pointer',
    language: 'go',
    title: 'Update a value through a pointer',
    topic: 'Pointers',
    difficulty: 'Foundation',
    explanation:
      'Go passes arguments by value. A pointer value still gets copied, but both copies identify the same underlying variable. Dereferencing lets a function update caller-owned state. Check nil explicitly when the contract permits an absent pointer.',
    problem:
      'Implement Increment(*int), incrementing the pointed-to integer and doing nothing for nil.',
    starter: 'package main\nfunc Increment(value *int) {\n}',
    solution: 'package main\nfunc Increment(value *int){if value!=nil{*value++}}',
    tests: [
      ['Updates caller state', 'n:=4; Increment(&n); if n!=5{t.Fatalf("expected 5, got %d",n)}'],
      ['Accepts nil', 'Increment(nil); n:=0;Increment(&n);if n!=1{t.Fatal("zero must increment")}'],
    ],
    hints: ['Dereference with *value to update the pointee.', 'Guard nil before dereferencing.'],
    example: ['n := 4; Increment(&n)', 'n == 5'],
  },
  {
    id: 'go-unique',
    language: 'go',
    title: 'Deduplicate a slice in order',
    topic: 'Slices & maps',
    explanation:
      'A slice is a view over an underlying array, while a map can track membership. Combining the two yields stable deduplication in one pass. Avoid returning the input unchanged or sorting it, because first-occurrence order is part of the API.',
    problem:
      'Implement Unique([]int) []int, returning first occurrences in input order without modifying the input.',
    starter: 'package main\nfunc Unique(values []int) []int {return values}',
    solution:
      'package main\nfunc Unique(values []int) []int{seen:=map[int]bool{};out:=[]int{};for _,v:=range values{if !seen[v]{seen[v]=true;out=append(out,v)}};return out}',
    tests: [
      [
        'Preserves first occurrence order',
        'out:=Unique([]int{3,1,3,2});if len(out)!=3||out[0]!=3||out[1]!=1||out[2]!=2{t.Fatalf("wrong output: %v",out)}',
      ],
      [
        'Accepts nil and repeated zeros',
        'if len(Unique(nil))!=0{t.Fatal("expected empty")};if len(Unique([]int{0,0}))!=1{t.Fatal("deduplicate zero")}',
      ],
    ],
    hints: [
      'Use a map for membership and a separate output slice.',
      'Append only when the value has not been seen.',
    ],
    example: ['[3,1,3,2]', '[3,1,2]'],
  },
  {
    id: 'go-queue',
    language: 'go',
    title: 'Implement a FIFO queue',
    topic: 'Methods & slices',
    explanation:
      'A queue exposes first-in-first-out semantics and an explicit empty result. Go commonly returns a value and an ok boolean rather than a sentinel value, allowing zero to remain valid data. Pointer receiver methods update the queue itself.',
    problem:
      'Implement Queue with Push(int) and Pop()(int,bool). Pop returns oldest value, or (0,false) when empty.',
    starter:
      'package main\ntype Queue struct{}\nfunc(q *Queue) Push(v int){}\nfunc(q *Queue) Pop()(int,bool){return 0,false}',
    solution:
      'package main\ntype Queue struct{values []int}\nfunc(q *Queue) Push(v int){q.values=append(q.values,v)}\nfunc(q *Queue) Pop()(int,bool){if len(q.values)==0{return 0,false};v:=q.values[0];q.values=q.values[1:];return v,true}',
    tests: [
      [
        'Maintains FIFO order',
        'q:=Queue{};q.Push(3);q.Push(7);a,ok:=q.Pop();if !ok||a!=3{t.Fatal("expected oldest")};b,_:=q.Pop();if b!=7{t.Fatal("wrong second value")}',
      ],
      [
        'Distinguishes zero from empty',
        'q:=Queue{};q.Push(0);v,ok:=q.Pop();if !ok||v!=0{t.Fatal("zero is valid")};_,ok=q.Pop();if ok{t.Fatal("expected empty")}',
      ],
    ],
    hints: [
      'Use a pointer receiver for mutating methods.',
      'Return ok=false only for an empty queue.',
    ],
    example: ['Push(3); Push(7); Pop()', '3,true'],
    visualization: 'queue',
  },
  {
    id: 'go-workers',
    language: 'go',
    title: 'Build a concurrent square service',
    topic: 'Goroutines & channels',
    mode: 'Build',
    difficulty: 'Advanced',
    explanation:
      'Worker goroutines consume jobs from a channel and write to disjoint result indices. A WaitGroup establishes completion before results are returned. Closing the job channel lets workers terminate. Bounding worker count prevents one goroutine per item.',
    problem:
      'Implement Squares(values []int,workers int) []int using bounded workers, preserving order. Return an empty slice for no input or nonpositive workers.',
    starter: 'package main\nfunc Squares(values []int,workers int) []int{return nil}',
    solution:
      'package main\nimport "sync"\nfunc Squares(values []int,workers int) []int{if workers<1{return []int{}};out:=make([]int,len(values));jobs:=make(chan int);var wg sync.WaitGroup;for w:=0;w<workers;w++{wg.Add(1);go func(){defer wg.Done();for i:=range jobs{out[i]=values[i]*values[i]}}()};for i:=range values{jobs<-i};close(jobs);wg.Wait();return out}',
    tests: [
      [
        'Returns ordered results',
        'out:=Squares([]int{3,-2,4},2);if len(out)!=3||out[0]!=9||out[1]!=4||out[2]!=16{t.Fatalf("wrong squares %v",out)}',
      ],
      [
        'Handles empty and invalid bounds',
        'if len(Squares(nil,2))!=0||len(Squares([]int{1},0))!=0{t.Fatal("expected empty") }',
      ],
    ],
    hints: [
      'Send indices through the jobs channel to preserve result positions.',
      'Close jobs and wait for all workers before returning.',
    ],
    example: ['Squares([]int{3,-2,4},2)', '[9,4,16]'],
  },
  {
    id: 'go-http',
    language: 'go',
    title: 'Serve a real JSON health endpoint',
    topic: 'HTTP handlers',
    explanation:
      'A Go HTTP handler writes headers before writing the body. httptest exercises the real net/http interface without opening a network socket. Set the JSON content type and encode a concrete response instead of hand-building malformed JSON.',
    problem:
      'Implement Health(http.ResponseWriter,*http.Request) returning status 200 and exactly {"status":"ok"} as JSON with Content-Type application/json.',
    starter:
      'package main\nimport "net/http"\nfunc Health(w http.ResponseWriter,r *http.Request){w.WriteHeader(500)}',
    solution:
      'package main\nimport("net/http";"encoding/json")\nfunc Health(w http.ResponseWriter,r *http.Request){w.Header().Set("Content-Type","application/json");json.NewEncoder(w).Encode(map[string]string{"status":"ok"})}',
    tests: [
      [
        'Returns a real HTTP response',
        'r:=httptest.NewRecorder();Health(r,httptest.NewRequest("GET","/health",nil));if r.Code!=200{t.Fatal("expected 200")};var body map[string]string;if json.Unmarshal(r.Body.Bytes(),&body)!=nil||body["status"]!="ok"||len(body)!=1{t.Fatal("wrong JSON")};if r.Header().Get("Content-Type")!="application/json"{t.Fatal("wrong content type")}',
      ],
      [
        'Supports repeated requests',
        'for i:=0;i<2;i++{r:=httptest.NewRecorder();Health(r,httptest.NewRequest("GET","/health",nil));var body map[string]string;json.Unmarshal(r.Body.Bytes(),&body);if r.Code!=200||body["status"]!="ok"{t.Fatal("unstable response")}}',
      ],
    ],
    hints: [
      'Set Content-Type before encoding the response.',
      'Use encoding/json for serialisation.',
    ],
    example: ['GET /health', '200 application/json; {"status":"ok"}'],
  },
  {
    id: 'rust-borrow',
    language: 'rust',
    title: 'Borrow data without consuming it',
    topic: 'Ownership & borrowing',
    mode: 'Debug',
    explanation:
      'Passing a Vec by value transfers ownership. A borrowed slice lets a function inspect elements without taking ownership and accepts both vectors and arrays. The caller can keep using its vector after the call because the borrow ends when the function returns.',
    problem: 'Fix total to take &[i32] and sum its values without consuming the input.',
    starter: 'fn total(values:Vec<i32>)->i32{values.iter().sum()}',
    solution: 'fn total(values:&[i32])->i32{values.iter().sum()}',
    tests: [
      [
        'Borrows instead of moving',
        'let values=vec![1,2,3];assert_eq!(total(&values),6);assert_eq!(values.len(),3);',
      ],
      [
        'Handles empty and negative values',
        'assert_eq!(total(&[]),0);assert_eq!(total(&[-2,1]),-1);',
      ],
    ],
    hints: [
      'Accept a slice reference rather than owning Vec.',
      'An iterator over borrowed numbers can be summed directly.',
    ],
    example: ['total(&vec![1,2,3])', '6; vector remains usable'],
  },
  {
    id: 'rust-option',
    language: 'rust',
    title: 'Represent a missing match',
    topic: 'Option & iterators',
    explanation:
      'Option<T> encodes absence without a magic sentinel. Iterator find returns a borrowed item; copied converts Option<&i32> into an owned number. This keeps the API explicit even when zero is a valid element.',
    problem: 'Implement first_even(&[i32])->Option<i32>, returning the first even value or None.',
    starter: 'fn first_even(values:&[i32])->Option<i32>{None}',
    solution: 'fn first_even(values:&[i32])->Option<i32>{values.iter().copied().find(|v|v%2==0)}',
    tests: [
      ['Returns the first even value', 'assert_eq!(first_even(&[3,4,2]),Some(4));'],
      [
        'Represents absence explicitly',
        'assert_eq!(first_even(&[]),None);assert_eq!(first_even(&[1,3]),None);assert_eq!(first_even(&[0]),Some(0));',
      ],
    ],
    hints: [
      'Return Some(value) on a match and None otherwise.',
      'Use copied if your iterator holds references.',
    ],
    example: ['first_even(&[3,4,2])', 'Some(4)'],
  },
  {
    id: 'rust-result',
    language: 'rust',
    title: 'Return a recoverable parse error',
    topic: 'Result & error handling',
    explanation:
      'Result carries either a successful value or an explicit error. Parsing input should not panic on malformed data. Mapping the standard parse error into a domain message gives callers a stable, meaningful contract.',
    problem:
      'Implement parse_port(&str)->Result<u16,String>, accepting ports 1..65535 and returning Err for zero, malformed text and out-of-range values.',
    starter: 'fn parse_port(text:&str)->Result<u16,String>{Ok(0)}',
    solution:
      'fn parse_port(text:&str)->Result<u16,String>{let port=text.parse::<u16>().map_err(|_|"Invalid port".to_string())?;if port==0{return Err("Invalid port".to_string())}Ok(port)}',
    tests: [
      [
        'Parses valid ports',
        'assert_eq!(parse_port("8080"),Ok(8080));assert_eq!(parse_port("65535"),Ok(65535));',
      ],
      [
        'Rejects invalid input without panicking',
        'assert!(parse_port("0").is_err());assert!(parse_port("abc").is_err());assert!(parse_port("65536").is_err());',
      ],
    ],
    hints: [
      'Parse into u16 and propagate a converted error with ?.',
      'Reject zero separately from parsing.',
    ],
    example: ['parse_port("8080")', 'Ok(8080)'],
  },
  {
    id: 'rust-unique',
    language: 'rust',
    title: 'Deduplicate with a HashSet',
    topic: 'Collections & ownership',
    explanation:
      'A HashSet answers membership queries while a Vec preserves insertion order. Insert returns whether a key was newly added, so it can drive stable deduplication in one pass. Copy integer values rather than keeping unnecessary references.',
    problem: 'Implement unique(&[i32])->Vec<i32>, preserving first occurrence order.',
    starter: 'fn unique(values:&[i32])->Vec<i32>{values.to_vec()}',
    solution:
      'fn unique(values:&[i32])->Vec<i32>{let mut seen=std::collections::HashSet::new();values.iter().copied().filter(|v|seen.insert(*v)).collect()}',
    tests: [
      ['Preserves first occurrences', 'assert_eq!(unique(&[3,1,3,2]),vec![3,1,2]);'],
      [
        'Handles empty and repeated zeros',
        'assert_eq!(unique(&[]),Vec::<i32>::new());assert_eq!(unique(&[0,0]),vec![0]);',
      ],
    ],
    hints: [
      'HashSet::insert returns true only for a new value.',
      'Collect the filtered iterator into a Vec.',
    ],
    example: ['unique(&[3,1,3,2])', 'vec![3,1,2]'],
  },
  {
    id: 'rust-cli',
    language: 'rust',
    title: 'Parse a small CLI command',
    topic: 'Pattern matching',
    mode: 'Build',
    explanation:
      'Matching a borrowed slice handles argument count and literal command names together. Keep parsing separate from IO so a CLI can be tested without spawning a process. Result makes usage and validation failures explicit.',
    problem:
      'Implement parse_command(&[&str])->Result<String,String>: ["greet",name] returns "Hello, NAME!" for nonempty name; all other inputs return Err.',
    starter: 'fn parse_command(args:&[&str])->Result<String,String>{Ok(String::new())}',
    solution:
      'fn parse_command(args:&[&str])->Result<String,String>{match args{["greet",name] if !name.is_empty()=>Ok(format!("Hello, {}!",name)),_=>Err("Usage: greet NAME".to_string())}}',
    tests: [
      [
        'Parses a valid command',
        'assert_eq!(parse_command(&["greet","Ada"]),Ok("Hello, Ada!".to_string()));',
      ],
      [
        'Rejects malformed arguments',
        'assert!(parse_command(&[]).is_err());assert!(parse_command(&["greet",""]).is_err());assert!(parse_command(&["other","Ada"]).is_err());',
      ],
    ],
    hints: [
      'Match the whole argument slice rather than indexing blindly.',
      'Use a match guard for an empty name.',
    ],
    example: ['["greet","Ada"]', 'Ok("Hello, Ada!")'],
  },
]);
