# Integration validation

## Video

The rebuilt intro is 28.000 s, 672 frames, 1920 × 1080 at 24 fps, H.264 with the original AAC score. It keeps the original 0–13 s rover and blackout section, continues through the AI pullback to a distant Mars, and then decelerates into the rendered Solar System, holding still for the final ~1.5 s. Contact sheets confirm the zoom-out settles at planetary scale with no galaxy section; frames at 26–27.5 s are essentially identical.

## Seam

`tests/browser_seam.py` runs Chromium against the local server at 1920 × 1080. It freezes the film on its final frame, reveals the canvas behind it, and compares the two: Sun centres are 4.3 px apart horizontally and 2.8 px vertically, and the 50/50 blend in `tests/captures/blend_50.png` shows single planets and orbits with no double image. The same run drives the natural pre-end dissolve and the Skip path; both remove the overlay, activate the Solar System and show the title, with no page errors.

## Behaviour

`node tests/intro_runtime.cjs` passes autoplay fallback, policy-versus-explicit mute, first background interaction, late-promise race protection, the 1.2-second pre-end trigger, the shared Skip/ended completion guard, 1200 ms timing, soundtrack fade-out, and listener/timer cleanup.

`node tests/preservation.cjs` passes full JSX parsing and semantic equality of every original dataset, dictionary and feature component except the intentionally changed controller and canvas; the canvas keeps its exact orbit constants, colours and sun gradient. Mission-console, blueprint, simulator, lessons, last-message, time-machine, quiz and certificate markup compares unchanged.

## Selected craft view

`tests/browser_craft.py` reaches a planet, opens Opportunity and confirms five telemetry rows (`تاريخ الإطلاق`, `آخر اتصال`, `العمر مقابل المخطط`, `المسافة`, `أهم اكتشاف`) with their values, the diary, three actions including `المحاكي`, the narration player, and a console that opens on `التفكيك`. It repeats the pass in English and at 390 × 844. The hero upgraded from a 640 px source to `PIA20285~orig.jpg` at 1024 px (Opportunity) and to `PIA23791~orig.jpg` at 2245 px on Mars, proving the `~large` → `~orig` fallback works where NASA blocks the large size. A craft without a recording shows the quiet "no recording" notice instead of failing, and no page errors were raised in any pass.

The console sheet previously failed to centre because its entrance animation reset the `-translate-x-1/2` it relied on; it now centres with auto margins. That one class change is the only edit inside the console.

## Known limits

A browser autoplay policy can still start the film muted; the audio control and any first interaction unmute it. On narrow portrait viewports the film's final framing is larger than the canvas's compact system, so the dissolve reads as a settle rather than an exact pixel match. Scientific text, mission data and missing-recording fallbacks were intentionally left as supplied. Hero imagery is whatever NASA asset the app's own query or pinned id resolves to, so an occasional photograph is a detail shot rather than a full-portrait of the craft; the framing never crops it further.
