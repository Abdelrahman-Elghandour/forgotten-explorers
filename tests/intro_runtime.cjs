const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../src/components/CinematicIntro.js'), 'utf8');
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

function mount(play) {
  const effects = [], cleanups = [], listeners = new Map(), timers = new Map();
  let parentMuted = false, unlocks = 0, begins = 0, completes = 0, timerID = 0;
  const video = {
    muted:false, volume:1, duration:28, currentTime:0, pauses:0, loads:0,
    play, pause() { this.pauses++; }, load() { this.loads++; }, removeAttribute() {}
  };
  const document = {
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); }
  };
  const React = {
    createElement(type, props, ...children) {
      const node = {type, props:props || {}, children};
      if (type === 'video') props.ref.current = video;
      return node;
    },
    useState(initial) { let value = initial; return [value, next => { value = typeof next === 'function' ? next(value) : next; }]; },
    useRef(value) { return {current:value}; },
    useEffect(effect) { effects.push(effect); }
  };
  const window = {
    React, location:{protocol:'http:', hostname:'localhost'},
    setTimeout(fn, delay) { const id = ++timerID; timers.set(id, {fn,delay}); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  vm.runInNewContext(source, {window, document, Promise, console, isFinite});
  const tree = window.CinematicIntro({
    lang:'ar', muted:false,
    onMutedChange(value) { parentMuted = value; },
    onFirstInteraction() { unlocks++; },
    onBeginTransition() { begins++; },
    onComplete() { completes++; }, onLanguageToggle() {}
  });
  for (const effect of effects) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); }
  function find(predicate, node=tree) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of node.children || []) { const found = find(predicate, child); if (found) return found; }
    return null;
  }
  return {
    video, timers, listeners, tree,
    get state() { return {parentMuted,unlocks,begins,completes}; },
    button(className) { return find(n => n.type==='button' && n.props.className.includes(className)); },
    ended() { find(n => n.type==='video').props.onEnded(); },
    gesture(type='pointerdown', target={parentNode:null}) {
      for (const fn of [...(listeners.get(type) || [])]) fn({type,target,key:'Enter'});
    },
    finishTimers() { for (const [id,timer] of [...timers]) { timers.delete(id); timer.fn(); } },
    unmount() { cleanups.forEach(fn => fn()); }
  };
}

(async () => {
  let calls = 0;
  const policy = mount(() => ++calls === 1 ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve());
  await settle();
  assert.equal(calls,2,'Audible autoplay retries muted');
  assert.equal(policy.video.muted,true,'Policy fallback starts silent video');
  assert.equal(policy.state.parentMuted,false,'Policy fallback does not mute the whole app');
  assert.equal(policy.state.unlocks,0,'Autoplay never invokes gesture-only Web Audio unlock');
  policy.gesture(); await settle();
  assert.equal(policy.video.muted,false,'First background interaction enables video audio');
  assert.equal(policy.state.unlocks,1);
  assert.equal(policy.listeners.get('pointerdown').size,0);
  assert.equal(policy.listeners.get('keydown').size,0);
  policy.unmount();

  const natural = mount(() => Promise.resolve()); await settle();
  natural.ended(); natural.ended();
  assert.equal(natural.state.begins,1,'Duplicate ended events cannot restart the transition');
  assert.equal(natural.state.completes,0,'Overlay is not removed early');
  assert.equal([...natural.timers.values()][0].delay,800);
  natural.finishTimers();
  assert.equal(natural.state.completes,1);
  assert.equal(natural.state.unlocks,0,'Natural ending without interaction does not attempt Web Audio unlock');
  natural.unmount();

  const skip = mount(() => Promise.resolve()); await settle();
  skip.button('intro-skip').props.onClick(); skip.ended();
  assert.equal(skip.state.begins,1,'Skip and ended share a completion guard');
  assert.equal(skip.state.unlocks,1,'Skip unlocks audio synchronously');
  assert.equal([...skip.timers.values()][0].delay,800);
  assert(skip.video.pauses > 0,'Skip stops the video soundtrack');
  skip.finishTimers(); assert.equal(skip.state.completes,1); skip.unmount();

  const muted = mount(() => Promise.resolve()); await settle();
  muted.button('intro-audio-control').props.onClick();
  assert.equal(muted.video.muted,true,'Manual mute takes effect');
  assert.equal(muted.state.parentMuted,true,'Manual mute updates the app preference');
  muted.gesture(); assert.equal(muted.video.muted,true,'Later gestures never override explicit mute');
  muted.ended(); muted.unmount(); assert.equal(muted.timers.size,0,'Unmount clears completion timer');

  calls = 0;
  const race = mount(() => {
    calls++;
    if (calls===1) return new Promise((resolve,reject) => { raceReject=reject; });
    return Promise.resolve();
  });
  race.gesture(); raceReject(new Error('late autoplay rejection')); await settle();
  assert.equal(race.video.muted,false,'Late autoplay failure cannot overwrite user-unlocked audio');
  race.unmount();
  console.log('PASS: Autoplay fallback, policy-versus-explicit mute, first interaction, race protection, natural ending, Skip 800ms guard, and listener/timer cleanup.');
})().catch(error => { console.error(error); process.exitCode=1; });
let raceReject;
