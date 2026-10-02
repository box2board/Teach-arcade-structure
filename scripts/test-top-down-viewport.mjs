import test from 'node:test';
import assert from 'node:assert/strict';
import {roomSize} from '../public/arcade-review-games/shared/top-down/viewport.js';

test('rooms fit available laptop, tablet, phone and landscape stages',()=>{
  for(const [width,height] of [[980,600],[680,900],[370,480],[250,220]]){
    for(const [columns,rows] of [[7,13],[9,9],[15,9]]){
      const size=roomSize(width,height,columns,rows);
      assert.ok(size.width<=width && size.height<=height);
      assert.ok(size.cell>0);
      assert.ok(Math.abs((size.width-8)/columns-(size.height-8)/rows)<1);
      assert.ok(Math.abs(size.width-width)<1 || Math.abs(size.height-height)<1);
    }
  }
});
test('square and wide rooms can grow beyond the former 360 pixel cap',()=>{
  assert.equal(roomSize(980,600,9,9).width,600);
  assert.equal(roomSize(980,600,15,9).width,980);
});
test('resizing recalculates dimensions and rejects unavailable stages',()=>{
  assert.ok(roomSize(680,900,7,13).height>roomSize(980,600,7,13).height);
  for(const args of [[0,600,9,9],[600,NaN,9,9],[600,600,0,9],[4,4,9,9]])assert.equal(roomSize(...args),null);
});
