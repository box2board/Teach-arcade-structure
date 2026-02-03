const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const stabilityEl = document.getElementById('stabilityValue');
const intelEl = document.getElementById('intelValue');
const zoneEl = document.getElementById('zoneValue');
const resetButton = document.getElementById('resetRun');
const muteToggle = document.getElementById('muteToggle');

const questionModal = document.getElementById('questionModal');
const questionText = document.getElementById('questionText');
const choiceGrid = document.getElementById('choiceGrid');
const questionFeedback = document.getElementById('questionFeedback');
const finishModal = document.getElementById('finishModal');
const finishTitle = document.getElementById('finishTitle');
const finishText = document.getElementById('finishText');
const playAgain = document.getElementById('playAgain');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');

const baseWidth = 960;
const baseHeight = 540;
let scale = 1;

const world = {
  width: 6200,
  groundY: 420
};

const player = {
  x: 120,
  y: 320,
  width: 42,
  height: 56,
  vx: 0,
  vy: 0,
  speed: 240,
  jump: 480,
  onGround: false
};

const camera = {
  x: 0
};

let stability = 70;
let intel = 0;
let muted = false;
let paused = false;
let lastTime = 0;
let activeZone = null;
let toastText = '';
let toastTimer = 0;

const checkpoints = [
  { x: 1600, label: 'Checkpoint Alpha' },
  { x: 3200, label: 'Checkpoint Bravo' },
  { x: 4700, label: 'Checkpoint Charlie' }
];
let currentCheckpoint = { x: 120 };

const finishMarker = world.width - 220;

const platforms = [
  { x: 540, y: 350, width: 180, height: 20 },
  { x: 980, y: 300, width: 200, height: 20 },
  { x: 1400, y: 260, width: 160, height: 20 },
  { x: 2100, y: 320, width: 220, height: 20 },
  { x: 2700, y: 260, width: 160, height: 20 },
  { x: 3400, y: 300, width: 220, height: 20 },
  { x: 4100, y: 260, width: 180, height: 20 },
  { x: 4900, y: 320, width: 220, height: 20 }
];

const surveillanceZones = [
  { x: 480, y: 330, width: 140, height: 90, asked: false },
  { x: 980, y: 260, width: 140, height: 120, asked: false },
  { x: 1500, y: 210, width: 160, height: 140, asked: false },
  { x: 2200, y: 290, width: 160, height: 110, asked: false },
  { x: 3000, y: 240, width: 160, height: 140, asked: false },
  { x: 3800, y: 280, width: 170, height: 120, asked: false },
  { x: 4550, y: 230, width: 180, height: 150, asked: false },
  { x: 5200, y: 300, width: 160, height: 110, asked: false }
];

const questionPool = [
  {
    q: 'What policy aimed to stop the spread of communism during the Cold War?',
    choices: ['Appeasement', 'Containment', 'Isolationism', 'Detente'],
    answer: 1
  },
  {
    q: 'The term “Iron Curtain” described what?',
    choices: ['A missile defense system', 'The division between Eastern and Western Europe', 'A Soviet naval blockade', 'A U.S. spy satellite program'],
    answer: 1
  },
  {
    q: 'Which alliance was formed by Western nations in 1949?',
    choices: ['Warsaw Pact', 'NATO', 'SEATO', 'Comintern'],
    answer: 1
  },
  {
    q: 'The Berlin Airlift responded to what event?',
    choices: ['Construction of the Berlin Wall', 'A blockade of West Berlin', 'The Cuban Missile Crisis', 'The Korean War armistice'],
    answer: 1
  },
  {
    q: 'Mutually Assured Destruction (MAD) was based on the idea that:',
    choices: ['Only one superpower would survive a nuclear war', 'Both sides had enough weapons to destroy each other', 'Nuclear weapons could be used safely', 'Conventional armies were more effective than nukes'],
    answer: 1
  },
  {
    q: 'Which crisis brought the U.S. and USSR closest to nuclear war in 1962?',
    choices: ['Berlin Wall Crisis', 'Cuban Missile Crisis', 'Korean War', 'Suez Crisis'],
    answer: 1
  },
  {
    q: 'A “proxy war” is best described as:',
    choices: ['A direct war between superpowers', 'A conflict where rivals support opposing sides', 'A war fought with only nuclear weapons', 'A peace negotiation between allies'],
    answer: 1
  },
  {
    q: 'Which conflict is often described as a Cold War proxy war in Asia?',
    choices: ['Spanish Civil War', 'Korean War', 'World War II', 'Gulf War'],
    answer: 1
  },
  {
    q: 'The Warsaw Pact was created primarily as a response to:',
    choices: ['The Marshall Plan', 'NATO expansion', 'The Space Race', 'The United Nations'],
    answer: 1
  },
  {
    q: 'Which leader promoted the policy of “peaceful coexistence” after Stalin?',
    choices: ['Nikita Khrushchev', 'Vladimir Lenin', 'Mikhail Gorbachev', 'Leon Trotsky'],
    answer: 0
  },
  {
    q: 'The Space Race began largely after which event?',
    choices: ['Sputnik launch', 'Apollo 11 landing', 'Cuban Missile Crisis', 'Fall of the Berlin Wall'],
    answer: 0
  },
  {
    q: 'Which term describes the build-up of weapons and troops by rival powers?',
    choices: ['Arms race', 'Collectivization', 'Nationalism', 'Decolonization'],
    answer: 0
  },
  {
    q: 'Which U.S. president announced the Truman Doctrine?',
    choices: ['Harry Truman', 'Dwight Eisenhower', 'John F. Kennedy', 'Richard Nixon'],
    answer: 0
  },
  {
    q: 'Which phrase best captures the strategy of brinkmanship?',
    choices: ['Backing down early', 'Pushing conflict to the edge of war', 'Ignoring allies', 'Using only economic tools'],
    answer: 1
  },
  {
    q: 'The Marshall Plan focused on:',
    choices: ['Rebuilding Western Europe', 'Arming the USSR', 'Creating the Berlin Wall', 'Ending the Korean War'],
    answer: 0
  },
  {
    q: 'Which event symbolized the end of the Cold War in Europe?',
    choices: ['Berlin Wall falls', 'Cuban Missile Crisis', 'Bay of Pigs', 'Sputnik launch'],
    answer: 0
  },
  {
    q: 'Which country was divided into North and South after World War II, becoming a Cold War flashpoint?',
    choices: ['Germany', 'Korea', 'India', 'Japan'],
    answer: 1
  },
  {
    q: 'Deterrence is best defined as:',
    choices: ['Preventing war by making the cost too high', 'Refusing any military action', 'Using propaganda only', 'Supporting only neutral states'],
    answer: 0
  },
  {
    q: 'Which Cold War conflict involved U.S. troops fighting to stop communist expansion in Southeast Asia?',
    choices: ['Vietnam War', 'Afghan War', 'Falklands War', 'Yom Kippur War'],
    answer: 0
  },
  {
    q: 'Which term describes easing tensions between the U.S. and USSR in the 1970s?',
    choices: ['Detente', 'Containment', 'Domino theory', 'Isolation'],
    answer: 0
  }
];

let availableQuestions = [...questionPool];

const keys = {
  left: false,
  right: false,
  jump: false
};

function resizeCanvas() {
  const containerWidth = canvas.parentElement.clientWidth;
  scale = containerWidth / baseWidth;
  const displayHeight = baseHeight * scale;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${containerWidth}px`;
  canvas.style.height = `${displayHeight}px`;
  canvas.width = containerWidth * dpr;
  canvas.height = displayHeight * dpr;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
}

function resetRun() {
  stability = 70;
  intel = 0;
  player.x = 120;
  player.y = 320;
  player.vx = 0;
  player.vy = 0;
  currentCheckpoint = { x: 120 };
  availableQuestions = [...questionPool];
  surveillanceZones.forEach((zone) => {
    zone.asked = false;
  });
  toast('Run reset. Re-enter the Berlin Sector.');
  updateHud();
}

function toast(message) {
  toastText = message;
  toastTimer = 2.5;
}

function updateHud() {
  stabilityEl.textContent = Math.max(0, Math.round(stability));
  intelEl.textContent = intel;
  zoneEl.textContent = 'Berlin Sector';
}

function openQuestion(zone) {
  paused = true;
  activeZone = zone;
  const question = availableQuestions.shift() || questionPool[Math.floor(Math.random() * questionPool.length)];
  activeZone.question = question;
  questionText.textContent = question.q;
  choiceGrid.innerHTML = '';
  questionFeedback.hidden = true;
  questionModal.classList.add('active');
  questionModal.setAttribute('aria-hidden', 'false');

  question.choices.forEach((choice, index) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.type = 'button';
    btn.textContent = choice;
    btn.addEventListener('click', () => handleAnswer(index));
    choiceGrid.appendChild(btn);
  });

  const firstChoice = choiceGrid.querySelector('button');
  if (firstChoice) firstChoice.focus();
}

function closeQuestion() {
  questionModal.classList.remove('active');
  questionModal.setAttribute('aria-hidden', 'true');
  paused = false;
  activeZone = null;
}

function handleAnswer(index) {
  const question = activeZone?.question;
  if (!question) return;
  const correct = index === question.answer;
  if (correct) {
    stability = Math.min(100, stability + 10);
    intel += 1;
    toast('Stability +10 · Intel secured.');
    questionFeedback.textContent = 'Correct! Stability +10.';
    questionFeedback.classList.remove('danger');
    questionFeedback.hidden = false;
  } else {
    stability = Math.max(0, stability - 5);
    player.x = Math.max(0, player.x - 80);
    toast('Stability -5 · Push back.');
    questionFeedback.textContent = 'Not quite. Stability -5.';
    questionFeedback.classList.add('danger');
    questionFeedback.hidden = false;
  }
  activeZone.asked = true;
  updateHud();
  setTimeout(closeQuestion, 650);
}

function finishRun(success) {
  paused = true;
  finishModal.classList.add('active');
  finishModal.setAttribute('aria-hidden', 'false');
  if (success) {
    finishTitle.textContent = 'Mission Complete';
    finishText.textContent = `You reached the finish with Stability ${Math.round(stability)}. Great work keeping tensions under control.`;
    playAgain.textContent = 'Run Again';
  } else {
    finishTitle.textContent = 'Stability Too Low';
    finishText.textContent = 'You reached the finish, but Stability dropped below 40. Return to the last checkpoint and try again.';
    playAgain.textContent = 'Retry Checkpoint';
  }
}

function closeFinishModal() {
  finishModal.classList.remove('active');
  finishModal.setAttribute('aria-hidden', 'true');
  paused = false;
}

function update(dt) {
  if (paused) return;
  player.vx = 0;
  if (keys.left) player.vx = -player.speed;
  if (keys.right) player.vx = player.speed;
  player.vy += 1200 * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (player.x < 0) player.x = 0;
  if (player.x > world.width - player.width) player.x = world.width - player.width;

  player.onGround = false;
  if (player.y + player.height >= world.groundY) {
    player.y = world.groundY - player.height;
    player.vy = 0;
    player.onGround = true;
  }

  platforms.forEach((platform) => {
    const withinX = player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const falling = player.vy >= 0;
    const hitTop = player.y + player.height >= platform.y && player.y + player.height <= platform.y + platform.height + 8;
    if (withinX && falling && hitTop && player.y < platform.y) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.onGround = true;
    }
  });

  if (player.y > baseHeight + 200) {
    stability = Math.max(0, stability - 5);
    player.x = currentCheckpoint.x;
    player.y = 320;
    player.vy = 0;
    toast('Fall detected. Stability -5.');
  }

  checkpoints.forEach((checkpoint) => {
    if (player.x > checkpoint.x && checkpoint.x > currentCheckpoint.x) {
      currentCheckpoint = { x: checkpoint.x + 40 };
      toast(`${checkpoint.label} secured.`);
    }
  });

  surveillanceZones.forEach((zone) => {
    if (zone.asked) return;
    const hit = player.x < zone.x + zone.width &&
      player.x + player.width > zone.x &&
      player.y < zone.y + zone.height &&
      player.y + player.height > zone.y;
    if (hit) {
      openQuestion(zone);
    }
  });

  if (player.x + player.width >= finishMarker) {
    finishRun(stability >= 40);
  }

  if (toastTimer > 0) toastTimer -= dt;
  updateHud();
}

function drawBackground() {
  ctx.fillStyle = '#070a16';
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  const layerOffsets = [0.2, 0.4, 0.6];
  const colors = ['#0b152b', '#101b34', '#162244'];
  layerOffsets.forEach((factor, index) => {
    const offset = -camera.x * factor % baseWidth;
    ctx.fillStyle = colors[index];
    for (let i = -1; i <= 2; i += 1) {
      ctx.fillRect(offset + i * baseWidth, 200 - index * 40, baseWidth, baseHeight);
    }
  });

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, world.groundY, baseWidth, baseHeight - world.groundY);
}

function drawWorld() {
  drawBackground();

  ctx.fillStyle = '#1f2937';
  platforms.forEach((platform) => {
    ctx.fillRect(platform.x - camera.x, platform.y, platform.width, platform.height);
  });

  ctx.fillStyle = '#38bdf8';
  checkpoints.forEach((checkpoint) => {
    const x = checkpoint.x - camera.x;
    ctx.fillRect(x, world.groundY - 60, 6, 60);
    ctx.fillText('⬤', x - 4, world.groundY - 70);
  });

  ctx.fillStyle = '#f97316';
  ctx.fillRect(finishMarker - camera.x, world.groundY - 80, 10, 80);
  ctx.fillText('★', finishMarker - camera.x - 4, world.groundY - 90);

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(player.x - camera.x, player.y, player.width, player.height);

  if (toastTimer > 0) {
    ctx.fillStyle = 'rgba(15,23,42,0.8)';
    ctx.fillRect(24, 24, 320, 40);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px Nunito, sans-serif';
    ctx.fillText(toastText, 34, 50);
  }
}

function loop(timestamp) {
  const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);
  lastTime = timestamp;
  camera.x = Math.min(Math.max(player.x - 220, 0), world.width - baseWidth);
  update(dt);
  drawWorld();
  requestAnimationFrame(loop);
}

function handleJump() {
  if (player.onGround && !paused) {
    player.vy = -player.jump;
    player.onGround = false;
  }
}

function setKey(key, value) {
  keys[key] = value;
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowLeft') setKey('left', true);
  if (event.code === 'ArrowRight') setKey('right', true);
  if (event.code === 'Space') handleJump();
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowLeft') setKey('left', false);
  if (event.code === 'ArrowRight') setKey('right', false);
});

leftBtn.addEventListener('pointerdown', () => setKey('left', true));
leftBtn.addEventListener('pointerup', () => setKey('left', false));
leftBtn.addEventListener('pointerleave', () => setKey('left', false));
rightBtn.addEventListener('pointerdown', () => setKey('right', true));
rightBtn.addEventListener('pointerup', () => setKey('right', false));
rightBtn.addEventListener('pointerleave', () => setKey('right', false));
jumpBtn.addEventListener('pointerdown', handleJump);

resetButton.addEventListener('click', () => {
  closeFinishModal();
  resetRun();
});

muteToggle.addEventListener('click', () => {
  muted = !muted;
  muteToggle.textContent = muted ? 'Mute: On' : 'Mute: Off';
  muteToggle.setAttribute('aria-pressed', muted.toString());
});

playAgain.addEventListener('click', () => {
  closeFinishModal();
  if (stability >= 40) {
    resetRun();
  } else {
    player.x = currentCheckpoint.x;
    player.y = 320;
    player.vy = 0;
    toast('Checkpoint retry engaged.');
  }
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
updateHud();
requestAnimationFrame(loop);
