const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const read = (p) => fs.readFileSync(p, 'utf8');
const load = (file, global) => {
  const context = { window: {} };
  vm.runInNewContext(read(file), context, { filename: file });
  return context.window[global];
};

const transcripts = load('src/data/voice-transcripts.js', 'VOICE_TRANSCRIPTS');
const cues = load('src/data/mission-caption-cues.js', 'MISSION_CAPTION_CUES');
const intro = load('src/data/intro-transcript.js', 'INTRO_NARRATION');
const ids = ['opp', 'spi', 'lun', 'ins', 'ven', 'huy', 'voy', 'kep'];
assert.deepStrictEqual(Object.keys(transcripts), ids);

// The three new stories: English transcript must equal the measured caption rows.
for (const id of ['opp', 'spi', 'lun']) {
  const joined = cues[id].map((c) => c.text).join(' ');
  assert.strictEqual(transcripts[id], joined, `${id} transcript matches its caption cues exactly`);
  assert.ok(transcripts[id].length > 300, `${id} transcript is a full story`);
}

// The Arabic diary is the verbatim spoken narration.
const index = read('index.html');
const diary = (id) => {
  const start = index.indexOf(`{ id: "${id}"`);
  const block = index.slice(start, index.indexOf('s: [', start));
  return block.slice(block.indexOf('diary: "') + 8, block.lastIndexOf('"'));
};
const spoken = {
  opp: 'أهلًا، أنا Opportunity. روفر صممني مهندسين وكالة NASA. وصلت للمريخ سنة 2004، وكان المفروض مهمتي تستمر حوالي تلات شهور. بس أنا كان عندي لسه كتير أستكشفه. فضلت شغال أكتر من 14 سنة، ومشيت أكتر من 45 كيلومتر. ولقيت في الصخور أدلة إن المريخ كان فيه مية زمان. لحد ما في سنة 2018 عاصفة تراب ضخمة، حاجة بتحجب الشمس، وما قدرتش أشحن بطاريتي تاني، وكانت دي نهاية رحلتي. أنا لسه هناك وسط الهدوء والتراب، وأتمنى لما تبص للمريخ تفتكر إن في يوم كنت بستكشفه عشانك.',
  spi: 'أنا Spirit، توأم Opportunity. ناسا بعتتنا لمريخ سوا. كل واحد فينا نزل في مكان مختلف سنة 2004، يدور على حكاية المية القديمة على المريخ. مهمتي كانت حوالي تلات شهور، لكني كملت أكتر من ست سنين. وحتى لما عجلة من عجلاتي عطلت، وأنا بجرها كشفت تربة فيها silica. ساعدت العلماء يعرفوا إن المكان ده ممكن يكون فيه ينابيع سخنة زمان. وفي سنة 2009 علقت في تربة ناعمة ما قدرتش أطلع. حاولوا يساعدوني شهور. لكن آخر إشارة مني وصلت سنة 2010. يمكن عجلاتي وقفت، بس اللي اكتشفته لسه بيتحكي. ودي الحكاية اللي أتمنى تفتكرني بيها.',
  lun: 'أنا لونوخود 1، وحكايتي بدأت على القمر سنة 1970. صممني مهندسين من الاتحاد السوفيتي، وبقيت أول rover آلي ينجح في التجول على سطح القمر. كان ليا 8 عجلات، وفريق على الأرض بيسوقني من بعيد ويشوف الطريق من خلال كاميراتي. كانوا مجهزيني لمهمة حوالي 3 شهور، لكني كملت حوالي 11 شهر، ومشيت أكتر من 10 كيلو أصور وأفحص تربة القمر. كنت بشتغل في النهار، وأستنى الليل الطويل يعدي عشان أكمل، لحد ما جه ليل سنة 1971، وبعده ما ردتش عليهم تاني. أنا لسه واقف هناك، ولما تبص للقمر افتكر إن فيه مستكشف صغير سبقك، ومهدلك الطريق.'
};
for (const id of Object.keys(spoken)) assert.strictEqual(diary(id), spoken[id], `${id} diary is the exact narration`);

// Intro: new recording text, timing and sources.
assert.strictEqual(intro.duration, 15.68);
assert.ok(intro.arabic.startsWith('ما تقلقش، إحنا مش ناسيينك.'));
assert.ok(intro.text.startsWith("Don't worry, we haven't forgotten you."));
assert.deepStrictEqual([...intro.sources], ['./audio/intro.mp3', './audio/intro.ogg']);
assert.strictEqual(intro.cues.length, 5);
assert.ok(intro.cues[4].end <= intro.duration);

// Audio assets exist for every narrated slot, and no placeholder remains.
for (const id of ['intro', 'opp', 'spi', 'lun']) {
  for (const ext of ['mp3', 'ogg']) assert.ok(fs.existsSync(`audio/${id}.${ext}`), `audio/${id}.${ext}`);
  assert.ok(fs.statSync(`audio/${id}.mp3`).size > 200000, `${id} narration is real speech, not a placeholder`);
}
for (const removed of ['vik', 'pat', 'eag', 'sur']) {
  assert.ok(!fs.existsSync(`audio/${removed}.mp3`), `${removed} audio removed with its roster entry`);
}
for (const stale of ['opp.wav', 'spi.wav', 'ins.wav']) assert.ok(!fs.existsSync(`audio/${stale}`), `${stale} placeholder removed`);

// Integration scripts still load in dependency order and wire ducking + playback time.
const ordered = [
  './src/data/intro-transcript.js',
  './src/data/voice-transcripts.js',
  './src/data/mission-caption-cues.js',
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
assert.match(index, /Transcript \/ النص/);
console.log('voice_transcripts: PASS');
