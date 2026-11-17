// Character identity and appearance stay separate from board rules. All characters play equally.
export const characters=[
 {id:'fox',name:'Steve',formerName:'Ember',gender:'boy',species:'Fox',emoji:'🦊',color:'#ed8437',accent:'#167f92',description:'A bright-eyed midway explorer.'},
 {id:'frog',name:'Susan',formerName:'Fern',gender:'girl',species:'Frog',emoji:'🐸',color:'#42bd62',accent:'#ffcc37',description:'A cheerful pond-side adventurer.'},
 {id:'rabbit',name:'Wanda',formerName:'Luna',gender:'girl',species:'Rabbit',emoji:'🐰',color:'#ae8ce1',accent:'#ed6f9d',description:'Long ears and a curious streak.'},
 {id:'robot',name:'Robert',formerName:'Bolt',gender:'boy',species:'Robot',emoji:'🤖',color:'#268fe2',accent:'#ffcf35',description:'A friendly little fairground inventor.'},
 {id:'bear',name:'George',formerName:'Bramble',gender:'boy',species:'Bear',emoji:'🐻',color:'#a66b42',accent:'#13a7a0',description:'A big-hearted bear in a teal vest.'},
 {id:'cat',name:'Mary',formerName:'Cleo',gender:'girl',species:'Cat',emoji:'🐱',color:'#e7ad49',accent:'#cf3e87',description:'A striped cat with a curling tail.'},
 {id:'dog',name:'David',formerName:'Scout',gender:'boy',species:'Dog',emoji:'🐶',color:'#c28a52',accent:'#2478c6',description:'Floppy ears, blue scarf, ready to roam.'},
 {id:'panda',name:'Linda',formerName:'Pippin',gender:'girl',species:'Panda',emoji:'🐼',color:'#faf3dc',accent:'#e54779',description:'A playful panda with a pink neckerchief.'},
 {id:'raccoon',name:'Frank',formerName:'Rascal',gender:'boy',species:'Raccoon',emoji:'🦝',color:'#8899ad',accent:'#ffb327',description:'A masked explorer with a ringed tail.'},
 {id:'squirrel',name:'Nancy',formerName:'Acorn',gender:'girl',species:'Squirrel',emoji:'🐿️',color:'#d36d35',accent:'#278d74',description:'A little adventurer with a great big tail.'},
 {id:'otter',name:'James',formerName:'Ripple',gender:'boy',species:'Otter',emoji:'🦦',color:'#926141',accent:'#12aabf',description:'Round cheeks and a turquoise waistcoat.'},
 {id:'penguin',name:'Thomas',formerName:'Pip',gender:'boy',species:'Penguin',emoji:'🐧',color:'#284b77',accent:'#ffb62b',description:'A dapper penguin with bright orange feet.'},
 {id:'owl',name:'Helen',formerName:'Hoot',gender:'girl',species:'Owl',emoji:'🦉',color:'#935ba7',accent:'#f6ce6c',description:'A wide-eyed owl with patterned wings.'},
 {id:'turtle',name:'William',formerName:'Tuck',gender:'boy',species:'Turtle',emoji:'🐢',color:'#50ad70',accent:'#e0bb52',description:'A smiling turtle with a patterned shell.'},
 {id:'hedgehog',name:'Betty',formerName:'Quill',gender:'girl',species:'Hedgehog',emoji:'🦔',color:'#b48762',accent:'#e86c4a',description:'A soft-faced wanderer with a spiky outline.'},
 {id:'dragon',name:'Henry',formerName:'Ziggy',gender:'boy',species:'Dragon',emoji:'🐉',color:'#12afa5',accent:'#c64fbd',description:'Tiny horns, purple wings, big curiosity.'},
 {id:'axolotl',name:'Alice',formerName:'Bubbles',gender:'girl',species:'Axolotl',emoji:'🫧',color:'#f08fae',accent:'#bd3f81',description:'A rosy axolotl with feathery gills.'},
 {id:'koala',name:'Margaret',formerName:'Kiki',gender:'girl',species:'Koala',emoji:'🐨',color:'#9ba2b5',accent:'#5b68cc',description:'Fluffy ears and a big velvety nose.'},
 {id:'red-panda',name:'Charles',formerName:'Rusty',gender:'boy',species:'Red panda',emoji:'🐾',color:'#c95834',accent:'#246b83',description:'White cheek tufts and a striped fluffy tail.'},
 {id:'deer',name:'Dorothy',formerName:'Maple',gender:'girl',species:'Deer',emoji:'🦌',color:'#bd8651',accent:'#c04463',description:'Little antlers and a cranberry scarf.'}
];
export const characterById=id=>characters.find(c=>c.id===id);
