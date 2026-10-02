// A small continuous model: channel continuity transfers flow; flow transfers
// energy to the wheel; the driven winch gradually lowers a ratcheted bridge.
export const WORLD={width:960,height:600};
export const objects={elbow:{x:330,y:180},valve:{x:180,y:180},trough:{x:475,targetY:330},wheel:{x:650,y:330},bridge:{x:740,y:425},exit:{x:915,y:425}};
export function initialState(){return {player:{x:205,y:465},elbow:0,troughY:430,valve:0.12,wheelSpeed:0,wheelAngle:0,bridge:0,won:false,discoveries:[]};}
export function connected(s){return s.elbow===3&&Math.abs(s.troughY-330)<4;}
export function simulate(s,dt){
  const flow=connected(s)?s.valve:0;
  const target=flow*3.2;
  s.wheelSpeed+=(target-s.wheelSpeed)*Math.min(1,dt*3);
  s.wheelAngle+=s.wheelSpeed*dt;
  if(s.wheelSpeed>0.5)s.bridge=Math.min(1,s.bridge+(s.wheelSpeed-0.5)*dt/10);
  return {flow,turning:s.wheelSpeed>0.1,bridgeOpen:s.bridge>=1};
}
export function canStand(x,y,s){
  if(x<30||x>930||y<50||y>558)return false;
  if(x>718&&x<840&&(s.bridge<1||y<399||y>451))return false;
  return true;
}
