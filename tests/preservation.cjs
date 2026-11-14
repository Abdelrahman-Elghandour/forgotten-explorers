const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const Babel = require(process.env.BABEL_CHECKER || '/tmp/fe_checks/babel.cjs');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
const original = read('original_step8.html');
const updated = read('index.html');
const inline = text => text.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/)[1];
const clean = node => JSON.parse(JSON.stringify(node, (key, value) =>
  ['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments'].includes(key) ? undefined : value));
const parse = html => Babel.transform(inline(html), {presets:['react'], ast:true, code:false}).ast.program;
const before = parse(original), after = parse(updated);
const named = program => {
  const map = new Map();
  program.body.forEach(node => {
    if (node.type === 'FunctionDeclaration') map.set('fn:' + node.id.name, node);
    if (node.type === 'VariableDeclaration') node.declarations.forEach(d => {
      if (d.id && d.id.name) map.set('const:' + d.id.name, d.init || d.id);
    });
  });
  return map;
};
// Declarations this task intentionally rewrote; every other original must be byte-identical.
const REWRITTEN = new Set(['fn:ForgottenExplorers', 'fn:Space', 'fn:Surface', 'fn:tone', 'fn:ambient', 'const:ac', 'const:root', 'const:M', 'const:VOICE_IDS', 'const:VOICE_TRACKS']);
const base = named(before), now = named(after);
for (const [key, node] of base) {
  if (REWRITTEN.has(key)) continue;
  assert(now.has(key), `original declaration removed: ${key}`);
  assert.deepEqual(clean(now.get(key)), clean(node), `original declaration changed: ${key}`);
}

// Output-bus edits may change only the audio connection, not the synth itself.
const withoutBus = node => JSON.parse(JSON.stringify(clean(node), (key, value) => {
  if (value && value.type === 'CallExpression' && value.callee?.name === 'narrationMaster') {
    return { type:'MemberExpression', object:{type:'Identifier', name:'a'}, property:{type:'Identifier', name:'destination'}, computed:false };
  }
  return value;
}));
for (const key of ['fn:tone','fn:ambient']) assert.deepEqual(withoutBus(now.get(key)), clean(base.get(key)), key+' preserves every synth parameter');
const previousHtml = read('tests/fixtures/pre-transcripts.html');
const rosterHtml = read('tests/fixtures/pre-roster.html');
const previous = named(parse(previousHtml));
// The canvas only gains a per-body label colour hook; geometry, palette and motion are untouched.
const canvasOnlyAddsColour = (node) => JSON.parse(JSON.stringify(clean(node), (key, value) => {
  if (value && value.type === 'ConditionalExpression' && JSON.stringify(value).includes('labelColorRef')) {
    return { type: 'StringLiteral', value: '#e5e7eb' };
  }
  if (value && value.type === 'Identifier' && value.name === 'labelColorRef') return { type: 'Literal', value: null };
  return value;
}));
assert.deepEqual(canvasOnlyAddsColour(now.get('fn:Space')).body, clean(previous.get('fn:Space')).body, 'Solar System canvas body changes only by the label-colour hook');
assert.deepEqual(clean(now.get('fn:Space')).params.map((q) => q.name).filter((q) => q !== 'labelColorRef'), clean(previous.get('fn:Space')).params.map((q) => q.name), 'canvas props are unchanged apart from the label colour');
for (const rule of previousHtml.match(/\.craft-[a-zA-Z_-]+[^{}]*\{[^{}]*\}/g) || []) {
  assert(updated.includes(rule), 'original craft framing rule changed: '+rule.slice(0,55));
}

// The canvas keeps its exact geometry, palette and planet set; only the intro freeze was added.
for (const fragment of ['const rx = o.d * R, ry = rx * 0.38;', 'rgba(139,211,255,.14)', 'rgba(224,176,122,.75)',
  '"#fff7c2"', '"#ffb347"', 'Math.min(W, H * 1.5) / 2 * 0.95', 'o.a0 + t * o.sp']) {
  assert(original.includes(fragment), `baseline canvas fragment: ${fragment}`);
  assert(updated.includes(fragment), `canvas fragment preserved: ${fragment}`);
}
assert(/frozenRef\.current \? 0 : mouse\.current\.x/.test(updated), 'Frozen canvas ignores parallax so the frame matches the film');
assert(/if \(!frozenRef\.current\) t \+= 0\.004;/.test(updated), 'Frozen canvas holds t = 0, the film’s final frame');
const featureMarkup = html => {
  const start = html.indexOf('      {/* MISSION CONSOLE */}');
  const oldEnd = html.indexOf('      {!started && (');
  const end = oldEnd >= 0 ? oldEnd : html.indexOf('      {introVisible && (');
  return html.slice(start, end).trim().replace(/\n      <\/div>$/, '');
};
const consoleMarkup = html => html.slice(html.indexOf('      {/* MISSION CONSOLE */}'), html.indexOf('      {introVisible && (')).replace(/\s+/g, ' ');
assert(consoleMarkup(updated).includes('className="p-4 flex items-start justify-between gap-3"'), 'console header markup intact');
assert(consoleMarkup(updated).includes('{tab === "blue" && ('), 'blueprint markup intact');
assert(consoleMarkup(updated).includes('{tab === "sim" && ('), 'simulator markup intact');
assert(consoleMarkup(updated).includes('{tab === "lesson" && ('), 'lesson markup intact');
assert(/sm:inset-x-0 sm:mx-auto sm:w-\[min\(900px,94vw\)\]/.test(updated), 'console sheet centres by margin, not by a transform its entrance animation resets');
assert(!updated.includes('onClick={enter}'), 'Old static Enter Space button removed');
assert(updated.includes('<window.CinematicIntro'), 'New video component is wired');
assert(updated.includes('setStarted(true)'), 'Solar system activated during transition');
assert(updated.includes('setView("solar")'), 'Handoff explicitly restores solar view');
assert(updated.includes('onComplete={() => setIntroVisible(false)}'), 'Overlay unmounts after transition');
assert(updated.includes('frozen={introVisible && !introHandoff}'), 'Live canvas renders behind the video and unfreezes at handoff');
assert(updated.includes('inert={introVisible && !introHandoff ?'), 'Canvas becomes interactive during the dissolve');
assert(/const fly = \(k\) => \{\s*unlockAudio\(\);/.test(updated) && updated.includes('play("planet")'), 'Planet interaction explicitly unlocks Web Audio');
assert(updated.includes('window.addEventListener("pointerdown", firstInteraction, true)'), 'Post-intro interaction unlock remains registered');
assert(updated.includes('window.addEventListener("keydown", firstInteraction, true)'), 'Keyboard unlock supported');

// ---- selected craft view: every fact on screen, action buttons, voice slots ----
const surfaceSrc = updated.slice(updated.indexOf('function Surface({'), updated.indexOf('/* ============ APP ============ */'));
for (const [label, re] of [
  ['all five telemetry cells rendered from SL', /SL\[en \? "en" : "ar"\]\.map\(\(label, i\)/],
  ['launch / last contact / lifespan / distance / discovery values', /<dd dir="rtl">\{fm\.s\[i\]\}<\/dd>/],
  ['bilingual diary is always visible', /en \? fm\.enDiary : fm\.diary/],
  ['blueprint action opens console tab', /onOpen\(fm\.id, "blue"\)/],
  ['simulator action opens console tab', /onOpen\(fm\.id, "sim"\)/],
  ['lesson action opens console tab', /onOpen\(fm\.id, "lesson"\)/],
  ['high-resolution hero element', /className=\{"craft-hero"/],
]) assert(re.test(surfaceSrc), `missing: ${label}`);
assert(/object-fit:contain/.test(updated), 'Hero frames the entire craft without cropping');

assert(!/setChip|\.craft-chips/.test(surfaceSrc), 'Facts are no longer hidden behind question chips');
assert(/\.craft-mask\{position:absolute/.test(updated), 'Cinematic gradient mask present');
assert(/linear-gradient\(to left,rgba\(5,7,13,\.98\)/.test(updated), 'Mask is asymmetric toward the HUD');
assert(/~large/.test(surfaceSrc) && /~orig/.test(surfaceSrc), 'High-resolution NASA ~large with ~orig fallback');
assert(/craft-hero/.test(updated) && /@keyframes drift/.test(updated), 'Slow cinematic drift applied to the hero plate');
assert(/const VOICE_TRACKS = Object\.fromEntries\(VOICE_IDS/.test(updated), 'Voice slots mapped by mission id');
assert(/"intro"/.test(updated), 'Dedicated intro narration slot');
assert(/const replayVoice/.test(updated) && /voiceId === fm\.id/.test(updated), 'Play/pause/replay state per mission');
assert(/const openMission = \(id, to\)/.test(updated), 'Console opens on the requested tab');
for (const id of ['opp','spi','lun','intro']) {
  assert(updated.includes(`"${id}"`), `voice slot for ${id}`);
}
// Surface navigation is untouched.
for (const fragment of ['const go = (m) => { if (m.locked) { play("bad"); onLocked(m); return; } play("click"); moved.current = false; setFocus(m.id);',
  'onPointerDown={(e) => { moved.current = false; setDrag({ x: e.clientX, p: pan }); }}',
  'const step = (d) => { const i = list.findIndex((m) => m.id === focus);',
  'className="surface-dock"', '<CraftIcon c={B.c} on={focus === m.id} im={imgs[m.id]} real={real} />']) {
  assert(surfaceSrc.includes(fragment), `surface navigation preserved: ${fragment}`);
}

// ---- roster restructure: three Mars crafts, one lunar craft, explicit teasers ----
const rosterHtmlNow = updated;
const bodyOf = (id) => {
  const start = rosterHtmlNow.indexOf(`{ id: "${id}"`);
  const slice = rosterHtmlNow.slice(start, rosterHtmlNow.indexOf('{ id: "', start + 10));
  return slice;
};
const marsIds = [...rosterHtmlNow.matchAll(/\{ id: "(\w+)", n: "[^"]*", b: "mars"/g)].map((m) => m[1]);
const moonIds = [...rosterHtmlNow.matchAll(/\{ id: "(\w+)", n: "[^"]*", b: "moon"/g)].map((m) => m[1]);
assert.deepEqual(marsIds, ['opp', 'spi', 'ins'], 'Mars shows exactly Opportunity, Spirit and the InSight teaser');
assert.deepEqual(moonIds, ['lun'], 'the Moon shows only Lunokhod 1');
for (const removed of ['vik', 'pat', 'eag', 'sur']) {
  assert(!new RegExp(`\\{ id: "${removed}"`).test(updated), `${removed} removed from the roster`);
  assert(!fs.existsSync(path.join(root, 'audio', `${removed}.mp3`)), `${removed} narration asset removed`);
}
assert(/id: "ins"[^\n]*locked: true/.test(updated), 'InSight is a locked teaser');
assert(/onClick=\{m\.locked \? true : undefined\}/.test(updated) || /aria-disabled=\{m\.locked/.test(updated), 'locked craft is announced as disabled');
assert(updated.includes('{m.locked && <span className="craft-soon'), 'coming-soon badge rendered on the surface');
assert(/COMING_SOON_BODIES = \["venus", "titan", "deep"\]/.test(updated), 'teaser worlds declared');
assert(/if \(COMING_SOON_BODIES\.indexOf\(k\) >= 0\) \{ play\("bad"\); stop\(\); setSoon\(k\); return; \}/.test(updated), 'teaser worlds open a badge instead of a roster');
assert(/More missions unlocking soon/.test(updated) && /مهمات جديدة تُفتح قريباً/.test(updated), 'bilingual coming-soon copy present');
assert(/ACTIVE_IDS\.includes\(m\.id\) && m\.y <= year/.test(updated), 'Time Machine lists only active missions');
assert(/const ACTIVE_IDS = \["opp", "spi", "lun"\]/.test(updated), 'active mission set is explicit');

// ---- narration data: measured cues for the three recorded stories ----
const cues = vm.runInNewContext(read('src/data/mission-caption-cues.js') + ';window.MISSION_CAPTION_CUES', { window: {} });
for (const id of ['opp', 'spi', 'lun']) {
  const list = cues[id];
  assert(Array.isArray(list) && list.length >= 12, `${id} has measured cue rows`);
  list.forEach((cue, i) => {
    assert(cue.end > cue.start, `${id} cue ${i} has a positive window`);
    assert(cue.text && cue.text.length > 3, `${id} cue ${i} has English text`);
    if (i) assert(cue.start >= list[i - 1].end - 0.01, `${id} cues are ordered and non-overlapping`);
  });
  assert(list[list.length - 1].end < 43, `${id} cues stay inside the recording`);
}
const intro = vm.runInNewContext(read('src/data/intro-transcript.js') + ';window.INTRO_NARRATION', { window: {} });
assert.strictEqual(intro.duration, 15.68, 'new intro length recorded');
assert.strictEqual(intro.cues.length, 5, 'five intro phrases');
intro.cues.forEach((cue, i) => { if (i) assert(cue.start > intro.cues[i - 1].start); });

new vm.Script(read('src/components/CinematicIntro.js'));
new vm.Script(read('src/data/abandonedEquipment.js'));
console.log('PASS: Full JSX syntax, every original data/feature module unchanged, mission UI intact, cinematic craft view complete, voice slots mapped, and surface navigation preserved.');
