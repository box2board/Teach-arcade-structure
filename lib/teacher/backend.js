// Server-only REST boundary. Requests use the teacher JWT, never a service-role key.
export function settings() {
 const {SUPABASE_URL:url,SUPABASE_ANON_KEY:key,TEACHER_APP_ORIGIN:origin}=process.env;
 return url && key && origin && process.env.TEACHER_AUTH_ENABLED==='true' ? {url:url.replace(/\/$/,''),key,origin} : null;
}
export async function backend(path,{token,method='GET',body}={}) {
 const config=settings();
 const response=await fetch(config.url+path,{method,signal:AbortSignal.timeout(10000),headers:{apikey:config.key,...(token?{Authorization:`Bearer ${token}`} : {}),'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json().catch(()=>null);
 if(!response.ok){
  const error=new Error('Account service request failed.');error.status=response.status;
  if(response.status===429){
   const header=response.headers.get('Retry-After');
   const message=typeof data?.msg==='string'?data.msg:typeof data?.message==='string'?data.message:'';
   const seconds=header&&/^\d+$/.test(header)?Number(header):header&&!Number.isNaN(Date.parse(header))?Math.ceil((Date.parse(header)-Date.now())/1000):Number(message.match(/after (\d+) seconds?\b/i)?.[1]);
   if(Number.isFinite(seconds)&&seconds>0&&seconds<=86400)error.retryAfter=Math.ceil(seconds);
  }
  throw error;
 }
 return data;
}
export function readToken(req) {
 const raw=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('__Host-ta_session='));
 return raw?.slice('__Host-ta_session='.length)||null;
}
export function sessionCookie(token,seconds=0) {
 return `__Host-ta_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0,Math.min(seconds,3600))}`;
}
