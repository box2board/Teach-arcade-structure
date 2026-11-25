// Client entrypoints are loaded only when the selected game is mounted.
const loaders={
  'red-light-green-light':()=>import('../mini-games/multiplayer/rlgl/client.js'),
  'spotlight-sneak':()=>import('../mini-games/multiplayer/spotlight-sneak/client.js'),
  'bumper-boats':()=>import('../mini-games/multiplayer/bumper-boats/client.js'),
  'magnet-mayhem':()=>import('../mini-games/multiplayer/magnet-mayhem/client.js')
};
export function createMiniGameHost({now,loaders:registry=loaders}){
  let instance=null,generation=0,latest;
  const supports=id=>Object.hasOwn(registry,id);
  function destroy(){generation++;instance?.destroy();instance=null;}
  return {
    supports,destroy,
    async mount(id,container,context){
      destroy();latest=context;const version=generation;
      container.textContent='Loading mini-game…';
      try{
        const module=await registry[id]();
        if(version!==generation)return;
        container.replaceChildren();
        instance=module.mount({container,initial:latest,now});
      }catch(error){if(version===generation)container.textContent='Could not load this mini-game. Reload to reconnect.';}
    },
    update(context){latest=context;instance?.update(context);},
    input:()=>instance?.input()??null,
    interval:()=>instance?.pollInterval??650
  };
}
