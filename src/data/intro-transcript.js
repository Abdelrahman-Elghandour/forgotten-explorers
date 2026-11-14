/* New intro narration (15.68 s). Cue times are audio-relative and come from
 * word-level timestamps of the supplied recording; the film starts the audio at
 * the first black frame after Signal Lost (video 11.833333 s). */
window.INTRO_NARRATION = {
  offset: 11.833333333333334,
  duration: 15.68,
  sources: ['./audio/intro.mp3', './audio/intro.ogg'],
  arabic: 'ما تقلقش، إحنا مش ناسيينك. شفنا بعيونك عوالم عمرنا ما كنا نحلم نوصل لها، وسبت أثر الزمن عمره ما هيمحيه. يمكن دورك خلص في الفضاء، بس إحنا هنا عشان نرجع حكايتك للنور.',
  text: "Don't worry, we haven't forgotten you. Through your eyes, we saw worlds we never dreamed we'd reach, and you left a mark that time will never erase. Maybe your time in space is over, but we're here to bring your story back into the light.",
  cues: [
    { start: 0.50, end: 2.85, text: "Don't worry, we haven't forgotten you.", ar: 'ما تقلقش، إحنا مش ناسيينك.' },
    { start: 3.40, end: 6.85, text: "Through your eyes, we saw worlds we never dreamed we'd reach.", ar: 'شفنا بعيونك عوالم عمرنا ما كنا نحلم نوصل لها،' },
    { start: 7.40, end: 9.95, text: 'And you left a mark that time will never erase.', ar: 'وسبت أثر الزمن عمره ما هيمحيه.' },
    { start: 10.40, end: 11.85, text: 'Maybe your time in space is over,', ar: 'يمكن دورك خلص في الفضاء،' },
    { start: 12.30, end: 15.05, text: "but we're here to bring your story back into the light.", ar: 'بس إحنا هنا عشان نرجع حكايتك للنور.' }
  ]
};
