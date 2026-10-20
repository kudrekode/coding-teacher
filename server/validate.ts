import { exercises, validateCurriculum } from '../curriculum/index';
import { capabilities, runExercise } from './runtime';
validateCurriculum();
let failed = 0,
  verified = 0,
  skipped = 0;
const caps = await capabilities();
for (const e of exercises) {
  if (!caps.find((c) => c.language === e.language)?.available) {
    console.log(`UNAVAILABLE ${e.id}: compiler missing; reference not executed`);
    skipped++;
    continue;
  }
  const reference = await runExercise(e, e.solution, true);
  const starter = await runExercise(e, e.starter, true);
  if (reference.passed && !starter.passed && !reference.unavailable) {
    console.log(
      `PASS ${e.id}: reference passes, starter fails (${reference.results.length} fixtures)`,
    );
    verified++;
  } else {
    console.error(`FAIL ${e.id}`, JSON.stringify({ reference, starter }));
    failed++;
  }
}
console.log(JSON.stringify({ total: exercises.length, verified, unavailable: skipped, failed }));
if (failed) process.exitCode = 1;
