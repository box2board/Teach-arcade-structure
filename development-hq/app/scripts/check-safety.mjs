import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const auth = src('../lib/neon.js'), actions = src('../app/actions.js');
const home = src('../app/page.jsx'), settings = src('../.env.example');
const pkg = JSON.parse(src('../package.json'));
const tests = [
 ['official Neon Auth SDK', () => { assert.equal(pkg.dependencies['@neon/auth'],'latest'); assert.match(auth,/from '@neon\/auth\/next\/server'/); }],
 ['Neon Postgres server-only', () => { assert.match(auth,/server-only/); assert.match(auth,/neon\(process\.env\.DATABASE_URL\)/); }],
 ['administrator ID checked', () => assert.match(auth,/user\.id !== id/)],
 ['privileged actions require admin', () => assert.ok((actions.match(/await requireAdmin\(\)/g)||[]).length>=3)],
 ['parameterized SQL', () => { assert.match(actions,/sql`INSERT INTO/); assert.match(actions,/\$\{user\.id\}/); }],
 ['disabled paid API', () => { assert.match(settings,/DEVHQ_API_MODE_ENABLED=false/); assert.match(home,/Mode 2 API billing is OFF/); }],
 ['no Supabase dependencies', () => assert.ok(!Object.keys(pkg.dependencies).some(x=>x.includes('supabase')))],
 ['Neon configuration documented', () => assert.match(src('../neon.ts'),/from '@neon\/config\/v1'/)],
 ['private sign-in', () => assert.match(src('../app/auth/sign-in/page.jsx'),/Administrator sign-in only/)]
];
let failed=0;for(const [name,fn] of tests){try{fn();console.log('PASS',name)}catch(e){failed++;console.error('FAIL',name,e.message)}}
console.log(`${tests.length-failed}/${tests.length} static checks passed`);
if(failed)process.exitCode=1;
