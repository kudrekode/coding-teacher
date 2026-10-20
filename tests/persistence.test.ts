import { describe, expect, it } from 'vitest';
import {
  emptyProgress,
  importProgress,
  loadProgress,
  recordAttempt,
  saveProgress,
  streak,
  xp,
} from '../src/persistence';
describe('local learning progress', () => {
  const attempt = {
    exerciseId: 'js-debounce',
    passed: true,
    action: 'submit' as const,
    duration: 20,
    passedTests: 3,
    totalTests: 3,
  };
  it('awards completion only for successful submissions, once per exercise', () => {
    let p = emptyProgress();
    p = recordAttempt(p, { ...attempt, action: 'run' });
    expect(xp(p)).toBe(0);
    p = recordAttempt(p, { ...attempt, passed: false });
    expect(xp(p)).toBe(0);
    p = recordAttempt(p, attempt);
    p = recordAttempt(p, attempt);
    expect(xp(p)).toBe(100);
    expect(p.attempts).toHaveLength(4);
  });
  it('round trips drafts, attempts and completions through browser storage', () => {
    let raw = '';
    const storage = {
      getItem: () => raw,
      setItem: (_key: string, v: string) => {
        raw = v;
      },
    };
    const p = recordAttempt(emptyProgress(), attempt);
    p.drafts['js-debounce'] = 'function debounce() {}';
    saveProgress(p, storage);
    expect(loadProgress(storage)).toEqual(p);
    expect(importProgress(raw)).toEqual(p);
  });
  it('rejects invalid imports and recovers from corrupt existing storage', () => {
    expect(() => importProgress('{"version":99}')).toThrow();
    expect(() => importProgress('{"__proto__":{"passed":true}}')).toThrow();
    expect(loadProgress({ getItem: () => '{broken' })).toEqual(emptyProgress());
  });
  it('counts solve-day streaks with calendar dates, including yesterday', () => {
    const p = emptyProgress();
    p.completed.a = new Date(2026, 9, 19, 12).toISOString();
    p.completed.b = new Date(2026, 9, 18, 12).toISOString();
    expect(streak(p, new Date(2026, 9, 20, 12))).toBe(2);
    p.completed.c = new Date(2026, 9, 20, 10).toISOString();
    expect(streak(p, new Date(2026, 9, 20, 12))).toBe(3);
  });
});
