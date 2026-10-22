(() => {
  'use strict';

  const data = window.ESCAPE_V2_DATA;
  if (!data || !Array.isArray(data.rooms) || !data.rooms.length) {
    console.error('Escape Room V2 data is missing or invalid.');
    return;
  }

  const $ = (id) => document.getElementById(id);
  const els = {
    storyScreen: $('storyScreen'), gameScreen: $('gameScreen'), reviewScreen: $('reviewScreen'), failureScreen: $('failureScreen'),
    storyEyebrow: $('storyEyebrow'), storyTitle: $('storyTitle'), storyCopy: $('storyCopy'), storyRooms: $('storyRooms'), storyTime: $('storyTime'), startBtn: $('startBtn'),
    timer: $('timer'), journalBtn: $('journalBtn'), journalCount: $('journalCount'), restartBtn: $('restartBtn'), panorama: $('panorama'),
    roomLabel: $('roomLabel'), roomTitle: $('roomTitle'), roomObjective: $('roomObjective'), roomProgress: $('roomProgress'), solutionBtn: $('solutionBtn'),
    journalPanel: $('journalPanel'), closeJournalBtn: $('closeJournalBtn'), journalEntries: $('journalEntries'),
    modalBackdrop: $('modalBackdrop'), modalCloseBtn: $('modalCloseBtn'), modalKicker: $('modalKicker'), modalTitle: $('modalTitle'), modalBody: $('modalBody'), modalFeedback: $('modalFeedback'),
    reviewTitle: $('reviewTitle'), reviewSummary: $('reviewSummary'), reviewStats: $('reviewStats'), reviewLearning: $('reviewLearning'), reviewRestartBtn: $('reviewRestartBtn'),
    failureCopy: $('failureCopy'), failureRestartBtn: $('failureRestartBtn')
  };

  const state = {
    started: false,
    finished: false,
    currentRoomIndex: 0,
    solved: new Set(),
    attempts: 0,
    remainingSeconds: data.timeLimitSeconds || 1200,
    timerId: null,
    viewer: null
  };

  const totalHotspots = data.rooms.reduce((sum, room) => sum + room.hotspots.length, 0);

  function paragraph(text) {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  }

  function init() {
    els.storyEyebrow.textContent = data.eyebrow || 'ESCAPE ROOM';
    els.storyTitle.textContent = data.title;
    els.storyCopy.replaceChildren(...(data.story || []).map(paragraph));
    const displayRooms = data.displayRoomCount || data.rooms.length;
    els.storyRooms.textContent = `${displayRooms} ${displayRooms === 1 ? 'room' : 'rooms'}`;
    els.storyTime.textContent = `${Math.ceil(state.remainingSeconds / 60)} minute limit`;
    updateTimerDisplay();
    updateJournal();
    bindEvents();
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
    showOnly(els.gameScreen);
    renderRoom(0);
    startTimer();
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

  function roomKey(room, hotspot) {
    return `${room.id}::${hotspot.id}`;
  }

  function hotspotDom(div, args) {
    div.dataset.hotspotId = args.id;
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', `Investigate ${args.title}`);
    div.title = args.title;
    div.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        args.open();
      }
    });
  }

  function renderRoom(index) {
    state.currentRoomIndex = index;
    const room = currentRoom();
    if (!room.scene) throw new Error(`No 3D scene configured for ${room.id}`);

    els.roomLabel.textContent = room.label || `ROOM ${index + 1}`;
    els.roomTitle.textContent = room.title;
    els.roomObjective.textContent = room.objective || '';

    if (state.viewer) {
      state.viewer.destroy();
      state.viewer = null;
    }
    els.panorama.replaceChildren();

    const solvedIds = new Set(room.hotspots.filter((hotspot) => state.solved.has(roomKey(room, hotspot))).map((hotspot) => hotspot.id));
    state.viewer = window.ESCAPE_V2_VIEWER.create(els.panorama, room, {
      onInteract: (id) => {
        const hotspot = room.hotspots.find((item) => item.id === id);
        if (hotspot) openHotspot(hotspot);
      }
    }, solvedIds);

    updateRoomProgress();
    updateJournal();
  }

  function openHotspot(hotspot) {
    const room = currentRoom();
    const solved = state.solved.has(roomKey(room, hotspot));
    openModal({ kicker: hotspot.kicker, title: hotspot.title });
    if (solved) {
      els.modalBody.append(paragraph('You already solved this object. Its phrase fragment is saved in your Investigation Journal.'));
      els.modalBody.append(clueReveal(hotspot));
      return;
    }
    els.modalBody.append(paragraph(hotspot.prompt));
    renderPuzzle(hotspot, () => solveHotspot(room, hotspot));
  }

  function renderPuzzle(puzzle, onCorrect) {
    const registry = window.ESCAPE_V2_PUZZLES;
    const renderer = registry?.get(puzzle.type);
    if (!renderer) {
      const message = document.createElement('p');
      message.className = 'puzzle-unavailable';
      message.textContent = `This challenge type (“${puzzle.type || 'unspecified'}”) is not available in this room.`;
      els.modalBody.appendChild(message);
      console.error(`Escape Room V2 has no puzzle renderer registered for "${puzzle.type}".`);
      return;
    }
    renderer(puzzle, {
      container: els.modalBody,
      onAttempt: () => { state.attempts += 1; },
      onCorrect,
      setFeedback,
      matchesAnswer
    });
  }

  function normalizeAnswer(value) {
    return String(value).normalize('NFKC').toLowerCase().trim().replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  function matchesAnswer(value, accepted) {
    const clean = normalizeAnswer(value);
    const answers = Array.isArray(accepted) ? accepted : [accepted];
    return answers.some((answer) => normalizeAnswer(String(answer)) === clean);
  }

  function solveHotspot(room, hotspot) {
    state.solved.add(roomKey(room, hotspot));
    setFeedback('Solved. A new phrase fragment has been added to your journal.', true);
    els.modalBody.querySelectorAll('button,input').forEach((control) => { control.disabled = true; });
    els.modalBody.append(clueReveal(hotspot));
    state.viewer?.setSolved(hotspot.id);
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
    if (room.hotspots.some((hotspot) => !state.solved.has(roomKey(room, hotspot)))) return;
    const puzzle = room.solution;
    openModal({ kicker: puzzle.kicker || 'ROOM SOLUTION', title: puzzle.title || 'Solve the room' });
    els.modalBody.append(paragraph(puzzle.prompt));
    renderPuzzle(puzzle, () => completeRoom(room));
  }

  function completeRoom(room) {
    setFeedback(room.solution.successMessage || 'Room solved.', true);
    state.viewer?.openExit?.();
    els.modalBody.querySelectorAll('button,input').forEach((control) => { control.disabled = true; });

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
      });
      els.modalBody.appendChild(nextButton);
    } else {
      const finishButton = document.createElement('button');
      finishButton.type = 'button';
      finishButton.className = 'primary-btn';
      finishButton.textContent = data.displayRoomCount && data.displayRoomCount > data.rooms.length ? 'Leave the Cell' : 'Complete mission';
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
    requestAnimationFrame(() => els.modalCloseBtn.focus());
  }

  function closeModal() {
    els.modalBackdrop.hidden = true;
  }

  function setFeedback(message, good) {
    els.modalFeedback.textContent = message;
    els.modalFeedback.classList.remove('good', 'bad');
    if (good === true) els.modalFeedback.classList.add('good');
    if (good === false) els.modalFeedback.classList.add('bad');
  }

  function toggleJournal() {
    if (els.journalPanel.hidden) openJournal(); else closeJournal();
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
        title.textContent = solved ? `${roomIndex + 1}.${hotspotIndex + 1} ${hotspot.clueTitle || hotspot.title}` : `${roomIndex + 1}.${hotspotIndex + 1} Undiscovered clue`;
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
    state.viewer?.destroy();
    state.viewer = null;
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
    data.rooms.forEach((room) => room.hotspots.forEach((hotspot) => {
      const item = document.createElement('article');
      item.className = 'learning-item';
      const heading = document.createElement('h3');
      heading.textContent = hotspot.title;
      const body = document.createElement('p');
      body.textContent = hotspot.learning || hotspot.clue;
      item.append(heading, body);
      learningNodes.push(item);
    }));
    if (data.review?.outro) learningNodes.push(paragraph(data.review.outro));
    els.reviewLearning.replaceChildren(...learningNodes);
    showOnly(els.reviewScreen);
  }

  function failGame() {
    if (state.finished) return;
    state.finished = true;
    clearInterval(state.timerId);
    state.viewer?.destroy();
    state.viewer = null;
    closeModal();
    closeJournal();
    els.failureCopy.textContent = `You recovered ${state.solved.size} of ${totalHotspots} discoveries before time expired. Restart the mission and use what you learned to escape faster.`;
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
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  init();
})();
