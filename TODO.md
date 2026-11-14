# Forgotten Explorers — media stage, 3D companion, refreshed voices

## Refreshed narration
- [x] Spirit and Lunokhod 1 use the newly supplied noise-reduced recordings; both are mastered to the same -16 LUFS / -1.5 dBTP target as the intro and Opportunity, and the previous masters are archived under `work/voice-mastering/masters/previous/`.
- [x] Cue timing stays valid: the new takes are the same performances (2.2 ms lag, no drift), so the existing phrase cues, sentence windows and subtitles still line up within 20 ms.

## Multi-media stage
- [x] The selected craft view shows 6–8 real NASA items per rover: photographs plus mission videos fetched from the NASA Image and Video Library.
- [x] Photos render at `~orig` with `~large`/`~thumb` fallbacks over a blurred thumbnail placeholder, so the frame is never empty or soft.
- [x] A thumbnail filmstrip, previous/next arrows and a slide counter let visitors browse; each video slide is badged and plays a real mp4 with native controls.
- [x] The slideshow advances on its own every seven seconds and pauses as soon as a visitor picks a slide or plays a video, with a toggle to resume it.
- [x] The NASA title and id of the visible slide are shown and linked in the stage credit.

## 3D talking companion
- [x] A Three.js model of the selected craft sits in the corner: six-wheeled MER rovers for Opportunity and Spirit, an eight-wheeled Lunokhod 1 with its hinged lid.
- [x] The model can be dragged to rotate and returns to a slow idle sway; its optics and mast respond to the narration's own loudness envelope while speaking.
- [x] A glass bubble shows the English transcript sentence by sentence, highlighting the sentence that covers the current playback time, and returns to an idle prompt when the narration is paused or finished.
- [x] The companion scales and re-stacks on narrow screens so it stays inside the media area above the filmstrip.

## Preservation
- [x] The intro film, solar-system canvas, surface overview, bilingual toggle, data entry, NASA image hook, blueprint, simulator, lessons, time machine, quiz and certificate generator are unchanged; the preservation suite pins every original module and the surface/canvas code.
- [x] All existing suites (preservation, transcripts, intro runtime, intro narration, seam, craft, narration, transcript browser checks) still pass alongside the new companion checks.
