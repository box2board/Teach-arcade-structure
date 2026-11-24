import {apiPaths, json, serveSession} from './http.js';

const authMessage = new TextEncoder().encode('teach-arcade-midway');
const hmac = {name:'HMAC',hash:'SHA-256'};
const encoder = new TextEncoder();
const productionOrigins = new Set(['https://www.teacharcade.com','https://teacharcade.com']);
const maxEnvelopeBytes = 1_000_000;
const roomLifetimeMs = 86_400_000;

async function authorized(supplied, expected) {
  if (!supplied || !expected || supplied.length>512) return false;
  const candidate = await crypto.subtle.importKey('raw',encoder.encode(supplied),hmac,false,['sign']);
  const key = await crypto.subtle.importKey('raw',encoder.encode(expected),hmac,false,['verify']);
  const signature = await crypto.subtle.sign(hmac,candidate,authMessage);
  return crypto.subtle.verify(hmac,key,signature,authMessage);
}

function roomBinding(binding, tablePrefix) {
  const rooms = tablePrefix+'_rooms';
  const codes = tablePrefix+'_lobby_codes';
  return {
    prepare(sql) {
      return binding.prepare(sql.replaceAll('mayhem_rooms',rooms).replaceAll('lobby_codes',codes));
    },
    async expire() {
      const cutoff = Date.now()-roomLifetimeMs;
      await binding.batch([
        binding.prepare('DELETE FROM '+codes+' WHERE code IN (SELECT code FROM '+rooms+' WHERE updated_at < ?)').bind(cutoff),
        binding.prepare('DELETE FROM '+rooms+' WHERE updated_at < ?').bind(cutoff)
      ]);
    }
  };
}

// The playtest Worker calls this for requests bearing X-Midway-Proxy-Key.
// Its own browser requests continue using the separate playtest tables.
export async function serveTeachArcadeProxy(request, env) {
  const path = new URL(request.url).pathname;
  if (!apiPaths.has(path)) return json({error:'Unknown room route.'},404);
  if (request.method!=='POST') return json({error:'Use POST.'},405);
  if (!await authorized(request.headers.get('X-Midway-Proxy-Key'),env.MULTIPLAYER_SERVICE_SECRET)) {
    return json({error:'Connect through Teach Arcade.'},403);
  }
  const origin = request.headers.get('X-Midway-Origin');
  const production = productionOrigins.has(origin);
  const previews = (env.MULTIPLAYER_PREVIEW_ORIGINS??'').split(',').map(value=>value.trim()).filter(Boolean);
  if (!production && !previews.includes(origin)) return json({error:'Invalid request origin.'},403);
  if (!env.DB) return json({error:'Room storage is unavailable.'},503);

  if (Number(request.headers.get('content-length'))>maxEnvelopeBytes) return json({error:'Request too large.'},413);
  const raw = await request.text();
  if (encoder.encode(raw).length>maxEnvelopeBytes) return json({error:'Request too large.'},413);

  let envelope;
  try { envelope=JSON.parse(raw); }
  catch { return json({error:'Invalid request.'},400); }
  const input = envelope?.request;
  if (!input || typeof input!=='object' || Array.isArray(input)) return json({error:'Invalid request.'},400);
  const bank = envelope.bank;
  const accounts = bank ? {
    configured:true,
    bank:reference=>reference===bank.id && Array.isArray(bank.questions) ? bank : null
  } : undefined;

  const database = roomBinding(env.DB,production?'teach_arcade':'teach_arcade_preview');
  if (path==='/api/multiplayer' && input.action==='create') await database.expire();
  return serveSession(new Request(new URL(path,origin),{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)
  }),database,{accounts});
}
