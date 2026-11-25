// Shared same-origin transport. Mutations are never automatically retried:
// a lost response does not imply that the server rejected the action.
export async function postSession(path, payload, {headers={}, timeout=10000, signal, fetchImpl=globalThis.fetch}={}) {
  const base=globalThis.location?.origin ?? 'https://local.invalid';
  const url=new URL(path,base);
  if(url.origin!==base)throw new Error('Session requests must use the same origin.');
  const controller=new AbortController();
  const abort=()=>controller.abort();
  if(signal?.aborted)abort();
  else signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(abort,timeout);
  try {
    const response=await fetchImpl(url.pathname+url.search,{
      method:'POST',credentials:'same-origin',cache:'no-store',signal:controller.signal,
      headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(payload)
    });
    const data=await response.json();
    return {status:response.status,ok:response.ok,data};
  } finally {clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}

// Schedule after completion so slow networks cannot accumulate requests.
// Return false from the task after a transient failure to enable backoff.
export function startSessionPolling(task,{interval=1000,maxDelay=8000,
  schedule=setTimeout,cancel=clearTimeout,random=Math.random}={}) {
  let stopped=false,timer,failures=0;
  async function tick(){
    if(stopped)return;
    try {failures=await task()===false?failures+1:0;}
    catch {failures++;}
    if(stopped)return;
    const base=typeof interval==='function'?interval():interval;
    const delay=failures?Math.min(maxDelay,base*2**Math.min(failures,6)):base;
    timer=schedule(tick,delay+(failures?Math.floor(random()*250):0));
  }
  void tick();
  return ()=>{stopped=true;cancel(timer);};
}

/** Poll at a start-to-start cadence, with one request in flight. */
export function createLivePolling(task, interval, timers = {}) {
  const schedule = timers.schedule ?? setTimeout;
  const cancel = timers.cancel ?? clearTimeout;
  const now = timers.now ?? (() => performance.now());
  let timer, running=false, stopped=false, immediate=false, failures=0;

  function queue(ms) {
    cancel(timer);
    timer=schedule(tick,ms);
  }
  async function tick() {
    if(stopped || running)return;
    const started=now();
    running=true;
    try { failures=await task()===false ? failures+1 : 0; }
    catch { failures++; }
    running=false;
    if(stopped)return;
    const cadence=interval();
    const delay=failures ? Math.max(300,Math.min(6000,cadence*2**Math.min(failures,6))) :
      immediate ? 0 : Math.max(12,cadence-(now()-started));
    immediate=false;
    queue(delay);
  }
  void tick();
  return {
    wake() {
      if(stopped||failures)return;
      if(running)immediate=true;
      else queue(0);
    },
    stop() { stopped=true;cancel(timer); }
  };
}
