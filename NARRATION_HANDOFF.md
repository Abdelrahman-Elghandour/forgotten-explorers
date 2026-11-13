# Arabic narration and English transcript handoff

## What changed

The original 28-second intro MP4 is byte-for-byte unchanged. Its existing Solar System ending, 1.2-second cross-dissolve, canvas geometry, craft hero framing and surface navigation are retained. The update adds a separate narration track, caption/transcript controls and bilingual story text; it does not re-encode or regenerate any video.

The supplied `First10thOfRamadan12.m4a.mp4` is actually audio-only AAC. An unchanged copy is retained as `audio/intro-original.m4a`; browser-compatible derivatives are `audio/intro.mp3` and `audio/intro.ogg`. The track begins at video time **11.833333333333334 seconds**, the first fully black frame after Signal Lost. Its first spoken phrase starts at narration time 0.54 seconds, so the first English subtitle appears at video time 12.373 seconds.

`src/audio/intro-narration.js` follows the video clock, using presented-frame callbacks where supported and a short fallback clock otherwise. Unmuting during the film seeks the narration to `video.currentTime - offset` without changing the video's position. Video pause, seek, mute, rate changes, Skip, narration end and component teardown are handled. While the narrator speaks, the existing video score eases down to 22%; synthesized ambience and SFX ramp to 24% through an owner-aware shared gain bus and recover afterward. The soundtrack is ducked, not replaced.

## English intro transcript

Don't worry, we haven't forgotten you. Through your eyes, we saw worlds we never dreamed we'd reach, and you left a mark that time will never erase. Maybe your time in space is over, but we're here to bring your story back into the light.

The five English phrase cues are based on actual Arabic word timestamps, not estimated reading speed. `src/data/intro-transcript.js` contains audio-relative cues and the source Arabic. `subtitles/intro.en.vtt` and `intro.en.srt` contain video-relative cue times. `subtitles/intro-transcript.md` retains the bilingual text, timing table and transcription notes. English cinema captions are on by default during the intro; CC toggles them. Transcript / النص opens the full text during the intro and remains accessible from the main header afterward.

## Spacecraft transcripts

Every mission in `M` now has an `enDiary` field populated from `src/data/voice-transcripts.js`. All twelve passages are exactly the user's supplied English text, including punctuation and the Voyager date sentence; they are quoted narration transcripts, not newly verified scientific assertions. The original Arabic diaries, mission statistics, scientific sources and lessons are not edited.

EN mode uses `enDiary` in both the selected-craft HUD and the legacy diary console. AR mode keeps the Arabic diary and exposes the English transcript when the viewer enables the EN captions/transcript control. English captions default on when entering EN and off when entering AR. Play/pause truly pauses and resumes the same audio element; Replay restarts it. Actual audio playback time drives measured cue lookup.

### Important recording limitation

Seven supplied mission paths (`opp`, `spi`, `vik`, `ins`, `pat`, `eag`, `sur`) contain **the same 10-second RIFF/WAVE PCM file mislabeled `.mp3`**, not distinct Arabic stories. The speech-to-text result for that common file contains no speech. The `lun`, `ven`, `huy`, `voy` and `kep` recordings are absent. Existing files are preserved unchanged, with correctly named `.wav` copies added as decoder fallbacks. No mission narration is generated or invented.

Consequently, all twelve full English transcripts are available now, but **verified mission-specific phrase synchronization cannot be completed from the supplied media**. The on-playback fallback is explicitly labeled “English transcript · awaiting matched narration timing,” not presented as timed subtitles. There is no proportional sentence-timing guess.

To complete synchronization, place each real Arabic recording in `audio/<id>.mp3` or `.ogg`, then add its measured audio-relative cue array to `src/data/mission-caption-cues.js`. The player already consumes these arrays through `SpaceNarration.cueAt`; no UI-code change is needed. Keep cue text aligned with the actual recording and preserve the supplied complete `enDiary` text separately.

## Running and verification

Run `python3 serve.py` and open `http://localhost:8000/`. The Preview service uses port 3000. The CDN-based app still needs internet access for React, Babel, Tailwind and NASA image requests. `python3 build_static.py` includes audio, sources, imagery, unchanged video and subtitle sidecars in `dist/`.

`node tests/preservation.cjs`, `node tests/voice_transcripts.cjs`, `node tests/intro_runtime.cjs` and `node tests/intro_narration.cjs` cover preserved scientific modules, exact user transcripts, playback policy, timing, ducking and cleanup. Browser checks are `tests/browser_narration.py`, `tests/browser_transcripts.py` and the existing `tests/browser_seam.py`. The source tree includes a pre-change HTML fixture for comparison. No public publication is requested or performed.
