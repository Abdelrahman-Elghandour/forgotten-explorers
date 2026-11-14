# Arabic narration and English transcript handoff

## What changed in this release

Four new Arabic recordings replaced the previous audio: a new intro voice-over, plus stories for Spirit (`spi`), Opportunity (`opp`) and Lunokhod 1 (`lun`). The 28-second intro MP4 is byte-for-byte unchanged, so its Solar System ending, 1.2-second cross-dissolve, canvas geometry, craft hero framing and surface navigation are exactly as delivered before.

The supplied files are audio-only AAC despite the `.m4a.mp4` suffix. Unchanged copies are archived under `work/voice-mastering/originals/`; browser editions are `audio/intro.mp3`/`.ogg`, `audio/opp.*`, `audio/spi.*` and `audio/lun.*`. The removed placeholders (`vik`, `ins`, `pat`, `eag`, `sur` and every stale `.wav`) are gone, so no silent 10-second file can play by mistake.

## Intro

The narration starts at video time **11.833333333333334 s**, the first fully black frame after Signal Lost. The new recording is 15.55 s long, so it ends inside the zoom-out at about 27.4 s, just before the film's final frame and the cross-dissolve. `src/audio/intro-narration.js` follows the video clock; unmuting mid-film seeks the narration to `video.currentTime - offset` without moving the video.

While the narrator speaks, the video score eases to 22% and synthesized ambience/SFX ramp to 24% through the shared owner-aware gain bus, then recover. The soundtrack is ducked, never replaced.

English phrase subtitles sit at bottom center with a restrained blurred backdrop, and CC plus **Transcript / النص** expose the full text during and after the film. Cue times come from word-level timestamps of the actual recording, stored in `src/data/intro-transcript.js`:

| Audio time | English subtitle |
| --- | --- |
| 0.50 – 2.85 | Don't worry, we haven't forgotten you. |
| 3.40 – 6.85 | Through your eyes, we saw worlds we never dreamed we'd reach. |
| 7.40 – 9.95 | And you left a mark that time will never erase. |
| 10.40 – 11.85 | Maybe your time in space is over, |
| 12.30 – 15.05 | but we're here to bring your story back into the light. |

## Spacecraft stories

Each new recording maps to its mission ID and drives three things: the Arabic `diary` (verbatim narration), the English `enDiary` transcript, and live English captions timed against real playback. `src/data/mission-caption-cues.js` holds the measured cue rows (14 for Opportunity, 16 for Spirit, 14 for Lunokhod 1); `tests/voice_transcripts.cjs` asserts that each `enDiary` equals the concatenation of its cue text, so transcript and captions cannot drift apart.

| Mission | Recording | Arabic script | English captions |
| --- | --- | --- | --- |
| `opp` Opportunity | 42.7 s | new, verbatim | 14 measured cues |
| `spi` Spirit | 39.9 s | new, verbatim | 16 measured cues |
| `lun` Lunokhod 1 | 43.0 s | new, verbatim | 14 measured cues |

Play/pause pauses and resumes the same audio element, Replay restarts it, and captions follow `timeupdate` rather than a wall clock. In Arabic mode the English transcript stays opt-in; English mode shows the English story directly.

### Two transcription normalisations

Both speech-to-text passes (and an independent Whisper pass) returned a non-word in two places, so those two words were written in their evident intended form while everything else stays verbatim: Opportunity's `حاجة بتحجب الشمس` ("something blocking the Sun") and Spirit's `يمكن عجلاتي وقفت` ("maybe my wheels stopped"). No other wording, pause or emphasis was altered.

## Roster and teaser states

Mars lists Opportunity, Spirit and InSight; the Moon lists only Lunokhod 1. InSight keeps its place on the surface as a disabled teaser with a glassmorphic **القصة قريباً / Script coming soon** badge and cannot open a story. Venus, Titan & outer moons, and Deep Space remain on the orbital map with muted `· قريباً` labels, and clicking one opens a **قريباً / Coming soon** card instead of an unvoiced roster. The Time Machine lists only the three active missions.

## Running and verification

Run `python3 serve.py` and open `http://localhost:8000/`; Preview uses port 3000. The CDN-based app still needs internet access for React, Babel, Tailwind and NASA image requests. `python3 build_static.py` copies audio, sources, imagery, the unchanged video and subtitle sidecars into `dist/`.

`node tests/preservation.cjs`, `node tests/voice_transcripts.cjs`, `node tests/intro_runtime.cjs` and `node tests/intro_narration.cjs` cover preserved scientific modules, exact scripts and cues, playback policy, timing, ducking and cleanup. `python3 tests/voice_mastering.py` verifies loudness, headroom and phrase alignment. Browser checks are `tests/browser_narration.py`, `tests/browser_transcripts.py`, `tests/browser_craft.py` and `tests/browser_seam.py`.
