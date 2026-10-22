import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { concepts, exercises, tracks } from '../curriculum/index';
import { capabilities, frameworkReady, runExercise } from './runtime';
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  const host = req.headers.host ?? '';
  if (!/^(127\.0\.0\.1|localhost):(4318|5174)$/.test(host))
    return void res.status(403).json({ error: 'Forge only accepts loopback requests.' });
  const origin = req.headers.origin;
  if (
    origin &&
    ![
      'http://127.0.0.1:5174',
      'http://localhost:5174',
      'http://127.0.0.1:4318',
      'http://localhost:4318',
    ].includes(origin)
  )
    return void res.status(403).json({ error: 'Cross-origin execution is disabled.' });
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'Forge' }));
app.get('/api/curriculum', (_req, res) =>
  res.json({
    tracks,
    concepts,
    exercises: exercises.map(({ solution: _solution, tests, ...e }) => ({
      ...e,
      tests: tests.map(({ name, hidden }) => ({ name, hidden })),
    })),
  }),
);
app.get('/api/runtimes', async (_req, res) =>
  res.json({
    capabilities: await capabilities(),
    fastapi: await frameworkReady(),
    security:
      'Trusted local use only. This service is bound to 127.0.0.1; subprocess isolation is not an OS sandbox.',
  }),
);
app.post('/api/runtimes/self-check', async (_req, res) => {
  if (active)
    return void res
      .status(429)
      .json({ error: 'The runner is busy. Wait for the current check or submission.' });
  active = true;
  try {
    res.json({ capabilities: await capabilities(true), fastapi: await frameworkReady(true) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Self-check failed' });
  } finally {
    active = false;
  }
});
app.get('/api/exercises/:id/solution', (req, res) => {
  const e = exercises.find((e) => e.id === req.params.id);
  if (!e) return void res.status(404).json({ error: 'Exercise not found' });
  res.json({ solution: e.solution });
});
const runSchema = z.object({
  exerciseId: z.string(),
  source: z.string().min(1).max(64000),
  action: z.enum(['run', 'submit']),
});
let active = false;
app.post('/api/run', async (req, res) => {
  const parsed = runSchema.safeParse(req.body);
  if (!parsed.success)
    return void res.status(400).json({
      error: 'Provide an exerciseId, source (1–64000 characters) and action (run or submit).',
    });
  if (active)
    return void res
      .status(429)
      .json({ error: 'The runner is busy. Wait for the current exercise to finish.' });
  const e = exercises.find((e) => e.id === parsed.data.exerciseId);
  if (!e) return void res.status(404).json({ error: 'Exercise not found' });
  active = true;
  try {
    res.json(await runExercise(e, parsed.data.source, parsed.data.action === 'submit'));
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : 'Execution service failed' });
  } finally {
    active = false;
  }
});
if (process.argv.includes('--production')) {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
  app.use(express.static(dist));
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) =>
  res.status(400).json({ error: error.message ?? 'Invalid request' }),
);
app.listen(4318, '127.0.0.1', () =>
  console.log('Forge execution service: http://127.0.0.1:4318 (trusted local use only)'),
);
