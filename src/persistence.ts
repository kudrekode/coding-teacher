import { z } from 'zod';
const attemptSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  date: z.string().datetime(),
  passed: z.boolean(),
  action: z.enum(['run', 'submit']),
  duration: z.number().nonnegative(),
  passedTests: z.number().int().nonnegative(),
  totalTests: z.number().int().nonnegative(),
});
export const progressSchema = z.object({
  version: z.literal(1),
  drafts: z.record(z.string().max(64000)),
  completed: z.record(z.string().datetime()),
  lessons: z.record(z.string().datetime()),
  attempts: z.array(attemptSchema).max(5000),
  name: z.string().max(40),
  theme: z.enum(['dark', 'light']),
});
export type Progress = z.infer<typeof progressSchema>;
export const emptyProgress = (): Progress => ({
  version: 1,
  drafts: {},
  completed: {},
  lessons: {},
  attempts: [],
  name: 'Developer',
  theme: 'dark',
});
export const STORAGE_KEY = 'forge.progress.v1';
export function loadProgress(storage: Pick<Storage, 'getItem'> = localStorage): Progress {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? progressSchema.parse(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}
export function saveProgress(progress: Progress, storage: Pick<Storage, 'setItem'> = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(progressSchema.parse(progress)));
}
export function importProgress(raw: string): Progress {
  return progressSchema.parse(JSON.parse(raw));
}
export function recordAttempt(
  progress: Progress,
  input: Omit<Progress['attempts'][number], 'id' | 'date'>,
  date = new Date().toISOString(),
): Progress {
  const completed = { ...progress.completed };
  if (input.action === 'submit' && input.passed) completed[input.exerciseId] ??= date;
  return {
    ...progress,
    completed,
    attempts: [{ ...input, id: crypto.randomUUID(), date }, ...progress.attempts].slice(0, 5000),
  };
}
export function streak(progress: Progress, now = new Date()) {
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const dates = new Set(Object.values(progress.completed).map((d) => key(new Date(d))));
  let n = 0;
  const date = new Date(now);
  if (!dates.has(key(date))) date.setDate(date.getDate() - 1);
  while (dates.has(key(date))) {
    n++;
    date.setDate(date.getDate() - 1);
  }
  return n;
}
export function xp(progress: Progress) {
  return Object.keys(progress.completed).length * 100;
}
