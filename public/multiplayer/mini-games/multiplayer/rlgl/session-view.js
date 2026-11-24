import { createArena } from './arena.js';
import { createCanvasArena } from './arena-2d.js';
import { characters } from '../../../lib/characters.js';
import { FIELD, standings } from './rules.js';
import { createMovementPreview } from './movement-preview.js';


const moves = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'
};
const live = new Set(['green', 'red']);

export function mountSession(root, { initial, now: serverNow, makeAvatar, avatars = characters, arenaFactory = createArena } = {}) {
  const el = id => root.querySelector('#' + id);
  const view = root.ownerDocument.defaultView;
  const doc = root.ownerDocument;
  const keys = new Map(), touches = new Map(), events = new AbortController();
  const movementPreview = createMovementPreview();
  let pendingPress = false;
  const room = {sessionId:initial.playerId,roomId:''};
  let state, arena, round = -1, phase, received = 0, inputSeq = 0;
  let audio, sound = false, frame, active = false, spectator = false, disposed = false;

  function on(target, event, handler) {
    target.addEventListener(event, handler, { signal: events.signal });
  }
  function content(id, value) {
    if (el(id).textContent !== value) el(id).textContent = value;
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
  function sendInput(press = false) { pendingPress ||= press === true; }
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
    inputSeq = Math.max(inputSeq, me?.seq ?? -1);
    const changed = phase !== state.phase || round !== state.roundId;
    const running = state.phase === 'countdown' || live.has(state.phase);
    const racing = running && me?.status === 'racing' && me.connected;
    active = racing && initial.canPlay;
    spectator = running && !racing;
    el('entry').hidden = true;
    el('room').hidden = running;
    el('hud').hidden = !running;
    el('pad').hidden = !racing;
    el('spectator').hidden = !spectator;
    el('host-actions').hidden = state.hostId !== room.sessionId;
    el('results').hidden = state.phase !== 'results';
    el('start').textContent = state.phase === 'results' ? 'Race again' : 'Start round';
    if (me && (root.activeElement ?? doc.activeElement) !== el('character')) el('character').value = me.characterId;
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
    select.replaceChildren(...options.map(([id, name]) => Object.assign(doc.createElement('option'),{textContent:name,value:id})));
    if (options.some(([id]) => id === selected)) select.value = selected;
  }
  function draw(now) {
    if (state) {
      const estimated = state.now + Math.max(0, now - received);
      const watched=el('watch').value;
      const observed = spectator ? (watched || state.players.values().next().value?.id) : room?.sessionId;
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
  updateOptions(el('character'), avatars.map(avatar => [avatar.id, avatar.name + (avatar.species ? ' · ' + avatar.species : '')]));
  const field = el('field');
  function useCanvasField() {
    arena?.dispose();
    const canvas=el('field').cloneNode(false);
    canvas.setAttribute('aria-label','Top-down race field');
    el('field').replaceWith(canvas);
    arena=createCanvasArena(canvas);
  }
  try {
    if(!initial.canPlay)useCanvasField();
    else {
      arena = arenaFactory(field, { makeAvatar });
      on(field,'webglcontextlost',event=>{event.preventDefault();useCanvasField();});
    }
  } catch {
    useCanvasField();
  }
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
  on(view, 'keydown', event => {
    if (!active || !moves[event.code] || (event.composedPath?.()[0] ?? event.target)?.matches?.('input, select, textarea, button')) return;
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

  function update(context) {
    const snapshot=context.snapshot;
    if(snapshot) sync({...snapshot,players:new Map(snapshot.players.map(p=>[p.id,p]))});
  }
  update(initial);
  frame = view.requestAnimationFrame(draw);
  return {
    update,pollInterval:100,
    input() {
      if(!active||!state||!live.has(state.phase))return null;
      const packet={phaseId:state.phaseId,roundId:state.roundId,seq:++inputSeq,
        sample:serverNow(),press:pendingPress,...direction()};
      pendingPress=false;return packet;
    },
    destroy() {
      disposed=true;events.abort();view.cancelAnimationFrame(frame);
      keys.clear();touches.clear();movementPreview.reset();
      arena?.dispose();void audio?.close();
    }
  };
}
