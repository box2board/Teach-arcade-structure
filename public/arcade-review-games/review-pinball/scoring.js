// Uses simulation time: pausing the game also pauses the bonus countdown.
export class CircuitRush {
 constructor(){this.shots=new Set();this.until=0;}
 remaining(time){return Math.max(0,this.until-time);}
 factor(time){return this.remaining(time)>0?2:1;}
 record(id,time){
  if(!['ramp','orbit','spinner'].includes(id)||this.remaining(time)>0)return false;
  this.shots.add(id);
  if(this.shots.size<3)return false;
  this.shots.clear();this.until=time+15;return true;
 }
 drain(){this.until=0;} // Earned shot progress persists, but a live rush ends on drain.
}
