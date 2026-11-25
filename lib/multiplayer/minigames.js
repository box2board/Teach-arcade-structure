import {engine as rlgl} from '../../public/multiplayer/mini-games/multiplayer/rlgl/engine.js';
import * as spotlight from '../../public/multiplayer/mini-games/multiplayer/spotlight-sneak/engine.js';
import * as bumperBoats from '../../public/multiplayer/mini-games/multiplayer/bumper-boats/engine.js';
import * as magnetMayhem from '../../public/multiplayer/mini-games/multiplayer/magnet-mayhem/engine.js';
const registered=[rlgl,spotlight,bumperBoats,magnetMayhem];
const contract=['create','advance','input','snapshot','finished','results'];
for(const engine of registered){
 if(!engine.id||contract.some(method=>typeof engine[method]!=='function'))
  throw new TypeError('Invalid multiplayer mini-game engine: '+(engine.id||'missing id'));
}
const engines=new Map(registered.map(engine=>[engine.id,engine]));
export const multiplayerIds=()=>[...engines.keys()];
export const getMiniGame=id=>engines.get(id);
