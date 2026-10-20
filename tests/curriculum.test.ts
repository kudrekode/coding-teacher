import { describe, expect, it } from 'vitest';
import { concepts, exercises, tracks, validateCurriculum } from '../curriculum/index';
import { validateConcepts } from '../curriculum/concepts';
import { layoutConcepts } from '../curriculum/layout';
import { exerciseSchema } from '../curriculum/schema';
describe('curriculum registry', () => {
  it('validates every definition and registers 64 unique executable exercises', () => {
    expect(exercises).toHaveLength(64);
    expect(new Set(exercises.map((e) => e.id)).size).toBe(64);
    for (const e of exercises) expect(exerciseSchema.safeParse(e).success, e.id).toBe(true);
  });
  it('maps every exercise to concepts and distinguishes delivered lessons from plans', () => {
    expect(concepts).toHaveLength(135);
    expect(concepts.filter((c) => c.status === 'lesson')).toHaveLength(53);
    for (const e of exercises)
      expect(
        concepts.some((c) => c.exercises.includes(e.id)),
        e.id,
      ).toBe(true);
    expect(exercises.some((e) => String(e.language) === 'swift')).toBe(false);
    expect(concepts.find((c) => c.id === 'ts-discriminated')?.prerequisites).toContain(
      'ts-narrowing',
    );
    expect(concepts.find((c) => c.id === 'ts-api')?.prerequisites).toContain('ts-discriminated');
  });
  it('rejects duplicate IDs, missing links, required cycles and empty lessons', () => {
    expect(() => validateConcepts([...concepts, concepts[0]], exercises)).toThrow(/Duplicate/);
    const cycle = structuredClone(concepts);
    cycle[0].prerequisites = [cycle[0].id];
    expect(() => validateConcepts(cycle, exercises)).toThrow(/cycle/);
    const broken = structuredClone(concepts);
    broken[0].related = ['missing'];
    expect(() => validateConcepts(broken, exercises)).toThrow(/Broken concept/);
    const empty = structuredClone(concepts);
    empty[0].lesson!.code = '';
    expect(() => validateConcepts(empty, exercises)).toThrow(/Empty lesson/);
  });
  it('lays out every track without overlapping nodes and with forward required edges', () => {
    for (const track of tracks) {
      const all = concepts.filter((c) => c.track === track.id),
        positions = layoutConcepts(all);
      for (const a of positions)
        for (const b of positions)
          if (a.id !== b.id)
            expect(Math.abs(a.x - b.x) >= 240 || Math.abs(a.y - b.y) >= 120).toBe(true);
      for (const c of all)
        for (const parent of c.prerequisites) {
          const p = positions.find((p) => p.id === parent);
          if (p) expect(positions.find((p) => p.id === c.id)!.x).toBeGreaterThan(p.x);
        }
    }
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
