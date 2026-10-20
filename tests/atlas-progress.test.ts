import { describe, expect, it } from 'vitest';
import { conceptState } from '../src/atlas-context';
import { concepts } from '../curriculum/index';
import { emptyProgress, importProgress, recordAttempt } from '../src/persistence';
describe('concept activity migration', () => {
  it('keeps v1 exercise drafts, retired data and completions without resetting storage', () => {
    const p = emptyProgress();
    p.drafts['swift-optionals'] = 'archived draft';
    p.completed['js-debounce'] = new Date().toISOString();
    const imported = importProgress(JSON.stringify(p));
    expect(imported.drafts['swift-optionals']).toBe('archived draft');
    expect(conceptState(concepts.find((c) => c.id === 'js-debounce')!, imported)).toBe('Practised');
  });
  it('separates reading, running and successful submissions', () => {
    const c = concepts.find((c) => c.id === 'go-pointers')!;
    let p = emptyProgress();
    expect(conceptState(c, p)).toBe('Not started');
    p.lessons[`concept:${c.id}`] = new Date().toISOString();
    expect(conceptState(c, p)).toBe('Exploring');
    p = recordAttempt(p, {
      exerciseId: 'go-pointer',
      action: 'run',
      passed: true,
      duration: 1,
      passedTests: 2,
      totalTests: 2,
    });
    expect(conceptState(c, p)).toBe('Exploring');
    p = recordAttempt(p, {
      exerciseId: 'go-pointer',
      action: 'submit',
      passed: true,
      duration: 1,
      passedTests: 2,
      totalTests: 2,
    });
    expect(conceptState(c, p)).toBe('Completed');
  });
});
