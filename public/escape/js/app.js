(function(){
  const $ = (sel, el=document)=>el.querySelector(sel);
  const toastEl = $('#toast');

  // --- State ---
  const G = {
    sceneIndex: 0,
    timeLeft: 0,            // set after ROOM_DATA loads
    timerId: null,
    hintsUsed: 0,
    inventory: new Map(),
    journal: []
  };

  // --- HUD elements ---
  const progressBar = $('#progressBar');
  const progressText = $('#progressText');
  const timerEl = $('#timer');
  const hintBtn = $('#hintBtn');
  const audioToggle = $('#audioToggle');
  const ambience = $('#ambience');
  const continueBtn = $('#continueBtn');
  const sceneRoot = $('#sceneRoot');
  const invList = $('#invList');
  const journalFeed = $('#journalFeed');

  function fmt(ss){ const m=Math.floor(ss/60), s=ss%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
  function setProgress(){
    const total = ROOM_DATA.scenes.length;
    progressBar.style.width = `${((G.sceneIndex+1)/total)*100}%`;
    progressText.textContent = `Scene ${G.sceneIndex+1} of ${total}`;
  }
  function setTimer(){ timerEl.textContent = fmt(G.timeLeft); }
  function startTimer(){
    if (G.timerId) clearInterval(G.timerId);
    G.timerId = setInterval(()=>{
      G.timeLeft--;
      if (G.timeLeft <= 0){
        G.timeLeft = 0; clearInterval(G.timerId);
        failMission();
      }
      setTimer();
    }, 1000);
  }
  function apiToast(msg){
    toastEl.textContent = msg;
    toastEl.hidden = false;
    setTimeout(()=>toastEl.hidden = true, 1600);
  }
  window.apiToast = apiToast;

  // --- Inventory & Journal ---
  function addItem(item){
    if (!item || G.inventory.has(item.id)) return;
    G.inventory.set(item.id, item);
    const li = document.createElement('li');
    li.textContent = item.label;
    invList.appendChild(li);
    apiToast(`+ ${item.label}`);
  }
  function journal(line){
    if (!line) return;
    G.journal.push(line);
    const div = document.createElement('div');
    div.className = 'entry';
    div.textContent = line;
    journalFeed.prepend(div);
  }

  // --- Router / Scenes ---
  let currentScene = null;
  function mountScene(){
    currentScene?.dispose?.();

    const conf = ROOM_DATA.scenes[G.sceneIndex];
    const factory = window.SceneRegistry[conf.type];
    if (!factory){
      sceneRoot.innerHTML = `<div class="card">Scene type <span class="kbd">${conf.type}</span> not implemented yet.</div>`;
      continueBtn.disabled = false;
      return;
    }
    currentScene = factory();

    const api = {
      addItem, journal,
      enableContinue:(v)=>{ continueBtn.disabled = !v; }
    };

    sceneRoot.innerHTML = '';
    currentScene.render(sceneRoot, api);
    setProgress();
    if (conf.journalOnStart) journal(conf.journalOnStart);
    continueBtn.disabled = true;
  }

  function nextScene(){
    const total = ROOM_DATA.scenes.length;
    if (G.sceneIndex < total - 1){
      G.sceneIndex++;
      mountScene();
    } else {
      sceneRoot.innerHTML = `
        <h2>Mission Complete</h2>
        <div class="card">Prototype end. Final scenes & reflection coming next.</div>
      `;
      continueBtn.disabled = true;
    }
  }

  // --- Hint & Audio ---
  hintBtn.addEventListener('click', ()=>{
    G.hintsUsed++;
    G.timeLeft = Math.max(0, G.timeLeft - 30);
    setTimer();
    currentScene?.showHint?.(sceneRoot);
  });
  audioToggle.addEventListener('click', ()=>{
    const pressed = audioToggle.getAttribute('aria-pressed') === 'true';
    audioToggle.setAttribute('aria-pressed', String(!pressed));
    if (pressed){ ambience.pause(); audioToggle.textContent = '🔇'; }
    else { try{ ambience.play(); }catch{} audioToggle.textContent = '🔊'; }
  });
  continueBtn.addEventListener('click', ()=>{
    if (currentScene?.validate && !currentScene.validate()){
      apiToast('Finish this scene to continue.');
      return;
    }
    nextScene();
  });

  function failMission(){
    sceneRoot.innerHTML = `
      <h2>Mission Failed</h2>
      <div class="card" style="border-color:var(--bad)">
        The gas reaches your position before HQ receives your signal.
      </div>
      <button id="retryBtn" class="btn primary" style="margin-top:10px">Retry from Scene 1</button>
    `;
    continueBtn.disabled = true;
    document.getElementById('retryBtn').addEventListener('click', ()=>location.reload());
  }

  // --- Boot after room data loads ---
  window.__escape_boot = function(){
    if (!window.ROOM_DATA){
      sceneRoot.innerHTML = '<div class="card">No room data found.</div>';
      return;
    }
    G.timeLeft = (ROOM_DATA.minutes || 40) * 60;
    setTimer(); setProgress(); startTimer();
    audioToggle.setAttribute('aria-pressed', 'false');
    audioToggle.textContent = '🔇';
    mountScene();
  };
})();
