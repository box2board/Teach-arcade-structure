import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const auth = src('../lib/neon.js');
const actions = src('../app/actions.js');
const home = src('../app/page.jsx');
const sql = src('../../schema.sql');
const settings = src('../.env.example');
const pkg = JSON.parse(src('../package.json'));
const tests = [
 ['Neon Auth and server-only database',()=>{assert.match(auth,/createNeonAuth/);assert.match(auth,/server-only/);assert.match(auth,/auth\.getSession\(\)/);}],
 ['admin identifier checked on server',()=>assert.match(auth,/user\.id !== id/)],
 ['privileged actions require admin session',()=>{assert.ok((actions.match(/await requireAdmin\(\)/g)||[]).length>=3)}],
 ['SQL is bound, not interpolated into query text',()=>{assert.match(actions,/sql`INSERT INTO/);assert.match(actions,/\$\{user\.id\}/);}],
 ['mode 2 remains disabled',()=>{assert.match(settings,/DEVHQ_API_MODE_ENABLED=false/);assert.match(home,/Mode 2 API billing is OFF/)}],
 ['no Supabase dependencies',()=>assert.ok(!Object.keys(pkg.dependencies).some(x=>x.includes('supabase')))],
 ['schema targets dedicated table',()=>assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.devhq_tasks/)],
];
let failures=0;
for(const [label,run] of tests){try{run();console.log('PASS',label)}catch(e){failures++;console.error('FAIL',label,e.message)}}
console.log(`${tests.length-failures}/${tests.length} source checks passed`);
if(failures)process.exitCode=1;
