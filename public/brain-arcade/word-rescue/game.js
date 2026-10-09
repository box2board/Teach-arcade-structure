(() => {
  const WORDS = {
    animals:[
      {word:"elephant",clue:"A very large land mammal with a trunk."},
      {word:"penguin",clue:"A flightless bird known for swimming."},
      {word:"giraffe",clue:"The tallest living land animal."},
      {word:"dolphin",clue:"An intelligent marine mammal."},
      {word:"kangaroo",clue:"An Australian animal known for hopping."},
      {word:"octopus",clue:"A sea animal with eight arms."}
    ],
    geography:[
      {word:"mountain",clue:"A landform that rises high above the surrounding area."},
      {word:"peninsula",clue:"Land almost surrounded by water."},
      {word:"equator",clue:"The imaginary line around Earth's middle."},
      {word:"glacier",clue:"A slowly moving mass of ice."},
      {word:"island",clue:"Land completely surrounded by water."},
      {word:"volcano",clue:"A landform that can erupt lava, ash, and gases."}
    ],
    science:[
      {word:"gravity",clue:"The force that pulls objects toward one another."},
      {word:"molecule",clue:"Two or more atoms chemically bonded together."},
      {word:"habitat",clue:"The natural home of an organism."},
      {word:"energy",clue:"The ability to do work or cause change."},
      {word:"planet",clue:"A large object that orbits a star."},
      {word:"oxygen",clue:"A gas humans need for respiration."}
    ],
    school:[
      {word:"backpack",clue:"A bag commonly carried to class."},
      {word:"notebook",clue:"Pages bound together for writing notes."},
      {word:"library",clue:"A place where books and other resources are kept."},
      {word:"pencil",clue:"A writing tool that can usually be erased."},
      {word:"project",clue:"A longer assignment often built over several steps."},
      {word:"schedule",clue:"A plan showing when activities happen."}
    ],
    food:[
      {word:"pancake",clue:"A flat breakfast food often served in a stack."},
      {word:"spaghetti",clue:"Long, thin pasta noodles."},
      {word:"popcorn",clue:"A snack made from heated corn kernels."},
      {word:"sandwich",clue:"Food commonly made with fillings between slices of bread."},
      {word:"avocado",clue:"A green fruit often used in guacamole."},
      {word:"pretzel",clue:"A baked snack often shaped in a knot."}
    ]
  };

  const CATEGORY_NAMES={animals:"Animals",geography:"Geography",science:"Science",school:"School",food:"Food"};
  const DIFFICULTIES={
    easy:{label:"Easy · 10 misses",max:10,thresholds:[1,2,3,4,5,6,7,8,9,10]},
    medium:{label:"Medium · 6 misses",max:6,thresholds:[1,2,4,6,9,10]},
    hard:{label:"Hard · 4 misses",max:4,thresholds:[2,4,9,10]}
  };

  const CRITTERS=[
    {id:"squirrel",name:"Squirrel",color:"#b7793f",ears:"point",tail:"bushy"},
    {id:"bear",name:"Bear",color:"#7c5a43",ears:"round",tail:"small"},
    {id:"rabbit",name:"Rabbit",color:"#d6d3d1",ears:"long",tail:"puff"},
    {id:"fox",name:"Fox",color:"#d97706",ears:"point",tail:"bushy"},
    {id:"raccoon",name:"Raccoon",color:"#6b7280",ears:"round",tail:"striped"},
    {id:"beaver",name:"Beaver",color:"#8b5e3c",ears:"round",tail:"flat"},
    {id:"owl",name:"Owl",color:"#a16207",ears:"tuft",tail:"none"},
    {id:"turtle",name:"Turtle",color:"#4d7c0f",ears:"none",tail:"small"},
    {id:"hedgehog",name:"Hedgehog",color:"#92400e",ears:"round",tail:"none"},
    {id:"frog",name:"Frog",color:"#65a30d",ears:"none",tail:"none"}
  ];

  const STORAGE_KEY="teachArcadeWordRescueStreaks";
  const els={
    category:document.getElementById("category-select"),
    difficulty:document.getElementById("difficulty-select"),
    surprise:document.getElementById("surprise-category"),
    newWord:document.getElementById("new-word"),
    categoryLabel:document.getElementById("category-label"),
    difficultyLabel:document.getElementById("difficulty-label"),
    clueButton:document.getElementById("clue-button"),
    clueText:document.getElementById("clue-text"),
    word:document.getElementById("word-display"),
    feedback:document.getElementById("feedback"),
    keyboard:document.getElementById("keyboard"),
    wrongCount:document.getElementById("wrong-count"),
    wrongMax:document.getElementById("wrong-max"),
    wrongLetters:document.getElementById("wrong-letters"),
    currentStreak:document.getElementById("current-streak"),
    bestStreak:document.getElementById("best-streak"),
    endActions:document.getElementById("end-actions"),
    playAgain:document.getElementById("play-again"),
    scene:document.getElementById("rescue-scene"),
    sceneArt:document.getElementById("scene-art"),
    critterName:document.getElementById("critter-name")
  };

  let activeCategory="animals",activeEntry=null,activeCritter=null,lastWord="",lastCritterId="";
  let guessed=new Set(),wrong=[],state="playing",difficultyKey="medium",streaks=loadStreaks();

  function loadStreaks(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));return{current:Number.isFinite(s?.current)?Math.max(0,s.current):0,best:Number.isFinite(s?.best)?Math.max(0,s.best):0};}catch{return{current:0,best:0}}}
  function saveStreaks(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(streaks));}catch{}}
  function updateStreaks(){els.currentStreak.textContent=String(streaks.current);els.bestStreak.textContent=String(streaks.best);}
  function randomItem(a){return a[Math.floor(Math.random()*a.length)]}
  function chooseWord(category){const pool=WORDS[category], alt=pool.filter(x=>x.word!==lastWord);return randomItem(alt.length?alt:pool)}
  function chooseCritter(){const pool=CRITTERS.filter(c=>c.id!==lastCritterId);activeCritter=randomItem(pool.length?pool:CRITTERS);lastCritterId=activeCritter.id;}

  function critterMarkup(c){
    const ear = c.ears==="long"
      ? '<ellipse cx="137" cy="76" rx="9" ry="28"/><ellipse cx="183" cy="76" rx="9" ry="28"/>'
      : c.ears==="point" || c.ears==="tuft"
        ? '<path d="M129 93 L137 61 L151 89 Z"/><path d="M169 89 L183 61 L191 93 Z"/>'
        : c.ears==="round"
          ? '<circle cx="136" cy="85" r="13"/><circle cx="184" cy="85" r="13"/>'
          : '';
    const tail = c.tail==="bushy"
      ? '<path d="M110 150 Q69 119 82 88 Q110 100 123 130 Q128 150 110 150 Z"/>'
      : c.tail==="striped"
        ? '<path d="M111 150 Q76 136 83 106 Q110 112 124 137 Z"/><path d="M89 119 Q100 123 112 132" class="wr-critter-mark"/>'
        : c.tail==="flat"
          ? '<ellipse cx="104" cy="153" rx="25" ry="10" transform="rotate(-25 104 153)"/>'
          : c.tail==="puff"
            ? '<circle cx="111" cy="145" r="15"/>'
            : c.tail==="small"
              ? '<circle cx="112" cy="149" r="8"/>'
              : '';
    let face='<circle cx="148" cy="108" r="4" class="wr-eye"/><circle cx="172" cy="108" r="4" class="wr-eye"/><path d="M154 123 Q160 128 166 123" class="wr-critter-mark"/>';
    let body='<ellipse cx="160" cy="146" rx="43" ry="48"/><circle cx="160" cy="107" r="36"/><ellipse cx="160" cy="174" rx="27" ry="16"/>';
    if(c.id==="owl"){
      body='<ellipse cx="160" cy="139" rx="45" ry="57"/><circle cx="160" cy="103" r="38"/><path d="M130 143 Q107 157 123 178 M190 143 Q213 157 197 178" class="wr-critter-mark"/>';
      face='<circle cx="146" cy="104" r="12" class="wr-face-patch"/><circle cx="174" cy="104" r="12" class="wr-face-patch"/><circle cx="146" cy="104" r="4" class="wr-eye"/><circle cx="174" cy="104" r="4" class="wr-eye"/><path d="M155 118 L165 118 L160 127 Z" class="wr-beak"/>';
    } else if(c.id==="turtle"){
      body='<ellipse cx="160" cy="151" rx="55" ry="39"/><circle cx="214" cy="139" r="22"/><circle cx="128" cy="181" r="11"/><circle cx="190" cy="181" r="11"/>';
      face='<circle cx="220" cy="136" r="4" class="wr-eye"/><path d="M217 147 Q224 151 230 146" class="wr-critter-mark"/>';
    } else if(c.id==="hedgehog"){
      body='<path d="M111 160 L119 130 L127 111 L138 92 L151 103 L163 86 L174 104 L190 94 L195 119 L210 131 L202 157 Q191 190 160 190 Q128 190 111 160 Z"/><circle cx="160" cy="120" r="32"/>';
    } else if(c.id==="frog"){
      body='<ellipse cx="160" cy="151" rx="49" ry="42"/><circle cx="138" cy="101" r="19"/><circle cx="182" cy="101" r="19"/><ellipse cx="160" cy="124" rx="40" ry="31"/><path d="M121 170 L96 188 M199 170 L224 188" class="wr-critter-mark"/>';
      face='<circle cx="138" cy="98" r="5" class="wr-eye"/><circle cx="182" cy="98" r="5" class="wr-eye"/><path d="M145 130 Q160 141 175 130" class="wr-critter-mark"/>';
    }
    return `<g class="wr-critter" style="--critter:${c.color}">${tail}${ear}${body}${face}</g>`;
  }

  function trapMarkup(){
    return `<g class="wr-trap">
      <line class="wr-trap-piece" data-piece="1" x1="82" y1="48" x2="82" y2="211"/>
      <line class="wr-trap-piece" data-piece="2" x1="238" y1="48" x2="238" y2="211"/>
      <line class="wr-trap-piece" data-piece="3" x1="82" y1="48" x2="238" y2="48"/>
      <line class="wr-trap-piece" data-piece="4" x1="82" y1="211" x2="238" y2="211"/>
      <line class="wr-trap-piece" data-piece="5" x1="113" y1="48" x2="113" y2="211"/>
      <line class="wr-trap-piece" data-piece="6" x1="144" y1="48" x2="144" y2="211"/>
      <line class="wr-trap-piece" data-piece="7" x1="176" y1="48" x2="176" y2="211"/>
      <line class="wr-trap-piece" data-piece="8" x1="207" y1="48" x2="207" y2="211"/>
      <line class="wr-trap-piece" data-piece="9" x1="82" y1="155" x2="238" y2="155"/>
      <g class="wr-trap-piece wr-lock" data-piece="10"><rect x="148" y="144" width="24" height="24" rx="4"/><path d="M153 144 V137 A7 7 0 0 1 167 137 V144"/></g>
    </g>`;
  }

  function renderScene(){
    els.sceneArt.innerHTML=`<svg viewBox="0 0 320 250" role="img" aria-label="${activeCritter.name} in a trap that builds with incorrect guesses">
      <rect width="320" height="250" rx="18" fill="#eef8ef"/>
      <circle cx="268" cy="42" r="18" fill="#f7c948" opacity=".78"/>
      <path d="M0 207 Q55 190 112 205 T222 203 T320 202 V250 H0 Z" fill="#dbe7d2"/>
      <path d="M14 205 L35 165 L56 205 Z M263 205 L284 160 L305 205 Z" fill="#b7cea9" opacity=".8"/>
      ${critterMarkup(activeCritter)}
      ${trapMarkup()}
    </svg>`;
    renderTrap();
  }

  function visibleTrapPieces(){
    const d=DIFFICULTIES[difficultyKey];
    if(!wrong.length) return 0;
    return d.thresholds[wrong.length-1]||10;
  }

  function renderTrap(){
    const visible=visibleTrapPieces();
    els.scene.querySelectorAll(".wr-trap-piece").forEach(piece=>{
      piece.classList.toggle("is-visible",Number(piece.dataset.piece)<=visible);
    });
    els.scene.classList.toggle("is-rescued",state==="won");
    els.scene.classList.toggle("is-trapped",state==="lost");
  }

  function startRound(category=els.category.value){
    activeCategory=category;
    difficultyKey=els.difficulty.value;
    els.category.value=category;
    activeEntry=chooseWord(category);lastWord=activeEntry.word;
    chooseCritter();
    guessed=new Set();wrong=[];state="playing";
    els.categoryLabel.textContent=CATEGORY_NAMES[category];
    els.difficultyLabel.textContent=DIFFICULTIES[difficultyKey].label;
    els.wrongMax.textContent=String(DIFFICULTIES[difficultyKey].max);
    els.critterName.textContent=activeCritter.name;
    els.clueText.textContent=activeEntry.clue;els.clueText.hidden=true;els.clueButton.textContent="Show Clue";
    els.feedback.textContent="Pick a letter or type on your keyboard.";
    els.feedback.classList.remove("is-win","is-loss");
    els.endActions.hidden=true;
    renderScene();
    render();
  }

  function renderWord(revealAll=false){
    els.word.replaceChildren();
    activeEntry.word.toUpperCase().split(" ").forEach((word,idx)=>{
      const group=document.createElement("span");group.className="word-rescue-page__word-group";group.setAttribute("aria-label",`Word ${idx+1}`);
      [...word].forEach(letter=>{const slot=document.createElement("span");slot.className="word-rescue-page__slot";slot.textContent=revealAll||guessed.has(letter.toLowerCase())?letter:"";group.appendChild(slot)});
      els.word.appendChild(group);
    });
  }

  function renderKeyboard(){
    els.keyboard.replaceChildren();
    [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].forEach(letter=>{
      const lower=letter.toLowerCase(),b=document.createElement("button");
      b.type="button";b.className="word-rescue-page__letter";b.textContent=letter;b.setAttribute("aria-label",`Guess ${letter}`);
      if(guessed.has(lower)){b.disabled=true;b.classList.add(activeEntry.word.includes(lower)?"is-correct":"is-wrong")} else if(state!=="playing"){b.disabled=true}
      b.addEventListener("click",()=>guess(lower));els.keyboard.appendChild(b);
    });
  }

  function render(){
    renderWord(state==="lost");renderKeyboard();renderTrap();updateStreaks();
    els.wrongCount.textContent=String(wrong.length);
    els.wrongLetters.textContent=wrong.length?wrong.map(x=>x.toUpperCase()).join("  "):"None yet";
  }

  function isSolved(){return [...activeEntry.word.toLowerCase()].every(ch=>ch===" "||guessed.has(ch))}

  function endRound(result){
    state=result;
    if(result==="won"){
      streaks.current++;streaks.best=Math.max(streaks.best,streaks.current);
      els.feedback.textContent=`Rescued! The word was ${activeEntry.word.toUpperCase()}. ${activeCritter.name} is free.`;
      els.feedback.classList.add("is-win");
    }else{
      streaks.current=0;
      els.feedback.textContent=`Trap complete. The word was ${activeEntry.word.toUpperCase()}. Try another rescue.`;
      els.feedback.classList.add("is-loss");
    }
    saveStreaks();els.endActions.hidden=false;render();
  }

  function guess(letter){
    if(state!=="playing"||!/^[a-z]$/.test(letter)||guessed.has(letter))return;
    guessed.add(letter);
    if(activeEntry.word.includes(letter)){
      els.feedback.textContent="Good guess — keep rescuing!";
    }else{
      wrong.push(letter);
      const remaining=DIFFICULTIES[difficultyKey].max-wrong.length;
      els.feedback.textContent=remaining===1?"One miss left before the trap is complete.":`Wrong letter — ${remaining} misses left.`;
    }
    if(isSolved())return endRound("won");
    if(wrong.length>=DIFFICULTIES[difficultyKey].max)return endRound("lost");
    render();
  }

  els.newWord.addEventListener("click",()=>startRound(els.category.value));
  els.surprise.addEventListener("click",()=>startRound(randomItem(Object.keys(WORDS))));
  els.playAgain.addEventListener("click",()=>startRound(activeCategory));
  els.category.addEventListener("change",()=>startRound(els.category.value));
  els.difficulty.addEventListener("change",()=>startRound(activeCategory));
  els.clueButton.addEventListener("click",()=>{const showing=!els.clueText.hidden;els.clueText.hidden=showing;els.clueButton.textContent=showing?"Show Clue":"Hide Clue"});
  document.addEventListener("keydown",e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const key=e.key.toLowerCase();if(/^[a-z]$/.test(key))guess(key)});

  updateStreaks();
  startRound(activeCategory);
})();