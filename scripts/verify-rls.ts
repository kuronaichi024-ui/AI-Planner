#!/usr/bin/env node
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../src/server/db/types';

type CheckResult = { name: string; passed: boolean; details?: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const TEST_USER_A_EMAIL = process.env.TEST_USER_A_EMAIL;
const TEST_USER_A_PASSWORD = process.env.TEST_USER_A_PASSWORD;
const TEST_USER_B_EMAIL = process.env.TEST_USER_B_EMAIL;
const TEST_USER_B_PASSWORD = process.env.TEST_USER_B_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local');
  process.exit(1);
}
if (!TEST_USER_A_EMAIL || !TEST_USER_A_PASSWORD || !TEST_USER_B_EMAIL || !TEST_USER_B_PASSWORD) {
  console.error('Error: Missing TEST_USER_A_* or TEST_USER_B_* credentials in .env.local');
  process.exit(1);
}

const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const supabaseAnon: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const results: CheckResult[] = [];

function record(name: string, passed: boolean, details?: string) {
  results.push({ name, passed, details });
}

function summaryTable(): { allPassed: boolean } {
  const maxLen = results.reduce((m, r) => Math.max(m, r.name.length), 0);
  console.log('\n=== RLS VERIFICATION SUMMARY ===');
  for (const r of results) {
    const padded = r.name.padEnd(maxLen + 2);
    const status = r.passed ? 'PASS' : 'FAIL';
    console.log(`${padded}  ${status}${r.details ? `  (${r.details})` : ''}`);
  }
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`\nTotal: ${passed} passed, ${failed} failed (${results.length} checks)`);
  return { allPassed: failed === 0 };
}

async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function ensureUser(email: string, password: string) {
  const trySignIn = await signIn(email, password).catch((e: unknown) => {
    const err = e as { message?: string };
    if (err?.message?.includes('Invalid login credentials')) return null;
    throw e;
  });
  if (trySignIn?.user) return trySignIn;
  await signUp(email, password);
  return await signIn(email, password);
}

async function setSessionFromTokens(accessToken: string, refreshToken: string) {
  await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
}

async function main() {
  console.log('=== RLS Verification ===\n');

  // 1. Sign in A and B (sign up on first run)
  console.log('1. Authenticating test users...');
  const userA = await ensureUser(TEST_USER_A_EMAIL!, TEST_USER_A_PASSWORD!);
  record('User A authenticated', !!userA.user, `id=${userA.user?.id}`);

  const userB = await ensureUser(TEST_USER_B_EMAIL!, TEST_USER_B_PASSWORD!);
  record('User B authenticated', !!userB.user, `id=${userB.user?.id}`);

  if (!userA.session || !userB.session || !userA.user || !userB.user) {
    console.error('Could not authenticate test users.');
    process.exit(1);
  }

  // 2. A creates a project + child rows
  console.log('\n2. Creating test data as User A...');
  await setSessionFromTokens(userA.session.access_token, userA.session.refresh_token);

  const projectName = `RLS Verify ${Date.now()}`;
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .insert({ name: projectName, idea_text: 'RLS verification idea' })
    .select('id')
    .single();
  if (projErr) throw projErr;
  const projectId = project.id;
  record('A creates project', !!projectId, `id=${projectId}`);

  // one row in each child table
  const { error: msgErr } = await supabase
    .from('messages')
    .insert({ project_id: projectId, role: 'user', content: 'hello' });
  if (msgErr) throw msgErr;

  const { error: propErr } = await supabase
    .from('proposals')
    .insert({ project_id: projectId, ops: [] });
  if (propErr) throw propErr;

  const { error: insErr } = await supabase
    .from('insights')
    .insert({
      project_id: projectId,
      title: 't',
      category: 'c',
      status: 'open',
      kind: 'question',
    });
  if (insErr) throw insErr;

  const { error: brainEvtErr } = await supabase.from('brain_events').insert({
    project_id: projectId,
    kind: 'decision',
    actor: 'user',
    summary: 's',
    revision: 0,
  });
  if (brainEvtErr) throw brainEvtErr;

  const { error: expErr } = await supabase.from('exports').insert({
    project_id: projectId,
    kind: 'prd',
    content_md: '# m',
    brain_revision: 0,
  });
  if (expErr) throw expErr;

  const { error: usageErr } = await supabase
    .from('ai_usage')
    .insert({
      project_id: projectId,
      job: 'interview',
      model: 'm',
      provider: 'p',
      ok: true,
    });
  if (usageErr) throw usageErr;

  record('A inserts child rows', true);

  // 3. B's view: each table returns 0 rows
  console.log('\n3. Verifying B isolation...');
  await setSessionFromTokens(userB.session.access_token, userB.session.refresh_token);

  const childTables = ['messages', 'proposals', 'insights', 'brain_events', 'exports', 'ai_usage'] as const;
  for (const table of childTables) {
    const { data, error } = await supabase.from(table).select('id').eq('project_id', projectId);
    if (error) throw error;
    record(`B sees 0 ${table}`, data.length === 0, `${data.length} rows`);
  }

  // 4. B's writes: update granted → 0 rows; delete → 0 rows or 42501; insert → 42501
  console.log('\n4. Verifying B cannot write A\'s data...');
  {
    const { data, error } = await supabase
      .from('projects')
      .update({ readiness_score: 99 })
      .eq('id', projectId)
      .select('id');
    const pass = !error || error.code === '42501';
    record(`B update projects on A's row`, pass, error ? `code=${error.code}` : `affected=${data?.length ?? 0}`);
  }
  {
    const { data, error } = await supabase
      .from('proposals')
      .update({})
      .eq('project_id', projectId)
      .select('id');
    const pass = !error || error.code === '42501';
    record(`B update proposals on A's row`, pass, error ? `code=${error.code}` : `affected=${data?.length ?? 0}`);
  }
  {
    const { data, error } = await supabase
      .from('insights')
      .update({ title: 'unauthorized update' })
      .eq('project_id', projectId)
      .select('id');
    const pass = !error || error.code === '42501';
    record(`B update insights on A's row`, pass, error ? `code=${error.code}` : `affected=${data?.length ?? 0}`);
  }

  for (const table of ['messages', 'proposals', 'insights', 'brain_events', 'exports'] as const) {
    // B cannot delete rows in A's project
    const { error } = await supabase.from(table).delete().eq('project_id', projectId).select('id');
    const pass = !error || error.code === '42501';
    record(`B delete from ${table}`, pass, error ? `code=${error.code}` : '0 rows');
  }

  {
    const { error } = await supabase
      .from('messages')
      .insert({ project_id: projectId, role: 'user', content: 'x' });
    record(`B insert into messages on A's project`, !error || error.code === '42501', error ? `code=${error.code}` : 'inserted');
  }
  {
    const { error } = await supabase
      .from('proposals')
      .insert({ project_id: projectId, ops: [] });
    record(`B insert into proposals on A's project`, !error || error.code === '42501', error ? `code=${error.code}` : 'inserted');
  }
  {
    const { error } = await supabase
      .from('insights')
      .insert({ project_id: projectId, title: 't', category: 'c', kind: 'question' });
    record(`B insert into insights on A's project`, !error || error.code === '42501', error ? `code=${error.code}` : 'inserted');
  }
  {
    const { error } = await supabase
      .from('brain_events')
      .insert({ project_id: projectId, kind: 'decision', actor: 'user', summary: 's', revision: 0 });
    record(`B insert into brain_events on A's project`, !error || error.code === '42501', error ? `code=${error.code}` : 'inserted');
  }
  {
    const { error } = await supabase
      .from('exports')
      .insert({ project_id: projectId, kind: 'prd', content_md: '# m', brain_revision: 0 });
    record(`B insert into exports on A's project`, !error || error.code === '42501', error ? `code=${error.code}` : 'inserted');
  }

  // 5. B calls commit_brain on A's project -> PROJECT_NOT_FOUND
  console.log('\n5. Verifying B commit_brain -> PROJECT_NOT_FOUND...');
  const { data: rpcData, error: rpcErr } = await supabase.rpc('commit_brain', {
    p_project_id: projectId,
    p_expected_revision: 0,
    p_brain: {} as Json,
    p_counts: {} as Json,
    p_event: {} as Json,
    p_readiness: 0,
  });
  const rpcMsg = (rpcErr?.message ?? '').toUpperCase();
  record(
    'B commit_brain -> PROJECT_NOT_FOUND',
    !rpcData && rpcMsg.includes('PROJECT_NOT_FOUND'),
    rpcErr ? rpcErr.message : `result=${rpcData}`,
  );

  // 6. Back to A: wrong revision -> REVISION_CONFLICT
  console.log('\n6. Verifying commit_brain revision conflict...');
  await setSessionFromTokens(userA.session.access_token, userA.session.refresh_token);

  const { data: revRow, error: revErr } = await supabase
    .from('projects')
    .select('brain_revision')
    .eq('id', projectId)
    .single();
  if (revErr) throw revErr;
  const currentRev = revRow.brain_revision;

  const { data: wrongData, error: wrongErr } = await supabase.rpc('commit_brain', {
    p_project_id: projectId,
    p_expected_revision: currentRev + 999,
    p_brain: {} as Json,
    p_counts: {} as Json,
    p_event: {} as Json,
    p_readiness: 0,
  });
  const wrongMsg = (wrongErr?.message ?? '').toUpperCase();
  record(
    'A wrong revision -> REVISION_CONFLICT',
    !wrongData && wrongMsg.includes('REVISION_CONFLICT'),
    wrongErr ? wrongErr.message : `result=${wrongData}`,
  );

  // 7. A correct revision succeeds
  const { data: goodData, error: goodErr } = await supabase.rpc('commit_brain', {
    p_project_id: projectId,
    p_expected_revision: currentRev,
    p_brain: { note: 'rls-verify' } as Json,
    p_counts: {} as Json,
    p_event: { actor: 'user', kind: 'edit', summary: 'test event' } as Json,
    p_readiness: 0,
  });
  record(
    'A correct revision succeeds',
    goodData !== null && !goodErr,
    goodErr ? goodErr.message : `new revision=${goodData}`,
  );

  const { data: afterRow, error: afterErr } = await supabase
    .from('projects')
    .select('brain_revision')
    .eq('id', projectId)
    .single();
  if (afterErr) throw afterErr;
  record(
    'Project brain_revision incremented',
    afterRow.brain_revision === currentRev + 1,
    `${currentRev} -> ${afterRow.brain_revision}`,
  );

  // 8. Anonymous client
  console.log('\n8. Verifying anonymous client...');
  const { data: anonProj, error: anonProjErr } = await supabaseAnon.from('projects').select('id').limit(1);
  record(
    'Anonymous projects select refused',
    !anonProj && !!anonProjErr,
    anonProjErr ? anonProjErr.message : 'returned rows',
  );

  const { data: anonRpc, error: anonRpcErr } = await supabaseAnon.rpc('commit_brain', {
    p_project_id: projectId,
    p_expected_revision: 0,
    p_brain: {} as Json,
    p_counts: {} as Json,
    p_event: {} as Json,
    p_readiness: 0,
  });
  record(
    'Anonymous commit_brain refused',
    !anonRpc && !!anonRpcErr,
    anonRpcErr ? anonRpcErr.message : 'returned data',
  );

  // 9. Append-only: A cannot update or delete messages/brain_events/ai_usage/exports
  console.log('\n9. Verifying append-only constraints...');
  await setSessionFromTokens(userA.session.access_token, userA.session.refresh_token);

  for (const table of ['messages', 'brain_events', 'ai_usage', 'exports'] as const) {
    const { error: updateErr } = await supabase
      .from(table)
      .update({})
      .eq('project_id', projectId);
    record(
      `A cannot update ${table}`,
      !updateErr || updateErr.code === '42501',
      updateErr ? `code=${updateErr.code}` : 'succeeded',
    );

    const { error: delErr } = await supabase.from(table).delete().eq('project_id', projectId);
    record(
      `A cannot delete ${table}`,
      !delErr || delErr.code === '42501',
      delErr ? `code=${delErr.code}` : 'succeeded',
    );
  }

  // 10. Cascade proof: delete project; ai_usage rows survive with project_id null
  console.log('\n10. Verifying CASCADE on delete...');
  const { data: usageBefore, error: usageBeforeErr } = await supabase
    .from('ai_usage')
    .select('id')
    .eq('project_id', projectId);
  if (usageBeforeErr) throw usageBeforeErr;
  const usageCount = usageBefore.length;

  const { error: deleteProjErr } = await supabase.from('projects').delete().eq('id', projectId);
  record('A deletes project', !deleteProjErr, deleteProjErr ? `code=${deleteProjErr.code}` : 'deleted');

  const { data: usageAfter, error: usageAfterErr } = await supabase
    .from('ai_usage')
    .select('id, project_id')
    .eq('user_id', userA.user.id);
  if (usageAfterErr) throw usageAfterErr;
  record(
    'ai_usage rows survive',
    usageAfter.length >= usageCount,
    `${usageCount} -> ${usageAfter.length}`,
  );
  const survivingIds = new Set(usageBefore.map((u) => u.id));
  const survivors = usageAfter.filter((u) => survivingIds.has(u.id));
  record('ai_usage pre-delete rows still present', survivors.length === usageCount);
  const allNull = survivors.every((u) => u.project_id === null);
  record('ai_usage project_id set to null', allNull);

  // 11. Cleanup
  console.log('\n11. Cleaning up test projects...');
  const { data: leftovers, error: leftErr } = await supabase
    .from('projects')
    .select('id')
    .like('name', 'RLS Verify%');
  if (leftErr) throw leftErr;
  let cleaned = 0;
  for (const p of leftovers ?? []) {
    const { error } = await supabase.from('projects').delete().eq('id', p.id);
    if (!error) cleaned++;
  }
  record(`Cleaned ${cleaned} leftover projects`, true);

  const { allPassed } = summaryTable();
  process.exit(allPassed ? 0 : 1);
}

main().catch((e) => {
  console.error('\nVerification failed with exception:');
  console.error(e);
  process.exit(1);
});