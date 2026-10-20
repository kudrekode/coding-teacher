import vm from 'node:vm';
import process from 'node:process';
import { setInterval, clearInterval } from 'node:timers';
import { isDeepStrictEqual, inspect } from 'node:util';

process.on('message', async ({ code, tests, react }) => {
  let React, act, createRoot, jsx, JSDOM;
  if (react) {
    React = await import('react');
    act = React.act;
    ({ createRoot } = await import('react-dom/client'));
    jsx = await import('react/jsx-runtime');
    ({ JSDOM } = await import('jsdom'));
  }
  process.send({ ready: true });
  const results = [],
    output = [];
  for (const test of tests) {
    let root, dom;
    try {
      let now = 0,
        serial = 0;
      const timers = new Map();
      const setTimeout = (fn, ms = 0, ...args) => {
        const id = ++serial;
        timers.set(id, { at: now + Math.max(0, Number(ms)), fn: () => fn(...args) });
        return id;
      };
      const clearTimeout = (id) => timers.delete(id);
      const clock = {
        pending: () => timers.size,
        tick(ms) {
          const end = now + ms;
          let guard = 0;
          while (true) {
            const next = [...timers]
              .filter(([, v]) => v.at <= end)
              .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
            if (!next) break;
            if (++guard > 10000) throw Error('Timer limit exceeded');
            timers.delete(next[0]);
            now = next[1].at;
            next[1].fn();
          }
          now = end;
        },
      };
      class ClockDate extends Date {
        static now() {
          return now;
        }
      }
      const assert = (ok, message = 'Assertion failed') => {
        if (!ok) throw Error(message);
      };
      const equal = (actual, expected) => {
        if (
          !isDeepStrictEqual(
            JSON.parse(JSON.stringify(actual) ?? 'null'),
            JSON.parse(JSON.stringify(expected) ?? 'null'),
          )
        ) {
          const err = Error(`Expected ${inspect(expected)}; received ${inspect(actual)}`);
          err.expected = inspect(expected);
          err.actual = inspect(actual);
          throw err;
        }
      };
      const exports = {};
      const sandbox = {
        exports,
        module: { exports },
        clock,
        Date: ClockDate,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        assert,
        equal,
        console: Object.fromEntries(
          ['log', 'warn', 'error', 'info'].map((k) => [
            k,
            (...a) => {
              if (output.length < 100)
                output.push(
                  a
                    .map((x) => inspect(x, { depth: 3 }))
                    .join(' ')
                    .slice(0, 2000),
                );
            },
          ]),
        ),
      };
      if (react) {
        dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
          url: 'http://localhost',
        });
        globalThis.window = dom.window;
        globalThis.document = dom.window.document;
        globalThis.HTMLElement = dom.window.HTMLElement;
        globalThis.IS_REACT_ACT_ENVIRONMENT = true;
        const container = dom.window.document.getElementById('app');
        root = createRoot(container);
        sandbox.require = (name) => {
          if (name === 'react') return React;
          if (name === 'react/jsx-runtime') return jsx;
          throw Error(`Import unavailable: ${name}`);
        };
        sandbox.React = React;
        sandbox.window = dom.window;
        sandbox.document = dom.window.document;
        sandbox.mount = async (props) => {
          await act(async () => root.render(React.createElement(exports.default, props)));
          return container;
        };
        sandbox.rerender = async (props) => {
          await act(async () => root.render(React.createElement(exports.default, props)));
        };
        sandbox.click = async (element) => {
          assert(element, 'Element missing');
          await act(async () =>
            element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })),
          );
        };
        sandbox.input = async (element, value) => {
          assert(element, 'Input missing');
          await act(async () => {
            Object.getOwnPropertyDescriptor(
              dom.window.HTMLInputElement.prototype,
              'value',
            ).set.call(element, value);
            element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
            element.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
          });
        };
        sandbox.flush = async () =>
          act(async () => {
            await Promise.resolve();
            await Promise.resolve();
          });
        sandbox.event = async (name) =>
          act(async () => dom.window.dispatchEvent(new dom.window.Event(name)));
        sandbox.resolvePromise = async (fn) =>
          act(async () => {
            fn();
            await Promise.resolve();
            await Promise.resolve();
          });
      }
      const context = vm.createContext(sandbox, {
        codeGeneration: { strings: false, wasm: false },
      });
      const run = new vm.Script(code + '\n;(async()=>{' + test.code + '\n})()', {
        filename: 'submission.js',
      });
      await Promise.race([
        run.runInContext(context, { timeout: 1200 }),
        new Promise((_, reject) =>
          globalThis.setTimeout(() => reject(Error('Test exceeded 1500ms')), 1500),
        ),
      ]);
      results.push({ name: test.name, hidden: test.hidden, passed: true });
    } catch (e) {
      results.push({
        name: test.name,
        hidden: test.hidden,
        passed: false,
        error: String(e?.message ?? e),
        expected: e?.expected,
        actual: e?.actual,
      });
    } finally {
      if (root)
        try {
          await act(async () => root.unmount());
        } catch {}
      dom?.window.close();
    }
  }
  process.send({ results, output }, () => process.exit(0));
});
