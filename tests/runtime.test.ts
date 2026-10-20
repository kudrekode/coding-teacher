import { describe, expect, it } from 'vitest';
import { exercises } from '../curriculum/index';
import { capabilities, runExercise } from '../server/runtime';
const exercise = (id: string) => exercises.find((e) => e.id === id)!;
describe('real runtime adapters', () => {
  it('reports all runtimes and their real availability', async () => {
    const caps = await capabilities();
    expect(caps).toHaveLength(7);
    expect(caps.find((c) => c.language === 'typescript')?.available).toBe(true);
    for (const c of caps) expect(c.execution).toBe(c.available);
  });
  it('grades correct and incorrect JavaScript independently', async () => {
    const e = exercise('js-debounce');
    expect((await runExercise(e, e.starter, true)).passed).toBe(false);
    const good = await runExercise(e, e.solution, true);
    expect(good.passed).toBe(true);
    expect(good.results).toHaveLength(3);
  });
  it('surfaces a runtime error', async () => {
    const result = await runExercise(
      exercise('js-once'),
      'throw new Error("broken runtime");',
      true,
    );
    expect(result.passed).toBe(false);
    expect(result.results[0].error).toContain('broken runtime');
  });
  it('checks TypeScript types with the actual compiler', async () => {
    const e = exercise('ts-pick');
    const bad = await runExercise(e, e.starter, true);
    expect(bad.passed).toBe(false);
    expect(bad.diagnostics.join(' ')).toContain('TS2578');
    expect((await runExercise(e, e.solution, true)).passed).toBe(true);
  });
  it('interrupts infinite loops', async () => {
    const result = await runExercise(exercise('js-once'), 'while (true) {}', true);
    expect(result.passed).toBe(false);
    expect(JSON.stringify(result)).toMatch(/timed out|timeout/i);
    expect(result.duration).toBeLessThan(6500);
  });
  it('executes real Python and catches incorrect output', async () => {
    const e = exercise('py-window');
    const good = await runExercise(e, e.solution, true);
    if (good.unavailable) return;
    expect(good.passed, JSON.stringify(good)).toBe(true);
    expect((await runExercise(e, e.starter, true)).passed).toBe(false);
  });
  it('runs actual React component events and catches the batching bug', async () => {
    const e = exercise('react-stale');
    expect((await runExercise(e, e.starter, true)).passed).toBe(false);
    const result = await runExercise(e, e.solution, true);
    expect(result.passed, JSON.stringify(result)).toBe(true);
  });
  it('sends actual requests through FastAPI validation and duplicate logic', async () => {
    const e = exercise('py-fastapi-users'),
      result = await runExercise(e, e.solution, true);
    if (result.unavailable) return;
    expect(result.passed, JSON.stringify(result)).toBe(true);
    expect((await runExercise(e, e.starter, true)).passed).toBe(false);
  });
  it('returns honest unavailable states or executes native compilers', async () => {
    const caps = await capabilities();
    for (const id of ['go-pointer', 'rust-borrow', 'swift-optionals']) {
      const e = exercise(id),
        result = await runExercise(e, e.solution, true);
      if (!caps.find((c) => c.language === e.language)?.available) {
        expect(result.unavailable).toBe(true);
        expect(result.passed).toBe(false);
      } else expect(result.passed, JSON.stringify(result)).toBe(true);
    }
  });
});
