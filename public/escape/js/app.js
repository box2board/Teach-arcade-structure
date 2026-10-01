/* Teach Arcade Escape engine: room content lives in rooms/<id>/data.js. */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const root = $('#sceneRoot');
  const roomId = new URLSearchParams(location.search).get('room') || 'wwi';
  const storageKey = `ta-escape:${roomId}:v3`;
  let data, state, hintLevel = 0;

  const clean = value => String(value ?? '').toLocaleLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {} };
  const feedback = (message, kind = 'info') => {
    const el = $('#feedback'); el.textContent = message; el.dataset.kind = kind;
    el.hidden = false;
  };
  const setProgress = () => {
    const rooms = data.scenes.filter(scene => scene.kind !== 'intro');
    const current = data.scenes[state.scene];
    const done = data.scenes.slice(0, state.scene).filter(scene => scene.kind !== 'intro').length
      + (state.solved[state.scene] && current?.kind !== 'intro' ? 1 : 0);
    const roomNumber = Math.max(1, rooms.indexOf(current) + 1);
    $('#progressText').textContent = state.complete ? 'Mission complete'
      : state.scene === 0 ? 'Mission briefing' : `Room ${roomNumber} of ${rooms.length} · ${state.solved[state.scene] ? 'insight unlocked' : 'investigate'}`;
    $('#progressBar').style.width = `${state.complete ? 100 : done / Math.max(1, rooms.length) * 100}%`;
  };
  const button = (label, action, cls = 'choice') => {
    const el = document.createElement('button'); el.className = cls; el.type = 'button'; el.textContent = label;
    el.addEventListener('click', action); return el;
  };
  const accepted = (value, answers) => answers.some(answer => clean(value) === clean(answer));
  const giveReward = scene => {
    if (scene.clueReward && !state.clues.some(clue => clue.id === scene.clueReward.id)) state.clues.push(scene.clueReward);
    if (scene.journal && !state.journal.includes(scene.journal)) state.journal.push(scene.journal);
    save(); renderSidebars();
  };
  function renderSidebars() {
    $('#clueList').innerHTML = state.clues.map(clue => `<li class="clue-card"><strong>${escapeHtml(clue.label)}</strong><span>${escapeHtml(clue.detail)}</span></li>`).join('') || '<li class="quiet">No clues recovered yet.</li>';
    $('#journalFeed').innerHTML = state.journal.map(x => `<p>${escapeHtml(x)}</p>`).join('') || '<p class="quiet">Your discoveries appear here.</p>';
    const notes = Object.entries(state.reasoning || {}).filter(([, note]) => note?.trim());
    $('#reasoningList').innerHTML = notes.map(([sceneId, note]) => {
      const scene = data.scenes.find(item => item.id === sceneId);
      return `<article class="reasoning-note"><strong>${escapeHtml(scene?.takeawayTitle || scene?.title || 'Field reasoning')}</strong><p>${escapeHtml(note)}</p></article>`;
    }).join('') || '<p class="quiet">Your reasoning notes will appear here.</p>';
  }
  function escapeHtml(v) { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function solve(scene) {
    if (state.complete) return;
    giveReward(scene); state.solved[state.scene] = true;
    hintLevel = 0;
    save(); render();
  }
  function continueMission() {
    if (state.scene >= data.scenes.length - 1) state.complete = true;
    else state.scene++;
    hintLevel = 0; save(); render();
  }
  function renderReasoning(scene, panel) {
    if (!scene.reflect) return;
    const box = document.createElement('section'); box.className = 'reflection';
    const prompt = document.createElement('p'); prompt.className = 'reflection-prompt'; prompt.textContent = scene.reflect;
    const label = document.createElement('label'); label.className = 'reflection-label'; label.textContent = 'Add your reasoning to the evidence board';
    const field = document.createElement('textarea'); field.className = 'reasoning-input'; field.rows = 3;
    field.maxLength = 500; field.setAttribute('aria-label', scene.reflect);
    field.placeholder = 'Use a clue to support your thinking…';
    field.value = state.reasoning?.[scene.id] || '';
    label.append(field);
    const saveNote = button(field.value ? 'Update reasoning note' : 'Save reasoning note', () => {
      const value = field.value.trim();
      if (!value) { field.focus(); return; }
      state.reasoning ||= {}; state.reasoning[scene.id] = value; save(); render();
    }, 'small save-reasoning');
    box.append(prompt, label, saveNote); panel.append(box);
  }
  function checkText(input, answers, scene) {
    if (accepted(input.value, answers)) solve(scene);
    else feedback(scene.wrong || 'That does not fit the evidence yet. Recheck the clues and try again.', 'error');
  }
  function renderPuzzle(scene, panel) {
    if (scene.kind === 'intro') {
      panel.innerHTML += `<div class="mission"><div class="mission-stamp">FIELD DISPATCH · 1918</div><p>${escapeHtml(scene.body)}</p>${data.missionQuestion ? `<div class="mission-question"><span>HQ'S QUESTION</span><p>${escapeHtml(data.missionQuestion)}</p></div>` : ''}<p class="quiet">Work together: read the evidence, agree on what it supports, then unlock the next room. Your progress saves on this device.</p>${scene.objectives?.length ? `<div class="objective-list"><strong>In this mission, you will</strong><ul>${scene.objectives.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}</div>`;
      panel.append(button('Accept the mission', () => solve(scene), 'primary')); return;
    }
    if (scene.kind === 'choice') {
      const group = document.createElement('div'); group.className = 'choice-grid';
      scene.options.forEach(option => group.append(button(option.label, () => option.id === scene.answer
        ? solve(scene) : feedback(option.feedback || scene.wrong || 'Not this clue. Check the evidence again.', 'error'))));
      panel.append(group); return;
    }
    if (scene.kind === 'match') {
      const form = document.createElement('form'); form.className = 'match-list';
      scene.pairs.forEach((pair, index) => {
        const row = document.createElement('label'); row.className = 'match-row';
        const text = document.createElement('span'); text.textContent = pair.label;
        const select = document.createElement('select'); select.dataset.index = index; select.required = true;
        select.innerHTML = `<option value="">Choose a cause…</option>${scene.categories.map(category => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`).join('')}`;
        row.append(text, select); form.append(row);
      });
      const submit = button(scene.actionLabel || 'Check the evidence', () => {}, 'primary'); submit.type = 'submit'; form.append(submit);
      form.addEventListener('submit', event => {
        event.preventDefault();
        const selected = [...form.querySelectorAll('select')].map(select => select.value);
        if (scene.pairs.every((pair, index) => selected[index] === pair.answer)) solve(scene);
        else feedback(scene.wrong || 'Some clues are matched to the wrong cause. Compare what each statement describes.', 'error');
      });
      panel.append(form); return;
    }
    if (scene.kind === 'order') {
      const picked = [];
      const list = document.createElement('div'); list.className = 'order-list';
      const display = () => { list.replaceChildren(); picked.forEach((item, i) => {
        const row = document.createElement('div'); row.className = 'order-row'; row.append(`${i + 1}. ${item.label}`);
        row.append(button('Undo', () => { picked.splice(i, 1); display(); }, 'small')); list.append(row);
      }); };
      const options = document.createElement('div'); options.className = 'choice-grid';
      scene.items.forEach(item => options.append(button(item.label, () => {
        if (picked.some(x => x.id === item.id)) return;
        picked.push(item); display();
      })));
      panel.append(options, list, button('Check sequence', () => {
        if (picked.map(x => x.id).join('|') === scene.answer.join('|')) solve(scene);
        else feedback('The sequence is not quite right. Use Undo to revise it.', 'error');
      }, 'primary')); return;
    }
    if (scene.kind === 'text') {
      const form = document.createElement('form'); form.className = 'answer-form';
      form.innerHTML = `<label for="answerInput">${escapeHtml(scene.label || 'Enter the answer')}</label><div class="answer-row"><input id="answerInput" autocomplete="off" placeholder="${escapeHtml(scene.placeholder || 'Type your answer')}" required><button class="primary" type="submit">Unlock</button></div>`;
      form.addEventListener('submit', e => { e.preventDefault(); checkText($('#answerInput', form), scene.answers, scene); }); panel.append(form); return;
    }
    if (scene.kind === 'multi') {
      const form = document.createElement('form'); form.className = 'answer-form';
      scene.parts.forEach((part, i) => { const wrap = document.createElement('label'); wrap.textContent = part.label;
        const input = document.createElement('input'); input.dataset.index = i; input.autocomplete = 'off'; input.placeholder = part.placeholder || 'Enter answer'; wrap.append(input); form.append(wrap); });
      const submit = button('Open the lock', () => {}, 'primary'); submit.type = 'submit'; form.append(submit);
      form.addEventListener('submit', e => { e.preventDefault(); const inputs = [...form.querySelectorAll('input')];
        if (scene.parts.every((part, i) => accepted(inputs[i].value, part.answers))) solve(scene);
        else feedback('One part of the combination needs another look.', 'error'); }); panel.append(form); return;
    }
    if (scene.kind === 'finish') {
      panel.innerHTML += `<div class="victory"><div class="victory-icon" aria-hidden="true">✦</div><h3>Transmission received</h3><p>${escapeHtml(scene.body)}</p></div>`;
      panel.append(button('Play again', reset, 'primary')); return;
    }
    panel.innerHTML += '<p>This room is unavailable.</p>';
  }
  function render() {
    const scene = data.scenes[Math.min(state.scene, data.scenes.length - 1)]; setProgress(); renderSidebars();
    $('#roomTitle').textContent = data.title;
    $('#sceneTitle').textContent = state.complete ? 'Mission complete' : scene.title;
    $('#sceneKicker').textContent = state.complete ? 'ESCAPE CONFIRMED' : scene.kicker || `ROOM ${state.scene + 1} · ${scene.type || 'FIELD REPORT'}`;
    root.replaceChildren(); root.dataset.scene = state.complete ? 'complete' : scene.id;
    const panel = document.createElement('div'); panel.className = 'puzzle-panel';
    if (!state.complete) {
      if (state.solved[state.scene]) {
        panel.innerHTML = `<div class="insight-card"><span class="insight-label">CASE NOTE · WHAT THE EVIDENCE SHOWS</span><h3>${escapeHtml(scene.takeawayTitle || 'What you figured out')}</h3><p>${escapeHtml(scene.learn || 'You solved the room by using the evidence. Connect this clue to the larger story as you continue.')}</p>${scene.clueReward ? `<div class="clue-found"><span>NEW CLUE · ADDED TO YOUR EVIDENCE BOARD</span><strong>${escapeHtml(scene.clueReward.label)}</strong><p>${escapeHtml(scene.clueReward.detail)}</p></div>` : ''}</div>`;
        renderReasoning(scene, panel);
        panel.append(button(state.scene === data.scenes.length - 1 ? 'Send the final report' : 'Continue to next room', continueMission, 'primary'));
      } else {
        const missing = (scene.requiresClues || []).filter(id => !state.clues.some(clue => clue.id === id));
        if (missing.length) {
          panel.innerHTML = `<div class="locked-card"><span class="insight-label">EVIDENCE LOCKED</span><h3>This lock needs earlier clues</h3><p>One or more evidence cards are missing. Restart the mission to rebuild the clue trail.</p></div>`;
          panel.append(button('Restart mission', reset, 'primary'));
          root.append(panel); return;
        }
        if (scene.evidence?.length) {
          const evidence = document.createElement('div'); evidence.className = 'evidence-grid';
          scene.evidence.forEach(item => {
            const card = document.createElement('section'); card.className = 'evidence-card';
            card.innerHTML = `<span class="evidence-label">${escapeHtml(item.label)}</span><p>${escapeHtml(item.text)}</p>${item.source ? `<small>${escapeHtml(item.source)}</small>` : ''}`;
            evidence.append(card);
          }); panel.append(evidence);
        }
        const prompt = document.createElement('p'); prompt.className = 'scene-copy'; prompt.textContent = scene.prompt || ''; panel.append(prompt);
        renderPuzzle(scene, panel);
        if (scene.kind !== 'intro') {
          const hint = document.createElement('button'); hint.className = 'hint-button'; hint.textContent = 'Need a clue? Reveal hint';
          hint.addEventListener('click', () => {
            if (!scene.hints?.length) return;
            hintLevel = Math.min(hintLevel + 1, scene.hints.length);
            feedback(`Hint ${hintLevel}: ${scene.hints[hintLevel - 1]}`, 'hint');
          });
          panel.append(hint);
        }
        const fb = document.createElement('div'); fb.id = 'feedback'; fb.className = 'feedback'; fb.setAttribute('role', 'status'); fb.setAttribute('aria-live', 'polite'); fb.hidden = true;
        panel.append(fb);
      }
    } else {
      const report = data.finalReport || {};
      const clueById = new Map(state.clues.map(clue => [clue.id, clue]));
      const citedClues = (report.clueIds || []).map(id => clueById.get(id)).filter(Boolean);
      const savedReasoning = Object.entries(state.reasoning || {}).filter(([, note]) => note?.trim());
      const reasoningReview = savedReasoning.length ? `<section class="final-reasoning"><h3>Your reasoning from the evidence board</h3>${savedReasoning.map(([sceneId, note]) => { const scene = data.scenes.find(item => item.id === sceneId); return `<p><strong>${escapeHtml(scene?.takeawayTitle || scene?.title || 'Field reasoning')}</strong><span>${escapeHtml(note)}</span></p>`; }).join('')}</section>` : '';
      panel.innerHTML = `<div class="victory"><div class="victory-icon" aria-hidden="true">✦</div><h3>Transmission received</h3><p>${escapeHtml(data.completion)}</p></div>${report.answer ? `<section class="final-report"><span class="insight-label">RECOVERED HQ DISPATCH · THE ANSWER</span><h3>${escapeHtml(report.question || data.missionQuestion || 'What do the clues show?')}</h3><p class="report-answer">${escapeHtml(report.answer)}</p><h4>Evidence in the report</h4><ul>${citedClues.map(clue => `<li><strong>${escapeHtml(clue.label)}</strong><span>${escapeHtml(clue.detail)}</span></li>`).join('')}</ul></section>` : ''}${reasoningReview}<div class="debrief"><h3>Debrief · connect the clues</h3>${(data.debrief || []).map(item => `<p><strong>${escapeHtml(item.label)}</strong> ${escapeHtml(item.text)}</p>`).join('')}</div>`;
      panel.append(button('Play again', reset, 'primary'));
    }
    root.append(panel);
  }
  function reset() {
    state = { scene: 0, solved: [], clues: [], journal: [], reasoning: {}, complete: false }; hintLevel = 0; save(); render();
  }
  function init() {
    data = window.ROOM_DATA;
    if (!data || !Array.isArray(data.scenes)) { root.textContent = 'This escape room could not be loaded.'; return; }
    try { state = JSON.parse(localStorage.getItem(storageKey)) || null; } catch { state = null; }
    if (!state || !Number.isInteger(state.scene) || state.scene > data.scenes.length || !Array.isArray(state.clues)) reset();
    else state.reasoning ||= {};
    $('#restartBtn').addEventListener('click', () => { if (confirm('Restart this escape room from the beginning?')) reset(); });
    render();
  }
  const loader = document.createElement('script'); loader.src = `/escape/rooms/${encodeURIComponent(roomId)}/data.js`;
  loader.onload = init; loader.onerror = () => { root.textContent = `Room “${roomId}” could not be loaded.`; };
  document.head.append(loader);
})();
