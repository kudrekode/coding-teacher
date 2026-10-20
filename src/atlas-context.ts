import { createContext, useContext } from 'react';
import type { Capability, PublicExercise } from '../curriculum/schema';
import type { Concept } from '../curriculum/concepts';
import type { Track } from './api';
import type { Progress } from './persistence';
export type Session = {
  ids: string[];
  index: number;
  deadline: number | null;
  startedAt: number;
  endedAt?: number;
  finished: boolean;
};
export type AppContext = {
  exercises: PublicExercise[];
  tracks: Track[];
  concepts: Concept[];
  capabilities: Capability[];
  fastapi: boolean;
  progress: Progress;
  setProgress: React.Dispatch<React.SetStateAction<Progress>>;
  notify: (s: string) => void;
  session: Session | null;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
};
export const Context = createContext<AppContext>(null!);
export const useForge = () => useContext(Context);
export function conceptState(c: Concept, p: Progress) {
  const solved = c.exercises.filter((id) => p.completed[id]).length;
  const read = !!p.lessons[`concept:${c.id}`] || c.exercises.some((id) => !!p.lessons[id]);
  if (read && (!c.exercises.length || solved === c.exercises.length)) return 'Completed';
  if (solved) return 'Practised';
  if (read || c.exercises.some((id) => p.drafts[id] || p.attempts.some((a) => a.exerciseId === id)))
    return 'Exploring';
  return 'Not started';
}
