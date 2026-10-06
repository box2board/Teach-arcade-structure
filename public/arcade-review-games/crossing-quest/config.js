// Park routes and scenery are independent of the selected academic question pack.
export const CELL = 64;
export const WIDTH = 896;
export const HEIGHT = 576;
export const DIFFICULTIES = {
  relaxed: { label: 'Gentle', speed: .7, lives: 4 },
  classic: { label: 'Classic', speed: 1, lives: 4 },
  challenge: { label: 'Challenge', speed: 1.25, lives: 3 }
};
export const ROUTES = [
  {
    name:'Sunny Grove', accent:'#a7d96b', speed:1, scene:'grove',
    description:'Woodland trails first, then the sprinkler meadow.',
    skin:{safe:'#426746',grass:'#5b804d',path:'#a99068',edge:'#705c42',foliage:'#345732',leaf:'#8fb763',shirt:'#6fc9c2',ball:'#d49b57',glow:'#294b36'},
    nuts:[{row:7,x:160},{row:6,x:608},{row:5,x:288},{row:4,x:224},{row:4,x:672},{row:3,x:416},{row:2,x:736},{row:1,x:160},{row:0,x:416}],
    lanes:[
      {row:7,type:'road',kind:'bike',speed:68,width:88,gap:266,offset:80},
      {row:6,type:'road',kind:'ball',speed:-84,width:112,gap:310,offset:210},
      {row:5,type:'road',kind:'bike',speed:60,width:88,gap:280,offset:130},
      {row:3,type:'sprinkler',heads:[160,416,736]},
      {row:2,type:'sprinkler',heads:[160,416,736]},
      {row:1,type:'sprinkler',heads:[160,416,736]}
    ]
  },
  {
    name:'Picnic Park', accent:'#ffcf83', speed:1.08, scene:'picnic',
    description:'A sprinkler at the entrance, open picnic lawn near the oak.',
    skin:{safe:'#819256',grass:'#91aa65',path:'#ccaf83',edge:'#987b53',foliage:'#577b43',leaf:'#b6d179',shirt:'#ef8c77',ball:'#e57664',glow:'#615038'},
    nuts:[{row:7,x:288},{row:6,x:736},{row:5,x:544},{row:4,x:224},{row:4,x:608},{row:3,x:224},{row:2,x:480},{row:1,x:800},{row:0,x:608}],
    lanes:[
      {row:7,type:'sprinkler',heads:[224,544,800],phase:.6},
      {row:6,type:'road',kind:'ball',speed:82,width:126,gap:320,offset:50},
      {row:5,type:'road',kind:'bike',speed:-64,width:88,gap:260,offset:225},
      {row:3,type:'road',kind:'bike',speed:60,width:100,gap:300,offset:150},
      {row:2,type:'sprinkler',heads:[96,352,672],phase:1.1},
      {row:1,type:'lawn'}
    ]
  },
  {
    name:'Twilight Garden', accent:'#b8b7ff', speed:1.16, scene:'garden',
    description:'Alternating garden paths and sprinklers under the lanterns.',
    skin:{safe:'#3c4967',grass:'#425870',path:'#82768d',edge:'#514762',foliage:'#32445d',leaf:'#6a789c',shirt:'#c0a3ee',ball:'#dfbb79',glow:'#353357'},
    nuts:[{row:7,x:672},{row:6,x:352},{row:5,x:160},{row:4,x:288},{row:4,x:736},{row:3,x:608},{row:2,x:416},{row:1,x:96},{row:0,x:288}],
    lanes:[
      {row:7,type:'road',kind:'bike',speed:78,width:90,gap:275,offset:90},
      {row:6,type:'sprinkler',heads:[160,416,736],phase:.4},
      {row:5,type:'road',kind:'bike',speed:-72,width:100,gap:295,offset:140},
      {row:3,type:'sprinkler',heads:[96,352,672],phase:1.5},
      {row:2,type:'road',kind:'ball',speed:-92,width:115,gap:320,offset:240},
      {row:1,type:'sprinkler',heads:[224,544,800],phase:.8}
    ]
  }
];
