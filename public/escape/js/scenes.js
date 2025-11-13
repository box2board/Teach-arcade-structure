// Scene renderers registry.
// Each renderer implements: render(root, api), validate(), showHint(), dispose()

(function(){
  const h = (strings, ...vals) => strings.map((s,i)=>s+(vals[i]??'')).join('');

  /* ---------- Scene 1: Evidence Matching (simplified skeleton) ---------- */
  function S1() {
    let solved = false;
    let unsub = [];

    return {
      render(root, api){
        root.innerHTML = h`
          <h2>The Sarajevo Mystery</h2>
          <p class="muted">Examine the dossier. When you're confident, summarize in one word.</p>

          <div class="grid" style="margin:12px 0 10px">
            <div class="card"><strong>📰 Newspaper</strong><div class="muted">Headline about Sarajevo parade...</div></div>
            <div class="card"><strong>🗺️ Map</strong><div class="muted">Arrow from Serbia → Bosnia...</div></div>
            <div class="card"><strong>✉️ Letter</strong><div class="muted">Mentions the “Black Hand”...</div></div>
            <div class="card"><strong>🧍 Photo</strong><div class="muted">Young man: Gavrilo Princip...</div></div>
            <div class="card"><strong>💬 Quote</strong><div class="muted">“A spark to light Europe ablaze.”</div></div>
          </div>

          <div class="card" style="margin-top:12px">
            <label>In one word, what do these clues describe?
              <input id="s1Summary" type="text" placeholder="e.g., Assassination" style="margin-top:6px;width:100%;padding:10px;border-radius:8px;border:1px solid var(--line);background:#0b0e1d;color:var(--ink)">
            </label>
            <div id="s1Status" class="muted" style="margin-top:6px">Press Enter to check.</div>
          </div>
        `;

        const input = root.querySelector('#s1Summary');
        const status = root.querySelector('#s1Status');

        const onKey = (e)=>{
          if (e.key !== 'Enter') return;
          const val = (input.value||'').trim().toLowerCase();
          if (!val) return;
          const accepts = ['assassination','assassination of archduke franz ferdinand','franz ferdinand','sarajevo'];
          if (accepts.includes(val)){
            solved = true;
            status.innerHTML = '<span style="color:var(--ok)">✔ Evidence compiled.</span>';
            api.addItem({id:'main-files', label:'M.A.I.N. Files'});
            api.journal('Assassination identified as spark in June 1914.');
            api.enableContinue(true);
          } else {
            status.innerHTML = '<span style="color:var(--bad)">✖ Not quite. Re-check the dossier.</span>';
          }
        };
        input.addEventListener('keydown', onKey);
        unsub.push(()=>input.removeEventListener('keydown', onKey));
      },
      validate(){ return solved; },
      showHint(){ apiToast('Think: Sarajevo, June 1914 — heir to the Austro-Hungarian throne.'); },
      dispose(){ unsub.forEach(fn=>fn()); }
    };
  }

  /* ---------- Scene 2: Drag-order (M.A.I.N.) ---------- */
  function S2(){
    let solved = false;
    let unsub = [];
    let listEl;

    function renderItem(it){
      return `
        <li class="s2-item" draggable="true" data-id="${it.id}">
          <strong>${it.label}</strong>
          <div class="muted" style="font-size:.9rem">${it.note}</div>
        </li>
      `;
    }

    function currentOrderIds(){
      return [...listEl.querySelectorAll('.s2-item')].map(li=>li.dataset.id);
    }

    function enableDnD(){
      let dragSrc = null;
      listEl.addEventListener('dragstart', e=>{
        const li = e.target.closest('.s2-item');
        if (!li) return;
        dragSrc = li;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', li.dataset.id);
        li.classList.add('dragging');
      });
      listEl.addEventListener('dragover', e=>{
        e.preventDefault();
        const target = e.target.closest('.s2-item');
        if (!target || target === dragSrc) return;
        const rect = target.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height/2;
        listEl.insertBefore(dragSrc, before ? target : target.nextSibling);
      });
      listEl.addEventListener('dragend', e=>{
        const li = e.target.closest('.s2-item');
        li && li.classList.remove('dragging');
      });
    }

    return {
      render(root, api){
        const conf = ROOM_DATA.scenes.find(s=>s.id==='s2');
        root.innerHTML = `
          <h2>M.A.I.N. Files</h2>
          <p class="muted">Drag to arrange the long-term causes into the best escalation order.</p>

          <ol id="s2List" class="card" style="list-style:none;padding:12px;display:grid;gap:8px"></ol>

          <div class="card" style="margin-top:10px">
            <button id="s2Check" class="btn primary">Check Order</button>
            <button id="s2Reset" class="btn alt" style="margin-left:6px">Reset</button>
            <span id="s2Status" class="muted" style="margin-left:10px"></span>
          </div>
        `;

        listEl = root.querySelector('#s2List');
        listEl.innerHTML = conf.order.map(renderItem).join('');
        enableDnD();

        const status = root.querySelector('#s2Status');
        const btnCheck = root.querySelector('#s2Check');
        const btnReset = root.querySelector('#s2Reset');

        const onCheck = ()=>{
          const ids = currentOrderIds();
          const ok = ids.join(',') === conf.correctIdOrder.join(',');
          if (ok){
            solved = true;
            status.innerHTML = '<span style="color:var(--ok)">✔ Correct order.</span>';
            api.journal('M.A.I.N. confirmed: Militarism → Alliances → Imperialism → Nationalism.');
            api.addItem({id:'map-frag-1', label:'Map Fragment #1'});
            api.enableContinue(true);
          } else {
            status.innerHTML = '<span style="color:var(--bad)">✖ Not quite. Re-read the notes.</span>';
          }
        };
        const onReset = ()=>{
          listEl.innerHTML = conf.order.map(renderItem).join('');
        };

        btnCheck.addEventListener('click', onCheck);
        btnReset.addEventListener('click', onReset);
        unsub.push(()=>btnCheck.removeEventListener('click', onCheck));
        unsub.push(()=>btnReset.removeEventListener('click', onReset));
      },
      validate(){ return solved; },
      showHint(){ apiToast('Hint: build-up → treaties → empires → pride.'); },
      dispose(){ unsub.forEach(fn=>fn()); }
    };
  }
/* ---------- Scene 3: Western vs Eastern Front Sorting ---------- */
function S3() {
  let solved = false;
  let unsub = [];

  return {
    render(root, api) {
      const conf = ROOM_DATA.scenes.find(s => s.id === 's3');

      root.innerHTML = `
        <h2>Frontline Intel</h2>
        <p class="muted">Drag each event to the correct front: Western or Eastern.</p>

        <div class="grid" style="grid-template-columns:1fr 1fr;gap:20px;margin:16px 0">
          <div class="card" id="westZone">
            <strong>🛡 Western Front</strong>
            <ul class="dropzone" data-zone="west"></ul>
          </div>
          <div class="card" id="eastZone">
            <strong>🗺 Eastern Front</strong>
            <ul class="dropzone" data-zone="east"></ul>
          </div>
        </div>

        <div class="card">
          <strong>Available Intel</strong>
          <ul id="s3Pool" class="drag-pool"></ul>
        </div>

        <button id="s3Check" class="btn primary" style="margin-top:12px">Check Answers</button>
        <span id="s3Status" class="muted" style="margin-left:10px"></span>
      `;

      const pool = root.querySelector('#s3Pool');
      const west = root.querySelector('#westZone .dropzone');
      const east = root.querySelector('#eastZone .dropzone');
      const status = root.querySelector('#s3Status');
      const btnCheck = root.querySelector('#s3Check');

      pool.innerHTML = conf.items.map(it => `
        <li class="s3-item" draggable="true" data-id="${it.id}">
          ${it.label}
        </li>
      `).join('');

      enableDragAndDrop();

      function enableDragAndDrop() {
        const items = root.querySelectorAll('.s3-item');
        const zones = root.querySelectorAll('.dropzone');

        items.forEach(li => {
          li.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', li.dataset.id);
            li.classList.add('dragging');
          });
          li.addEventListener('dragend', () => li.classList.remove('dragging'));
        });

        zones.forEach(z => {
          z.addEventListener('dragover', e => e.preventDefault());
          z.addEventListener('drop', e => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const dragged = root.querySelector(`[data-id="${id}"]`);
            z.appendChild(dragged);
          });
        });
      }

      btnCheck.addEventListener('click', () => {
        const westIDs = [...west.querySelectorAll('.s3-item')].map(el => el.dataset.id);
        const eastIDs = [...east.querySelectorAll('.s3-item')].map(el => el.dataset.id);

        const wOK = arraysEqual(westIDs.sort(), conf.correct.west.sort());
        const eOK = arraysEqual(eastIDs.sort(), conf.correct.east.sort());

        if (wOK && eOK) {
          solved = true;
          status.innerHTML = `<span style="color:var(--ok)">✔ Correct fronts identified.</span>`;
          api.journal("Correctly identified Western & Eastern Front events.");
          api.addItem({ id: "map-frag-2", label: "Map Fragment #2" });
          api.enableContinue(true);
        } else {
          status.innerHTML = `<span style="color:var(--bad)">✖ Not quite. Try again.</span>`;
        }
      });

      unsub.push(() => btnCheck.removeEventListener('click', () => {}));
    },

    validate() { return solved; },
    showHint() { apiToast("Think trenches vs mobility: France/Belgium vs Russia."); },
    dispose() { unsub.forEach(fn => fn()); }
  };
}

function arraysEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
  /* ---------- Scene 4: Map Click Challenge ---------- */
function S4() {
  let solved = false;

  return {
    render(root, api) {
      const conf = ROOM_DATA.scenes.find(s => s.id === 's4');

      root.innerHTML = `
        <h2>Map Recon</h2>
        <p class="muted">Tap the correct region of Europe to locate the Western Front.</p>

        <div class="map-wrapper">
          <img src="/escape/assets/wwi-map.png" class="map-img">
          ${conf.hotspots.map(h => `
            <div class="hotspot" data-id="${h.id}"
              style="left:${h.x}%;top:${h.y}%"></div>
          `).join('')}
        </div>

        <div id="s4Status" class="muted" style="margin-top:10px"></div>
      `;

      const status = root.querySelector('#s4Status');
      root.querySelectorAll('.hotspot').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.id === conf.correct) {
            solved = true;
            status.innerHTML = `<span style="color:var(--ok)">✔ Correct region selected.</span>`;
            api.journal("Western Front located on map.");
            api.addItem({ id: "map-frag-3", label: "Map Fragment #3" });
            api.enableContinue(true);
          } else {
            status.innerHTML = `<span style="color:var(--bad)">✖ Incorrect region.</span>`;
          }
        });
      });
    },

    validate() { return solved; },
    showHint() { apiToast("Think: France & Belgium, not the Eastern side near Russia."); },
    dispose() {}
  };
}
  /* ---------- Scene 5: Dual input (Lusitania + Zimmerman) ---------- */
  function S5(){
    let ok1=false, ok2=false;
    let unsub = [];

    const norm = (s)=> (s||'').trim().toLowerCase();

    return {
      render(root, api){
        const conf = ROOM_DATA.scenes.find(s=>s.id==='s5');
        root.innerHTML = `
          <h2>Intercepted Messages</h2>
          <p class="muted">Two events pushed the U.S. closer to war. Identify both.</p>

          <div class="grid" style="margin:10px 0 12px">
            <div class="card">
              <strong>${conf.inputs.q1.label}</strong>
              <input id="s5a" type="text" inputmode="numeric" placeholder="${conf.inputs.q1.placeholder}" class="s5-inp"
                     style="margin-top:6px;width:100%;padding:10px;border-radius:8px;border:1px solid var(--line);background:#0b0e1d;color:var(--ink)">
              <div id="s5aStatus" class="muted" style="margin-top:6px"></div>
            </div>

            <div class="card">
              <strong>${conf.inputs.q2.label}</strong>
              <input id="s5b" type="text" placeholder="${conf.inputs.q2.placeholder}" class="s5-inp"
                     style="margin-top:6px;width:100%;padding:10px;border-radius:8px;border:1px solid var(--line);background:#0b0e1d;color:var(--ink)">
              <div id="s5bStatus" class="muted" style="margin-top:6px"></div>
            </div>
          </div>
        `;

        const a = root.querySelector('#s5a');
        const b = root.querySelector('#s5b');
        const aSt = root.querySelector('#s5aStatus');
        const bSt = root.querySelector('#s5bStatus');

        const onInputA = ()=>{
          const good = conf.inputs.q1.accepts.includes(norm(a.value));
          ok1 = good; aSt.innerHTML = good ? '<span style="color:var(--ok)">✔ Looks right.</span>' : '';
          maybeDone();
        };
        const onInputB = ()=>{
          const good = conf.inputs.q2.accepts.includes(norm(b.value));
          ok2 = good; bSt.innerHTML = good ? '<span style="color:var(--ok)">✔ Looks right.</span>' : '';
          maybeDone();
        };
        function maybeDone(){
          if (ok1 && ok2){
            api.journal('Decoded: Lusitania (1915) & Zimmerman to Mexico.');
            api.addItem({id:'us-flag', label:'U.S. Flag Pin'});
            api.enableContinue(true);
          }
        }

        a.addEventListener('input', onInputA);
        b.addEventListener('input', onInputB);
        unsub.push(()=>a.removeEventListener('input', onInputA));
        unsub.push(()=>b.removeEventListener('input', onInputB));
      },
      validate(){ return (/* both correct → continue is enabled */ true); },
      showHint(){ apiToast('One sank in the Atlantic; the other promised Texas, New Mexico, Arizona.'); },
      dispose(){ unsub.forEach(fn=>fn()); }
    };
  }
/* ---------- Scene 6: Multiselect (WWI Technologies) ---------- */
function S6() {
  let solved = false;

  return {
    render(root, api) {
      const conf = ROOM_DATA.scenes.find(s => s.id === 's6');

      root.innerHTML = `
        <h2>Arsenal Review</h2>
        <p class="muted">Select ALL technologies first used or widely used in WWI.</p>

        <div class="grid" id="s6Grid" style="margin-top:12px">
          ${conf.options.map(o => `
            <div class="card s6opt" data-id="${o.id}">
              <input type="checkbox"> ${o.label}
            </div>
          `).join('')}
        </div>

        <button id="s6Check" class="btn primary" style="margin-top:12px">Check</button>
        <span id="s6Status" class="muted" style="margin-left:10px"></span>
      `;

      const status = root.querySelector('#s6Status');
      const btnCheck = root.querySelector('#s6Check');

      btnCheck.addEventListener('click', () => {
        const selected = [...root.querySelectorAll('.s6opt input:checked')]
          .map(i => i.parentElement.dataset.id);

        const isCorrect =
          arraysEqual(selected.sort(), conf.correct.sort());

        if (isCorrect) {
          solved = true;
          status.innerHTML = `<span style="color:var(--ok)">✔ Correct technologies identified.</span>`;
          api.journal("Verified WWI technological advancements.");
          api.addItem({ id: "tech-kit", label: "Tech Kit" });
          api.enableContinue(true);
        } else {
          status.innerHTML = `<span style="color:var(--bad)">✖ Incorrect set. Think again.</span>`;
        }
      });
    },

    validate() { return solved; },
    showHint() { apiToast("Hint: poison gas, tanks, machine guns, U-boats, airplanes."); },
    dispose() {}
  };
}
  /* ---------- Scene 7: Decision Tree (gauges) ---------- */
  function S7(){
    let meters = {h:5, m:5, s:5};
    let step = 0;
    let solved = false;

    const choices = [
      { title:'The Flooded Trench', body:'Water rises around your knees.',
        options:[
          {label:'Stay and bail water with helmets', delta:{h:-1,m:+1,s:0}},
          {label:'Retreat to higher ground (risk orders)', delta:{h:+1,m:-1,s:0}},
          {label:'Stack sandbags to divert flow (ideal)', delta:{h:+1,m:+1,s:0}}
        ]},
      { title:'The Food Ration', body:'Two biscuits and bully beef for six men.',
        options:[
          {label:'Share equally', delta:{h:0,m:+1,s:-1}},
          {label:'Give to wounded first', delta:{h:+1,m:0,s:-2}},
          {label:'Save it for morning', delta:{h:0,m:-1,s:0}}
        ]},
      { title:'The Gas Alarm', body:'A faint hiss drifts through the trench.',
        options:[
          {label:'Masks on immediately', delta:{h:+1,m:0,s:0}},
          {label:'Wet cloths; help others first', delta:{h:-1,m:+1,s:0}},
          {label:'Ignore it — probably false', delta:{fail:true}}
        ]}
    ];

    function meterHtml(){
      return `
        <div class="grid" style="margin:10px 0 12px">
          <div class="card"><strong>🩸 Health</strong><div class="muted">${meters.h}/10</div></div>
          <div class="card"><strong>🎖️ Morale</strong><div class="muted">${meters.m}/10</div></div>
          <div class="card"><strong>📦 Supplies</strong><div class="muted">${meters.s}/10</div></div>
        </div>
      `;
    }

    function applyDelta(delta){
      if (delta.fail){ meters.h = 0; return; }
      meters.h = Math.max(0, Math.min(10, meters.h + (delta.h||0)));
      meters.m = Math.max(0, Math.min(10, meters.m + (delta.m||0)));
      meters.s = Math.max(0, Math.min(10, meters.s + (delta.s||0)));
    }

    return {
      render(root, api){
        const renderStep = ()=>{
          if (meters.h===0 || meters.m===0 || meters.s===0){
            root.innerHTML = `
              <h2>Hold the Line</h2>
              ${meterHtml()}
              <div class="card" style="border-color:var(--bad)"><strong>Mission Failed</strong><div class="muted">Your unit could not hold through the night. Try again.</div></div>
              <button id="retryS7" class="btn primary" style="margin-top:10px">Retry Scene</button>
            `;
            root.querySelector('#retryS7').addEventListener('click', ()=>{
              meters={h:5,m:5,s:5}; step=0; renderStep();
            });
            api.enableContinue(false);
            return;
          }

          if (step >= choices.length){
            solved = true;
            root.innerHTML = `
              <h2>Hold the Line</h2>
              ${meterHtml()}
              <div class="card" style="border-color:var(--ok)"><strong>Night Survived</strong><div class="muted">The rain eases. Radio access restored.</div></div>
            `;
            api.journal('Unit survived trench night; radio access granted.');
            api.addItem({id:'radio', label:'Radio Access'});
            api.enableContinue(true);
            return;
          }

          const c = choices[step];
          root.innerHTML = `
            <h2>Hold the Line</h2>
            ${meterHtml()}
            <div class="card">
              <strong>${c.title}</strong>
              <div class="muted" style="margin:6px 0 10px">${c.body}</div>
              <div class="grid">
                ${c.options.map((o,i)=>`<button class="btn alt" data-opt="${i}">${o.label}</button>`).join('')}
              </div>
            </div>
          `;

          root.querySelectorAll('[data-opt]').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              const opt = c.options[Number(btn.dataset.opt)];
              applyDelta(opt.delta||{});
              step++;
              renderStep();
            });
          });
          api.enableContinue(false);
        };

        renderStep();
      },
      validate(){ return solved; },
      showHint(){ apiToast('Mud, hunger, and gas — think safety, fairness, and ingenuity.'); },
      dispose(){ /* no-op */ }
    };
  }
/* ---------- Scene 8: Final Cipher ---------- */
function S8() {
  let solved = false;

  return {
    render(root, api) {
      const conf = ROOM_DATA.scenes.find(s => s.id === 's8');

      root.innerHTML = `
        <h2>Final Transmission</h2>
        <p class="muted">Decode the scrambled message to complete the mission.</p>

        <div class="card" style="margin-top:12px">
          <strong>Scrambled:</strong>
          <div class="muted" style="margin-top:6px;font-size:1.1rem">${conf.scrambled}</div>

          <input id="s8Input" placeholder="Decoded message…" 
            style="margin-top:10px;width:100%;padding:10px;border-radius:8px;background:#0a0c19;color:var(--ink);border:1px solid var(--line)">
          <div id="s8Status" class="muted" style="margin-top:10px">Press Enter to check.</div>
        </div>
      `;

      const input = root.querySelector('#s8Input');
      const status = root.querySelector('#s8Status');

      input.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;

        const val = input.value.trim().toLowerCase();
        const accepted = conf.accepts.map(a => a.toLowerCase());

        if (accepted.includes(val)) {
          solved = true;
          status.innerHTML = `<span style="color:var(--ok)">✔ Transmission decoded. Mission accomplished.</span>`;
          api.journal("Final cipher solved; HQ contacted.");
          api.enableContinue(true);
        } else {
          status.innerHTML = `<span style="color:var(--bad)">✖ Incorrect code.</span>`;
        }
      });
    },

    validate() { return solved; },
    showHint() { apiToast("Try a simple letter-shift: think substitution cipher."); },
    dispose() {}
  };
}
  /* ---------- Registry ---------- */
  window.SceneRegistry = {
    'match': S1,
    'order': S2,
    'sort': S3,
    'map': S4,
    'dual-input': S5,
    'multiselect': S6,
    'decision': S7,
    'final': S8
};
})();
