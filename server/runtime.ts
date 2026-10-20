import { spawn, fork } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import type { Capability, Exercise, Language, RunResult, TestResult } from '../curriculum/schema';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function command(
  command: string,
  args: string[],
  cwd?: string,
  timeout = 5000,
  input?: string,
): Promise<{ code: number; out: string; err: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd,
      windowsHide: true,
      shell: false,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' },
    });
    let out = '',
      err = '',
      timedOut = false,
      done = false;
    const finish = (code: number) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ code, out, err, timedOut });
    };
    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
      finish(-1);
    }, timeout);
    proc.stdout.on('data', (d) => {
      out += d.toString();
      if (out.length > 128000) {
        proc.kill('SIGKILL');
        err = 'Output limit exceeded';
        finish(-1);
      }
    });
    proc.stderr.on('data', (d) => {
      err += d.toString();
      if (err.length > 128000) {
        proc.kill('SIGKILL');
        err = 'Diagnostic output limit exceeded';
        finish(-1);
      }
    });
    proc.on('error', (e) => {
      err = e.message;
      finish(-1);
    });
    proc.on('close', (c) => finish(c ?? -1));
    if (input) proc.stdin.end(input);
    else proc.stdin.end();
  });
}
const specs: Record<Language, { cmd: string; args: string[]; install: string }> = {
  javascript: {
    cmd: process.execPath,
    args: ['--version'],
    install: 'Install Node.js 22 or later.',
  },
  typescript: { cmd: process.execPath, args: ['--version'], install: 'npm install' },
  react: { cmd: process.execPath, args: ['--version'], install: 'npm install' },
  python: {
    cmd: process.env.FORGE_PYTHON ?? 'python',
    args: ['--version'],
    install: 'Install Python 3.11+, then python -m pip install -r requirements.txt',
  },
  go: {
    cmd: 'go',
    args: ['version'],
    install: 'Install Go from https://go.dev/dl/ and restart Forge.',
  },
  rust: {
    cmd: 'rustc',
    args: ['--version'],
    install: 'Install rustup from https://rustup.rs/ and restart Forge.',
  },
  swift: {
    cmd: 'swift',
    args: ['--version'],
    install: 'Install a Swift toolchain from https://www.swift.org/install/ and restart Forge.',
  },
};
let cached: Capability[] | undefined;
export async function capabilities(refresh = false) {
  if (cached && !refresh) return cached;
  cached = await Promise.all(
    (Object.keys(specs) as Language[]).map(async (language) => {
      const s = specs[language],
        r = ['javascript', 'typescript', 'react'].includes(language)
          ? { code: 0, out: process.version, err: '' }
          : await command(s.cmd, s.args, undefined, 5000);
      return {
        language,
        available: r.code === 0,
        compilation: language !== 'javascript' && language !== 'python',
        execution: r.code === 0,
        tests: r.code === 0,
        version: r.code === 0 ? (r.out || r.err).trim().split('\n')[0] : 'Not installed',
        dependencies:
          language === 'python'
            ? ['Python 3.11+', 'FastAPI + httpx for API exercises']
            : language === 'go'
              ? ['Go toolchain (go test)']
              : language === 'rust'
                ? ['Rust toolchain (rustc) and native linker']
                : language === 'swift'
                  ? ['Swift toolchain']
                  : [
                      'Node.js 22+',
                      ...(language === 'typescript' ? ['TypeScript compiler'] : []),
                      ...(language === 'react' ? ['React', 'React DOM', 'jsdom'] : []),
                    ],
        limitations:
          'Trusted local code only. Child-process deadlines and output limits are enforced; this is not an OS security sandbox. Native code and Python inherit the local user permissions.',
        install: s.install,
      };
    }),
  );
  return cached;
}
let frameworkCache: boolean | undefined;
export async function frameworkReady() {
  if (frameworkCache !== undefined) return frameworkCache;
  const result = await command(
    specs.python.cmd,
    [
      '-I',
      '-c',
      'import importlib.util; assert all(importlib.util.find_spec(m) is not None for m in ("fastapi", "httpx"))',
    ],
    undefined,
    15000,
  );
  if (!result.timedOut) frameworkCache = result.code === 0;
  return result.code === 0;
}

function formatDiagnostics(diags: readonly ts.Diagnostic[]) {
  return diags.map((d) => {
    const pos =
      d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : undefined;
    return `${pos ? `Line ${pos.line + 1}:${pos.character + 1} ` : ''}TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`;
  });
}
export async function runExercise(
  ex: Exercise,
  source: string,
  submit = false,
): Promise<RunResult> {
  const start = performance.now();
  const tests = submit ? ex.tests : ex.tests.filter((t) => !t.hidden);
  const base = {
    exerciseId: ex.id,
    passed: false,
    results: [] as TestResult[],
    output: [] as string[],
    diagnostics: [] as string[],
    duration: 0,
  };
  const finish = (extra: Partial<RunResult>) => ({
    ...base,
    ...extra,
    duration: Math.round(performance.now() - start),
  });
  const cap = (await capabilities()).find((c) => c.language === ex.language)!;
  if (!cap.available) return finish({ unavailable: true, diagnostics: [cap.install] });
  if (ex.framework === 'fastapi' && !(await frameworkReady()))
    return finish({
      unavailable: true,
      diagnostics: ['FastAPI dependencies missing. Run: python -m pip install -r requirements.txt'],
    });
  const dir = await mkdtemp(path.join(tmpdir(), 'forge-'));
  try {
    if (['javascript', 'typescript', 'react'].includes(ex.language)) {
      let code = source;
      let fixtures = tests;
      if (ex.language === 'typescript') {
        const prelude =
          'declare function assert(ok:unknown,message?:string):asserts ok;\ndeclare function equal(actual:unknown,expected:unknown):void;\n';
        const combined =
          prelude +
          source +
          '\n' +
          tests.map((t, i) => `async function __fixture${i}(){\n${t.code}\n}`).join('\n');
        const filename = path.join(dir, 'solution.ts');
        await writeFile(filename, combined);
        const options: ts.CompilerOptions = {
          strict: true,
          noEmit: true,
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.CommonJS,
          types: [],
          skipLibCheck: true,
        };
        const program = ts.createProgram([filename], options),
          diagnostics = formatDiagnostics(ts.getPreEmitDiagnostics(program));
        if (diagnostics.length) return finish({ diagnostics });
        code = ts.transpileModule(source, {
          compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
        }).outputText;
        fixtures = tests.map((t) => ({
          ...t,
          code: ts
            .transpileModule('async function __test(){' + t.code + '\n}', {
              compilerOptions: { target: ts.ScriptTarget.ES2022 },
            })
            .outputText.replace(/^async function __test\(\) \{\s*/, '')
            .replace(/\}\s*$/, ''),
        }));
      }
      if (ex.language === 'react') {
        const transpiled = ts.transpileModule(source, {
          fileName: 'Component.tsx',
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
          },
          reportDiagnostics: true,
        });
        const diagnostics = formatDiagnostics(transpiled.diagnostics ?? []);
        if (diagnostics.length) return finish({ diagnostics });
        code = transpiled.outputText;
      }
      const response = await new Promise<{
        results: TestResult[];
        output: string[];
        diagnostics?: string[];
      }>((resolve) => {
        const worker = fork(path.join(root, 'server/js-worker.mjs'), [], {
          cwd: dir,
          execArgv: ['--max-old-space-size=128'],
          silent: true,
          windowsHide: true,
        });
        let done = false;
        const settle = (r: { results: TestResult[]; output: string[]; diagnostics?: string[] }) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          worker.kill('SIGKILL');
          resolve(r);
        };
        let timer = setTimeout(
          () =>
            settle({
              results: [],
              output: [],
              diagnostics: ['Runtime startup timed out (30 seconds).'],
            }),
          30000,
        );
        let stderr = '';
        worker.stderr?.on('data', (d) => {
          stderr += d.toString().slice(0, 4000);
        });
        worker.on('message', (r: any) => {
          if (r.ready) {
            clearTimeout(timer);
            timer = setTimeout(
              () =>
                settle({
                  results: [],
                  output: [],
                  diagnostics: ['Execution timed out (5 second process deadline).'],
                }),
              5000,
            );
          } else settle(r);
        });
        worker.on('error', (e) => settle({ results: [], output: [], diagnostics: [e.message] }));
        worker.on('exit', (c) => {
          if (!done)
            settle({ results: [], output: [], diagnostics: [stderr || `Worker exited (${c})`] });
        });
        worker.send({ code, tests: fixtures, react: ex.language === 'react' });
      });
      return finish({
        ...response,
        passed:
          response.results.length === tests.length &&
          response.results.every((t) => t.passed) &&
          !response.diagnostics?.length,
      });
    }
    if (ex.language === 'python') {
      const payload = { source, tests };
      const harness = `import sys,json,traceback,contextlib,io\npayload=json.loads(sys.stdin.read())\nresults=[]\noutput=io.StringIO()\nfor test in payload['tests']:\n    namespace={'__name__':'forge_submission'}\n    try:\n        with contextlib.redirect_stdout(output),contextlib.redirect_stderr(output):\n            exec(compile(payload['source'],'solution.py','exec'),namespace)\n            exec(compile(test['code'],'test.py','exec'),namespace)\n        results.append({'name':test['name'],'hidden':test['hidden'],'passed':True})\n    except BaseException as error:\n        results.append({'name':test['name'],'hidden':test['hidden'],'passed':False,'error':traceback.format_exc(limit=4)})\nprint(json.dumps({'results':results,'output':output.getvalue().splitlines()[:100]}))\n`;
      const file = path.join(dir, 'runner.py');
      await writeFile(file, harness);
      const r = await command(specs.python.cmd, ['-I', file], dir, 15000, JSON.stringify(payload));
      if (r.code !== 0)
        return finish({
          diagnostics: [
            r.timedOut
              ? 'Execution timed out (15 second Python deadline, including imports).'
              : r.err || r.out,
          ],
        });
      try {
        const result = JSON.parse(r.out);
        return finish({
          ...result,
          passed:
            result.results.length === tests.length &&
            result.results.every((t: TestResult) => t.passed),
        });
      } catch {
        return finish({ diagnostics: ['Runner output was not valid JSON.', r.out] });
      }
    }
    const results: TestResult[] = [];
    for (const t of tests) {
      let compiled;
      const exe = path.join(dir, process.platform === 'win32' ? 'solution.exe' : 'solution');
      if (ex.language === 'go') {
        const imports =
          ex.id === 'go-http'
            ? 'import("testing";"net/http/httptest";"encoding/json")'
            : 'import "testing"';
        await writeFile(path.join(dir, 'solution.go'), source);
        await writeFile(
          path.join(dir, 'solution_test.go'),
          `package main\n${imports}\nfunc TestAcceptance(t *testing.T){${t.code}}`,
        );
        compiled = await command('go', ['test', 'solution.go', 'solution_test.go'], dir, 15000);
      } else if (ex.language === 'rust') {
        await writeFile(path.join(dir, 'solution.rs'), source + `\nfn main(){${t.code}}`);
        compiled = await command('rustc', ['solution.rs', '-o', exe], dir, 15000);
        if (!compiled.code) compiled = await command(exe, [], dir, 3000);
      } else {
        await writeFile(path.join(dir, 'solution.swift'), source + `\n${t.code}`);
        compiled = await command('swift', ['solution.swift'], dir, 15000);
      }
      results.push({
        name: t.name,
        hidden: t.hidden,
        passed: compiled.code === 0,
        error:
          compiled.code === 0
            ? undefined
            : compiled.timedOut
              ? 'Execution timed out'
              : compiled.err || compiled.out,
      });
    }
    return finish({ results, passed: results.every((r) => r.passed) });
  } finally {
    await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
