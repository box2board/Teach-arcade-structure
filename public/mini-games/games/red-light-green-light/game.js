import { createArena } from './arena.js';
import { characters } from '../../shared/midway-characters/characters.js';
import { FIELD, standings } from './rules.js';
import { createMovementPreview } from './movement-preview.js';

const ROOM_TYPE = 'red-light-green-light';
const moves = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'
};
const live = new Set(['green', 'red']);

export function mountGame(root, { client, makeAvatar, avatars = characters } = {}) {
  const el = id => root.querySelector('#' + id);
  const view = root.ownerDocument.defaultView;
  const doc = root.ownerDocument;
  const keys = new Map(), touches = new Map(), events = new AbortController();
  const movementPreview = createMovementPreview();
  const storageKey = 'ta-red-light-reconnect';
  let room, state, arena, attempt = 0, round = -1, phase, received = 0, inputSeq = 0;
  let audio, sound = false, frame, active = false, spectator = false, disposed = false, arenaError = '';

  function on(target, event, handler) {
    target.addEventListener(event, handler, { signal: events.signal });
  }
  function content(id, value) {
    if (el(id).textContent !== value) el(id).textContent = value;
  }
  function status(message) {
    content('connection', message);
    el('connection').hidden = !message;
  }
  function save(key) {
    try {
      if (key) view.sessionStorage.setItem(storageKey, JSON.stringify(key));
      else view.sessionStorage.removeItem(storageKey);
    } catch {}
  }
  function updateURL(id) {
    const url = new URL(view.location.href);
    if (id) url.searchParams.set('room', id);
    else url.searchParams.delete('room');
    view.history.replaceState(null, '', url);
  }
  function playTone(next) {
    if (!sound || audio?.state !== 'running') return;
    const oscillator = audio.createOscillator(), gain = audio.createGain(), time = audio.currentTime;
    const pitch = next === 'green' ? 645 : next === 'red' ? 355 : 790;
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(pitch, time);
    oscillator.frequency.exponentialRampToValueAtTime(pitch * (next === 'red' ? .59 : 1.52), time + .22);
    gain.gain.setValueAtTime(.075, time);
    gain.gain.exponentialRampToValueAtTime(.001, time + .28);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(time);
    oscillator.stop(time + .3);
  }
  function direction() {
    const held = new Set([...keys.values(), ...touches.values()]);
    return {
      x: +held.has('right') - +held.has('left'),
      z: +held.has('up') - +held.has('down')
    };
  }
  function sendInput(press = false) {
    if (!room || !active || !state || !live.has(state.phase)) return;
    room.send('input', {
      phaseId: state.phaseId, roundId: state.roundId, seq: ++inputSeq, sample: state.now,
      press: press === true, ...direction()
    });
  }
  function clear() {
    keys.clear();
    touches.clear();
    sendInput();
  }
  function sync(snapshot) {
    if (!snapshot?.phase || !room) return;
    state = snapshot;
    received = view.performance.now();
    const me = state.players.get(room.sessionId);
    const changed = phase !== state.phase || round !== state.roundId;
    const running = state.phase === 'countdown' || live.has(state.phase);
    const racing = running && me?.status === 'racing' && me.connected;
    active = racing;
    spectator = running && !racing;
    el('entry').hidden = true;
    el('room').hidden = running;
    el('hud').hidden = !running;
    el('pad').hidden = !racing;
    el('spectator').hidden = !spectator;
    el('host-actions').hidden = state.hostId !== room.sessionId;
    el('results').hidden = state.phase !== 'results';
    el('start').textContent = state.phase === 'results' ? 'Race again' : 'Start round';
    if (me && doc.activeElement !== el('character')) el('character').value = me.characterId;
    if (changed) {
      if (live.has(state.phase) || state.phase === 'results') playTone(state.phase);
      if ((state.phase === 'countdown' && racing) || (phase === undefined && racing)) {
        el('field').focus({ preventScroll: true });
      }

      el('signal').dataset.phase = state.phase;
      phase = state.phase;
      round = state.roundId;
    }
    if (!running) {
      const list = Array.from(state.players.values()).filter(player => player.connected);
      content('room-code', room.roomId);
      content('roster-count', list.length + (list.length === 1 ? ' player' : ' players'));
      renderList(el('roster'), list.map(player => player.name + (player.id === state.hostId ? ' · Host' : '')));
      if (state.phase === 'results') {
        const rows = standings(Array.from(state.players.values()));
        const wins = rows.filter(player => player.finish).length;
        content('result-title', wins === 0 ? 'Round over · No winner' : wins === 1 ? 'We have a winner!' : wins + ' winners!');
        renderList(el('placements'), rows.map(player => {
          const label = {
            finished: 'Finished', survivor: 'Last runner standing', time: 'Time expired · ' +
              Math.max(0, Math.round(player.z / FIELD.finish * 100)) + '%', out: 'Eliminated · Moved on red', left: 'Disconnected'
          }[player.status];
          const time = player.status === 'finished' ? ' · ' + (player.finishMs / 1000).toFixed(2) + 's' : '';
          return '#' + player.place + ' ' + player.name + ' · ' + player.points + ' pts · ' + label + time +
            ' · ' + player.distancePoints + ' distance + ' + (player.finishBonus + player.speedBonus + player.survivalBonus) + ' bonus';
        }));
      }
    }
    if (changed && state.phase === 'results') el('result-title').focus({ preventScroll: true });
    if (spectator) {
      content('spectator-message', {
        out: 'Out on red · Watch the race', finished: 'You crossed the finish line!',
        waiting: 'Spectating · You’re in for the next race'
      }[me?.status] ?? 'Watch the race');
      const targets = Array.from(state.players.values()).filter(player => player.connected && player.status === 'racing');
      updateOptions(el('watch'), targets.map(player => [player.id, player.name]));
    }
    if (!racing && (keys.size || touches.size)) clear();
    if (changed && active) sendInput();
  }

  function renderList(list, strings) {
    const signature = JSON.stringify(strings);
    if (signature === list.dataset.signature) return;
    list.dataset.signature = signature;
    list.replaceChildren(...strings.map(value => {
      const item = doc.createElement('li'); item.textContent = value; return item;
    }));
  }
  function updateOptions(select, options) {
    const signature = JSON.stringify(options);
    if (signature === select.dataset.signature) return;
    select.dataset.signature = signature;
    const selected = select.value;
    select.replaceChildren(...options.map(([id, name]) => new Option(name, id)));
    if (options.some(([id]) => id === selected)) select.value = selected;
  }
  function draw(now) {
    if (state) {
      const estimated = state.now + Math.max(0, now - received);
      const observed = spectator ? el('watch').value : room?.sessionId;
      const player = state.players.get(observed);
      if (live.has(state.phase) || state.phase === 'countdown') {
        const seconds = Math.max(0, Math.ceil((state.deadline - estimated) / 1000));
        const label = state.phase === 'green' ? 'GREEN · RUN'
          : state.phase === 'red' ? 'RED · FREEZE'
            : String(Math.max(1, Math.ceil((state.phaseEndsAt - estimated) / 1000)));
        content('signal', label);
        content('clock', seconds + 's');
        const percent = Math.max(0, Math.min(100, Math.round((player?.z ?? 0) / FIELD.finish * 100)));
        content('percent', percent + '%');
        if (el('progress').value !== percent) el('progress').value = percent;
      }
      content('points', (player?.points ?? 0) + ' pts');
      const local = active && observed === room?.sessionId && player
        ? movementPreview.sample(player, state, direction(), now, now - received) : undefined;
      arena?.render(state, observed, now, local);
    } else {
      arena?.render(null, '', now);
    }
    if (!disposed) frame = view.requestAnimationFrame(draw);
  }
  function detach() {
    room = null;
    state = null;
    movementPreview.reset();
    phase = undefined;
    active = false;
    spectator = false;
    clear();
    el('room').hidden = el('hud').hidden = el('pad').hidden = el('spectator').hidden = true;
    el('entry').hidden = false;
  }
  async function attach(next, myAttempt) {
    if (attempt !== myAttempt || disposed) {
      await next.leave();
      return;
    }
    room = next;
    save({ roomId: next.roomId, token: next.reconnectionToken, seq: inputSeq });
    updateURL(next.roomId);
    el('entry').hidden = true;
    status(arenaError);
    next.onStateChange(sync);
    next.onMessage('pong', sent => {
      if (room === next && Number.isFinite(sent)) {
        content('latency', Math.round(view.performance.now() - sent) + ' ms');
      }
    });
    next.onLeave(async () => {
      if (room !== next || attempt !== myAttempt || disposed) return;
      detach();
      status('Connection lost. Rejoining…');
      const expiry = view.performance.now() + 10500;
      while (attempt === myAttempt && !disposed && view.performance.now() < expiry) {
        try {
          await attach(await client.reconnect(next.reconnectionToken), myAttempt);
          return;
        } catch {
          await new Promise(resolve => view.setTimeout(resolve, 650));
        }
      }
      if (attempt === myAttempt && !disposed) {
        save(null);
        status('Reconnection expired. Enter the room code to join again.');
      }
    });
    if (next.state?.phase) sync(next.state);
  }
  async function createHostedRoom(options) {
    const retryDelays = [1000, 2000, 4000, 8000];
    for (let retry = 0; ; retry++) {
      try {
        return await client.create(ROOM_TYPE, options);
      } catch (error) {
        if (retry >= retryDelays.length) throw error;
        content('entry-status', 'Waking the multiplayer service… retry ' + (retry + 1) + ' of ' + retryDelays.length);
        await new Promise(resolve => view.setTimeout(resolve, retryDelays[retry]));
      }
    }
  }

  async function connect(host) {
    if (!client) {
      content('entry-status', 'Open the game through the local multiplayer preview server.');
      return;
    }
    const code = el('code').value.trim();
    if (!host && !code) {
      content('entry-status', 'Enter the room code.');
      return;
    }
    const myAttempt = ++attempt;
    const controls = [...el('join').querySelectorAll('button')];
    controls.forEach(button => { button.disabled = true; });
    const options = { name: el('name').value };
    content('entry-status', host ? 'Opening a room…' : 'Joining room…');
    save(null);
    inputSeq = 0;
    try {
      let next;
      if (host) {
        options.hostKey = Array.from(crypto.getRandomValues(new Uint8Array(16)),
          byte => byte.toString(16).padStart(2, '0')).join('');
        next = await createHostedRoom(options);
      } else next = await client.joinById(code, options);
      await attach(next, myAttempt);
      content('entry-status', '');
    } catch (error) {
      console.error('Red Light, Green Light multiplayer connection failed', error);
      if (attempt === myAttempt) {
        const detail = typeof error?.message === 'string' ? error.message.trim().slice(0, 180) : '';
        content('entry-status', host
          ? 'Could not open a room' + (detail ? ': ' + detail : '. Check the preview server.')
          : 'Could not join' + (detail ? ': ' + detail : '. Check the room code and ask the host if there is space.'));
      }
    } finally {
      controls.forEach(button => { button.disabled = false; });
    }
  }

  updateOptions(el('character'), avatars.map(avatar => [avatar.id, avatar.name + (avatar.species ? ' · ' + avatar.species : '')]));
  try {
    arena = createArena(el('field'), { makeAvatar });
  } catch {
    arenaError = '3D graphics unavailable on this device.';
    status(arenaError);
  }
  on(el('join'), 'submit', event => { event.preventDefault(); void connect(false); });
  on(el('host'), 'click', () => void connect(true));
  on(el('sound'), 'click', async () => {
    sound = !sound;
    if (sound) {
      try {
        const Audio = view.AudioContext || view.webkitAudioContext;
        audio ??= new Audio();
        await audio.resume();
        playTone('green');
      } catch { sound = false; }
    }
    el('sound').setAttribute('aria-pressed', String(sound));
    content('sound', sound ? 'Sound on' : 'Sound off');
  });
  on(el('invite'), 'click', async () => {
    if (!room) return;
    try {
      await view.navigator.clipboard.writeText(view.location.href);
      content('room-notice', 'Invite link copied.');
    } catch { content('room-notice', 'Share the room code or copy the page address.'); }
  });
  on(el('start'), 'click', () => room?.send('start', { durationMs: Number(el('duration').value) }));
  on(el('character'), 'change', () => room?.send('character', el('character').value));
  on(el('leave'), 'click', () => {
    const previous = room;
    attempt++;
    detach();
    previous?.leave();
    save(null);
    updateURL('');
    el('code').value = '';
    status(arenaError);
  });
  on(view, 'keydown', event => {
    if (!active || !moves[event.code] || event.target?.matches?.('input, select, textarea, button')) return;
    event.preventDefault();
    if (!event.repeat) {
      keys.set(event.code, moves[event.code]);
      sendInput(true);
    }
  });
  on(view, 'keyup', event => { if (keys.delete(event.code)) sendInput(); });
  on(view, 'blur', clear);
  on(doc, 'visibilitychange', () => { if (doc.hidden) clear(); });
  for (const button of el('pad').querySelectorAll('button')) {
    on(button, 'pointerdown', event => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      touches.set(event.pointerId, button.dataset.direction);
      sendInput(true);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      on(button, event, pointer => { if (touches.delete(pointer.pointerId)) sendInput(); });
    }
  }
  const timer = view.setInterval(sendInput, 50);
  const pingTimer = view.setInterval(() => room?.send('ping', view.performance.now()), 1500);
  on(view, 'pagehide', () => {
    clear();
    if (room) save({ roomId: room.roomId, token: room.reconnectionToken, seq: inputSeq });
  });
  frame = view.requestAnimationFrame(draw);
  const code = new URL(view.location.href).searchParams.get('room') || '';
  el('code').value = code;
  let cached;
  try { cached = JSON.parse(view.sessionStorage.getItem(storageKey)); } catch {}
  if (client && code && cached?.roomId === code) {
    const myAttempt = ++attempt;
    inputSeq = Number.isSafeInteger(cached.seq) ? cached.seq + 10000 : 0;
    status('Restoring your seat…');
    client.reconnect(cached.token).then(next => attach(next, myAttempt)).catch(() => {
      if (attempt === myAttempt) {
        save(null);
        status('Previous seat expired. Join with the room code.');
      }
    });
  }

  return {
    get state() { return state; },
    dispose() {
      disposed = true;
      events.abort();
      view.clearInterval(timer);
    view.clearInterval(pingTimer);
      view.cancelAnimationFrame(frame);
      room?.leave();
      detach();
      arena?.dispose();
      audio?.close();
    }
  };
}
