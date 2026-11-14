# Forgotten Explorers — planet surface scene

## Layered, textured planet surface
- [x] The surface is built from a sky, far ridge, mid ridge and near ground layer instead of one flat gradient with two blurry wave lines.
- [x] Each layer is a square-unit SVG (`viewBox 0 0 <layer width> 100`), so ridge slopes stay steep and craters stay round instead of being stretched 2.5x horizontally.
- [x] The near ground is graded regolith with soft dune shading, lit crater rims with shadowed far walls, rock scatter with contact shadows, wind ripples, a film-grain overlay and a dark foreground berm for depth.
- [x] Mars keeps its warm rust palette and drifting dust; the Moon uses a cooler, darker regolith with no dust and a faint Earth in the sky.

## Distinct craft, planted on the ground
- [x] Every mission id has its own illustration: Opportunity and Spirit differ in deck angle, wheel count and the buried wheel with its dug pit; InSight shows its two fan-like solar arrays, deck, seismometer and tether; Lunokhod 1 shows the tub hull, open solar lid, cone antenna, eight-wheel bogie and tread marks.
- [x] Craft are positioned from the same `sGroundY()` curve that draws the terrain, so wheels meet the surface exactly at every pan position; a browser test asserts the ground fill contains the point just below the feet and not a point above them.
- [x] Real NASA photos still replace the illustration when the API returns an image, and a failed photo falls back to the illustration rather than an empty slot.

## Interaction and motion
- [x] Hover/focus lifts the name tag, lights a warm rim glow and emits three sonar rings; a selected craft stays lit.
- [x] Idle motion: lens glints on the rovers, blinking beacons, drifting regolith under the wheels and floating dust motes.
- [x] Drag-to-pan keeps the original three-speed parallax and the original click-to-open behavior; selecting a craft still opens the cinematic story view unchanged.
- [x] `prefers-reduced-motion` disables every ambient animation.
- [x] Mobile keeps three separated, tappable craft at 390 x 844.

## Preserved
- [x] Intro film, Solar System canvas, craft story view, slideshow, 2D guide, captions, narration audio, transcript data, blueprint, simulator, lessons, Time Machine and certificate are byte-identical or behaviorally unchanged; `tests/preservation.cjs`, `guide_preservation.cjs`, `voice_transcripts.cjs`, `intro_runtime.cjs` and the browser suites still pass.
