(() => {
  'use strict';

  const data = window.ESCAPE_V2_DATA;
  if (!data || !Array.isArray(data.rooms) || !data.rooms.length) {
    console.error('Escape Room V2 data is missing or invalid.');
    return;
  }

  const $ = (id) => document.getElementById(id);
  const els = {
    storyScreen: $('storyScreen'),
    gameScreen: $('gameScreen'),
    reviewScreen: $('reviewScreen'),
    failureScreen: $('failureScreen'),
    storyEyebrow: $('storyEyebrow'),
    storyTitle: $('storyTitle'),
    storyCopy: $('storyCopy'),
    storyRooms: $('storyRooms'),
    storyTime: $('storyTime'),
    startBtn: $('startBtn'),
    timer: $('timer'),
    journalBtn: $('journalBtn'),
    journalCount: $('journalCount'),
    restartBtn: $('restartBtn'),
    panorama: $('panorama'),
    hotspotLayer: $('hotspotLayer'),
    roomLabel: $('roomLabel'),
    roomTitle: $('roomTitle'),
    roomObjective: $('roomObjective'),
    roomProgress: $('roomProgress'),
    solutionBtn: $('solutionBtn'),
    journalPanel: $('journalPanel'),
    closeJournalBtn: $('closeJournalBtn'),
    journalEntries: $('journalEntries'),
    modalBackdrop: $('modalBackdrop'),
    puzzleModal: $('puzzleModal'),
    modalCloseBtn: $('modalCloseBtn'),
    modalKicker: $('modalKicker'),
    modalTitle: $('modalTitle'),
    modalBody: $('modalBody'),
    modalFeedback: $('modalFeedback'),
    reviewTitle: $('reviewTitle'),
    reviewSummary: $('reviewSummary'),
    reviewStats: $('reviewStats'),
    reviewLearning: $('reviewLearning'),
    reviewRestartBtn: $('reviewRestartBtn'),
    failureCopy: $('failureCopy'),
    failureRestartBtn: $('failureRestartBtn')
  };

  const state = {
    started: false,
    finished: false,
    currentRoomIndex: 0,
    yaw: 0,
    solved: new Set(),
    attempts: 0,
    remainingSeconds: data.timeLimitSeconds || 1200,
    timerId: null,
    drag: null,
    openedAt: null
  };

  const totalHotspots = data.rooms.reduce((sum, room) => sum + room.hotspots.length, 0);

  function init() {
    els.storyEyebrow.textContent = data.eyebrow || 'ESCAPE ROOM';
    els.storyTitle.textContent = data.title;
    els.storyCopy.replaceChildren(...(data.story || []).map(paragraph));
    els.storyRooms.textContent = `${data.rooms.length} ${data.rooms.length === 1 ? 'prototype room' : 'rooms'}`;
    els.storyTime.textContent = `${Math.ceil(state.remainingSeconds / 60)} minute limit`;
    updateTimerDisplay();
    updateJournal();
    bindEvents();
  }

  function paragraph(text) {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  }

  function bindEvents() {
    els.startBtn.addEventListener('click', startGame);
    els.restartBtn.addEventListener('click', restart);
    els.reviewRestartBtn.addEventListener('click', restart);
    els.failureRestartBtn.addEventListener('click', restart);
    els.journalBtn.addEventListener('click', toggleJournal);
    els.closeJournalBtn.addEventListener('click', closeJournal);
    els.modalCloseBtn.addEventListener('click', closeModal);
    els.solutionBtn.addEventListener('click', openRoomSolution);

    els.modalBackdrop.addEventListener('click', (event) => {
      if (event.target === els.modalBackdrop) closeModal();
    });

    els.panorama.addEventListener('pointerdown', onPointerDown);
    els.panorama.addEventListener('pointermove', onPointerMove);
    els.panorama.addEventListener('pointerup', onPointerUp);
    els.panorama.addEventListener('pointercancel', onPointerUp);
    els.panorama.addEventListener('wheel', onWheel, { passive: false });
    els.panorama.addEventListener('keydown', onPanoramaKeyDown);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!els.modalBackdrop.hidden) closeModal();
      else if (!els.journalPanel.hidden) closeJournal();
    });
  }

  function showOnly(screen) {
    [els.storyScreen, els.gameScreen, els.reviewScreen, els.failureScreen].forEach((item) => {
      item.hidden = item !== screen;
    });
  }

  function startGame() {
    if (state.started) return;
    state.started = true;
    state.openedAt = Date.now();
    showOnly(els.gameScreen);
    renderRoom(0);
    startTimer();
    requestAnimationFrame(() => els.panorama.focus());
  }

  function restart() {
    window.location.reload();
  }

  function startTimer() {
    clearInterval(state.timerId);
    state.timerId = window.setInterval(() => {
      if (state.finished) return;
      state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
      updateTimerDisplay();
      if (state.remainingSeconds === 0) failGame();
    }, 1000);
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(state.remainingSeconds / 60);
    const seconds = state.remainingSeconds % 60;
    els.timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    els.timer.classList.toggle('warning', state.remainingSeconds <= 180);
  }

  function currentRoom() {
    return data.rooms[state.currentRoomIndex];
  }

  function renderRoom(index) {
    state.currentRoomIndex = index;
    const room = currentRoom();
    state.yaw = normalizeYaw(room.startYaw || 0);

    els.panorama.style.backgroundImage = `url("${room.panorama}")`;
    els.roomLabel.textContent = room.label || `ROOM ${index + 1}`;
    els.roomTitle.textContent = room.title;
    els.roomObjective.textContent = room.objective || '';

    els.hotspotLayer.replaceChildren();
    room.hotspots.forEach((hotspot) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hotspot';
      button.dataset.hotspotId = hotspot.id;
      button.textContent = hotspot.label || '•';
      button.setAttribute('aria-label', `Investigate ${hotspot.title}`);
      button.addEventListener('click', () => openHotspot(hotspot));
      els.hotspotLayer.appendChild(button);
    });

    renderPanorama();
    updateRoomProgress();
    updateJournal();
  }

  function roomKey(room, hotspot) {
    return `${room.id}::${hotspot.id}`;
  }

  function normalizeYaw(value) {
    let result = value % 360;
    if (result < 0) result += 360;
    return result;
  }

  function signedAngle(target, origin) {
    let delta = normalizeYaw(target) - normalizeYaw(origin);
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta;
  }

  function renderPanorama() {
    const room = currentRoom();
    const fov = room.fov || 100;
    els.panorama.style.backgroundPosition = `${(state.yaw / 360) * 100}% 50%`;

    room.hotspots.forEach((hotspot) => {
      const button = els.hotspotLayer.querySelector(`[data-hotspot-id="${CSS.escape(hotspot.id)}"]`);
      if (!button) return;
      const delta = signedAngle(hotspot.yaw, state.yaw);
      const visible = Math.abs(delta) <= fov * 0.58;
      button.setAttribute('aria-hidden', String(!visible));
      if (!visible) return;

      const x = 50 + (delta / fov) * 100;
      const y = Math.max(13, Math.min(87, 50 - ((hotspot.pitch || 0) / 65) * 100));
      button.style.left = `${x}%`;
      button.style.top = `${y}%`;
      button.classList.toggle('solved', state.solved.has(roomKey(room, hotspot)));
    });
  }

  function onPointerDown(event) {
    if (event.target.closest('.hotspot')) return;
    state.drag = { pointerId: event.pointerId, startX: event.clientX, startYaw: state.yaw };
    els.panorama.classList.add('dragging');
    els.panorama.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!state.drag || state.drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.drag.startX;
    state.yaw = normalizeYaw(state.drag.startYaw - dx * 0.22);
    renderPanorama();
  }

  function onPointerUp(event) {
    if (!state.drag || state.drag.pointerId !== event.pointerId) return;
    state.drag = null;
    els.panorama.classList.remove('dragging');
    els.panorama.releasePointerCapture?.(event.pointerId);
  }

  function onWheel(event) {
    if (!state.started || state.finished) return;
    event.preventDefault();
    state.yaw = normalizeYaw(state.yaw + event.deltaY * 0.06 + event.deltaX * 0.08);
    renderPanorama();
  }

  function onPanoramaKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      state.yaw = normalizeYaw(state.yaw - 8);
      renderPanorama();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      state.yaw = normalizeYaw(state.yaw + 8);
      renderPanorama();
    }
  }

  function openHotspot(hotspot) {
    const room = currentRoom();
    const solved = state.solved.has(roomKey(room, hotspot));
    openModal({ kicker: hotspot.kicker, title: hotspot.title });

    if (solved) {
      els.modalBody.append(paragraph('You already solved this object. Its clue remains in your Investigation Journal.'));
      els.modalBody.append(clueReveal(hotspot));
      return;
    }

    els.modalBody.append(paragraph(hotspot.prompt));
    renderPuzzle(hotspot, () => solveHotspot(room, hotspot));
  }

  function renderPuzzle(puzzle, onCorrect) {
    if (puzzle.type === 'choice') {
      const list = document.createElement('div');
      list.className = 'choice-list';
      puzzle.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice-btn';
        button.textContent = choice;
        button.addEventListener('click', () => {
          state.attempts += 1;
          if (index === puzzle.answer) onCorrect();
          else setFeedback('That does not fit the evidence. Try again.', false);
        });
        list.appendChild(button);
      });
      els.modalBody.appendChild(list);
      return;
    }

    if (puzzle.type === 'text') {
      const form = document.createElement('form');
      form.className = 'answer-form';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = puzzle.placeholder || 'Enter your answer';
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.setAttribute('aria-label', puzzle.placeholder || 'Answer');
      const submit = document.createElement('button');
      submit.type = 'submit';
      submit.className = 'primary-btn';
      submit.textContent = 'Submit';
      form.append(input, submit);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        state.attempts += 1;
        if (matchesAnswer(input.value, puzzle.answer)) onCorrect();
        else setFeedback('That does not unlock it. Recheck the clue and try again.', false);
      });
      els.modalBody.appendChild(form);
      requestAnimationFrame(() => input.focus());
      return;
    }

    els.modalBody.append(paragraph(`Puzzle type “${puzzle.type}” is not available in this prototype yet.`));
  }

  function matchesAnswer(value, accepted) {
    const clean = normalizeAnswer(value);
    const answers = Array.isArray(accepted) ? accepted : [accepted];
    return answers.some((answer) => normalizeAnswer(String(answer)) === clean);
  }

  function normalizeAnswer(value) {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function solveHotspot(room, hotspot) {
    state.solved.add(roomKey(room, hotspot));
    setFeedback('Solved. A new clue has been added to your journal.', true);
    els.modalBody.querySelectorAll('button,input').forEach((control) => {
      control.disabled = true;
    });
    els.modalBody.append(clueReveal(hotspot));
    renderPanorama();
    updateRoomProgress();
    updateJournal();
  }

  function clueReveal(hotspot) {
    const box = document.createElement('div');
    box.className = 'clue-reveal';
    const strong = document.createElement('strong');
    strong.textContent = hotspot.clueTitle || 'Recovered clue';
    const text = document.createElement('span');
    text.textContent = hotspot.clue;
    box.append(strong, text);
    return box;
  }

  function updateRoomProgress() {
    const room = currentRoom();
    const solvedCount = room.hotspots.filter((hotspot) => state.solved.has(roomKey(room, hotspot))).length;
    els.roomProgress.textContent = `${solvedCount} / ${room.hotspots.length}`;
    const unlocked = solvedCount === room.hotspots.length;
    els.solutionBtn.disabled = !unlocked;
    els.solutionBtn.textContent = unlocked ? 'Solve room' : `Room solution locked (${solvedCount}/${room.hotspots.length})`;
    els.journalCount.textContent = `${state.solved.size}/${totalHotspots}`;
  }

  function openRoomSolution() {
    const room = currentRoom();
    const solvedCount = room.hotspots.filter((hotspot) => state.solved.has(roomKey(room, hotspot))).length;
    if (solvedCount !== room.hotspots.length) return;

    const puzzle = room.solution;
    openModal({ kicker: puzzle.kicker || 'ROOM SOLUTION', title: puzzle.title || 'Solve the room' });
    els.modalBody.append(paragraph(puzzle.prompt));
    renderPuzzle(puzzle, () => completeRoom(room));
  }

  function completeRoom(room) {
    setFeedback(room.solution.successMessage || 'Room solved.', true);
    els.modalBody.querySelectorAll('button,input').forEach((control) => {
      control.disabled = true;
    });

    if (state.currentRoomIndex < data.rooms.length - 1) {
      const nextButton = document.createElement('button');
      nextButton.type = 'button';
      nextButton.className = 'primary-btn';
      nextButton.textContent = 'Continue to next room';
      nextButton.style.marginTop = '18px';
      nextButton.disabled = false;
      nextButton.addEventListener('click', () => {
        closeModal();
        renderRoom(state.currentRoomIndex + 1);
        requestAnimationFrame(() => els.panorama.focus());
      });
      els.modalBody.appendChild(nextButton);
    } else {
      const finishButton = document.createElement('button');
      finishButton.type = 'button';
      finishButton.className = 'primary-btn';
      finishButton.textContent = 'Complete mission';
      finishButton.style.marginTop = '18px';
      finishButton.disabled = false;
      finishButton.addEventListener('click', finishGame);
      els.modalBody.appendChild(finishButton);
    }
  }

  function openModal({ kicker = '', title = '' }) {
    closeJournal();
    els.modalKicker.textContent = kicker;
    els.modalTitle.textContent = title;
    els.modalBody.replaceChildren();
    setFeedback('', null);
    els.modalBackdrop.hidden = false;
    document.body.dataset.modalOpen = 'true';
    requestAnimationFrame(() => els.modalCloseBtn.focus());
  }

  function closeModal() {
    els.modalBackdrop.hidden = true;
    delete document.body.dataset.modalOpen;
    if (!els.gameScreen.hidden) requestAnimationFrame(() => els.panorama.focus());
  }

  function setFeedback(message, good) {
    els.modalFeedback.textContent = message;
    els.modalFeedback.classList.remove('good', 'bad');
    if (good === true) els.modalFeedback.classList.add('good');
    if (good === false) els.modalFeedback.classList.add('bad');
  }

  function toggleJournal() {
    if (els.journalPanel.hidden) openJournal();
    else closeJournal();
  }

  function openJournal() {
    updateJournal();
    els.journalPanel.hidden = false;
    els.journalBtn.setAttribute('aria-expanded', 'true');
  }

  function closeJournal() {
    els.journalPanel.hidden = true;
    els.journalBtn.setAttribute('aria-expanded', 'false');
  }

  function updateJournal() {
    const nodes = [];
    data.rooms.forEach((room, roomIndex) => {
      room.hotspots.forEach((hotspot, hotspotIndex) => {
        const solved = state.solved.has(roomKey(room, hotspot));
        const entry = document.createElement('article');
        entry.className = `journal-entry${solved ? '' : ' locked'}`;
        const title = document.createElement('h3');
        title.textContent = solved
          ? `${roomIndex + 1}.${hotspotIndex + 1} ${hotspot.clueTitle || hotspot.title}`
          : `${roomIndex + 1}.${hotspotIndex + 1} Undiscovered clue`;
        const text = document.createElement('p');
        text.textContent = solved ? hotspot.clue : 'Investigate the room to recover this clue.';
        entry.append(title, text);
        nodes.push(entry);
      });
    });
    els.journalEntries.replaceChildren(...nodes);
    els.journalCount.textContent = `${state.solved.size}/${totalHotspots}`;
  }

  function finishGame() {
    if (state.finished) return;
    state.finished = true;
    clearInterval(state.timerId);
    closeModal();
    closeJournal();

    const elapsed = (data.timeLimitSeconds || 1200) - state.remainingSeconds;
    els.reviewTitle.textContent = data.review?.title || 'You escaped.';
    els.reviewSummary.textContent = data.review?.summary || 'You completed the escape room.';
    els.reviewStats.replaceChildren(
      reviewStat(formatDuration(elapsed), 'time used'),
      reviewStat(`${state.solved.size}/${totalHotspots}`, 'discoveries'),
      reviewStat(String(state.attempts), 'answers submitted')
    );

    const learningNodes = [];
    data.rooms.forEach((room) => {
      room.hotspots.forEach((hotspot) => {
        const item = document.createElement('article');
        item.className = 'learning-item';
        const heading = document.createElement('h3');
        heading.textContent = hotspot.title;
        const body = document.createElement('p');
        body.textContent = hotspot.learning || hotspot.clue;
        item.append(heading, body);
        learningNodes.push(item);
      });
    });
    if (data.review?.outro) learningNodes.push(paragraph(data.review.outro));
    els.reviewLearning.replaceChildren(...learningNodes);
    showOnly(els.reviewScreen);
  }

  function failGame() {
    if (state.finished) return;
    state.finished = true;
    clearInterval(state.timerId);
    closeModal();
    closeJournal();
    els.failureCopy.textContent = `You recovered ${state.solved.size} of ${totalHotspots} discoveries before time expired. Nothing is lost — restart the mission and use what you learned to escape faster.`;
    showOnly(els.failureScreen);
  }

  function reviewStat(value, label) {
    const card = document.createElement('div');
    card.className = 'review-stat';
    const strong = document.createElement('strong');
    strong.textContent = value;
    const span = document.createElement('span');
    span.textContent = label;
    card.append(strong, span);
    return card;
  }

  function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }

  init();
})();
