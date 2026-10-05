// Park routes are independent of the selected academic question pack.
export const CELL = 64;
export const WIDTH = 896;
export const HEIGHT = 576;
export const DIFFICULTIES = {
  relaxed: { label: 'Gentle', speed: .7, lives: 4 },
  classic: { label: 'Classic', speed: 1, lives: 4 },
  challenge: { label: 'Challenge', speed: 1.25, lives: 3 }
};
export const ROUTES = [
  {name:'Sunny Grove',accent:'#a7d96b',water:'#1a6076',road:'#283745',speed:1,
    lanes:[{row:7,type:'road',speed:68,width:88,gap:266,offset:80},{row:6,type:'road',speed:-84,width:112,gap:310,offset:210},{row:5,type:'road',speed:60,width:88,gap:280,offset:130},{row:3,type:'sprinkler',speed:-44,width:210,gap:295,offset:60},{row:2,type:'sprinkler',speed:53,width:210,gap:295,offset:200},{row:1,type:'sprinkler',speed:-40,width:220,gap:310,offset:110}]},
  {name:'Picnic Park',accent:'#e8c484',water:'#225c75',road:'#343746',speed:1.08,
    lanes:[{row:7,type:'road',speed:-70,width:100,gap:285,offset:170},{row:6,type:'road',speed:82,width:126,gap:320,offset:50},{row:5,type:'road',speed:-64,width:88,gap:260,offset:225},{row:3,type:'sprinkler',speed:48,width:196,gap:285,offset:150},{row:2,type:'sprinkler',speed:-58,width:210,gap:300,offset:50},{row:1,type:'sprinkler',speed:46,width:205,gap:295,offset:190}]},
  {name:'Twilight Garden',accent:'#a4cbee',water:'#274f79',road:'#303748',speed:1.16,
    lanes:[{row:7,type:'road',speed:78,width:90,gap:275,offset:90},{row:6,type:'road',speed:-92,width:115,gap:320,offset:240},{row:5,type:'road',speed:72,width:100,gap:295,offset:140},{row:3,type:'sprinkler',speed:-50,width:202,gap:290,offset:70},{row:2,type:'sprinkler',speed:62,width:200,gap:292,offset:200},{row:1,type:'sprinkler',speed:-48,width:212,gap:300,offset:140}]}
];
