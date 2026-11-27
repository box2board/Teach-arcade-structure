import assert from 'node:assert/strict';
import middleware from '../middleware.js';
import {defaultFlags} from '../lib/feature-gate/policy.js';

const host = 'https://preview.example';
const chess = '/brain-arcade/chess/';
const request = (path, options) => middleware(new Request(host + path, options));
const status = () => request('/api/feature-availability');
const store = 'https://edge-config.vercel.com/ecfg_2179bzbbgxjq6ry1pruzbbdhbsii/item/teach_arcade_pilot';
const token = 'fixture-read-token';
const clock = Date.now;
let now = clock();
Date.now = () => now;
let calls = 0;
let flags = defaultFlags();
let failure;
globalThis.fetch = async (url, options) => {
 calls++;
 assert.equal(url.toString(), store);
 assert.equal(options.headers.Authorization, 'Bearer ' + token);
 assert.equal(options.redirect, 'error');
 assert.ok(options.signal instanceof AbortSignal);
 await Promise.resolve();
 if (failure === 'invalid-token') return new Response(null, {status: 401});
 if (failure === 'offline') throw new TypeError('Network error');
 if (failure === 'slow') {
  await new Promise((resolve, reject) => {
   const timer = setTimeout(resolve, 3000);
   options.signal.addEventListener('abort', () => {
    clearTimeout(timer);
    reject(options.signal.reason);
   }, {once: true});
  });
 }
 return Response.json(flags);
};

delete process.env.TA_FEATURE_GATE_ENABLED;
delete process.env.TA_FEATURE_CONFIG_URL;
assert.equal((await (await status()).json()).mode, 'disabled');
assert.equal(calls, 0);
process.env.TA_FEATURE_GATE_ENABLED = '1';
assert.equal((await request(chess)).status, 503);
assert.equal(calls, 0);
process.env.VERCEL_ENV = 'preview';
process.env.VERCEL_GIT_COMMIT_REF = 'prototype/public-feature-blockers';
process.env.TA_FEATURE_CONFIG_URL = store + '?token=' + token;

assert.equal((await (await status()).json()).mode, 'configured');
assert.equal((await request(chess)).headers.get('x-middleware-next'), '1');
const priorCalls = calls;
now += 2001;
flags['brain-chess'] = 'coming_soon';
const classroom = await Promise.all(Array.from({length: 40}, () => request(chess)));
assert.ok(classroom.every(response => response.status === 503));
assert.equal(calls - priorCalls, 1);
assert.match(await classroom[0].text(), /Coming Soon/);
assert.equal((await request(chess + 'index.html')).status, 503);
assert.equal((await request(chess + 'script.js')).status, 403);
assert.equal((await request('/brain-arcade/sudoku/')).headers.get('x-middleware-next'), '1');
assert.equal((await request('/brain-arcade/rv-road-trip-mayhem/')).headers.get('x-middleware-next'), '1');
assert.equal((await request('/brain-arcade/word-search/')).headers.get('x-middleware-next'), '1');

now += 2001;
flags['brain-chess'] = 'under_improvement';
assert.match(await (await request(chess)).text(), /Under Improvement/);
now += 2001;
flags['brain-chess'] = 'live';
assert.equal((await request(chess)).headers.get('x-middleware-next'), '1');

for (failure of ['invalid-token', 'offline', 'slow', 'malformed']) {
 now += 2001;
 if (failure === 'malformed') flags = {};
 const unavailable = await status();
 assert.equal(unavailable.status, 503);
 assert.equal((await unavailable.json()).features['brain-chess'], 'unavailable');
 assert.equal((await request(chess + 'script.js')).status, 503);
}
assert.equal((await request('/api/feature-availability', {method: 'POST'})).status, 405);
assert.equal((await request('/assets/styles.css')).headers.get('x-middleware-next'), '1');

console.log('Middleware request tests passed, including 40 concurrent requests and four provider failure scenarios.');
