import { next } from '@vercel/functions';
import { PILOT,featureForPath,validateFlags,availability,defaultFlags } from './lib/feature-gate/policy.js';

export const config={matcher:['/brain-arcade/rv-road-trip-mayhem/:path*','/brain-arcade/chess/:path*','/brain-arcade/sudoku/:path*','/api/feature-availability']};
const noCache={'Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const configLifetime = 2000;
let cachedFlags;
let pendingRead;

function configuredMode() {
 const enabled = process.env.TA_FEATURE_GATE_ENABLED;
 const connection = process.env.TA_FEATURE_CONFIG_URL;
 if (!enabled && !connection) return 'disabled';
 if (enabled !== '1' || !connection || process.env.VERCEL_ENV !== 'preview' ||
     process.env.VERCEL_GIT_COMMIT_REF !== 'prototype/public-feature-blockers') return 'unavailable';
 return 'configured';
}

async function fetchFlags(){
 // This deployment accepts only the existing pilot store and never returns its credential.
 const url = new URL(process.env.TA_FEATURE_CONFIG_URL);
 if (url.origin !== 'https://edge-config.vercel.com' || url.username || url.password || url.hash ||
     url.pathname !== '/ecfg_2179bzbbgxjq6ry1pruzbbdhbsii/item/teach_arcade_pilot' ||
     url.searchParams.size !== 1 || !url.searchParams.get('token')) throw Error('Invalid flag configuration');
 const token = url.searchParams.get('token');
 url.search = '';
 const response = await fetch(url, {
  headers: {Authorization: 'Bearer ' + token},
  cache: 'no-store',
  redirect: 'error',
  signal: AbortSignal.timeout(1500)
 });
 if (!response.ok) throw Error('Feature config unavailable');
 return validateFlags(await response.json());
}

function readFlags(mode){
 if (mode === 'disabled') return defaultFlags();
 if (mode !== 'configured') return null;
 if (cachedFlags?.expires > Date.now()) return cachedFlags.flags;
 pendingRead ??= fetchFlags().catch(() => null).then(flags => {
  cachedFlags = {flags, expires: Date.now() + configLifetime};
  return flags;
 }).finally(() => { pendingRead = undefined; });
 return pendingRead;
}
function blockedPage(request,id,state){
 const title=PILOT[id].name;
 const label=state==='coming_soon'?'Coming Soon':state==='under_improvement'?'Under Improvement':'Temporarily Unavailable';
 const message=state==='coming_soon'?'We’re getting this game ready. Check back soon!':state==='under_improvement'?'We’re improving this experience. Check back for the next release.':'We couldn’t verify this game’s availability. Please try again shortly.';
 const path=new URL(request.url).pathname;
 const isPage=path.replace(/\/$/,'').toLowerCase()===PILOT[id].path||path.toLowerCase()===PILOT[id].path+'/index.html';
 if(!isPage&&request.headers.get('sec-fetch-dest')!=='document'&&!request.headers.get('accept')?.includes('text/html'))return new Response(null,{status:state==='unavailable'?503:403,headers:noCache});
 const art=PILOT[id].image;
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>'+title+' | Teach Arcade</title><style>body{margin:0;background:#f1f5f9;color:#0f172a;font:16px system-ui,sans-serif}main{max-width:600px;margin:6vh auto;padding:24px;text-align:center}img{width:100%;max-height:320px;object-fit:cover;border-radius:18px}span{display:inline-block;margin-top:20px;background:#fef3c7;color:#78350f;padding:8px 16px;border-radius:24px;font-weight:700}h1{font-size:36px}a{display:inline-block;background:#1d4ed8;color:white;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700}</style></head><body><main><p>TEACH ARCADE · BRAIN ARCADE</p><img src="'+art+'" alt=""><span>'+label+'</span><h1>'+title+'</h1><p>'+message+'</p><a href="/brain-arcade/">Explore other games</a></main></body></html>';
 return new Response(request.method==='HEAD'?null:html,{status:503,headers:{...noCache,'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, follow','Content-Security-Policy':"default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
}
export default async function middleware(request){
 const path=new URL(request.url).pathname;
 const statusEndpoint=path==='/api/feature-availability';
 const id=featureForPath(path);
 if(!id&&!statusEndpoint)return next();
 if(statusEndpoint&&!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...noCache,Allow:'GET, HEAD'}});
 const mode=configuredMode();
 const flags=await readFlags(mode);
 if(statusEndpoint)return new Response(request.method==='HEAD'?null:JSON.stringify({mode:flags?mode:'unavailable',features:flags??Object.fromEntries(Object.keys(PILOT).map(k=>[k,'unavailable']))}),{status:flags?200:503,headers:{...noCache,'Content-Type':'application/json'}});
 const result=availability(flags,id);
 if(result==='pass')return next();
 return blockedPage(request,id,result);
}
