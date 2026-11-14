# Forgotten Explorers — opening sequence

## No Skip control
- [x] The `تخطي / Skip` button is removed from the intro HUD and from the stylesheet; only Transcript, CC, the audio toggle and the language switch remain.
- [x] The opening plays through to its own end and cross-dissolves into the Solar System as before.
- [x] If the film cannot load at all, the error state offers `متابعة / Continue` so the app is never trapped behind the overlay.

## Sound on from the first frame
- [x] The film mounts unmuted at full volume and attempts audible playback before anything else.
- [x] A browser autoplay refusal falls back to a silent start that still plays, and the first click or key press anywhere unmutes the film and unlocks the Web Audio graph for narration and ambience.
- [x] The explicit mute control still works and is never overridden by later gestures.

## Verified
- [x] Chromium with audible autoplay allowed: unmuted, volume 1, playing, zero skip buttons.
- [x] Chromium with the default policy: playing muted, unmuted by the first click.
- [x] Every browser suite now enters the app by seeking to the final 1.4 s; all node and browser suites pass.
