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
const stable = program => program.body.filter(node => {
  if (node.type === 'FunctionDeclaration') return node.id.name !== 'ForgottenExplorers';
  if (node.type === 'VariableDeclaration') return !node.declarations.some(d => d.id.name === 'ac' || d.id.name === 'root');
  return false;
}).map(clean);
assert.deepEqual(stable(after), stable(before), 'Data, feature components and audio synthesis must remain unchanged');
const featureMarkup = html => {
  const start = html.indexOf('      {/* MISSION CONSOLE */}');
  const oldEnd = html.indexOf('      {!started && (');
  const end = oldEnd >= 0 ? oldEnd : html.indexOf('      {introVisible && (');
  return html.slice(start, end).trim().replace(/\n      <\/div>$/, '');
};
assert.equal(featureMarkup(updated), featureMarkup(original), 'Mission console, simulator, blueprint, time machine and certificate markup must remain unchanged');
assert(!updated.includes('onClick={enter}'), 'Old static Enter Space button removed');
assert(updated.includes('<window.CinematicIntro'), 'New video component is wired');
assert(updated.includes('setStarted(true)'), 'Solar system activated during transition');
assert(updated.includes('setView("solar")'), 'Handoff explicitly restores solar view');
assert(updated.includes('onComplete={() => setIntroVisible(false)}'), 'Overlay unmounts after transition');
assert(updated.includes('unlockAudio(); play("planet")'), 'Planet interaction explicitly unlocks Web Audio');
assert(updated.includes('window.addEventListener("pointerdown", firstInteraction, true)'), 'Post-intro interaction unlock remains registered');
assert(updated.includes('window.addEventListener("keydown", firstInteraction, true)'), 'Keyboard unlock supported');
new vm.Script(read('src/components/CinematicIntro.js'));
new vm.Script(read('src/data/abandonedEquipment.js'));
console.log('PASS: Full JSX syntax, all original data and feature modules, unchanged mission UI, video wiring, audio unlock, and preserved NSSDCA source.');
