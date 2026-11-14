# Integration validation

## Video

The rebuilt intro is 28.000 s, 672 frames, 1920 × 1080 at 24 fps, H.264 with the original AAC score. It keeps the original 0–13 s rover and blackout section, continues through the AI pullback to a distant Mars, and then decelerates into the rendered Solar System, holding still for the final ~1.5 s. Contact sheets confirm the zoom-out settles at planetary scale with no galaxy section; frames at 26–27.5 s are essentially identical.

## Seam

`tests/browser_seam.py` runs Chromium against the local server at 1920 × 1080. It freezes the film on its final frame, reveals the canvas behind it, and compares the two: Sun centres are 4.3 px apart horizontally and 2.8 px vertically, and the 50/50 blend in `tests/captures/blend_50.png` shows single planets and orbits with no double image. The same run drives the natural pre-end dissolve and the Skip path; both remove the overlay, activate the Solar System and show the title, with no page errors. It still passes unchanged after this revision.

## Behaviour

`node tests/intro_runtime.cjs` passes autoplay fallback, policy-versus-explicit mute, first background interaction, late-promise race protection, the 1.2-second pre-end trigger, the shared Skip/ended completion guard, 1200 ms timing, soundtrack fade-out, and listener/timer cleanup.

`node tests/preservation.cjs` passes full JSX parsing and semantic equality of every original dataset, dictionary and feature component except the intentionally changed controller, canvas and mission roster; the canvas keeps its exact orbit constants, colours and sun gradient, changing only by the per-body label-colour hook. Mission-console, blueprint, simulator, lessons, last-message, time-machine, quiz and certificate markup compares unchanged.

## Selected craft view

`tests/browser_craft.py` reaches a planet, opens Opportunity and confirms five telemetry rows (`تاريخ الإطلاق`, `آخر اتصال`, `العمر مقابل المخطط`, `المسافة`, `أهم اكتشاف`) with their values, the diary, three actions including `المحاكي`, the narration player, and a console that opens on `التفكيك`. It repeats the pass in English and at 390 × 844. The hero upgraded from a 640 px source to `PIA20285~orig.jpg` at 1024 px, proving the `~large` → `~orig` fallback works where NASA blocks the large size. No page errors were raised in any pass.

## New voice-overs, captions and rosters

All four new recordings were mastered and measured: −15.8 to −16.1 LUFS, true peaks −1.5 to −2.8 dBTP, per-channel sample peaks ≤ 0.84, and phrase alignment within 0.06 ms after latency compensation. `python3 tests/voice_mastering.py` re-checks all of it and confirms the delivered MP3/OGG lengths match their masters.

`node tests/voice_transcripts.cjs` asserts that the Arabic `diary` of Opportunity, Spirit and Lunokhod 1 is the exact spoken narration, that each English `enDiary` equals the concatenation of its measured caption rows, that the intro text and 15.68 s length match the new recording, that all four audio pairs exist and are real speech, and that the removed placeholder files are gone.

`tests/browser_transcripts.py` runs Chromium against the real app and confirms: Mars lists exactly three crafts with one `القصة قريباً` badge; clicking InSight opens no HUD and instead shows the coming-soon card; Opportunity's HUD shows five facts and the Arabic script; the opt-in English transcript appears; the live caption at a sampled playback time equals the cue covering that time (no "awaiting" fallback); pause holds position and resume continues; mute propagates; English mode shows the English story; and the Moon lists only Lunokhod 1 with its own narration. `tests/captures/mars_roster.png` and `coming_soon.png` record the two new states.

`node tests/intro_narration.cjs` and `tests/browser_narration.py` still pass: narration begins at video 11.85 s, score ducking engages, mid-film unmute does not restart the video, Skip cleans up, and the transcript stays reachable after the film.

## Media stage, 3D companion and the re-supplied recordings
`python3 tools/master_voice.py spi lun` rebuilt Spirit and Lunokhod 1 from the noise-reduced
re-recordings; both are the same performances (cross-correlation lag 2.2 ms, no drift across the
clip), so every measured cue window stayed valid. `tests/voice_mastering.py` confirms -16 LUFS,
≤ -1.5 dBTP and phrase alignment within 20 ms for all four tracks.
`tests/browser_companion.py` drives Chromium and confirms: eight slides with a photo/video mix,
arrow navigation changing the image, manual navigation pausing the slideshow, a video slide
resolving a real `~mobile.mp4` and playing, a WebGL robot that visibly rotates on drag, the bubble
speaking only recorded sentences and advancing between them, a distinct Lunokhod 1 model, the
mobile layout staying inside the media area, and no page errors. `tests/preservation.cjs` still
pins every original module and the whole surface/canvas code, and now also checks the carousel
and companion contracts. `tests/browser_craft.py`, `browser_seam.py`, `browser_narration.py` and
`browser_transcripts.py` continue to pass.

## Rover views must never fail closed
A missing `ResizeObserver` (older or embedded browsers) previously threw inside the 3D companion's
effect, which unmounted the whole React tree: every rover then appeared "not opening". The scene
is now optional by construction — its setup is wrapped in `try/catch`, `ResizeObserver` falls back
to a window resize listener, and a failed scene renders a static placeholder. `CraftMedia` and
`RobotCompanion` each sit inside a `SlotBoundary` whose fallback is the craft's still photograph,
the globals are checked before use, and the app root has a last-resort recovery card instead of a
blank page.
The stage and companion were also checked with every external host blocked
(`tests/browser_resilience.py`): four bundled photographs, a NASA credit line and a live WebGL
companion remain, because the photos ship with the project and Three.js is vendored locally.
`tests/browser_resilience.py` reproduces each case and passes: no `ResizeObserver`, the Three.js
CDN blocked, the NASA image API offline, and the media component file failing to load — the HUD,
the facts and a photograph are present every time, with no page errors.

## Known limits

A browser autoplay policy can still start the film muted; the audio control and any first interaction unmute it. On narrow portrait viewports the film's final framing is larger than the canvas's compact system, so the dissolve reads as a settle rather than an exact pixel match. Hero imagery is whatever NASA asset the app's own query or pinned id resolves to, so an occasional photograph is a detail shot rather than a full-portrait of the craft; the framing never crops it further.

Two words were normalised from the recordings because both speech-to-text passes returned a non-word in those positions: `حاجة بتحجب الشمس` (Opportunity) and `يمكن عجلاتي وقفت` (Spirit). Everything else in the Arabic scripts is verbatim.

The earlier placeholder-audio limitation is resolved: real recordings now exist for the intro, Opportunity, Spirit and Lunokhod 1, and the unvoiced missions were removed from the rosters rather than left playable.

## Local-file parity and captions
The stage used to be a separate `text/babel src=…` file, which Babel cannot fetch when `index.html`
is opened from disk, so a local run showed neither the slideshow nor the companion while Preview
did. The component is now part of `index.html`; a `file://` load reaches Opportunity with six
slides, the HUD and a live caption line, with no page errors. The 3D companion is gone: its Three.js
module also could not load over `file://`, and the translation is better served by captions. The
craft captions reuse the intro's measured cue data, so each line appears and clears with the Arabic
audio, stays dimmed when paused, and clears on switching craft.

## Reliable 2D guide — current version

The old WebGL companion is superseded by an original illustrated 2D guide in the same inline app. `images/mission-guide.webp` is bundled, and a self-contained SVG fallback remains visible if it cannot load. No Three.js, external Babel component request, WebGL context or ResizeObserver is required.

`tests/browser_2d_guide.py` opens the complete app through `file://`, with NASA media endpoints and the former CDN blocked. Opportunity, Spirit and Lunokhod 1 each retain four bundled slideshow photographs and a working guide. The actual narration play/pause/resume/replay controls, independent CC toggle, hide/reopen state, failed-illustration fallback and reduced motion all pass. Companion and caption rectangles do not intersect at 390×844 or 390×667. The independent review's confirmed short-phone overlap was corrected with a compact side-by-side layout.

`tests/browser_guide_lifecycle.py` observes real HTMLAudioElement instances rather than mocking playback. An Unmute-and-listen click preserves the already-playing recording; silent measured cue gaps actually hide the subtitle; completion clears it; and replay leaves exactly one active recording. `tests/browser_companion.py` still passes the NASA slideshow, arrows, manual pause, playable video, and advancing/paused English captions.

`tests/guide_preservation.cjs` pins the previous inline slideshow source and current feature helper functions exactly. `tests/preservation.cjs`, intro runtime, intro narration and transcript tests also pass. SHA-256 checks confirm the intro film, all four narration tracks and the Arabic/English transcript and mission cue data are byte-identical to the pre-guide version. Static build and HTTP health checks include the new local illustration and the route manifest.

## Planet surface scene (layered terrain + grounded craft)

The previous surface was one flat gradient plus two blurred wave paths, with every mission sharing a single 280 x 170 rover glyph placed by a `bottom: 58 - (i % 3) * 8` offset — so craft floated above or sank into the terrain and the horizon read as fog.

It is now four parallax layers drawn in square units (`viewBox 0 0 <w> 100`), which is what makes the ridge slopes steep and the craters circular instead of 2.5x stretched. `sGroundY()` is the single source of truth: the terrain path samples it across the full 250-unit near layer, and each craft's `bottom` is derived from the same function, so wheels meet soil at every pan position.

`tests/browser_surface_scene.py` checks this in a real browser: it asserts four layers, a sky, a grain overlay and 30 dust motes on Mars; that all three Mars craft and the lunar rover render their own illustration; that `path.isPointInFill()` contains the point 3 px below each craft's feet and excludes a point 46 px above them; that hover lifts the tag and brings the glow to 0.85 and the sonar to 0.75; that the four layers pan by different amounts without changing the focus scale; that the story view still opens from the new sprite; that the three craft stay at least 40 px apart at 390 x 844; and that reduced motion sets every ambient animation to `none`. It passes with no page errors, as do `preservation.cjs`, `guide_preservation.cjs`, `voice_transcripts.cjs`, `intro_runtime.cjs`, `browser_craft.py`, `browser_2d_guide.py` and `browser_companion.py`.

Screenshots: `tests/captures/surface_final_mars.png`, `surface_final_moon.png`, `surface_scene_mobile.png`, `surface_mars_hover.png`.

## Opening without a Skip control, sound on by default

The Skip button is gone from the intro HUD; only Transcript, CC, the audio toggle and the language switch remain. The film now calls `startPlayback(true)` on mount with `muted = false`, `defaultMuted = false` and `volume = 1`, so an audible start is attempted first. A browser refusal still falls back to a silent start rather than a stalled overlay, and the first pointer or key press anywhere unmutes it and unlocks Web Audio. Because there is no Skip, a film that cannot load at all exposes a `متابعة / Continue` action in the error state, so the app can never be trapped behind the overlay.

Verified in Chromium with `--autoplay-policy=no-user-gesture-required`: `muted:false, volume:1, paused:false, currentTime:2, skip buttons:0`. With the default policy: `muted:true, paused:false` (film still plays), and after one click at the centre of the page `muted:false`. `tests/intro_runtime.cjs` asserts the film mounts unmuted at volume 1, that no `intro-skip` control exists, and that a double `ended` still completes exactly once. All browser suites were updated to reach the app by seeking to the final 1.4 seconds instead of clicking Skip, and `browser_seam.py`, `browser_craft.py`, `browser_surface_scene.py`, `browser_2d_guide.py`, `preservation.cjs`, `guide_preservation.cjs`, `voice_transcripts.cjs`, `intro_narration.cjs` and `intro_runtime.cjs` pass.

Screenshots: `tests/captures/intro_sound_on_desktop.png`, `intro_sound_on_mobile.png`.

## Sound always enabled — automatic recovery, no mute toggles

The active app no longer has master mute state, an intro audio toggle, or a native slideshow-video volume/mute UI. The film stays unmuted even when audible autoplay is denied. A genuine mouse/touch/key interaction automatically retries playback and unlocks Web Audio/narration; no mute/unmute action is needed. The guarded retry avoids duplicate playback attempts from one pointer gesture. Ordinary focus/pageshow/visibility restoration retries the existing ambient track, including the autoplay-only case, without restarting a deliberately paused mission story.

Background music no longer stops when leaving the Solar System: the same unmuted track persists on surfaces, selected craft and feature dialogs, with the existing narration ducking and loop. The gallery retains play/pause/replay, seeking and fullscreen through compact custom controls; standard fullscreen targets the frame so its controls remain available.

The independent review identified two concrete recovery issues—autoplay-only ambient on tab return and duplicate intro gesture attempts—and both were corrected. `browser_narration.py` passes audible autoplay and explicitly blocked autoplay profiles, including first-Enter-key recovery without a toggle, original black-frame offset, English captions, decode-ready seeking, ducking and the unchanged cinematic handoff. Narration now pauses through video buffering/seeking and automatically resynchronizes on ready playback, rather than running ahead. `browser_guide_lifecycle.py` passes real pause/resume with no recording restart, silent cue gaps, completion cleanup and one active mission recording on replay.

Node intro runtime, intro narration, transcript and full feature preservation checks pass. The current pre-change fixture pins all unchanged feature helper functions and the gallery's NASA loading, image fallback, image rendering, navigation and filmstrip code. No recordings, video footage, mission data or caption cues were changed. A complete static build passes. Browser/site/OS autoplay or output-mute restrictions remain outside the application's control; the website does not claim to bypass them.

`tests/browser_always_audio.py` also passes the full `file://` app workflow with real HTML media: one persistent unmuted ambient track on Solar System, surface and story; autoplay-only focus recovery; deliberate story pause retained; gallery-video play/pause, real keyboard seeking and replay; and no mute controls. Its MP4 fixture correctly returns HTTP206 byte ranges so seeking is verified against actual playable data rather than an invalid mock response.

## Direct launch and startup speed

The exhibit no longer waits behind the film. `started` is `true` and `view` is `solar` on the first render, so the canvas, header and title are live immediately; `introVisible` starts `false` and the 28-second film opens from the header button (`aria-label="Play the opening film"`). Opening it still marks the app inert behind the overlay and still ends with the unchanged 1.2-second cross-dissolve into the canvas; a Close control at the top-left guarantees a way back, since the film is now optional rather than mandatory.

Startup work that made the difference:

| Change | Before | After |
| --- | --- | --- |
| React + ReactDOM | unpkg CDN | `vendor/react.min.js`, `vendor/react-dom.min.js` |
| Tailwind | `cdn.tailwindcss.com` (runtime JIT, ~400 KB) | `vendor/tailwind.css`, precompiled, 15 KB |
| JSX | Babel Standalone (3 MB) parsing 2 700 lines in the browser | `app.js`, precompiled by `tools/compile_app.py` |
| First contentful paint (local) | 6.0–15.3 s | 0.11–0.22 s |

`index.html` keeps the readable JSX as the canonical source; the block is inert in the browser and `app.js` is generated from it. `python3 tools/compile_app.py` rebuilds it, `--check` fails if it is stale, and `build_static.py` recompiles before copying, so `dist/` can never ship a stale bundle. Babel is a build-time tool and is stripped from `dist/vendor`.

`tests/browser_direct_launch.py` measures first contentful paint and asserts there is no overlay, a title and a canvas, with and without the NASA endpoints reachable. `tests/browser_launch_audio.py` asserts the soundtrack is requested at load, plays unmuted at non-zero volume, and recovers on one ordinary click under `--autoplay-policy=document-user-activation-required`. `tests/visual_parity.py` screenshots the Solar System, the quiz and the sources dialogs in both builds: the dialogs differ by about 1% of pixels (canvas animation behind the glass), confirming the precompiled stylesheet matches the CDN output.

Test suites that used to dismiss the intro were updated for the new flow: the app suites now wait for the canvas instead of the overlay, and the suites that actually exercise the film (`browser_seam.py`, `browser_narration.py`, `browser_always_audio.py`) open it from the header first. `browser_craft.py`'s canvas hit helper now collects arcs over a short window, because the Solar System paints its bodies into a cached layer and only the pulsing Sun redraws each frame. Two long-standing test-side issues were also fixed: the pan check compared a scale that was still easing (now compared within 0.01), and the transcript suite clicked the first `.voice-transcript-toggle`, which is the CC control, instead of the English transcript button.

Passing after the change: `preservation.cjs`, `guide_preservation.cjs`, `intro_runtime.cjs`, `intro_narration.cjs`, `voice_transcripts.cjs`, `browser_direct_launch.py`, `browser_launch_audio.py`, `browser_craft.py`, `browser_surface_scene.py`, `browser_2d_guide.py`, `browser_guide_lifecycle.py`, `browser_transcripts.py`, `browser_resilience.py`, `browser_companion.py`, `browser_seam.py` (Sun offset 4.3 px / 2.3 px), `browser_narration.py`, `browser_always_audio.py`, and a clean `build_static.py` run.

Known limit unchanged: a browser that refuses audible autoplay still needs one interaction before sound starts. Nothing in the app can override that, and it no longer hides behind a mute toggle — the soundtrack simply begins on the first click or key.
