const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const settle = async () => { for (let i=0;i<12;i++) await Promise.resolve(); };
class Media {
  constructor(src='') { this.src=src; this.dataset={}; this.listeners={}; this.paused=true; this.ended=false; this.muted=false; this.volume=1; this._currentTime=0; this.seeks=[]; this.duration=14.229333; this.playbackRate=1; this.plays=[]; this.pauses=0; }
  get currentTime() { return this._currentTime; }
  set currentTime(value) { this._currentTime=value; this.seeks.push(value); }
  addEventListener(t,f) { (this.listeners[t] ||= new Set()).add(f); }
  removeEventListener(t,f) { this.listeners[t]?.delete(f); }
  emit(t) { for(const f of [...(this.listeners[t]||[])]) f({currentTarget:this}); }
  play() { this.plays.push(this.currentTime); if(this.deny){const e=new Error('autoplay');e.name='NotAllowedError';return Promise.reject(e);}this.paused=false;return Promise.resolve(); }
  pause() { this.paused=true;this.pauses++; }
  load() {}
  removeAttribute() {this.src='';}
}
function mount() {
  let aud, id=0;
  const video = new Media(); video.duration=28;video.paused=false;
  const effects=[], cleanups=[], states=[], timers=new Map(), ducks=[];
  const React={useRef:v=>({current:v}),useEffect:f=>effects.push(f),useState(v){const i=states.length;states.push(v);return[v,n=>states[i]=n];}};
  const window={React,location:{hostname:'localhost',protocol:'http:'},INTRO_NARRATION:{offset:11.833333333333334,duration:14.229333,sources:['./audio/intro.mp3','./audio/intro.ogg']},
    Audio:class extends Media{constructor(){super();aud=this;}},SpaceNarration:{duck:(owner,on)=>ducks.push([owner,on])},
    setInterval(f,d){timers.set(++id,{f,d});return id;},clearInterval(i){timers.delete(i);}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'src/audio/intro-narration.js'),'utf8'),{window,Promise,isFinite,Date,console});
  const hook=window.useIntroNarration({current:video},'./audio/intro.mp3');
  for(const f of effects){const c=f();if(c)cleanups.push(c);}
  return{video,audio:aud,hook,states,ducks,timers,tick(){for(const v of [...timers.values()])v.f();},cleanup(){cleanups.forEach(f=>f());}};
}
(async()=>{
  const m=mount();m.tick();await settle();assert.equal(m.audio.plays.length,0,'No narrator before blackout');
  m.video.currentTime=11.82;m.tick();assert.equal(m.audio.plays.length,0);
  m.video.currentTime=11.833333333333334;m.tick();await settle();assert.equal(m.audio.plays.length,1);assert.equal(m.audio.plays[0],0,'Narration starts at audio t=0 on black frame');
  assert(m.ducks.some(x=>x[1]),'Narration engages shared duck');
  m.audio.currentTime=.16;m.video.currentTime=12.24;
  const seeksBefore=m.audio.seeks.length;
  for(let i=0;i<6;i++)m.tick();
  assert.equal(m.audio.seeks.length,seeksBefore,'Small startup drift never retriggers the first words');
  m.video.currentTime=17.2;m.video.emit('seeking');await settle();m.tick();await settle();
  assert(Math.abs(m.audio.currentTime-(17.2-11.833333333333334))<.001,'Seeking uses the video-relative offset');
  for(let i=0;i<35;i++)m.tick();assert(m.video.volume<.24,'Film score gently ducks');
  m.video.muted=true;m.video.emit('volumechange');assert(m.audio.paused,'Explicit mute pauses Arabic narration');
  for(let i=0;i<35;i++)m.tick();assert(m.video.volume>.98,'Score restores after narrator stops');
  m.video.muted=false;m.hook.unlock();await settle();assert(!m.audio.paused,'User unmute resumes narration');
  m.video.currentTime=26.1;m.tick();assert(m.audio.paused,'End of narration restores ambience before dissolve');
  m.hook.stop();m.cleanup();assert.equal(m.timers.size,0,'No timers survive unmount');assert(m.audio.paused);

  const p=mount();p.audio.deny=true;p.video.currentTime=16;p.tick();await settle();assert.equal(p.states[0],true,'Blocked narration exposes unmute recovery');
  const originalVideoTime=p.video.currentTime;p.audio.deny=false;p.hook.unlock();await settle();
  assert.equal(p.video.currentTime,originalVideoTime,'Unmute never resets video');assert(Math.abs(p.audio.currentTime-(16-11.833333333333334))<.001,'Unmute catches up to the narrator');
  assert.equal(p.states[0],false);p.cleanup();
  console.log('PASS: smooth first words, seeking sync, score/shared ducking, mute, late-unmute recovery, ending and cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1;});
