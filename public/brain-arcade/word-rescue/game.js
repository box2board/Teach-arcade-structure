(() => {
  const WORDS = {
    animals: [
      { word: "elephant", clue: "A very large land mammal with a trunk." },
      { word: "penguin", clue: "A flightless bird known for swimming." },
      { word: "giraffe", clue: "The tallest living land animal." },
      { word: "dolphin", clue: "An intelligent marine mammal." },
      { word: "kangaroo", clue: "An Australian animal known for hopping." },
      { word: "octopus", clue: "A sea animal with eight arms." }
    ],
    geography: [
      { word: "mountain", clue: "A landform that rises high above the surrounding area." },
      { word: "peninsula", clue: "Land almost surrounded by water." },
      { word: "equator", clue: "The imaginary line around Earth's middle." },
      { word: "glacier", clue: "A slowly moving mass of ice." },
      { word: "island", clue: "Land completely surrounded by water." },
      { word: "volcano", clue: "A landform that can erupt lava, ash, and gases." }
    ],
    science: [
      { word: "gravity", clue: "The force that pulls objects toward one another." },
      { word: "molecule", clue: "Two or more atoms chemically bonded together." },
      { word: "habitat", clue: "The natural home of an organism." },
      { word: "energy", clue: "The ability to do work or cause change." },
      { word: "planet", clue: "A large object that orbits a star." },
      { word: "oxygen", clue: "A gas humans need for respiration." }
    ],
    school: [
      { word: "backpack", clue: "A bag commonly carried to class." },
      { word: "notebook", clue: "Pages bound together for writing notes." },
      { word: "library", clue: "A place where books and other resources are kept." },
      { word: "pencil", clue: "A writing tool that can usually be erased." },
      { word: "project", clue: "A longer assignment often built over several steps." },
      { word: "schedule", clue: "A plan showing when activities happen." }
    ],
    food: [
      { word: "pancake", clue: "A flat breakfast food often served in a stack." },
      { word: "spaghetti", clue: "Long, thin pasta noodles." },
      { word: "popcorn", clue: "A snack made from heated corn kernels." },
      { word: "sandwich", clue: "Food commonly made with fillings between slices of bread." },
      { word: "avocado", clue: "A green fruit often used in guacamole." },
      { word: "pretzel", clue: "A baked snack often shaped in a knot." }
    ]
  };

  const CATEGORY_NAMES = {
    animals: "Animals",
    geography: "Geography",
    science: "Science",
    school: "School",
    food: "Food"
  };

  const SCENES = [
    {
      id: "signal",
      name: "Signal Station",
      resource: "Rescue signal",
      success: "Aircraft locked onto the signal.",
      stages: [["Signal flicker","⚡",28,72],["Antenna damage","✕",40,37],["Clouds building","☁",67,16],["Static surge","⚡",57,49],["Aircraft losing lock","!",83,28],["Signal offline","×",47,28]],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A stranded explorer beside a radio tower while a rescue aircraft approaches.">
        <path class="wr-soft-fill" d="M0 190 Q58 174 111 191 T221 188 T320 188 V230 H0 Z"/>
        <g class="wr-line"><line x1="74" y1="184" x2="108" y2="82"/><line x1="142" y1="184" x2="108" y2="82"/><line x1="84" y1="151" x2="132" y2="151"/><line x1="93" y1="122" x2="123" y2="122"/><circle cx="108" cy="72" r="9"/></g>
        <g class="wr-accent wr-beacon wr-success"><path d="M87 58 Q108 38 129 58"/><path d="M73 45 Q108 12 143 45"/></g>
        <g class="wr-line wr-thin"><circle cx="235" cy="153" r="13"/><line x1="235" y1="166" x2="235" y2="199"/><line x1="235" y1="175" x2="216" y2="188"/><line x1="235" y1="175" x2="254" y2="188"/><line x1="235" y1="199" x2="222" y2="219"/><line x1="235" y1="199" x2="248" y2="219"/></g>
        <g class="wr-action wr-fill"><ellipse cx="274" cy="53" rx="30" ry="11"/><rect x="257" y="41" width="34" height="13" rx="6"/><line class="wr-line wr-thin" x1="274" y1="64" x2="274" y2="84"/></g>
      </svg>`
    },
    {
      id: "mountain",
      name: "Mountain Rescue",
      resource: "Helicopter fuel",
      success: "The helicopter reached the ledge.",
      stages: [["Wind rising","≈",20,25],["Snow starts","❄",37,20],["Clouds close in","☁",58,16],["Rotor strain","!",81,27],["Visibility critical","❄",68,43],["Helicopter turns away","×",83,18]],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A hiker waits on a mountain ledge while a rescue helicopter approaches.">
        <path class="wr-snow" d="M0 220 L72 112 L109 151 L164 57 L250 220 Z"/><path class="wr-soft-fill" d="M150 220 L232 132 L320 220 Z"/>
        <path class="wr-line wr-thin" d="M72 112 L109 151 L164 57 L250 220 M150 220 L232 132 L320 220"/>
        <g class="wr-line wr-thin"><circle cx="191" cy="139" r="11"/><line x1="191" y1="150" x2="191" y2="179"/><line x1="191" y1="158" x2="174" y2="168"/><line x1="191" y1="158" x2="207" y2="168"/></g>
        <g class="wr-action wr-fill"><rect x="244" y="54" width="48" height="20" rx="10"/><line class="wr-line wr-thin" x1="255" y1="54" x2="274" y2="38"/><line class="wr-line wr-thin" x1="234" y1="64" x2="205" y2="64"/><line class="wr-line wr-thin" x1="260" y1="38" x2="294" y2="38"/><circle cx="254" cy="78" r="5"/><circle cx="282" cy="78" r="5"/></g>
        <path class="wr-accent wr-beacon wr-success" d="M208 121 Q221 110 234 121"/>
      </svg>`
    },
    {
      id: "island",
      name: "Island Rescue",
      resource: "Time before the tide wins",
      success: "The rescue boat reached the island.",
      stages: [["Water reaches the beach"],["The shoreline is disappearing"],["The island is half flooded"],["Water reaches the survivor"],["Only the high ground remains"],["The island is submerged"]],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A stranded person waits on a shrinking island while a rescue boat approaches.">
        <defs>
          <linearGradient id="wrIslandSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#dff3ff"/>
            <stop offset="100%" stop-color="#f8fbff"/>
          </linearGradient>
          <linearGradient id="wrIslandWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7dd3fc"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="320" height="230" fill="url(#wrIslandSky)"/>
        <circle cx="266" cy="40" r="18" fill="#fbbf24" opacity=".75"/>
        <g id="island-palm" class="wr-island-palm">
          <line class="wr-line wr-thin" x1="99" y1="165" x2="111" y2="101"/>
          <path d="M111 102 Q135 106 143 126 Q124 125 110 113" fill="#86b97a" stroke="#1e293b" stroke-width="3"/>
          <path d="M111 102 Q92 98 78 114 Q96 117 111 111" fill="#86b97a" stroke="#1e293b" stroke-width="3"/>
        </g>
        <path id="island-land" class="wr-sand" d="M32 181 Q84 136 157 176 Q134 202 52 201 Z"/>
        <g id="island-survivor" class="wr-line wr-thin">
          <circle cx="79" cy="151" r="10" fill="#fff"/>
          <line x1="79" y1="161" x2="79" y2="188"/>
          <line x1="79" y1="168" x2="64" y2="179"/>
          <line x1="79" y1="168" x2="95" y2="177"/>
          <line x1="79" y1="188" x2="68" y2="202"/>
          <line x1="79" y1="188" x2="90" y2="202"/>
        </g>
        <g id="island-boat" class="wr-fill wr-island-boat">
          <path d="M236 144 L304 144 L286 168 L247 168 Z"/>
          <rect x="257" y="123" width="28" height="21" rx="3"/>
          <line class="wr-line wr-thin" x1="271" y1="123" x2="271" y2="105"/>
          <path d="M271 107 L289 116 L271 121 Z" fill="#f29c38" stroke="none"/>
        </g>
        <g id="island-waves-back" opacity=".55">
          <path d="M0 164 Q20 153 40 164 T80 164 T120 164 T160 164 T200 164 T240 164 T280 164 T320 164" fill="none" stroke="#60a5fa" stroke-width="5"/>
        </g>
        <rect id="island-water-rise" x="0" y="164" width="320" height="90" fill="url(#wrIslandWater)" opacity=".82"/>
        <path id="island-water-line" d="M0 164 Q20 153 40 164 T80 164 T120 164 T160 164 T200 164 T240 164 T280 164 T320 164" fill="none" stroke="#eff6ff" stroke-width="6"/>
      </svg>`
    },
    {
      id: "space",
      name: "Orbital Rescue",
      resource: "Oxygen reserve",
      success: "The rescue craft docked safely.",
      stages: [["Oxygen warning","O₂",43,55],["Power fault","⚡",52,44],["Comms fading","≈",61,39],["Capsule drifting","↗",54,67],["Docking lock lost","!",79,40],["Oxygen depleted","×",48,50]],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A disabled space capsule waits for a rescue craft in orbit.">
        <circle cx="62" cy="54" r="3" fill="#64748b"/><circle cx="121" cy="28" r="2" fill="#64748b"/><circle cx="274" cy="94" r="3" fill="#64748b"/><circle cx="210" cy="39" r="2" fill="#64748b"/>
        <circle class="wr-water" cx="72" cy="187" r="76"/><path class="wr-soft-fill" d="M18 181 Q65 144 126 171 Q104 208 41 220 Z"/>
        <g class="wr-fill"><path d="M135 116 Q159 85 183 116 L177 154 L141 154 Z"/><line class="wr-line wr-thin" x1="159" y1="85" x2="159" y2="67"/></g>
        <g class="wr-action wr-fill"><rect x="235" y="77" width="47" height="30" rx="9"/><path d="M235 85 L220 76 L220 108 L235 100 Z"/><line class="wr-line wr-thin" x1="282" y1="92" x2="301" y2="92"/></g>
        <path class="wr-accent wr-beacon wr-success" d="M190 103 Q204 91 218 103"/>
      </svg>`
    },
    {
      id: "flood",
      name: "Flood Rescue",
      resource: "Rescue time",
      success: "The rescue boat reached the rooftop.",
      stages: [["Water rising","≈",22,67],["Rain intensifies","☂",40,20],["Current strengthens","≈",56,69],["Roof access shrinking","!",43,47],["Boat pushed off line","↗",83,58],["Water critical","×",48,63]],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A person waits on a rooftop during a flood while a rescue boat approaches.">
        <path class="wr-water" d="M0 157 Q24 147 48 157 T96 157 T144 157 T192 157 T240 157 T320 157 V230 H0 Z"/>
        <g class="wr-fill"><rect x="53" y="108" width="98" height="67"/><path d="M42 109 L102 69 L162 109 Z"/></g>
        <g class="wr-line wr-thin"><circle cx="105" cy="88" r="9"/><line x1="105" y1="97" x2="105" y2="119"/><line x1="105" y1="104" x2="91" y2="113"/><line x1="105" y1="104" x2="119" y2="113"/></g>
        <g class="wr-action wr-fill"><path d="M231 143 L297 143 L282 166 L242 166 Z"/><rect x="252" y="124" width="25" height="19" rx="3"/></g>
        <path class="wr-accent wr-beacon wr-success" d="M116 77 Q128 66 140 77"/>
      </svg>`
    },
    {
      id: "forest",
      name: "Forest Search",
      resource: "Search daylight",
      success: "The search team found the explorer.",
      stages: [["Trail lost","?",49,60],["Fog building","☁",37,30],["Daylight fading","◐",68,24],["Search route blocked","×",58,63],["Vehicle loses trail","!",84,64],["Darkness falls","●",50,33]],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A lost explorer waits in a forest as a rescue vehicle approaches.">
        <path class="wr-soft-fill" d="M0 199 Q70 183 140 199 T280 198 T320 198 V230 H0 Z"/>
        <g fill="#dbe7d2" stroke="#1e293b" stroke-width="4"><path d="M40 172 L67 105 L94 172 Z"/><path d="M92 174 L121 90 L150 174 Z"/><path d="M238 177 L266 98 L294 177 Z"/></g>
        <g class="wr-line wr-thin"><circle cx="184" cy="149" r="11"/><line x1="184" y1="160" x2="184" y2="191"/><line x1="184" y1="168" x2="168" y2="180"/><line x1="184" y1="168" x2="200" y2="180"/></g>
        <g class="wr-action wr-fill"><rect x="248" y="153" width="53" height="27" rx="5"/><rect x="260" y="138" width="25" height="15" rx="3"/><circle cx="259" cy="184" r="7"/><circle cx="290" cy="184" r="7"/></g>
        <path class="wr-accent wr-beacon wr-success" d="M200 137 Q212 126 224 137"/>
      </svg>`
    },
    {
      id: "arctic",
      name: "Arctic Rescue",
      resource: "Heat reserve",
      success: "The snowcat reached the research team.",
      stages: [["Temperature drops","❄",47,62],["Wind rising","≈",38,27],["Snow thickens","❄",59,25],["Heat system failing","!",40,54],["Whiteout","☁",69,33],["Heat depleted","×",51,50]],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="Researchers wait at an Arctic station while a snow rescue vehicle approaches.">
        <path class="wr-snow" d="M0 170 Q45 150 91 170 T184 168 T276 170 T320 166 V230 H0 Z"/>
        <g class="wr-fill"><rect x="47" y="111" width="102" height="67"/><path d="M39 111 L98 76 L157 111 Z"/><rect x="84" y="136" width="28" height="42"/></g>
        <g class="wr-line wr-thin"><circle cx="178" cy="151" r="10"/><line x1="178" y1="161" x2="178" y2="190"/></g>
        <g class="wr-action wr-fill"><rect x="241" y="147" width="58" height="30" rx="7"/><rect x="254" y="132" width="27" height="15" rx="4"/><path d="M237 181 H303"/></g>
        <path class="wr-accent wr-beacon wr-success" d="M164 132 Q177 120 190 132"/>
      </svg>`
    },
    {
      id: "cave",
      name: "Cave Rescue",
      resource: "Rope length",
      success: "The rescue line reached the caver.",
      stages: [["Loose rock","◆",47,29],["Dust cloud","☁",57,44],["Rope snag","!",34,53],["Rockfall","◆",64,62],["Line retracting","↑",34,36],["Route blocked","×",50,70]],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A trapped caver waits below while a rescue team lowers a rope.">
        <path class="wr-dark-fill" d="M0 0 H320 V45 Q275 37 252 66 Q226 94 197 63 Q160 31 125 67 Q90 101 56 61 Q31 32 0 48 Z"/>
        <path class="wr-dark-fill" d="M0 230 V190 Q45 165 78 195 Q108 221 146 191 Q181 162 220 196 Q262 225 320 188 V230 Z"/>
        <g class="wr-line wr-thin"><circle cx="162" cy="168" r="10"/><line x1="162" y1="178" x2="162" y2="203"/><circle cx="105" cy="58" r="9"/><line x1="105" y1="67" x2="105" y2="91"/></g>
        <g class="wr-action"><line class="wr-accent wr-success" x1="105" y1="85" x2="105" y2="154"/><circle class="wr-fill" cx="105" cy="158" r="7"/></g>
        <path class="wr-accent wr-beacon" d="M174 153 Q187 141 200 153"/>
      </svg>`
    },
    {
      id: "lighthouse",
      name: "Storm Rescue",
      resource: "Emergency power",
      success: "The Coast Guard boat reached the lighthouse.",
      stages: [["Rain begins","☂",34,20],["Waves grow","≈",48,70],["Wind strengthens","≈",62,26],["Beacon flickers","⚡",37,37],["Boat pushed back","!",83,61],["Beacon out","×",41,34]],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A lighthouse keeper waits during a storm as a rescue boat approaches.">
        <path class="wr-water" d="M0 171 Q25 154 50 171 T100 171 T150 171 T200 171 T250 171 T320 171 V230 H0 Z"/>
        <g class="wr-fill"><path d="M56 171 L70 85 H116 L130 171 Z"/><rect x="67" y="68" width="52" height="20" rx="4"/><path d="M62 68 L93 48 L124 68 Z"/></g>
        <path class="wr-accent wr-beacon wr-success" d="M120 77 L189 57 M120 80 L190 97"/>
        <g class="wr-action wr-fill"><path d="M232 151 L302 151 L286 175 L244 175 Z"/><rect x="255" y="130" width="27" height="21" rx="3"/></g>
        <path class="wr-line wr-thin" d="M18 39 Q38 23 58 39 M224 45 Q244 29 264 45"/>
      </svg>`
    },
    {
      id: "desert",
      name: "Desert Airlift",
      resource: "Water reserve",
      success: "The rescue aircraft reached the outpost.",
      stages: [["Heat rising","☀",30,22],["Water low","!",49,63],["Wind picks up","≈",61,32],["Dust builds","☁",68,43],["Aircraft loses visual","!",83,29],["Water depleted","×",49,58]],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A stranded traveler waits at a desert outpost while a rescue aircraft approaches.">
        <path class="wr-sand" d="M0 176 Q57 135 118 175 Q173 205 229 171 Q274 144 320 177 V230 H0 Z"/>
        <g class="wr-fill"><rect x="56" y="125" width="84" height="56"/><path d="M48 126 L98 96 L148 126 Z"/></g>
        <g class="wr-line wr-thin"><circle cx="173" cy="153" r="10"/><line x1="173" y1="163" x2="173" y2="191"/><path d="M30 176 V130 M19 142 Q30 132 41 142"/></g>
        <g class="wr-action wr-fill"><path d="M243 59 L301 59 L280 73 L249 73 Z"/><line class="wr-line wr-thin" x1="270" y1="59" x2="270" y2="42"/><line class="wr-line wr-thin" x1="256" y1="42" x2="285" y2="42"/></g>
        <path class="wr-accent wr-beacon wr-success" d="M184 138 Q198 126 212 138"/>
      </svg>`
    }
  ];

  const MAX_WRONG = 6;
  const STORAGE_KEY = "teachArcadeWordRescueStreaks";
  const LEGACY_STORAGE_KEY = "teachArcadeHangmanStreaks";

  const els = {
    category: document.getElementById("category-select"),
    surprise: document.getElementById("surprise-category"),
    newWord: document.getElementById("new-word"),
    categoryLabel: document.getElementById("category-label"),
    clueButton: document.getElementById("clue-button"),
    clueText: document.getElementById("clue-text"),
    word: document.getElementById("word-display"),
    feedback: document.getElementById("feedback"),
    keyboard: document.getElementById("keyboard"),
    wrongCount: document.getElementById("wrong-count"),
    wrongLetters: document.getElementById("wrong-letters"),
    currentStreak: document.getElementById("current-streak"),
    bestStreak: document.getElementById("best-streak"),
    endActions: document.getElementById("end-actions"),
    playAgain: document.getElementById("play-again"),
    signalStatus: document.getElementById("signal-status"),
    signalCells: Array.from(document.querySelectorAll(".word-rescue-page__cell")),
    rescueScene: document.getElementById("rescue-scene"),
    sceneArt: document.getElementById("scene-art"),
    sceneName: document.getElementById("scene-name"),
    sceneKicker: document.getElementById("scene-kicker"),
    resourceLabel: document.getElementById("resource-label")
  };

  let activeCategory = "animals";
  let activeEntry = null;
  let guessed = new Set();
  let wrong = [];
  let state = "playing";
  let streaks = loadStreaks();
  let lastWord = "";
  let activeScene = null;
  let lastSceneId = "";

  function parseStreaks(raw) {
    try {
      const stored = JSON.parse(raw);
      return {
        current: Number.isFinite(stored?.current) ? Math.max(0, stored.current) : 0,
        best: Number.isFinite(stored?.best) ? Math.max(0, stored.best) : 0
      };
    } catch {
      return null;
    }
  }

  function loadStreaks() {
    try {
      const current = parseStreaks(localStorage.getItem(STORAGE_KEY));
      if (current) return current;
      const legacy = parseStreaks(localStorage.getItem(LEGACY_STORAGE_KEY));
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
        return legacy;
      }
    } catch {}
    return { current: 0, best: 0 };
  }

  function saveStreaks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(streaks)); } catch {}
  }

  function updateStreakDisplay() {
    els.currentStreak.textContent = String(streaks.current);
    els.bestStreak.textContent = String(streaks.best);
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function chooseEntry(category) {
    const choices = WORDS[category];
    const alternatives = choices.filter(item => item.word !== lastWord);
    return randomItem(alternatives.length ? alternatives : choices);
  }

  function chooseScene() {
    const choices = SCENES.filter(scene => scene.id !== lastSceneId);
    activeScene = lastSceneId ? randomItem(choices.length ? choices : SCENES) : SCENES.find(scene => scene.id === "island");
    lastSceneId = activeScene.id;
    els.rescueScene.dataset.scene = activeScene.id;
    els.sceneName.textContent = activeScene.name;
    els.sceneKicker.textContent = "Rescue Mission";
    els.resourceLabel.textContent = activeScene.resource;
    els.sceneArt.innerHTML = activeScene.markup + '<div class="word-rescue-page__stage-layer" id="stage-layer" aria-hidden="true"></div>';
    if (activeScene.id !== "island") {
      activeScene.stages.forEach((stage, index) => {
        const [label, symbol, left, top] = stage;
        const mark = document.createElement("span");
        mark.className = "word-rescue-page__stage-mark";
        mark.dataset.stage = String(index + 1);
        mark.style.left = `${left}%`;
        mark.style.top = `${top}%`;
        mark.textContent = symbol;
        mark.title = label;
        mark.setAttribute("aria-label", label);
        document.getElementById("stage-layer").appendChild(mark);
      });
    }
    els.rescueScene.dataset.wrong = "0";
    els.rescueScene.setAttribute("aria-label", `${activeScene.name}: ${activeScene.resource} status`);
  }

  function startRound(category = els.category.value) {
    activeCategory = category;
    els.category.value = category;
    activeEntry = chooseEntry(category);
    lastWord = activeEntry.word;
    guessed = new Set();
    wrong = [];
    state = "playing";

    els.categoryLabel.textContent = CATEGORY_NAMES[category];
    els.clueText.textContent = activeEntry.clue;
    els.clueText.hidden = true;
    els.clueButton.textContent = "Show Clue";
    els.clueButton.disabled = false;
    els.feedback.textContent = "Pick a letter or type on your keyboard.";
    els.feedback.classList.remove("is-win", "is-loss");
    els.endActions.hidden = true;
    els.rescueScene.classList.remove("is-rescued", "is-offline");
    chooseScene();

    render();
  }

  function renderWord(revealAll = false) {
    els.word.replaceChildren();
    const words = activeEntry.word.toUpperCase().split(" ");
    words.forEach((word, wordIndex) => {
      const group = document.createElement("span");
      group.className = "word-rescue-page__word-group";
      group.setAttribute("aria-label", `Word ${wordIndex + 1}`);
      [...word].forEach(letter => {
        const slot = document.createElement("span");
        slot.className = "word-rescue-page__slot";
        slot.textContent = revealAll || guessed.has(letter.toLowerCase()) ? letter : "";
        group.appendChild(slot);
      });
      els.word.appendChild(group);
    });
  }

  function renderKeyboard() {
    els.keyboard.replaceChildren();
    [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].forEach(letter => {
      const lower = letter.toLowerCase();
      const button = document.createElement("button");
      button.type = "button";
      button.className = "word-rescue-page__letter";
      button.textContent = letter;
      button.dataset.letter = lower;
      button.setAttribute("aria-label", `Guess ${letter}`);
      if (guessed.has(lower)) {
        button.disabled = true;
        button.classList.add(activeEntry.word.includes(lower) ? "is-correct" : "is-wrong");
      } else if (state !== "playing") {
        button.disabled = true;
      }
      button.addEventListener("click", () => guess(lower));
      els.keyboard.appendChild(button);
    });
  }

  function solvedProgress() {
    const letters = [...activeEntry.word.toLowerCase()].filter(char => /[a-z]/.test(char));
    if (!letters.length) return 0;
    const revealed = letters.filter(char => guessed.has(char)).length;
    return Math.max(0, Math.min(1, revealed / letters.length));
  }

  function renderIslandRescue() {
    if (activeScene?.id !== "island") return;
    const water = document.getElementById("island-water-rise");
    const line = document.getElementById("island-water-line");
    const boat = document.getElementById("island-boat");
    const palm = document.getElementById("island-palm");
    const survivor = document.getElementById("island-survivor");
    if (!water || !line || !boat || !palm || !survivor) return;

    const stage = Math.min(MAX_WRONG, wrong.length);
    const waterY = 164 - (stage * 10);
    water.setAttribute("y", String(waterY));
    water.setAttribute("height", String(230 - waterY + 18));
    line.setAttribute("d", `M0 ${waterY} Q20 ${waterY - 11} 40 ${waterY} T80 ${waterY} T120 ${waterY} T160 ${waterY} T200 ${waterY} T240 ${waterY} T280 ${waterY} T320 ${waterY}`);

    const progress = solvedProgress();
    const boatShift = Math.round(progress * -112);
    boat.setAttribute("transform", `translate(${boatShift} 0)`);

    const palmTilt = Math.max(0, stage - 2) * -2;
    palm.setAttribute("transform", `rotate(${palmTilt} 104 151)`);
    survivor.setAttribute("transform", stage >= 5 ? "translate(0 -8)" : "");

    if (state === "won") {
      boat.setAttribute("transform", "translate(-145 0)");
    }
  }

  function renderSignal() {
    const remaining = Math.max(0, MAX_WRONG - wrong.length);
    els.signalStatus.textContent = `${remaining} / ${MAX_WRONG}`;
    els.rescueScene.dataset.wrong = String(wrong.length);
    els.signalCells.forEach((cell, index) => {
      cell.classList.toggle("is-offline", index >= remaining);
    });
    els.sceneArt.querySelectorAll(".word-rescue-page__stage-mark").forEach(mark => {
      mark.classList.toggle("is-visible", Number(mark.dataset.stage) <= wrong.length);
    });
    els.wrongCount.textContent = String(wrong.length);
    els.wrongLetters.textContent = wrong.length ? wrong.map(letter => letter.toUpperCase()).join("  ") : "None yet";
    renderIslandRescue();
  }

  function render() {
    renderWord(state === "lost");
    renderKeyboard();
    renderSignal();
    updateStreakDisplay();
  }

  function isSolved() {
    return [...activeEntry.word.toLowerCase()].every(char => char === " " || guessed.has(char));
  }

  function endRound(result) {
    state = result;
    if (result === "won") {
      streaks.current += 1;
      streaks.best = Math.max(streaks.best, streaks.current);
      els.feedback.textContent = `Rescue complete — ${activeEntry.word.toUpperCase()}! ${activeScene.success} Streak extended.`;
      els.feedback.classList.add("is-win");
      els.rescueScene.classList.add("is-rescued");
    } else {
      streaks.current = 0;
      els.feedback.textContent = `Mission failed. The word was ${activeEntry.word.toUpperCase()}. Start a new rescue and try again.`;
      els.feedback.classList.add("is-loss");
      els.rescueScene.classList.add("is-offline");
    }
    saveStreaks();
    els.endActions.hidden = false;
    render();
  }

  function guess(letter) {
    if (state !== "playing" || !/^[a-z]$/.test(letter) || guessed.has(letter)) return;
    guessed.add(letter);

    if (activeEntry.word.includes(letter)) {
      els.feedback.textContent = activeScene.id === "island"
        ? "Good guess — the rescue boat is getting closer."
        : "Good guess — the rescue is still on track.";
    } else {
      wrong.push(letter);
      const remaining = MAX_WRONG - wrong.length;
      const stageLabel = activeScene.stages[wrong.length - 1]?.[0] || "Rescue conditions worsening";
      els.feedback.textContent = remaining === 1
        ? `${stageLabel}. Critical — one chance left.`
        : `${stageLabel}. ${remaining} chances remaining.`;
    }

    if (isSolved()) {
      endRound("won");
      return;
    }
    if (wrong.length >= MAX_WRONG) {
      endRound("lost");
      return;
    }
    render();
  }

  function surpriseRound() {
    startRound(randomItem(Object.keys(WORDS)));
  }

  els.newWord.addEventListener("click", () => startRound(els.category.value));
  els.surprise.addEventListener("click", surpriseRound);
  els.playAgain.addEventListener("click", () => startRound(activeCategory));
  els.category.addEventListener("change", () => startRound(els.category.value));
  els.clueButton.addEventListener("click", () => {
    const showing = !els.clueText.hidden;
    els.clueText.hidden = showing;
    els.clueButton.textContent = showing ? "Show Clue" : "Hide Clue";
  });

  document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (/^[a-z]$/.test(key)) guess(key);
  });

  updateStreakDisplay();
  startRound(activeCategory);
})();