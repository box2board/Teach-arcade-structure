// /arcade-review-games/social-studies/wwi-trench-run-v2/game.js
(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('start-btn');
  const howToBtn = document.getElementById('how-to-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const questionModal = document.getElementById('question-modal');
  const forkModal = document.getElementById('fork-modal');
  const pauseModal = document.getElementById('pause-modal');
  const relayModal = document.getElementById('relay-modal');
  const relayContinue = document.getElementById('relay-continue');
  const relayMessage = document.getElementById('relay-message');
  const toast = document.getElementById('toast');
  const distanceEl = document.getElementById('distance');
  const scoreEl = document.getElementById('score');
  const staminaEl = document.getElementById('stamina');
  const accuracyEl = document.getElementById('accuracy');
  const streakEl = document.getElementById('streak');
  const questionText = document.getElementById('question-text');
  const questionHint = document.getElementById('question-hint');
  const choicesEl = document.getElementById('choices');
  const forkLeftBtn = document.getElementById('fork-left');
  const forkRightBtn = document.getElementById('fork-right');
  const resultsSection = document.getElementById('results');
  const finalScore = document.getElementById('final-score');
  const finalDistance = document.getElementById('final-distance');
  const finalAccuracy = document.getElementById('final-accuracy');
  const topicBreakdown = document.getElementById('topic-breakdown');
  const missedList = document.getElementById('missed-list');
  const forkLog = document.getElementById('fork-log');
  const rematchBtn = document.getElementById('rematch-btn');
  const restartBtn = document.getElementById('restart-btn');
  const rematchMessage = document.getElementById('rematch-message');
  const modeSelect = document.getElementById('mode');
  const focusSelect = document.getElementById('focus');
  const difficultySelect = document.getElementById('difficulty');
  const questionCountSelect = document.getElementById('question-count');
  const speedSelect = document.getElementById('speed');
  const soundSelect = document.getElementById('sound');
  const reducedMotionSelect = document.getElementById('reduced-motion');
  const relaySettings = document.getElementById('relay-settings');
  const rotationSelect = document.getElementById('rotation');
  const teamsInput = document.getElementById('teams');

  const leftBtn = document.getElementById('left-btn');
  const rightBtn = document.getElementById('right-btn');
  const jumpBtn = document.getElementById('jump-btn');
  const actionBtn = document.getElementById('action-btn');

  const GAME_WIDTH = 960;
  const GAME_HEIGHT = 420;
  const LANE_COUNT = 3;
  const LANE_WIDTH = GAME_WIDTH / LANE_COUNT;

  const obstacleTypes = [
    { type: 'barrier', width: 80, height: 40, color: '#fbbf24' },
    { type: 'crater', width: 90, height: 28, color: '#64748b' },
    { type: 'wire', width: 100, height: 32, color: '#38bdf8' }
  ];

  const forkOptions = [
    {
      label: 'Charge now',
      description: 'Higher risk, higher reward. +Multiplier, +Obstacles',
      effect: { obstacleRate: 1.35, scoreMultiplier: 1.3 },
      topic: 'MAIN'
    },
    {
      label: 'Hold position',
      description: 'Safer pace. -Multiplier, -Obstacles',
      effect: { obstacleRate: 0.8, scoreMultiplier: 0.9 },
      topic: 'TRENCH'
    },
    {
      label: 'Scout the ridge',
      description: 'Moderate risk with a steady bonus.',
      effect: { obstacleRate: 1.1, scoreMultiplier: 1.15 },
      topic: 'US_ENTRY'
    },
    {
      label: 'Reinforce defenses',
      description: 'Lower risk, steadier breathing room.',
      effect: { obstacleRate: 0.85, scoreMultiplier: 0.95 },
      topic: 'TREATY'
    }
  ];

  let questionsData = null;
  let questionPool = [];
  let missedQuestions = [];
  let lastMissedQuestions = [];
  let runLog = [];
  let answeredQuestions = [];

  let gameState = {
    running: false,
    paused: false,
    awaitingQuestion: false,
    awaitingFork: false,
    distance: 0,
    score: 0,
    stamina: 3,
    lane: 1,
    speed: 4,
    baseSpeed: 4,
    obstacleRate: 1,
    scoreMultiplier: 1,
    correctCount: 0,
    totalCount: 0,
    streak: 0,
    nextQuestionAt: 600,
    nextForkAt: 1200,
    questionCountLimit: 20,
    endless: false,
    focus: 'MIXED',
    difficulty: 'standard',
    reducedMotion: false,
    relayMode: false,
    rotationTimer: 60,
    rotationRemaining: 60,
    teams: 2,
    activeTeam: 1,
    fogUntil: 0
  };

  let obstacles = [];
  let lastTime = 0;
  let animationId = null;
  let currentQuestion = null;
  let currentFork = null;
  let questionTimer = null;
  let effectTimer = null;
  let forkEffectTimer = null;

  window.taTrack = (eventName, data = {}) => {
    if (window.gtag) {
      window.gtag('event', eventName, data);
    }
  };

  const showToast = (message, type = 'info') => {
    toast.textContent = message;
    toast.style.borderColor = type === 'good' ? 'var(--success)' : type === 'bad' ? 'var(--danger)' : 'var(--border)';
    toast.classList.add('show');
    window.clearTimeout(questionTimer);
    questionTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
  };

  const updateHud = () => {
    distanceEl.textContent = Math.floor(gameState.distance);
    scoreEl.textContent = Math.floor(gameState.score);
    staminaEl.textContent = gameState.stamina;
    const accuracy = gameState.totalCount === 0 ? 100 : Math.round((gameState.correctCount / gameState.totalCount) * 100);
    accuracyEl.textContent = `${accuracy}%`;
    streakEl.textContent = gameState.streak;
  };

  const resetGame = () => {
    obstacles = [];
    missedQuestions = [];
    runLog = [];
    answeredQuestions = [];
    gameState.distance = 0;
    gameState.score = 0;
    gameState.stamina = 3;
    gameState.lane = 1;
    gameState.speed = gameState.baseSpeed;
    gameState.obstacleRate = 1;
    gameState.scoreMultiplier = 1;
    gameState.correctCount = 0;
    gameState.totalCount = 0;
    gameState.streak = 0;
    gameState.nextQuestionAt = 600;
    gameState.nextForkAt = 1200;
    gameState.rotationRemaining = gameState.rotationTimer;
    gameState.activeTeam = 1;
  };

  const chooseQuestionPool = (useMissedOnly = false) => {
    if (!questionsData) return [];
    let pool = questionsData.questions;
    if (useMissedOnly) {
      pool = lastMissedQuestions.map((item) => item.question);
    } else if (gameState.focus !== 'MIXED') {
      pool = questionsData.questions.filter((q) => q.topic === gameState.focus);
    }
    return shuffle([...pool]);
  };

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const loadQuestions = async () => {
    try {
      const response = await fetch('questions.json');
      if (!response.ok) throw new Error('Questions failed to load.');
      questionsData = await response.json();
    } catch (error) {
      showToast('Questions failed to load. Refresh to retry.', 'bad');
    }
  };

  const setRelayVisibility = () => {
    relaySettings.style.display = modeSelect.value === 'relay' ? 'block' : 'none';
  };

  const applySettings = () => {
    gameState.focus = focusSelect.value;
    gameState.difficulty = difficultySelect.value;
    gameState.reducedMotion = reducedMotionSelect.value === 'on' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gameState.relayMode = modeSelect.value === 'relay';
    gameState.rotationTimer = parseInt(rotationSelect.value, 10);
    gameState.rotationRemaining = gameState.rotationTimer;
    gameState.teams = Math.min(6, Math.max(2, parseInt(teamsInput.value, 10)));

    const speedSetting = speedSelect.value;
    gameState.baseSpeed = speedSetting === 'slow' ? 3.2 : speedSetting === 'fast' ? 5 : 4;
    gameState.speed = gameState.baseSpeed;

    const questionCountValue = questionCountSelect.value;
    gameState.endless = questionCountValue === 'endless';
    gameState.questionCountLimit = questionCountValue === 'endless' ? Infinity : parseInt(questionCountValue, 10);
  };

  const getDifficultyModifiers = () => {
    if (gameState.difficulty === 'easy') {
      return { obstacleRate: 0.8, speed: 0.9, hints: true };
    }
    if (gameState.difficulty === 'challenge') {
      return { obstacleRate: 1.2, speed: 1.1, hints: false };
    }
    return { obstacleRate: 1, speed: 1, hints: true };
  };

  const startRun = (useMissedOnly = false) => {
    if (!questionsData) {
      showToast('Questions are still loading. Please try again.', 'bad');
      return;
    }
    applySettings();
    resetGame();
    const difficultyMods = getDifficultyModifiers();
    gameState.obstacleRate = difficultyMods.obstacleRate;
    gameState.speed = gameState.baseSpeed * difficultyMods.speed;
    questionPool = chooseQuestionPool(useMissedOnly);
    resultsSection.classList.remove('show');
    questionModal.classList.remove('active');
    forkModal.classList.remove('active');
    pauseModal.classList.remove('active');
    relayModal.classList.remove('active');
    gameState.running = true;
    gameState.paused = false;
    gameState.awaitingQuestion = false;
    gameState.awaitingFork = false;
    lastTime = performance.now();
    window.taTrack('game_start', { mode: gameState.relayMode ? 'relay' : 'solo' });
    animationId = requestAnimationFrame(loop);
  };

  const pauseRun = () => {
    if (!gameState.running || gameState.paused) return;
    gameState.paused = true;
    pauseModal.classList.add('active');
  };

  const resumeRun = () => {
    if (!gameState.running) return;
    gameState.paused = false;
    pauseModal.classList.remove('active');
    relayModal.classList.remove('active');
    lastTime = performance.now();
    animationId = requestAnimationFrame(loop);
  };

  const drawBackground = () => {
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    for (let i = 1; i < LANE_COUNT; i += 1) {
      ctx.fillRect(i * LANE_WIDTH - 2, 0, 4, GAME_HEIGHT);
    }
    if (gameState.awaitingQuestion || gameState.awaitingFork) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    if (gameState.fogUntil > Date.now()) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  };

  const drawPlayer = () => {
    const laneX = gameState.lane * LANE_WIDTH + LANE_WIDTH / 2;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(laneX, GAME_HEIGHT - 60, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f29c38';
    ctx.fillRect(laneX - 12, GAME_HEIGHT - 40, 24, 20);
  };

  const drawObstacles = () => {
    obstacles.forEach((obstacle) => {
      ctx.fillStyle = obstacle.color;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 6);
    });
  };

  const spawnObstacle = () => {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const lane = Math.floor(Math.random() * LANE_COUNT);
    obstacles.push({
      ...type,
      lane,
      x: lane * LANE_WIDTH + (LANE_WIDTH - type.width) / 2,
      y: -type.height - 20
    });
  };

  const updateObstacles = (delta) => {
    const speed = gameState.speed * 1.8;
    obstacles.forEach((obstacle) => {
      obstacle.y += speed * delta;
    });
    obstacles = obstacles.filter((obstacle) => obstacle.y < GAME_HEIGHT + 50);
  };

  const checkCollision = () => {
    const playerX = gameState.lane * LANE_WIDTH + LANE_WIDTH / 2;
    const playerY = GAME_HEIGHT - 60;
    const playerRadius = 18;

    return obstacles.some((obstacle) => {
      const nearestX = Math.max(obstacle.x, Math.min(playerX, obstacle.x + obstacle.width));
      const nearestY = Math.max(obstacle.y, Math.min(playerY, obstacle.y + obstacle.height));
      const dx = playerX - nearestX;
      const dy = playerY - nearestY;
      return dx * dx + dy * dy < playerRadius * playerRadius;
    });
  };

  const applyAnswerEffect = (correct) => {
    if (effectTimer) window.clearTimeout(effectTimer);
    if (correct) {
      gameState.score += 150;
      gameState.scoreMultiplier = 1.2;
      gameState.obstacleRate = Math.max(0.7, gameState.obstacleRate * 0.9);
      gameState.speed = Math.min(gameState.baseSpeed * 1.2, gameState.speed + 0.5);
      effectTimer = window.setTimeout(() => {
        gameState.scoreMultiplier = 1;
        gameState.obstacleRate = getDifficultyModifiers().obstacleRate;
        gameState.speed = gameState.baseSpeed * getDifficultyModifiers().speed;
      }, 10000);
    } else {
      gameState.stamina = Math.max(0, gameState.stamina - 1);
      gameState.scoreMultiplier = 0.9;
      gameState.obstacleRate = gameState.obstacleRate * 1.25;
      gameState.speed = Math.max(2, gameState.speed - 0.8);
      gameState.fogUntil = Date.now() + 10000;
      if (!gameState.reducedMotion) {
        canvas.classList.add('shake');
        window.setTimeout(() => canvas.classList.remove('shake'), 400);
      }
      effectTimer = window.setTimeout(() => {
        gameState.scoreMultiplier = 1;
        gameState.obstacleRate = getDifficultyModifiers().obstacleRate;
        gameState.speed = gameState.baseSpeed * getDifficultyModifiers().speed;
      }, 10000);
    }
  };

  const showQuestion = (question) => {
    currentQuestion = question;
    gameState.awaitingQuestion = true;
    questionText.textContent = question.question;
    const allowHints = getDifficultyModifiers().hints;
    questionHint.textContent = allowHints ? question.explanation : '';
    choicesEl.innerHTML = '';
    question.choices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice;
      btn.addEventListener('click', () => handleAnswer(index));
      choicesEl.appendChild(btn);
    });
    questionModal.classList.add('active');
  };

  const handleAnswer = (index) => {
    if (!currentQuestion) return;
    const isCorrect = index === currentQuestion.answerIndex;
    gameState.totalCount += 1;
    if (isCorrect) {
      gameState.correctCount += 1;
      gameState.streak += 1;
      gameState.score += 100 * gameState.scoreMultiplier;
      showToast(`Correct! ${currentQuestion.explanation}`, 'good');
    } else {
      gameState.streak = 0;
      showToast(`Incorrect. ${currentQuestion.explanation}`, 'bad');
      missedQuestions.push({ question: currentQuestion, time: Date.now() });
    }
    answeredQuestions.push({ question: currentQuestion, correct: isCorrect });
    applyAnswerEffect(isCorrect);
    window.taTrack('question_answered', {
      correct: isCorrect,
      topic: currentQuestion.topic
    });

    questionModal.classList.remove('active');
    gameState.awaitingQuestion = false;
    currentQuestion = null;

    if (gameState.stamina <= 0 || gameState.totalCount >= gameState.questionCountLimit) {
      endRun();
      return;
    }
    updateHud();
    resumeRun();
  };

  const showFork = () => {
    gameState.awaitingFork = true;
    const options = shuffle([...forkOptions]).slice(0, 2);
    currentFork = options;
    forkLeftBtn.innerHTML = `<strong>${options[0].label}</strong><br><span class="muted">${options[0].description}</span>`;
    forkRightBtn.innerHTML = `<strong>${options[1].label}</strong><br><span class="muted">${options[1].description}</span>`;
    forkModal.classList.add('active');
  };

  const applyForkChoice = (choiceIndex) => {
    if (!currentFork) return;
    const choice = currentFork[choiceIndex];
    gameState.scoreMultiplier = choice.effect.scoreMultiplier;
    gameState.obstacleRate = choice.effect.obstacleRate * getDifficultyModifiers().obstacleRate;
    runLog.unshift(`${choice.label} (${choice.effect.scoreMultiplier}x)`);
    runLog = runLog.slice(0, 3);
    window.taTrack('fork_choice', { label: choice.label, multiplier: choice.effect.scoreMultiplier });
    forkModal.classList.remove('active');
    gameState.awaitingFork = false;
    if (forkEffectTimer) window.clearTimeout(forkEffectTimer);
    forkEffectTimer = window.setTimeout(() => {
      gameState.scoreMultiplier = 1;
      gameState.obstacleRate = getDifficultyModifiers().obstacleRate;
    }, 12000);
    const nextQuestion = getNextQuestionByTopic(choice.topic);
    if (nextQuestion) {
      showQuestion(nextQuestion);
    } else {
      resumeRun();
    }
  };

  const getNextQuestion = () => {
    if (questionPool.length === 0) {
      if (gameState.endless) {
        questionPool = chooseQuestionPool(false);
      } else {
        return null;
      }
    }
    return questionPool.shift();
  };

  const getNextQuestionByTopic = (topic) => {
    const index = questionPool.findIndex((q) => q.topic === topic);
    if (index >= 0) {
      return questionPool.splice(index, 1)[0];
    }
    return getNextQuestion();
  };

  const endRun = () => {
    gameState.running = false;
    gameState.paused = false;
    cancelAnimationFrame(animationId);
    questionModal.classList.remove('active');
    forkModal.classList.remove('active');
    pauseModal.classList.remove('active');
    relayModal.classList.remove('active');
    lastMissedQuestions = [...missedQuestions];
    showResults();
    window.taTrack('game_over', {
      score: Math.floor(gameState.score),
      accuracy: gameState.totalCount === 0 ? 0 : Math.round((gameState.correctCount / gameState.totalCount) * 100),
      mode: gameState.relayMode ? 'relay' : 'solo'
    });
  };

  const showResults = () => {
    resultsSection.classList.add('show');
    finalScore.textContent = Math.floor(gameState.score);
    finalDistance.textContent = Math.floor(gameState.distance);
    const accuracy = gameState.totalCount === 0 ? 0 : Math.round((gameState.correctCount / gameState.totalCount) * 100);
    finalAccuracy.textContent = `${accuracy}%`;

    const topicMap = {};
    answeredQuestions.forEach(({ question, correct }) => {
      if (!topicMap[question.topic]) {
        topicMap[question.topic] = { correct: 0, total: 0 };
      }
      topicMap[question.topic].total += 1;
      if (correct) topicMap[question.topic].correct += 1;
    });

    topicBreakdown.innerHTML = '';
    if (!questionsData || Object.keys(topicMap).length === 0) {
      topicBreakdown.innerHTML = '<li>No questions answered yet.</li>';
    } else {
      Object.entries(topicMap).forEach(([topic, stats]) => {
        const percent = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);
        const li = document.createElement('li');
        li.textContent = `${topic.replace('_', ' ')}: ${percent}%`;
        topicBreakdown.appendChild(li);
      });
    }

    missedList.innerHTML = '';
    const missedSummary = missedQuestions.slice(0, 5);
    if (missedSummary.length === 0) {
      missedList.innerHTML = '<li>Great work! No missed concepts.</li>';
    } else {
      missedSummary.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item.question.question;
        missedList.appendChild(li);
      });
    }

    forkLog.innerHTML = '';
    if (runLog.length === 0) {
      forkLog.innerHTML = '<li>No forks reached.</li>';
    } else {
      runLog.forEach((entry) => {
        const li = document.createElement('li');
        li.textContent = entry;
        forkLog.appendChild(li);
      });
    }
  };

  const handleCollision = () => {
    if (checkCollision()) {
      obstacles.shift();
      gameState.stamina = Math.max(0, gameState.stamina - 1);
      showToast('Obstacle hit! Stamina down.', 'bad');
      if (gameState.stamina <= 0) {
        endRun();
      }
    }
  };

  const loop = (timestamp) => {
    if (!gameState.running || gameState.paused || gameState.awaitingQuestion || gameState.awaitingFork) return;
    const delta = Math.min(0.05, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    gameState.distance += gameState.speed * 12 * delta;
    gameState.score += gameState.speed * gameState.scoreMultiplier * delta * 12;

    if (Math.random() < delta * 1.5 * gameState.obstacleRate) {
      spawnObstacle();
    }

    updateObstacles(delta);
    handleCollision();

    if (gameState.distance >= gameState.nextQuestionAt) {
      gameState.nextQuestionAt += 700;
    const nextQuestion = getNextQuestionByTopic(choice.topic);
      if (nextQuestion) {
        showQuestion(nextQuestion);
      }
    }

    if (gameState.distance >= gameState.nextForkAt) {
      gameState.nextForkAt += 1300;
      showFork();
    }

    if (gameState.relayMode) {
      gameState.rotationRemaining -= delta;
      if (gameState.rotationRemaining <= 0) {
        gameState.rotationRemaining = gameState.rotationTimer;
        gameState.activeTeam = gameState.activeTeam % gameState.teams + 1;
        relayMessage.textContent = `Team ${gameState.activeTeam}, take over!`;
        gameState.paused = true;
        relayModal.classList.add('active');
        return;
      }
    }

    drawBackground();
    drawObstacles();
    drawPlayer();
    updateHud();

    animationId = requestAnimationFrame(loop);
  };

  const handleKey = (event) => {
    if (!gameState.running) return;
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      gameState.lane = Math.max(0, gameState.lane - 1);
    }
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      gameState.lane = Math.min(LANE_COUNT - 1, gameState.lane + 1);
    }
    if (event.key === 'Enter' && gameState.awaitingFork) {
      applyForkChoice(0);
    }
    if (event.key === 'p') {
      if (gameState.paused) {
        resumeRun();
      } else {
        pauseRun();
      }
    }
  };

  const handleJump = () => {
    showToast('Jump!', 'info');
  };

  const bindControls = () => {
    leftBtn.addEventListener('click', () => {
      gameState.lane = Math.max(0, gameState.lane - 1);
    });
    rightBtn.addEventListener('click', () => {
      gameState.lane = Math.min(LANE_COUNT - 1, gameState.lane + 1);
    });
    jumpBtn.addEventListener('click', handleJump);
    actionBtn.addEventListener('click', () => {
      if (gameState.awaitingFork && forkModal.classList.contains('active')) {
        applyForkChoice(0);
      }
    });
  };

  startBtn.addEventListener('click', () => startRun(false));
  restartBtn.addEventListener('click', () => startRun(false));
  rematchBtn.addEventListener('click', () => {
    if (missedQuestions.length === 0) {
      rematchMessage.textContent = 'No missed questions to rematch. Try a new run!';
      return;
    }
    rematchMessage.textContent = '';
    questionPool = chooseQuestionPool(true);
    startRun(true);
  });
  pauseBtn.addEventListener('click', pauseRun);
  resumeBtn.addEventListener('click', resumeRun);
  relayContinue.addEventListener('click', resumeRun);
  forkLeftBtn.addEventListener('click', () => applyForkChoice(0));
  forkRightBtn.addEventListener('click', () => applyForkChoice(1));
  howToBtn.addEventListener('click', () => {
    document.getElementById('how-to').scrollIntoView({ behavior: 'smooth' });
  });
  modeSelect.addEventListener('change', setRelayVisibility);
  document.addEventListener('keydown', handleKey);
  bindControls();
  setRelayVisibility();
  loadQuestions();
})();
