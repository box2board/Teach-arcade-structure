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
      resource: "Tower integrity",
      success: "The aircraft reached the signal station.",
      stages: ["The top antenna breaks loose","A support brace snaps","Another brace gives way","The mast begins to lean","Only the base is holding","The signal tower collapses"],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A stranded explorer beside a radio tower while a rescue aircraft approaches.">
        <rect width="320" height="230" fill="#eaf7ff"/>
        <path class="wr-soft-fill" d="M0 191 Q55 175 112 191 T222 190 T320 188 V230 H0 Z"/>
        <g id="signal-tower" class="wr-line">
          <line id="signal-part-6" x1="74" y1="188" x2="108" y2="84"/>
          <line id="signal-part-5" x1="142" y1="188" x2="108" y2="84"/>
          <line id="signal-part-4" x1="84" y1="155" x2="132" y2="155"/>
          <line id="signal-part-3" x1="92" y1="127" x2="124" y2="127"/>
          <line id="signal-part-2" x1="100" y1="103" x2="116" y2="103"/>
          <circle id="signal-part-1" cx="108" cy="75" r="9"/>
        </g>
        <g id="signal-waves" class="wr-accent wr-beacon">
          <path d="M88 61 Q108 42 128 61"/><path d="M75 49 Q108 18 141 49"/>
        </g>
        <g class="wr-line wr-thin"><circle cx="217" cy="153" r="12" fill="#fff"/><line x1="217" y1="165" x2="217" y2="197"/><line x1="217" y1="174" x2="200" y2="186"/><line x1="217" y1="174" x2="234" y2="186"/></g>
        <g id="signal-rescue" class="wr-fill wr-rescue-mover">
          <ellipse cx="274" cy="53" rx="30" ry="11"/><rect x="257" y="41" width="34" height="13" rx="6"/>
          <line class="wr-line wr-thin" x1="274" y1="64" x2="274" y2="84"/>
        </g>
      </svg>`
    },
    {
      id: "mountain",
      name: "Mountain Rescue",
      resource: "Avalanche distance",
      success: "The helicopter reached the ledge.",
      stages: ["Snow starts sliding","The avalanche grows","Snow reaches the lower slope","The ledge is nearly cut off","The avalanche reaches the hiker","The ledge is buried"],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A hiker waits on a mountain ledge while a rescue helicopter approaches and an avalanche descends.">
        <rect width="320" height="230" fill="#eaf7ff"/>
        <path class="wr-snow" d="M0 220 L72 112 L109 151 L164 57 L250 220 Z"/><path class="wr-soft-fill" d="M150 220 L232 132 L320 220 Z"/>
        <path class="wr-line wr-thin" d="M72 112 L109 151 L164 57 L250 220 M150 220 L232 132 L320 220"/>
        <g id="mountain-hiker" class="wr-line wr-thin"><circle cx="191" cy="139" r="11" fill="#fff"/><line x1="191" y1="150" x2="191" y2="179"/><line x1="191" y1="158" x2="174" y2="168"/><line x1="191" y1="158" x2="207" y2="168"/></g>
        <path id="mountain-avalanche" d="M123 54 Q153 47 181 61 Q205 75 221 99 Q180 94 150 112 Q133 91 123 54 Z" fill="#fff" stroke="#94a3b8" stroke-width="3"/>
        <g id="mountain-rescue" class="wr-fill wr-rescue-mover"><rect x="244" y="54" width="48" height="20" rx="10"/><line class="wr-line wr-thin" x1="255" y1="54" x2="274" y2="38"/><line class="wr-line wr-thin" x1="234" y1="64" x2="205" y2="64"/><line class="wr-line wr-thin" x1="260" y1="38" x2="294" y2="38"/><circle cx="254" cy="78" r="5"/><circle cx="282" cy="78" r="5"/></g>
      </svg>`
    },
    {
      id: "island",
      name: "Island Rescue",
      resource: "Time before the tide wins",
      success: "The rescue boat reached the island.",
      stages: ["Water reaches the beach","The shoreline is disappearing","The island is half flooded","Water reaches the survivor","Only the high ground remains","The island is submerged"],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A stranded person waits on a shrinking island while a rescue boat approaches.">
        <defs><linearGradient id="wrIslandSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dff3ff"/><stop offset="100%" stop-color="#f8fbff"/></linearGradient><linearGradient id="wrIslandWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs>
        <rect x="0" y="0" width="320" height="230" fill="url(#wrIslandSky)"/><circle cx="266" cy="40" r="18" fill="#fbbf24" opacity=".75"/>
        <g id="island-palm"><line class="wr-line wr-thin" x1="99" y1="165" x2="111" y2="101"/><path d="M111 102 Q135 106 143 126 Q124 125 110 113" fill="#86b97a" stroke="#1e293b" stroke-width="3"/><path d="M111 102 Q92 98 78 114 Q96 117 111 111" fill="#86b97a" stroke="#1e293b" stroke-width="3"/></g>
        <path id="island-land" class="wr-sand" d="M32 181 Q84 136 157 176 Q134 202 52 201 Z"/>
        <g id="island-survivor" class="wr-line wr-thin"><circle cx="79" cy="151" r="10" fill="#fff"/><line x1="79" y1="161" x2="79" y2="188"/><line x1="79" y1="168" x2="64" y2="179"/><line x1="79" y1="168" x2="95" y2="177"/><line x1="79" y1="188" x2="68" y2="202"/><line x1="79" y1="188" x2="90" y2="202"/></g>
        <g id="island-boat" class="wr-fill wr-rescue-mover"><path d="M236 144 L304 144 L286 168 L247 168 Z"/><rect x="257" y="123" width="28" height="21" rx="3"/><line class="wr-line wr-thin" x1="271" y1="123" x2="271" y2="105"/><path d="M271 107 L289 116 L271 121 Z" fill="#f29c38" stroke="none"/></g>
        <rect id="island-water-rise" x="0" y="164" width="320" height="90" fill="url(#wrIslandWater)" opacity=".82"/><path id="island-water-line" d="M0 164 Q20 153 40 164 T80 164 T120 164 T160 164 T200 164 T240 164 T280 164 T320 164" fill="none" stroke="#eff6ff" stroke-width="6"/>
      </svg>`
    },
    {
      id: "space",
      name: "Orbital Rescue",
      resource: "Collision distance",
      success: "The rescue craft docked safely.",
      stages: ["The asteroid enters the flight path","The asteroid closes in","The capsule begins drifting toward it","Collision course confirmed","Impact is seconds away","The capsule is struck"],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A disabled capsule waits in orbit while a rescue craft approaches and an asteroid closes in.">
        <rect width="320" height="230" fill="#eef2ff"/><circle cx="55" cy="45" r="3" fill="#64748b"/><circle cx="116" cy="28" r="2" fill="#64748b"/><circle cx="276" cy="94" r="3" fill="#64748b"/>
        <circle class="wr-water" cx="70" cy="193" r="78"/><path class="wr-soft-fill" d="M17 187 Q64 150 124 177 Q102 212 40 224 Z"/>
        <g id="space-capsule" class="wr-fill"><path d="M132 116 Q158 84 184 116 L177 154 L141 154 Z"/><line class="wr-line wr-thin" x1="158" y1="84" x2="158" y2="66"/></g>
        <g id="space-asteroid"><path d="M301 41 L314 57 L307 78 L286 85 L268 73 L271 50 L286 36 Z" fill="#94a3b8" stroke="#475569" stroke-width="4"/><circle cx="290" cy="57" r="6" fill="#64748b"/></g>
        <g id="space-rescue" class="wr-fill wr-rescue-mover"><rect x="235" y="77" width="47" height="30" rx="9"/><path d="M235 85 L220 76 L220 108 L235 100 Z"/><line class="wr-line wr-thin" x1="282" y1="92" x2="301" y2="92"/></g>
      </svg>`
    },
    {
      id: "flood",
      name: "Flood Rescue",
      resource: "Water level",
      success: "The rescue boat reached the rooftop.",
      stages: ["Water reaches the first floor","The lower windows disappear","Water reaches the second floor","Only the roof is safe","Water reaches the roofline","The rooftop is submerged"],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A person waits on a rooftop as flood water rises and a rescue boat approaches.">
        <rect width="320" height="230" fill="#eaf7ff"/>
        <g class="wr-fill"><rect x="52" y="107" width="101" height="72"/><path d="M40 108 L102 68 L164 108 Z"/><rect x="68" y="129" width="19" height="22"/><rect x="116" y="129" width="19" height="22"/></g>
        <g id="flood-survivor" class="wr-line wr-thin"><circle cx="104" cy="87" r="9" fill="#fff"/><line x1="104" y1="96" x2="104" y2="119"/></g>
        <g id="flood-rescue" class="wr-fill wr-rescue-mover"><path d="M230 143 L299 143 L282 167 L242 167 Z"/><rect x="252" y="123" width="25" height="20" rx="3"/></g>
        <rect id="flood-water-rise" x="0" y="168" width="320" height="80" fill="#60a5fa" opacity=".82"/><path id="flood-water-line" d="M0 168 Q20 157 40 168 T80 168 T120 168 T160 168 T200 168 T240 168 T280 168 T320 168" fill="none" stroke="#eff6ff" stroke-width="6"/>
      </svg>`
    },
    {
      id: "forest",
      name: "Forest Search",
      resource: "Daylight remaining",
      success: "The search vehicle reached the explorer.",
      stages: ["The sun starts setting","The forest darkens","Long shadows cover the trail","The explorer is hard to see","Only a strip of daylight remains","Night falls"],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A lost explorer waits in a forest while a search vehicle approaches and darkness falls.">
        <rect width="320" height="230" fill="#eaf7ff"/><circle id="forest-sun" cx="270" cy="45" r="18" fill="#fbbf24"/>
        <path class="wr-soft-fill" d="M0 199 Q70 183 140 199 T280 198 T320 198 V230 H0 Z"/>
        <g fill="#dbe7d2" stroke="#1e293b" stroke-width="4"><path d="M34 176 L63 102 L92 176 Z"/><path d="M87 178 L119 87 L151 178 Z"/><path d="M224 178 L257 94 L290 178 Z"/></g>
        <g id="forest-survivor" class="wr-line wr-thin"><circle cx="179" cy="149" r="11" fill="#fff"/><line x1="179" y1="160" x2="179" y2="191"/><line x1="179" y1="168" x2="163" y2="180"/><line x1="179" y1="168" x2="195" y2="180"/></g>
        <g id="forest-rescue" class="wr-fill wr-rescue-mover"><rect x="247" y="153" width="54" height="27" rx="5"/><rect x="259" y="138" width="26" height="15" rx="3"/><circle cx="258" cy="184" r="7"/><circle cx="291" cy="184" r="7"/></g>
        <rect id="forest-darkness" x="0" y="0" width="320" height="0" fill="#0f172a" opacity=".78"/>
      </svg>`
    },
    {
      id: "arctic",
      name: "Arctic Rescue",
      resource: "Visibility",
      success: "The snowcat reached the research team.",
      stages: ["Snow starts blowing","The wind strengthens","The station begins disappearing","Visibility drops sharply","Only silhouettes remain","The whiteout closes in"],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="Researchers wait at an Arctic station while a snowcat approaches and a whiteout closes in.">
        <rect width="320" height="230" fill="#edf8ff"/><path class="wr-snow" d="M0 171 Q45 151 91 171 T184 169 T276 171 T320 167 V230 H0 Z"/>
        <g class="wr-fill"><rect x="46" y="111" width="104" height="67"/><path d="M38 111 L98 75 L158 111 Z"/><rect x="84" y="136" width="28" height="42"/></g>
        <g class="wr-line wr-thin"><circle cx="177" cy="151" r="10" fill="#fff"/><line x1="177" y1="161" x2="177" y2="190"/></g>
        <g id="arctic-rescue" class="wr-fill wr-rescue-mover"><rect x="241" y="147" width="58" height="30" rx="7"/><rect x="254" y="132" width="27" height="15" rx="4"/><path d="M237 181 H303"/></g>
        <g id="arctic-whiteout" opacity="0"><rect x="0" y="0" width="320" height="230" fill="#fff"/><path d="M0 55 H320 M0 92 H320 M0 129 H320 M0 166 H320" stroke="#cbd5e1" stroke-width="8"/></g>
      </svg>`
    },
    {
      id: "cave",
      name: "Cave Rescue",
      resource: "Open route",
      success: "The rescue line reached the caver.",
      stages: ["Loose rock starts falling","The opening narrows","More debris blocks the shaft","The rescue path is almost closed","Only a small gap remains","The cave-in seals the route"],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A trapped caver waits below while a rescue rope lowers and a cave-in closes the shaft.">
        <rect width="320" height="230" fill="#e2e8f0"/>
        <path class="wr-dark-fill" d="M0 0 H320 V43 Q273 35 249 66 Q225 94 197 64 Q161 31 125 67 Q91 101 55 61 Q30 32 0 49 Z"/>
        <path class="wr-dark-fill" d="M0 230 V190 Q45 165 78 195 Q108 221 146 191 Q181 162 220 196 Q262 225 320 188 V230 Z"/>
        <g id="cave-caver" class="wr-line wr-thin"><circle cx="163" cy="168" r="10" fill="#fff"/><line x1="163" y1="178" x2="163" y2="203"/></g>
        <g class="wr-line wr-thin"><circle cx="105" cy="58" r="9" fill="#fff"/><line x1="105" y1="67" x2="105" y2="91"/></g>
        <line id="cave-rope" class="wr-accent" x1="105" y1="84" x2="105" y2="96"/>
        <g id="cave-collapse"><path d="M215 38 L244 74 L222 102 L198 76 Z" fill="#64748b"/><path d="M246 60 L278 92 L251 123 L229 92 Z" fill="#475569"/></g>
      </svg>`
    },
    {
      id: "lighthouse",
      name: "Storm Rescue",
      resource: "Wave height",
      success: "The Coast Guard boat reached the lighthouse.",
      stages: ["The surf grows rough","Waves cover the rocks","Water reaches the lighthouse base","The boat is fighting heavy seas","Waves reach the lower tower","A giant wave overwhelms the landing"],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A lighthouse keeper waits as a Coast Guard boat approaches and waves grow.">
        <rect width="320" height="230" fill="#dbeafe"/>
        <g class="wr-fill"><path d="M55 174 L69 85 H117 L131 174 Z"/><rect x="66" y="68" width="53" height="20" rx="4"/><path d="M61 68 L93 48 L125 68 Z"/></g>
        <path class="wr-accent wr-beacon" d="M120 77 L189 57 M120 80 L190 97"/>
        <g id="lighthouse-rescue" class="wr-fill wr-rescue-mover"><path d="M231 151 L302 151 L286 175 L243 175 Z"/><rect x="255" y="130" width="27" height="21" rx="3"/></g>
        <rect id="lighthouse-water-rise" x="0" y="174" width="320" height="70" fill="#3b82f6" opacity=".8"/><path id="lighthouse-wave" d="M0 174 Q25 154 50 174 T100 174 T150 174 T200 174 T250 174 T320 174" fill="none" stroke="#eff6ff" stroke-width="8"/>
      </svg>`
    },
    {
      id: "desert",
      name: "Desert Airlift",
      resource: "Clear visibility",
      success: "The rescue aircraft reached the outpost.",
      stages: ["Dust appears on the horizon","The sandstorm grows","The outpost starts disappearing","Visibility drops quickly","The traveler is barely visible","The sandstorm covers the outpost"],
      markup: `<svg viewBox="0 0 320 230" role="img" aria-label="A stranded traveler waits at a desert outpost while a rescue aircraft approaches and a sandstorm closes in.">
        <rect width="320" height="230" fill="#fff7ed"/><circle cx="272" cy="43" r="20" fill="#fbbf24" opacity=".82"/>
        <path class="wr-sand" d="M0 176 Q57 135 118 175 Q173 205 229 171 Q274 144 320 177 V230 H0 Z"/>
        <g class="wr-fill"><rect x="55" y="125" width="86" height="56"/><path d="M47 126 L98 96 L149 126 Z"/></g>
        <g id="desert-survivor" class="wr-line wr-thin"><circle cx="173" cy="153" r="10" fill="#fff"/><line x1="173" y1="163" x2="173" y2="191"/></g>
        <g id="desert-rescue" class="wr-fill wr-rescue-mover"><path d="M243 59 L301 59 L280 73 L249 73 Z"/><line class="wr-line wr-thin" x1="270" y1="59" x2="270" y2="42"/><line class="wr-line wr-thin" x1="256" y1="42" x2="285" y2="42"/></g>
        <rect id="desert-storm" x="320" y="0" width="320" height="230" fill="#d6a35d" opacity=".78"/>
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
    els.sceneArt.innerHTML = activeScene.markup;
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

  function setTransform(id, x = 0, y = 0) {
    const el = document.getElementById(id);
    if (el) el.setAttribute("transform", `translate(${Math.round(x)} ${Math.round(y)})`);
  }

  function setWater(idRect, idLine, baseY, step, stage) {
    const water = document.getElementById(idRect);
    const line = document.getElementById(idLine);
    const y = baseY - (stage * step);
    if (water) {
      water.setAttribute("y", String(y));
      water.setAttribute("height", String(230 - y + 18));
    }
    if (line) line.setAttribute("d", `M0 ${y} Q20 ${y - 11} 40 ${y} T80 ${y} T120 ${y} T160 ${y} T200 ${y} T240 ${y} T280 ${y} T320 ${y}`);
  }

  function renderPhysicalScene() {
    if (!activeScene) return;
    const progress = state === "won" ? 1 : solvedProgress();
    const stage = Math.min(MAX_WRONG, wrong.length);

    switch (activeScene.id) {
      case "island": {
        setWater("island-water-rise", "island-water-line", 164, 10, stage);
        setTransform("island-boat", progress * -145, 0);
        const palm = document.getElementById("island-palm");
        const survivor = document.getElementById("island-survivor");
        if (palm) palm.setAttribute("transform", `rotate(${Math.max(0, stage - 2) * -2} 104 151)`);
        if (survivor) survivor.setAttribute("transform", stage >= 5 ? "translate(0 -8)" : "");
        break;
      }
      case "signal": {
        setTransform("signal-rescue", progress * -105, progress * 35);
        for (let i = 1; i <= 6; i++) {
          const part = document.getElementById(`signal-part-${i}`);
          if (part) {
            const broken = i <= stage;
            part.style.opacity = broken ? ".15" : "1";
            part.style.transform = broken ? `translate(${i * 2}px,${10 + i * 3}px) rotate(${i % 2 ? -12 : 12}deg)` : "";
          }
        }
        const waves = document.getElementById("signal-waves");
        if (waves) waves.style.opacity = String(Math.max(.08, 1 - stage * .15));
        break;
      }
      case "mountain": {
        setTransform("mountain-rescue", progress * -92, progress * 54);
        setTransform("mountain-avalanche", stage * 8, stage * 16);
        const avalanche = document.getElementById("mountain-avalanche");
        if (avalanche) avalanche.setAttribute("transform", `translate(${stage * 8} ${stage * 16}) scale(${1 + stage * .08})`);
        break;
      }
      case "space": {
        setTransform("space-rescue", progress * -82, progress * 22);
        setTransform("space-asteroid", stage * -23, stage * 9);
        if (stage >= 4) setTransform("space-capsule", (stage - 3) * 5, (stage - 3) * 3);
        break;
      }
      case "flood": {
        setTransform("flood-rescue", progress * -120, 0);
        setWater("flood-water-rise", "flood-water-line", 168, 11, stage);
        const survivor = document.getElementById("flood-survivor");
        if (survivor) survivor.setAttribute("transform", stage >= 5 ? "translate(0 -8)" : "");
        break;
      }
      case "forest": {
        setTransform("forest-rescue", progress * -102, 0);
        const dark = document.getElementById("forest-darkness");
        if (dark) dark.setAttribute("height", String(stage * 38));
        const sun = document.getElementById("forest-sun");
        if (sun) sun.setAttribute("cy", String(45 + stage * 21));
        break;
      }
      case "arctic": {
        setTransform("arctic-rescue", progress * -105, 0);
        const whiteout = document.getElementById("arctic-whiteout");
        if (whiteout) whiteout.setAttribute("opacity", String(Math.min(.93, stage * .15)));
        break;
      }
      case "cave": {
        const rope = document.getElementById("cave-rope");
        if (rope) rope.setAttribute("y2", String(96 + progress * 76));
        setTransform("cave-collapse", stage * -10, stage * 15);
        const collapse = document.getElementById("cave-collapse");
        if (collapse) collapse.setAttribute("transform", `translate(${stage * -10} ${stage * 15}) scale(${1 + stage * .08})`);
        break;
      }
      case "lighthouse": {
        setTransform("lighthouse-rescue", progress * -112, 0);
        setWater("lighthouse-water-rise", "lighthouse-wave", 174, 10, stage);
        break;
      }
      case "desert": {
        setTransform("desert-rescue", progress * -115, progress * 48);
        const storm = document.getElementById("desert-storm");
        if (storm) storm.setAttribute("x", String(320 - stage * 53));
        break;
      }
    }
  }

  function renderSignal() {
    const remaining = Math.max(0, MAX_WRONG - wrong.length);
    els.signalStatus.textContent = `${remaining} / ${MAX_WRONG}`;
    els.rescueScene.dataset.wrong = String(wrong.length);
    els.signalCells.forEach((cell, index) => {
      cell.classList.toggle("is-offline", index >= remaining);
    });
    els.wrongCount.textContent = String(wrong.length);
    els.wrongLetters.textContent = wrong.length ? wrong.map(letter => letter.toUpperCase()).join("  ") : "None yet";
    renderPhysicalScene();
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
      els.feedback.textContent = "Good guess — the rescue is getting closer.";
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