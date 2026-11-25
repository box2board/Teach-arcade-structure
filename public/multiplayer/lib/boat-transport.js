// HTTPS stays available while a new socket proves it can read this exact seat and round.
export function openBoatTransport({url,credentials,initial,onMode,open=url=>new WebSocket(url)}) {
  let socket,ready=false,pending,timer,closed=false;
  function stop(){
    if(closed)return;
    closed=true;
    ready=false;
    clearTimeout(timer);
    pending?.reject(new Error('Socket closed'));
    pending=null;
    socket?.close();
  }
  function fallback(){
    if(closed)return;
    stop();
    onMode('HTTPS fallback');
  }
  onMode('HTTPS');
  try {
    socket=open(url);
    timer=setTimeout(fallback,3000);
    socket.onopen=()=>{if(!closed)socket.send(JSON.stringify({...credentials,action:'hello'}));};
    socket.onmessage=event=>{
      if(closed)return;
      try{
        const reply=JSON.parse(event.data);
        if(!ready){
          const state=reply.state;
          if(reply.status!==200||state?.code!==initial.code||state.since!==initial.since||
             state.phase!=='mini'||state.game!=='bumper-boats'||
             !state.player||state.player.miniPlayerId!==initial.player.miniPlayerId)return fallback();
          clearTimeout(timer);
          ready=true;
        }else if(pending){
          clearTimeout(timer);
          if(reply.status>=500)return fallback();
          pending.resolve(reply);
          pending=null;
          onMode('WebSocket');
        }
      }catch{fallback();}
    };
    socket.onerror=fallback;
    socket.onclose=fallback;
  }catch{fallback();}
  return {
    stop,
    request(packet){
      if(!ready||pending)return null;
      return new Promise((resolve,reject)=>{
        pending={resolve,reject};
        timer=setTimeout(fallback,1000);
        try{socket.send(JSON.stringify(packet));}catch{fallback();}
      });
    }
  };
}
