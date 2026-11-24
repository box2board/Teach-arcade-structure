import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiPaths, json, serveSession } from './http.js';
import { openRoomDatabase } from './database/sqlite.js';

const root = fileURLToPath(new URL('../../public/',import.meta.url));
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const reviewEnabled = process.env.MIDWAY_REVIEW==='true';
const proxyKey = process.env.MULTIPLAYER_SERVICE_SECRET;
const databasePath = process.env.MIDWAY_DB || ':memory:';
if (process.env.NODE_ENV==='production' && !reviewEnabled && (!proxyKey || databasePath===':memory:')) {
  throw Error('Set the multiplayer proxy key and durable room database path before starting production.');
}
const db = openRoomDatabase(databasePath);
db.expire(Date.now());
setInterval(() => db.expire(Date.now()), 3600000).unref();

function trusted(value) {
  if (!value || !proxyKey) return false;
  const expected = Buffer.from(proxyKey);
  const actual = Buffer.from(value);
  return actual.length===expected.length && timingSafeEqual(actual,expected);
}

async function handle(req) {
  const proxied = trusted(req.headers['x-midway-proxy-key']);
  const base = proxied ? req.headers['x-midway-origin'] :
    (req.headers['x-forwarded-proto']==='https' ? 'https://' : 'http://')+req.headers.host;
  const url = new URL(req.url,base);
  if (url.pathname==='/health') return json({ok:true});
  if (apiPaths.has(url.pathname)) {
    if (proxyKey && !proxied) return json({error:'Connect through Teach Arcade.'},403);
    let body;
    let accounts;
    if (req.method==='POST') {
      const chunks=[];
      let length=0;
      for await (const chunk of req) {
        length+=chunk.length;
        if (length>1000000) return json({error:'Request too large.'},413);
        chunks.push(chunk);
      }
      body=Buffer.concat(chunks).toString('utf8');
      if (proxied) {
        let envelope;
        try { envelope=JSON.parse(body); }
        catch { return json({error:'Invalid request.'},400); }
        body=JSON.stringify(envelope.request);
        if (envelope.bank) accounts={configured:true,bank:() => envelope.bank};
      }
    }
    return serveSession(new Request(url,{method:req.method,headers:req.headers,body}),db,{accounts,reviewEnabled:reviewEnabled&&!proxied});
  }
  if (req.method!=='GET' && req.method!=='HEAD') return new Response(null,{status:405});
  if (url.pathname==='/') return Response.redirect(new URL('/multiplayer/',url),302);
  const allowed = ['/multiplayer','/mini-games/vendor/','/mini-games/shared/midway-characters/'];
  if (!allowed.some(prefix => url.pathname.startsWith(prefix))) return new Response(null,{status:404});
  const path = resolve(root,'.'+decodeURIComponent(url.pathname));
  if (!path.startsWith(resolve(root)+sep)) return new Response(null,{status:404});
  if (['/multiplayer','/multiplayer/join','/multiplayer/project','/multiplayer/mayhem'].includes(url.pathname)) {
    url.pathname+='/';
    return Response.redirect(url,302);
  }
  const file = url.pathname.endsWith('/') ? resolve(path,'index.html') : path;
  const type = mime[extname(file)];
  if (!type) return new Response(null,{status:404});
  const data = await readFile(file).catch(() => null);
  if (!data) return new Response(null,{status:404});
  return new Response(req.method==='HEAD'?null:data,{headers:{'Content-Type':type,'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'}});
}

createServer(async (req,res) => {
  let response;
  try { response=await handle(req); }
  catch (error) {
    console.error('Multiplayer request failed:',error.name);
    response=json({error:'Multiplayer could not respond. Try again.'},500);
  }
  res.writeHead(response.status,Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(Number(process.env.PORT || 4173),'0.0.0.0');
