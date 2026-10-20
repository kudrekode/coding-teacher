import { describe, expect, it } from 'vitest';
import { exercises, tracks, validateCurriculum } from '../curriculum/index';
import { exerciseSchema } from '../curriculum/schema';
describe('curriculum registry', () => {
  it('validates every definition and registers exactly 50 unique exercises', () => {
    expect(exercises).toHaveLength(50);
    expect(new Set(exercises.map((e) => e.id)).size).toBe(50);
    for (const e of exercises) expect(exerciseSchema.safeParse(e).success, e.id).toBe(true);
  });
  it('has resolvable, acyclic prerequisite graphs and seven real paths', () => {
    expect(validateCurriculum()).toBe(true);
    expect(tracks).toHaveLength(7);
    for (const t of tracks) expect(exercises.some((e) => e.track === t.id)).toBe(true);
  });
  it('separates meaningful starters, references and independent edge fixtures', () => {
    for (const e of exercises) {
      expect(e.starter, e.id).not.toBe(e.solution);
      expect(e.tests.length, e.id).toBeGreaterThanOrEqual(2);
      expect(
        e.tests.some((t) => t.hidden),
        e.id,
      ).toBe(true);
      expect(e.hints.length, e.id).toBeGreaterThanOrEqual(2);
    }
  });
});
