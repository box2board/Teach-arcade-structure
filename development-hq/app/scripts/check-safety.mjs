import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const auth = src('../lib/supabase.js');
const actions = src('../app/actions.js');
const login = src('../app/login/actions.js');
const home = src('../app/page.jsx');
const sql = src('../../schema.sql');
const settings = src('../.env.example');
const pkg = JSON.parse(src('../package.json'));
const tests = [
  ['server-side identity and trusted metadata both checked', () => {
    assert.match(auth, /user\.id === adminId/);
    assert.match(auth, /app_metadata\?\.devhq_admin === true/);
    assert.match(auth, /auth\.getUser\(\)/);
  }],
  ['create/archive task actions require administrator', () => {
    assert.match(actions, /export async function createTask[\s\S]*?await requireAdmin\(\)/);
    assert.match(actions, /export async function archiveTask[\s\S]*?await requireAdmin\(\)/);
  }],
  ['database requires RLS and trusted admin', () => {
    assert.match(sql, /enable row level security/i);
    assert.match(sql, /auth\.uid\(\)/);
    assert.match(sql, /auth\.jwt\(\)->'app_metadata'->>'devhq_admin'/);
  }],
  ['login does not automatically register accounts', () => assert.match(login,/shouldCreateUser: false/)],
  ['mode 2 is not wired to execution or billing', () => {
    assert.match(settings, /DEVHQ_API_MODE_ENABLED=false/);
    assert.match(home, /Mode 2 API billing is OFF/);
    assert.doesNotMatch(actions, /fetch\(|openai\.responses|createCompletion|executeAgent|codex\.run/);
  }],
  ['Next and Supabase dependencies are pinned', () => {
    for (const version of Object.values(pkg.dependencies)) assert.match(version, /^\d+\.\d+\.\d+$/);
  }]
];
let failed=0;
for (const [name, run] of tests) {
  try { run(); console.log('PASS',name); }
  catch(err) { failed++; console.error('FAIL',name,err.message); }
}
console.log(`${tests.length-failed}/${tests.length} static checks passed`);
if (failed) process.exitCode=1;
