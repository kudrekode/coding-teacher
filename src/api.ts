import type { Capability, PublicExercise, RunResult } from '../curriculum/schema';
import type { Concept } from '../curriculum/concepts';
export interface Track {
  id: string;
  name: string;
  short: string;
  color: string;
  description: string;
  level: string;
  modules: string[];
  future: string[];
}
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const r = await fetch(url, options);
  const data = await r.json();
  if (!r.ok) throw Error(data.error ?? 'Request failed');
  return data;
}
export const getCurriculum = () =>
  request<{ exercises: PublicExercise[]; tracks: Track[]; concepts: Concept[] }>('/api/curriculum');
export const getRuntimes = () =>
  request<{ capabilities: Capability[]; fastapi: boolean; security: string }>('/api/runtimes');
export const checkRuntimes = () =>
  request<{ capabilities: Capability[]; fastapi: boolean }>('/api/runtimes/self-check', {
    method: 'POST',
  });
export const runCode = (exerciseId: string, source: string, action: 'run' | 'submit') =>
  request<RunResult>('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, source, action }),
  });
export const getSolution = (id: string) =>
  request<{ solution: string }>(`/api/exercises/${id}/solution`);
