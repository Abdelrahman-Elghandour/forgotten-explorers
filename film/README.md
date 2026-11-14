# Submission film — 30 seconds

`Forgotten_Explorers_30s.mp4` — 1920×1080, 30 fps, 30.000 s, H.264 + AAC.
Music only, mixed at −20.5 LUFS with a −7.5 dBTP ceiling so a human voice-over sits comfortably on top. No narration, no captions burned from audio, no spoken words anywhere in the file.

## Structure

| Time | Beat | Visual | On-screen claim |
| --- | --- | --- | --- |
| 0.0–4.6 | Opening | Intro film: the rover on Mars | Title, Arabic name, NASA Space Apps 2026 |
| 4.6–8.8 | The problem | Live Mars surface with all three craft | Three machines. Twenty years of silence. |
| 8.8–12.4 | 01 · Impact | Live Solar System canvas | A free, bilingual exhibit for classrooms and museums |
| 12.4–16.0 | 02 · Creativity | Craft console: photo, telemetry, diary, guide | Meet the craft: its mission, its diary, its voice |
| 16.0–18.2 | 03 · Validity | Blueprint breakdown tab | A working prototype, not a mockup |
| 18.2–20.4 | 03 · Validity | Dust and power simulator | Every claim comes from the mission record |
| 20.4–24.0 | 04 · Relevance | English interface, live English diary | NASA's open image library, reused as the backbone |
| 24.0–28.4 | 05 · Storytelling | Film pullback: Mars to the Solar System | Every mission deserves to be heard |
| 28.4–30.0 | End card | Title, Arabic name, repository URL | — |

Every frame of interface footage is a real recording of the running application, captured with Playwright at 1920×1080 — no mockups. The film opens and closes on the same 28-second intro the site ships with, which is why the hand-off between film and interface reads as one continuous shot.

## Rebuilding

```sh
python3 film/record.py     # capture the app scenes (needs serve.py on :3000)
python3 film/cards.py      # render the typographic cards
python3 film/assemble.py   # cut, caption, crossfade, mix
```

`record.py` writes `film/raw/*.webm`; `cards.py` writes `film/cards/*.png`; `assemble.py` writes `film/seg/*.mp4`, then `picture.mp4`, `bed.wav`, the final MP4 and the music bed.

## Audio

`Forgotten_Explorers_music_bed.mp3` is the same 30-second bed as a standalone file, for anyone who prefers to build their own mix. It is instrumental only: sustained analog pads, felt piano, sub-bass, tape texture, no percussion.

If you record a voice-over, speak over the bed at roughly −16 LUFS; the music sits about 6 dB below that and leaves the mid-range clear.
