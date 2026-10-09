import test from 'node:test';
import assert from 'node:assert/strict';
import {updateCamera,cancelCamera} from '../public/arcade-review-games/shared/top-down/camera.js';
function fixture(){
  let rect={left:0,top:0,width:1000,height:800};
  const animations=[];
  const world={getBoundingClientRect:()=>({...rect}),animate(frames,options){
    const flight={frames,options,canceled:false,cancel(){this.canceled=true;}};
    animations.push(flight);return flight;
  }};
  return {world,animations,setRect:value=>{rect=value;}};
}
test('room travel interpolates horizontal, vertical and differently sized cameras',()=>{
  const {world,animations,setRect}=fixture();
  updateCamera(world,()=>setRect({left:-500,top:-400,width:1200,height:960}),{glide:true});
  assert.equal(animations.length,1);
  assert.equal(animations[0].frames[0].transform,'translate(500px,400px) scale(0.8333333333333334,0.8333333333333334)');
  assert.equal(animations[0].frames[1].transform,'none');
  assert.equal(animations[0].options.duration,260);
});
test('rapid reversal starts at the currently visible camera and cancels the old flight',()=>{
  const {world,animations,setRect}=fixture();
  updateCamera(world,()=>setRect({left:-500,top:0,width:1000,height:800}),{glide:true});
  setRect({left:-200,top:0,width:1000,height:800});
  updateCamera(world,()=>setRect({left:0,top:0,width:1000,height:800}),{glide:true});
  assert.equal(animations[0].canceled,true);
  assert.equal(animations[1].frames[0].transform,'translate(-200px,0px) scale(1,1)');
  // Finishing an obsolete flight must not discard its replacement.
  animations[0].onfinish();cancelCamera(world);
  assert.equal(animations[1].canceled,true);
});
test('initial view, reduced motion and unsupported browsers update without animation',()=>{
  for(const options of [{},{glide:true,reducedMotion:true}]){
    const {world,animations}=fixture();let updated=false;
    updateCamera(world,()=>{updated=true;},options);
    assert.equal(updated,true);assert.equal(animations.length,0);
  }
  let updated=false;updateCamera({},()=>{updated=true;},{glide:true});assert.equal(updated,true);
});
test('unchanged or zero-size views do not animate; finished flights can be cleared safely',()=>{
  const {world,animations,setRect}=fixture();
  updateCamera(world,()=>{},{glide:true});assert.equal(animations.length,0);
  updateCamera(world,()=>setRect({left:0,top:0,width:0,height:0}),{glide:true});assert.equal(animations.length,0);
  setRect({left:0,top:0,width:1000,height:800});
  updateCamera(world,()=>setRect({left:0,top:-400,width:1000,height:800}),{glide:true});
  animations[0].onfinish();cancelCamera(world);assert.equal(animations[0].canceled,false);
});
