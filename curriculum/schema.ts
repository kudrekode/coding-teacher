import { z } from 'zod';
export const languages = [
  'javascript',
  'typescript',
  'python',
  'react',
  'go',
  'rust',
  'swift',
] as const;
export const exerciseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(4),
  language: z.enum(languages),
  track: z.string(),
  topic: z.string(),
  difficulty: z.enum(['Foundation', 'Intermediate', 'Advanced']),
  mode: z.enum(['Implement', 'Debug', 'Build']),
  prerequisites: z.array(z.string()),
  objectives: z.array(z.string()).min(1),
  explanation: z.string().min(40),
  problem: z.string().min(20),
  starter: z.string().min(10),
  solution: z.string().min(10),
  filename: z.string(),
  examples: z.array(z.object({ input: z.string(), output: z.string() })).min(1),
  constraints: z.array(z.string()).min(1),
  hints: z.array(z.string()).min(2),
  mistakes: z.array(z.string()).min(1),
  complexity: z.string(),
  tests: z
    .array(z.object({ name: z.string(), code: z.string(), hidden: z.boolean().default(false) }))
    .min(2),
  files: z.record(z.string()).optional(),
  visualization: z.enum(['binary', 'queue', 'stack', 'event-loop']).optional(),
  framework: z.enum(['fastapi']).optional(),
  minutes: z.number().positive(),
});
export type Exercise = z.infer<typeof exerciseSchema>;
export type PublicExercise = Omit<Exercise, 'solution' | 'tests'> & {
  tests: { name: string; hidden: boolean }[];
};
export type Language = (typeof languages)[number];
export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  expected?: string;
  actual?: string;
  hidden: boolean;
}
export interface RunResult {
  exerciseId: string;
  passed: boolean;
  results: TestResult[];
  output: string[];
  diagnostics: string[];
  duration: number;
  unavailable?: boolean;
}
export interface Capability {
  language: Language;
  available: boolean;
  compilation: boolean;
  execution: boolean;
  tests: boolean;
  version: string;
  dependencies: string[];
  limitations: string;
  install: string;
}
