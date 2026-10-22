import type { Concept } from './concepts';
export function layoutConcepts(concepts: Concept[]) {
  const local = new Map(concepts.map((c) => [c.id, c]));
  const ranks = new Map<string, number>();
  const rank = (id: string): number => {
    if (ranks.has(id)) return ranks.get(id)!;
    const parents = local.get(id)!.prerequisites.filter((p) => local.has(p));
    const n = parents.length ? Math.max(...parents.map(rank)) + 1 : 0;
    ranks.set(id, n);
    return n;
  };
  const rows = new Map<number, number>();
  return concepts.map((c) => {
    const depth = rank(c.id),
      row = rows.get(depth) ?? 0;
    rows.set(depth, row + 1);
    return { id: c.id, x: depth * 292, y: row * 158 };
  });
}
