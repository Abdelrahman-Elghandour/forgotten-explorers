const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const transcriptSource = fs.readFileSync('src/data/voice-transcripts.js', 'utf8');
const context = { window: {} };
vm.runInNewContext(transcriptSource, context, { filename: 'voice-transcripts.js' });
const transcripts = context.window.VOICE_TRANSCRIPTS;
const ids = ['opp', 'spi', 'vik', 'ins', 'pat', 'eag', 'sur', 'lun', 'ven', 'huy', 'voy', 'kep'];
assert.deepStrictEqual(Object.keys(transcripts), ids);
assert.strictEqual(transcripts.opp, "I am Opportunity. I was designed to live for only 90 days, yet I roamed Meridiani Planum for 14 years. In 2018, a massive dust storm covered me and blocked the Sun from my panels, so I went quietly to sleep. My last message was: 'My battery is low and it’s getting dark.'");
assert.strictEqual(transcripts.voy, "We are Voyager 1 and 2. Launched in 1977, we carry a Golden Record filled with sounds and images from Earth. We are now traveling through interstellar space, farther than anything human-made. We still whisper back to Earth as much as our power allows—and on November 18, 2026, Voyager 1 reaches one full light-day away, meaning its signal takes 24 hours to reach you.");
for (const id of ids) assert.ok(transcripts[id].length > 20, `${id} transcript should be populated`);

const index = fs.readFileSync('index.html', 'utf8');
const ordered = [
  './src/data/intro-transcript.js',
  './src/data/voice-transcripts.js',
  './src/audio/narration-support.js',
  './src/audio/intro-narration.js',
  './src/components/CinematicIntro.js',
].map((src) => index.indexOf(`src="${src}"`));
assert.ok(ordered.every((n) => n >= 0), 'all integration scripts should be present');
assert.ok(ordered.every((n, i) => i === 0 || n > ordered[i - 1]), 'integration scripts should load in dependency order');
assert.match(index, /mission\.enDiary : mission\.diary/);
assert.match(index, /fm\.enDiary : fm\.diary/);
assert.match(index, /a\.ontimeupdate/);
assert.match(index, /a\.onloadedmetadata/);
assert.match(index, /SpaceNarration\?\.duck\("mission", true\)/);
assert.match(index, /SpaceNarration\?\.duck\("mission", false\)/);
assert.match(index, /never invented per-phrase timestamps/);
assert.deepStrictEqual(JSON.parse(JSON.stringify(transcripts)), JSON.parse(fs.readFileSync('tests/fixtures/user-english-transcripts.json','utf8')), 'all twelve user transcripts are exact');
assert.match(index, /Transcript \/ النص/);
console.log('voice_transcripts: PASS');
