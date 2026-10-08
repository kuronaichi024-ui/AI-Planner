// Regenerates src/server/db/types.ts from the linked Supabase project.
// The file is written only when the CLI succeeds, so a failed run (not logged
// in, not linked, offline) can never truncate the committed types the way a
// shell redirect would. Run it with: npm run db:types
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const OUT = 'src/server/db/types.ts';

const result = spawnSync('supabase gen types --lang typescript --linked', {
  encoding: 'utf8',
  shell: true,
  maxBuffer: 16 * 1024 * 1024,
});

if (result.status !== 0 || !result.stdout.trim()) {
  console.error(result.stderr || 'supabase gen types produced no output.');
  console.error(`${OUT} was NOT changed. Run "supabase login" and "supabase link --project-ref <ref>" first.`);
  process.exit(result.status || 1);
}

writeFileSync(OUT, result.stdout, 'utf8');
console.log(`Wrote ${OUT}`);
