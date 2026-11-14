const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../src/components/CinematicIntro.js'), 'utf8');
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

function mount(play) {
  const effects = [], cleanups = [], listeners = new Map(), timers = new Map(), intervals = new Map();
  let parentMuted = false, unlocks = 0, leads = 0, begins = 0, completes = 0, timerID = 0, intervalID = 0;
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
    clearTimeout(id) { timers.delete(id); },
    setInterval(fn, delay) { const id = ++intervalID; intervals.set(id, {fn,delay}); return id; },
    clearInterval(id) { intervals.delete(id); }
  };
  vm.runInNewContext(source, {window, document, Promise, console, isFinite});
  const tree = window.CinematicIntro({
    lang:'ar', muted:false,
    onMutedChange(value) { parentMuted = value; },
    onFirstInteraction() { unlocks++; },
    onMusicLeadIn() { leads++; },
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
    video, timers, intervals, listeners, tree,
    get state() { return {parentMuted,unlocks,leads,begins,completes}; },
    button(className) { return find(n => n.type==='button' && n.props.className.includes(className)); },
    ended() { find(n => n.type==='video').props.onEnded(); },
    timeUpdate(time, length=28) { video.currentTime = time; video.duration = length; find(n => n.type==='video').props.onTimeUpdate({currentTarget: video}); },
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
  assert.equal(calls,1,'Policy refusal does not secretly retry muted playback');
  assert.equal(policy.video.muted,false,'Sound remains enabled when autoplay is blocked');
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
  assert.equal([...natural.timers.values()][0].delay,1200,'Dissolve lasts 1.2s');
  natural.finishTimers();
  assert.equal(natural.state.completes,1);
  assert.equal(natural.state.unlocks,0,'Natural ending without interaction does not attempt Web Audio unlock');
  natural.unmount();

  const noSkip = mount(() => Promise.resolve()); await settle();
  assert.equal(noSkip.button('intro-skip'), null, 'the intro offers no Skip control');
  assert.equal(noSkip.video.muted, false, 'the film starts unmuted when the browser allows it');
  assert.equal(noSkip.video.volume, 1, 'the film starts at full volume');
  noSkip.ended(); noSkip.ended();
  assert.equal(noSkip.state.begins,1,'Ending twice still completes once');
  assert.equal([...noSkip.timers.values()][0].delay,1200);
  assert(noSkip.intervals.size === 1,'The ending fades the soundtrack instead of cutting it');
  noSkip.finishTimers(); assert.equal(noSkip.state.completes,1); noSkip.unmount();

  const enabled = mount(() => Promise.resolve()); await settle();
  assert.equal(enabled.button('intro-audio-control'),null,'No mute/unmute toggle is rendered');
  enabled.button('intro-transcript-toggle').props.onClick(); await settle();
  assert.equal(enabled.video.muted,false,'A normal control click automatically retains enabled audio');
  assert.equal(enabled.state.unlocks,1,'Transcript click unlocks audio without a mute toggle');
  enabled.ended(); enabled.unmount(); assert.equal(enabled.timers.size,0,'Unmount clears completion timer');

  const early = mount(() => Promise.resolve()); await settle();
  early.timeUpdate(21.9); assert.equal(early.state.leads,0,'Homepage music waits until six seconds before the end');
  early.timeUpdate(22.0); assert.equal(early.state.leads,1,'Homepage music enters before the visual dissolve');
  early.timeUpdate(26.0); assert.equal(early.state.begins,0,'Dissolve waits for the final 1.2 seconds');
  early.timeUpdate(26.9); assert.equal(early.state.begins,1,'Dissolve begins at duration minus 1.2s');
  assert.equal(early.state.leads,1,'Music lead-in fires once');
  assert.equal(early.state.completes,0,'Overlay stays until the dissolve finishes');
  early.timeUpdate(27.4); assert.equal(early.state.begins,1,'Time updates cannot restart the dissolve');
  early.unmount();

  calls = 0;
  const race = mount(() => {
    calls++;
    if (calls===1) return new Promise((resolve,reject) => { raceReject=reject; });
    return Promise.resolve();
  });
  race.gesture(); raceReject(new Error('late autoplay rejection')); await settle();
  assert.equal(race.video.muted,false,'Late autoplay failure cannot overwrite user-unlocked audio');
  race.unmount();
  console.log('PASS: Always-unmuted autoplay, automatic gesture recovery, no mute controls, music lead-in, dissolve and cleanup.');
})().catch(error => { console.error(error); process.exitCode=1; });
let raceReject;
