# Forgotten Explorers — cinematic intro integration

Run `python3 serve.py` (or `python serve.py` on Windows), then open `http://localhost:8000/`. The existing `run_website.bat` launcher is retained. No npm install or bundler is needed. Internet access is still required for the pinned React, Babel, Tailwind and Google Fonts CDN imports and for on-demand NASA image search.

## The opening sequence

The film now runs 28.000 seconds, 1920 × 1080 at 24 fps. Its first 13 seconds are the rover mission, telemetry warning and signal-loss blackout. From there the camera pulls back off the surface, past the rover, to a distant Mars — and then **decelerates into a settled frame of our Solar System** rather than continuing out to the galaxy. The closing shot was rendered from the same geometry as the site's `<Space />` canvas: a warm `#ffb347` Sun at the canvas centre, the five elliptical orbits (`0.38` flattening) for Venus, Earth/Moon, Mars, Titan with its ring, and Deep Space, over a `#05070d` backdrop with the canvas's purple and blue corner glows. The camera's scale follows a cubic ease-out and stops, holding still for the final ~1.5 seconds.

`tools/render_solar_ending.py` regenerates that closing shot (`mars_8.2.jpg` is the AI frame it takes over from), and the assembly is a plain ffmpeg concat: 13 s of the original film, 8.4 s of the original pullback, then the rendered ending, cross-faded at the join and muxed with the original 28-second score.

## The handoff

The live canvas renders behind the film from the first frame, frozen at `t = 0` — which is exactly the frame the film ends on — with parallax and labels held back. The overlay begins its dissolve 1.2 seconds before the end of the video (`onTimeUpdate`), and Skip triggers the identical path. The dissolve is an `opacity` transition of 1200 ms on `cubic-bezier(0.22, 1, 0.36, 1)` with a 1.035 scale match and a warm Sun bloom; the overlay stops taking pointer events immediately, the canvas unfreezes and starts orbiting, labels and the title fade in, and the overlay is removed only when the dissolve finishes. Nothing is unmounted early and there is no black frame, hard cut or jump.

Measured in a real browser at 1920 × 1080, the Sun in the film's last frame and the Sun in the frozen canvas sit **4.3 px apart horizontally and 2.8 px vertically**; a 50/50 blend of the two shows single, crisp planets and orbits with no ghosting. On viewports wider than about 3:2 the `object-fit: cover` crop and the canvas's `min(W, 1.5H)` sizing coincide exactly; on narrow portrait screens the film's system is framed somewhat larger than the canvas's, so the dissolve reads as a gentle settle rather than a pixel match.

Web Audio is created and resumed only inside a real gesture — Skip, the audio control, a planet click, or the first pointer/keyboard interaction. Ambience starts at handoff when audio is already unlocked, otherwise on the first interaction afterwards. A browser-imposed muted autoplay never becomes the visitor's mute preference.

## Selected spacecraft view

Choosing a craft on a planet surface opens a full-bleed cinematic stage rather than the old cropped photo with a small card. The hero is the highest-resolution NASA asset available: it starts from the image already on screen, measures its natural width against `innerWidth × devicePixelRatio`, and only then upgrades — `~large` first, `~orig` as the fallback (several NASA assets 403 on `~large`, so the fallback matters). Every candidate the browser cannot load is skipped, and the loaded picture cross-fades in over a blurred, darkened copy of itself, so a slow connection shows a continuous image instead of a blank frame.

The hero is `object-fit: contain` inside an inset frame, so the whole rover or lander is visible and never cropped, with a warm halo, a 22 px rounded plate edge and a 54-second drift (disabled under `prefers-reduced-motion`). Three stacked gradients — bottom, HUD-side and a radial vignette — darken the edges and the panel side while leaving the craft luminous, so the glass HUD stays readable over any photograph.

The HUD shows everything at once, no chips or extra clicks: bilingual mission name (the other language shown beneath), tagline and era, then a five-cell telemetry grid for `تاريخ الإطلاق`, `آخر اتصال`, `العمر مقابل المخطط`, `المسافة` and `أهم اكتشاف`, then the first-person diary, then three action tiles that open the console directly on `التفكيك`, `المحاكي` (only for craft where the simulator applies) and `الحدود التالية`. The NASA credit and the photo-replacement control stay in the footer. Wide screens get a right-hand column; narrow screens get a bottom sheet with the craft selector docked beside it.

## Voice-over slots

`VOICE_TRACKS` in `index.html` maps the narrated mission ids — `opp, spi, lun` plus `intro` — to `./audio/<id>.mp3` then `./audio/<id>.ogg`. Adding another story means dropping a file in place, adding its id to `VOICE_IDS`, and adding its measured cues; the player tries each extension, reports a missing recording with a quiet notice, and needs no other code change. The player shows play/pause, an animated equaliser whose bars only move for the craft actually speaking, a replay control, and the track id. Opportunity, Spirit and Lunokhod 1 all ship a new recording and play immediately.

`INTRO_VOICE` carries the newly supplied Arabic narration, mastered and re-cued. It starts at the first black frame after Signal Lost (11.833333 s), stays locked to the video clock and ducks the existing score instead of replacing it. Timed English subtitles, CC and full Transcript / النص controls are integrated; the full intro transcript remains available afterward. See `NARRATION_HANDOFF.md` for cue tables and `VOICE_MASTERING.md` for the audio chain.

Each of the three recorded missions has a verbatim Arabic `diary`, an English `enDiary` shown in EN mode and opt-in in AR, and measured caption rows in `src/data/mission-caption-cues.js` that follow real playback time. `tools/build_subtitles.py` regenerates the downloadable `.vtt`/`.srt` sidecars from the same data, so they cannot drift.

## Planet rosters and teasers

Mars lists Opportunity, Spirit and InSight; the Moon lists only Lunokhod 1. InSight remains on the surface as a disabled teaser with a glassmorphic `القصة قريباً / Script coming soon` badge and never opens a story. Venus, Titan & outer moons, and Deep Space stay on the orbital map with muted `· قريباً` labels; clicking one opens a `قريباً / Coming soon` card instead of an unvoiced roster. `vik`, `pat`, `eag` and `sur` were removed from the roster along with their placeholder audio, and the Time Machine now lists only the three active missions.

## Which supplied application is used

`MANUS_HANDOFF.md` identifies the complete original `!started` application, supplied as `original_step8.html`, as the authoritative feature-complete source. That version contains the NASA image API and uploads, the panoramic Surface explorer, diary, blueprint, dust simulator, lessons, time machine, last-message dramatization and PNG certificate. It is the main `index.html`, with only the intro, canvas freeze and audio-unlock wiring changed.

The package's previous `index.html` was a different, simplified immersive Moon/Mars variant without several of those systems. It is retained as `immersive_explorer.html`. The unmodified `original_step8.html`, `MANUS_HANDOFF.md`, the extended NSSDCA data file, and all supplied images, audio and public mirrors are kept.

Babel Standalone is pinned to 7.26.4 in both HTML entry points. The unpinned CDN now serves Babel 8, whose `react` preset emits `import … from "react/jsx-runtime"` and breaks this UMD build; the pin is what makes the supplied app load at all.

## Multi-media stage and the 3D companion

The selected craft no longer opens on one still photograph. `src/components/craft-media.jsx`
builds a slideshow of real NASA media for that craft: six photographs and up to three mission
videos, searched through `images-api.nasa.gov` with one request per `media_type` (the API accepts
a single type at a time). NASA only guarantees `~orig` and `~thumb` for every item, so the sharp
frame is `~orig` with `~large` and `~thumb` fallbacks, and a blurred thumbnail is painted beneath
it while the full file downloads. Video files are derived from each item's own asset path
(`~small.mp4`, `~mobile.mp4`, `~preview.mp4`, `~orig.mp4`, tried in order) because the asset
manifest is not readable cross-origin.

The slideshow advances every seven seconds, pauses permanently the moment a visitor picks a
slide or plays a video, and can be restarted with the ▶ toggle beside the filmstrip. The strip
itself scrolls to the active thumbnail, and each video slide carries a ▶ badge. On a slide change
the HUD's credit line follows the new NASA title and id.

`src/components/robot-companion.jsx` adds a small Three.js scene in the corner of the media area:
Opportunity and Spirit are built as six-wheeled MER rovers (solar decks, mast camera, high-gain
antenna), Lunokhod 1 as an eight-wheeled tub with its hinged lid. The model can be dragged to
inspect it, and while the narration plays its optics and mast follow the recording's own loudness
envelope (`src/data/voice-envelopes.js`) rather than a decorative loop. Beside it, a glass bubble
shows the English transcript sentence by sentence, highlighting the sentence whose measured
window contains the current playback time (`src/data/mission-sentences.js`).

Both data files are generated from the recordings and the existing cue tables:

```bash
python3 tools/build_companion_data.py
```

### Bundled so it always appears
The stage no longer depends on the network being open. `tools/fetch_craft_gallery.py` downloads
four real NASA photographs per craft into `images/craft/` and writes `src/data/craft-gallery.js`,
so the slideshow and filmstrip are present even when `images-api.nasa.gov` is unreachable; live
results and mission footage are appended when it is. Three.js is vendored at
`src/vendor/three.module.min.js` instead of being imported from a CDN, so the companion renders on
networks or embeddings that block third-party hosts. To refresh the bundled set:

```bash
python3 tools/fetch_craft_gallery.py
```

## Files

* `src/components/craft-media.jsx` — NASA photo/video slideshow, filmstrip, credits, autoplay.
* `src/components/robot-companion.jsx` — Three.js craft model, drag rotation, live transcript bubble.
* `src/data/mission-sentences.js`, `src/data/voice-envelopes.js` — generated companion data.
* `tools/build_companion_data.py` — regenerates both from the narration.
* `tests/browser_companion.py`, `tests/jsx_check.cjs` — browser and syntax checks for the above.

`src/components/CinematicIntro.js` and `cinematic-intro.css` own the opening layer. `index.html` wires the freeze, the handoff and the gesture-gated audio. `serve.py` keeps the local launcher with a configurable port and MP4 byte-range support. `build_static.py` writes `dist/` for static hosting.

`tests/preservation.cjs` parses the full JSX and compares every original declaration against `original_step8.html` (additions are allowed; `Surface`, `Space`, the roster, the voice map and the controller are the only rewrites), then checks the craft view, its telemetry, the three console triggers, the mask, the drift, the new roster counts, the teaser states and the measured cue rows. `tests/browser_craft.py` drives a real browser through planet → craft → HUD → console tab in Arabic, English and a 390 px mobile viewport. `tests/intro_runtime.cjs` drives the player against a mock React/browser runtime: autoplay fallback, policy-versus-explicit mute, first interaction, late-promise races, the 1.2-second pre-end dissolve, Skip, and listener/timer cleanup. `tests/browser_seam.py` is the real-browser check described above and writes its captures to `tests/captures/`.

The MP4 is an AI-generated fictional scientific visualization, not actual NASA mission footage. No public deployment is performed by this package.
