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
`tests/browser_resilience.py` reproduces each case and passes: no `ResizeObserver`, the Three.js
CDN blocked, the NASA image API offline, and the media component file failing to load — the HUD,
the facts and a photograph are present every time, with no page errors.

## Known limits

A browser autoplay policy can still start the film muted; the audio control and any first interaction unmute it. On narrow portrait viewports the film's final framing is larger than the canvas's compact system, so the dissolve reads as a settle rather than an exact pixel match. Hero imagery is whatever NASA asset the app's own query or pinned id resolves to, so an occasional photograph is a detail shot rather than a full-portrait of the craft; the framing never crops it further.

Two words were normalised from the recordings because both speech-to-text passes returned a non-word in those positions: `حاجة بتحجب الشمس` (Opportunity) and `يمكن عجلاتي وقفت` (Spirit). Everything else in the Arabic scripts is verbatim.

The earlier placeholder-audio limitation is resolved: real recordings now exist for the intro, Opportunity, Spirit and Lunokhod 1, and the unvoiced missions were removed from the rosters rather than left playable.
