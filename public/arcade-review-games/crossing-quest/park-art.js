// Original vector artwork, kept separate from rules and collision geometry.
// All ambient animation follows simulation time; paused games stay still.
export function createParkArt(ctx) {
  const ink='#334735';
  const path=(d,fill,stroke=ink,width=2)=>{const p=new Path2D(d);ctx.fillStyle=fill;ctx.fill(p);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke(p);}};
  const oval=(x,y,rx,ry,fill,stroke=null,width=2)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}};
  const line=(d,color,width=2)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke(new Path2D(d));};
  const palette=scene=>scene==='garden'?['#263d68','#5069a8','#8bb0d8','#bdd9df']:scene==='picnic'?['#245e4a','#4c9d58','#9fcd67','#e0e99a']:['#255c44','#4a9852','#8fc85c','#d3e58a'];
  function tree(x,y,scale=1,scene='grove',autumn=false) {
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    oval(12,3,68,17,'#173d3835');
    path('M-27 3 Q-13-20-18-65 L19-68 Q14-24 33 3 Q19 8 8 3 L-4 8-13 2Z','#95633b','#543e2a',3);
    path('M-12-57 Q-9-20-15-4 L-5-2 Q1-24-2-58Z','#c38e51',null);
    line('M6-54 Q3-36 11-20 M-15-24-31-45 M14-34 33-55','#654528',3);
    let [deep,mid,light,tip]=palette(scene);if(autumn)[deep,mid,light,tip]=['#855130','#c17f39','#e9b652','#ffe399'];
    path('M-60-54 Q-83-62-67-84 Q-76-107-50-111 Q-46-140-19-129 Q-2-152 19-133 Q48-142 53-115 Q82-111 68-88 Q85-64 58-52 Q43-33 21-44 Q2-26-19-44 Q-47-31-60-54Z',deep,ink,3);
    path('M-62-88 Q-69-106-44-108 Q-44-129-19-119 Q-5-142 15-123 Q42-130 45-108 Q70-104 59-87 Q69-68 44-62 Q27-49 12-60 Q-7-43-22-61 Q-48-48-55-67Z',mid,null);
    path('M-53-98 Q-44-118-25-108 Q-10-134 7-115 Q30-122 39-104 Q14-108 5-91 Q-15-101-26-84 Q-45-86-53-98Z',light,null);
    for(const [lx,ly,r] of [[-39,-95,.8],[-12,-113,1],[18,-104,.9],[-23,-76,.7],[42,-80,.8],[10,-59,.7]]){
      ctx.save();ctx.translate(lx,ly);ctx.scale(r,r);path('M-8 0 Q0-10 9-2 Q2 7-8 0Z',tip,null);ctx.restore();
    }
    line('M-34-92-27-95 M-7-109 0-112 M23-103 30-104',tip,2);
    ctx.restore();
  }
  function bush(x,y,scale,scene){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);const [deep,mid,light]=palette(scene);
    oval(3,8,39,10,'#1c403c2b');
    path('M-39 4 Q-48-11-31-17 Q-30-35-11-26 Q2-42 17-25 Q37-30 37-12 Q53 5 29 12 L-22 12Q-38 14-39 4Z',deep,ink,2);
    path('M-33-11Q-23-27-11-17Q3-34 17-16Q32-23 32-8Q12-14 3-3Q-17-11-33-11Z',mid,null);
    for(const [lx,ly] of [[-22,-13],[0,-22],[21,-14]])path(`M${lx-4} ${ly}q5-7 10-1q-4 5-10 1`,light,null);
    ctx.restore();
  }
  function flowerBed(x,y,scene,wide=1){
    ctx.save();ctx.translate(x,y);ctx.scale(wide,1);
    oval(4,5,62,14,'#1b40342c');oval(0,0,59,15,'#806245','#52613b',2);oval(0,-3,54,12,'#477345');
    const colors=scene==='garden'?['#e5aff1','#9ae3e4','#fff0ab']:['#fff1c4','#f69875','#f4cf69'];
    for(let n=0;n<13;n++){
      const px=-47+n*8,py=-5+(n%3)*3;line(`M${px} ${py+3}v-12`,'#28573b',2);
      for(let k=0;k<5;k++){const a=k*Math.PI*2/5;oval(px+Math.cos(a)*3,py-12+Math.sin(a)*3,2.7,2.7,colors[n%3]);}oval(px,py-12,1.5,1.5,'#d8904a');
    }
    ctx.restore();
  }
  function sign(x,y,text){
    ctx.save();ctx.translate(x,y);path('M-4 7V-26H4V7Z','#b0824f','#594934',2);
    path('M-54-36-47-48 54-46 61-33 49-20-51-22Z','#b98950','#594934',3);
    line('M-44-42 46-41','#e7b779',2);ctx.fillStyle='#fff3c6';ctx.font='800 10px system-ui';ctx.textAlign='center';ctx.fillText(text,2,-30);ctx.restore();
  }
  function clearing(world,homeRow,stumpRow){
    const scene=world.route.scene,base=homeRow*64;
    // Larger compositions are backdrops. Hazards and acorns are drawn above them.
    ctx.save();ctx.translate(1000,base-25);
    oval(4,4,235,64,'#244e3d24');oval(0,0,228,58,scene==='garden'?'#9cabc5':'#d6be84','#66825a',3);
    oval(0,-3,216,49,scene==='garden'?'#bac4d4':'#e8d19c');
    for(let n=0;n<14;n++){const a=n*Math.PI/7;oval(Math.cos(a)*220,Math.sin(a)*53,10,4,'#f5e9c6','#9c9b73',1);}
    ctx.restore();
    tree(1140,base+50,1.05,scene);
    ctx.save();ctx.translate(1140,base+50);
    path('M-18 2V-19Q-18-42 0-42Q18-42 18-19V2Z','#57432b','#3e3527',2);
    path('M-11 0V-19Q-11-33 0-33Q11-33 11-19V0Z','#dda260',null);oval(6,-13,2,2,'#5d472f');
    path('M-27-33-21-42 22-42 29-33Z','#42aa9c','#315d4d',2);ctx.restore();
    flowerBed(630,base+39,scene,1.15);sign(740,base+49,'ACORN HOLLOW');
    
    // The entry clearing has a curved, planted border instead of identical grass rows.
    for(const [x,y] of [[590,base-160],[1320,base-145],[690,base-300],[1250,base-315]]){
      bush(x,y,.7,scene);flowerBed(x+50,y+8,scene,.65);
    }
    if(scene==='picnic'){
      ctx.save();ctx.translate(1200,base-150);line('M-55 6V-52M55 6V-52','#7a6646',3);line('M-56-50Q0-30 56-50','#fff0bf',2);
      for(let n=0;n<6;n++){const x=-48+n*18;path(`M${x}-46l7 16 7-13Z`,['#f18c72','#f0d369','#73c8be'][n%3],null);}ctx.restore();
    }
    if(scene==='garden'){
      ctx.save();ctx.translate(1230,base-210);oval(0,0,50,21,'#c7c1d6','#4b5771',3);oval(0,-5,43,14,'#7eb9ca');oval(-12,-8,19,4,'#d8edf1aa');
      // A flat mosaic set into the lawn, rather than a solid fountain obstacle.
      for(let n=0;n<8;n++){const a=n*Math.PI/4;oval(Math.cos(a)*32,-5+Math.sin(a)*10,3,2,'#ede1ab');}ctx.restore();
    }
    // Smaller landmarks keep the review stops consistent across curriculum topics.
    tree(1140,100,.65,scene,true);sign(1115,54,'THE OLD OAK');
    flowerBed(690,stumpRow*64+43,scene,.85);sign(1215,stumpRow*64+57,'REST & REVIEW');
  }
  function actor(x,y,world,reduced){
    const moving=world.hop>0,phase=reduced?0:Math.sin(world.hop/.11*Math.PI),lift=phase*7;
    const facing=world.facing||'up',side=facing==='left'||facing==='right',north=facing==='up';
    oval(x+3,y+22,21-phase*3,7-phase,'#14392f55');ctx.save();ctx.translate(x,y-lift);
    if(!reduced&&world.hitFlash>0)ctx.rotate(Math.sin(world.hitFlash*28)*.12);
    if(facing==='left')ctx.scale(-1,1);
    if(world.shield){oval(0,0,29,30,'#d6f8bc0b','#e7ffbdab',1.5);}
    ctx.save();ctx.translate(side?-12:13,8);ctx.rotate((side?-.3:.4)+(reduced?0:Math.sin(world.time*4)*.09));
    path('M0 10C-23-2-26-29-12-46C1-60 22-53 24-38C28-17 3-21 7-6L13 6Z','#bd733b','#66452e',2.5);
    path('M-7-1C-22-17-15-43-2-46C15-51 22-35 10-31C-2-33-7-24 0-13Z','#eda659',null);
    line('M-8-15Q-19-34-2-39','#ffd18a',3);ctx.restore();
    const stride=phase*6;
    oval(-10,20-stride,7,4.5,'#9f6236','#66452e',1.5);oval(9,20+stride*.4,7,4.5,'#9f6236','#66452e',1.5);
    path('M-14 13Q-18-10-9-17L9-17Q19-5 13 15Q0 24-14 13Z','#cb8747','#66452e',2.5);
    if(!north)oval(side?4:-1,7,8,12,'#ffe1a3');
    path('M-15-19L-17-35Q-13-44-7-31L5-32Q13-46 16-36L16-20Z','#b9753e','#66452e',2);
    oval(-12,-33,2.5,5,'#edb38b');oval(12,-33,2.5,5,'#edb38b');
    if(north){
      oval(0,-20,17,15,'#ce8a47','#66452e',2);path('M-9-29Q0-38 9-29L5-21-3-24Z','#eeb164',null);
    }else{
      oval(side?3:0,-20,18,15,'#dfa05a','#66452e',2);oval(side?14:0,-13,side?10:12,7,'#ffe4b4');
      const blink=!reduced&&world.time%5.5>5.34;
      for(const ex of (side?[8]:[-7,7])){if(blink)line(`M${ex-3}-22h5`,'#3b352d',2);else{oval(ex,-23,3,4,'#32362e');oval(ex-.7,-24.5,1,1.5,'#fff');}}
      oval(side?21:0,-16,3,2.3,'#594334');line(side?'M14-9q4 3 7-1':'M-4-9q4 4 8 0','#9a6843',1.2);
      oval(side?0:-13,-13,3,1.5,'#efab7d');
    }
    path('M-13-7Q0-2 14-7L13-1Q0 4-13-1Z','#34c5bb','#286c62',1.5);path('M10-3Q20 1 21 10L11 6Z','#26a9ae','#286c62',1);
    oval(-14,6+stride*.4,4,7,'#dda05a','#66452e',1.5);oval(14,6-stride*.4,4,7,'#dda05a','#66452e',1.5);
    ctx.restore();
  }
  function foreground(world,homeRow){
    for(const [x,y] of [[550,homeRow*64+35],[1340,homeRow*64+38]]){
      const nearPlayer=Math.hypot(world.player.x-x,(world.player.row+.5)*64-y)<85;
      const nearNut=world.nuts().some(n=>!n.collected&&Math.hypot(n.x-x,(n.row+.5)*64-y)<85);
      ctx.save();ctx.globalAlpha=nearPlayer||nearNut?.25:1;bush(x,y,.85,world.route.scene);ctx.restore();
    }
  }
  function bursts(pickups,reduced){
    for(const p of pickups){const t=1-p.life;
      for(let n=0;n<7;n++){const a=n*Math.PI*2/7,r=reduced?16:10+t*38;ctx.save();ctx.translate(p.x+Math.cos(a)*r,p.row*64+32+Math.sin(a)*r-t*12);ctx.rotate(a+t);ctx.globalAlpha=p.life;
        path('M-4 0Q0-6 5-1Q1 5-4 0Z',p.golden?'#ffe28a':'#d5ed9b',null);ctx.restore();}
    }
  }
  return {tree,bush,clearing,actor,bursts,foreground};
}
