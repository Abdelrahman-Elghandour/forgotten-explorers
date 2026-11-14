# Forgotten Explorers · مستكشفون نسيهم الزمن

A bilingual (Arabic / English) interactive space exhibit about the machines we sent away and then stopped listening to — Opportunity and Spirit on Mars, Lunokhod 1 on the Moon — built as a single-page React app with no build step.

Open it, watch the 28-second intro settle on our Solar System, then fly to a planet, pick a craft, and read its story while it is read to you.

---

## What is inside

**Cinematic opening.** A 28-second Full HD film: the rover on Mars, a telemetry warning, a loss of signal and a silent blackout, then the camera pulls back and decelerates into the exact framing of the live Solar System canvas. The last 1.2 seconds cross-dissolve into the interactive canvas, so the planets appear to become clickable rather than cutting to a new screen. There is no Skip button: the opening plays through, and sound is on from the first frame — if the browser refuses audible autoplay, the film starts silently and the first click anywhere restores the audio.

**Live Solar System.** A canvas of the Sun and five orbits with parallax, hover states and drag-to-pan, drawn in the site's `#05070d` palette with a `#ffb347` Sun.

**Planet surfaces.** Layered terrain (sky, far ridge, mid ridge, near ground) with graded regolith, lit crater rims, rock scatter, wind ripples, film grain, drifting dust on Mars and a foreground berm. Opportunity, Spirit, InSight and Lunokhod 1 each have their own illustration, planted on the same terrain curve that draws the ground, so wheels meet soil at any pan position.

**Craft story consoles.** A museum-grade HUD showing mission name and tagline, launch date, last contact, actual versus planned lifespan, distance, key discovery and the first-person diary — all visible at once, with tabs for the blueprint breakdown, the dust and power simulator and the next-frontier lesson.

**Media and narration.** A NASA image carousel with bundled photographs, an illustrated 2D mission guide that talks, English closed captions driven by the measured Arabic narration timing, and a separate transcript panel.

**Everything else.** Bilingual AR/EN toggle, NASA Image Library integration with upload fallbacks, Time Machine, quiz, coming-soon teasers for unvoiced worlds, and a PNG certificate generator.

---

## Running it

The app is plain HTML, CSS and JSX transformed in the browser, so there is nothing to install.

```sh
# recommended: a local server with MP4 range requests
python3 serve.py --port 8000
# then open http://localhost:8000
```

`index.html` also opens directly from disk (`file://`) — the slideshow, guide, captions and audio all work there, because every asset is bundled locally.

`build_static.py` copies the app and its assets into `dist/` for static hosting.

Windows users can double-click `run_website.bat`.

---

## Structure

| Path | Purpose |
| --- | --- |
| `index.html` | The whole application: markup, styles and the React tree |
| `src/components/` | Intro player, media carousel, captions, styles |
| `src/audio/` | Narration clock, ducking and caption lookup |
| `src/data/` | Transcripts, caption cues, sentence timings |
| `videos/` | The intro film |
| `audio/` | Mastered Arabic narration per mission |
| `images/`, `gallery/` | Bundled NASA imagery |
| `subtitles/` | VTT sidecars for the intro |
| `tests/` | Node and Playwright checks (preservation, narration, surface, craft view) |
| `tools/` | Reproducible voice mastering and subtitle generation |

---

## Notes

- The film opens with sound on and full volume. Only when a browser policy blocks audible autoplay does it fall back to a silent start, and the first click or key press anywhere unmutes it and unlocks the Web Audio graph for the narration and ambience.
- `tests/preservation.cjs` pins every original feature and dataset; the browser suites in `tests/` drive the real app.
- NASA imagery and mission facts come from public NASA sources; the Arabic voice-over is original narration written for this project.

---

## License

Code and original artwork: MIT. NASA imagery and mission data remain the property of NASA and are used under its media guidelines. The recorded narration is original work.
