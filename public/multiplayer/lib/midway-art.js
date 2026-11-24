import * as T from '../../mini-games/vendor/three.module.js';
import {mesh,box,sphere} from './three-assets.js';
// Shared code-native carnival props. Scene placement still passes path-clearance checks.
export {createTicketToken as ticketToken} from './reward-art.js';
export function balloons(parent,x,z,color=0xff3979){
 const group=new T.Group();group.position.set(x,.66,z);parent.add(group);
 mesh(group,new T.CylinderGeometry(.55,.7,.32,16),0x176e99,0,.16,0);
 for(let i=0;i<3;i++){const dx=(i-1)*.52,top=3.5+(i===1?.6:0);const curve=new T.QuadraticBezierCurve3(new T.Vector3(0,.3,0),new T.Vector3(dx,1.8,.1),new T.Vector3(dx,top-.45,0));mesh(group,new T.TubeGeometry(curve,12,.018,4,false),0xfff3cf);const b=sphere(group,[color,0xffc92d,0x13cdd5][i],dx,top,0,.44);b.scale.y=1.22;b.material.roughness=.34;mesh(group,new T.ConeGeometry(.075,.12,8),[color,0xffc92d,0x13cdd5][i],dx,top-.56,0).rotation.z=Math.PI;}
 return group;
}
export function bunting(parent,x,z){
 const group=new T.Group();group.position.set(x,.66,z);parent.add(group);
 for(const side of [-1,1]){box(group,0xf8edd1,side*2.7,1.8,0,.12,3.6,.12);sphere(group,0xffc52d,side*2.7,3.65,0,.15)}
 const curve=new T.QuadraticBezierCurve3(new T.Vector3(-2.7,3.4,0),new T.Vector3(0,2.45,0),new T.Vector3(2.7,3.4,0));mesh(group,new T.TubeGeometry(curve,24,.025,5,false),0x244976);
 for(let i=0;i<9;i++){const p=curve.getPoint((i+.5)/9);const shape=new T.Shape();shape.moveTo(-.23,0);shape.lineTo(.23,0);shape.lineTo(0,-.52);shape.closePath();const flag=mesh(group,new T.ShapeGeometry(shape),[0xff3b6c,0xffc52d,0x00bade,0x7947e8][i%4],p.x,p.y,p.z);flag.material.side=T.DoubleSide;}
 return group;
}
export function flowerPlanter(parent,x,z){
 const group=new T.Group();group.position.set(x,.66,z);parent.add(group);
 box(group,0x216d84,0,.2,0,1.6,.4,.8);box(group,0xffdb74,0,.43,0,1.7,.12,.9);
 for(let i=0;i<5;i++){const dx=(i-2)*.29;box(group,0x15804c,dx,.65,0,.035,.38,.035);const color=[0xff3c77,0xffa62b,0xa346ed][i%3];for(let j=0;j<5;j++){const a=j/5*Math.PI*2;sphere(group,color,dx+Math.cos(a)*.11,.86+Math.sin(a)*.11,0,.09)}sphere(group,0xffe36b,dx,.86,.07,.07)}return group;
}
