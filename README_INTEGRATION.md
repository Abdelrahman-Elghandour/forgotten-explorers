# Forgotten Explorers — cinematic intro integration

Run `python3 serve.py` (or `python serve.py` on Windows), then open `http://localhost:8000/`. The existing `run_website.bat` launcher is retained. No npm install or bundler is needed. Internet access is still required for the original React, Babel, Tailwind, Google Fonts CDN imports and on-demand NASA image search.

## Opening experience

The application opens with the actual 28.000-second Full HD, 24 fps intro at `videos/intro.mp4`. The player fills the viewport with object-cover, attempts audible autoplay, falls back to muted autoplay when necessary, and offers Arabic/English sound, language and Skip controls. The timecode reads the actual video duration. Both natural completion and Skip use the same guarded 800ms fade/radial-light dissolve; the Solar System becomes active beneath the overlay, which is removed only when the dissolve finishes. Reduced-motion preferences disable the radial warp while preserving the fade.

Web Audio is created/resumed from user interaction. If the entire video finishes without a user gesture, visual handoff still succeeds; ambience starts at the first Solar System interaction. Explicit user mute remains respected. The player has tap-to-play and media-error recovery, a local MP4 fallback, and cleaned-up listeners/timers. The Python server supports byte-range requests for efficient MP4 playback.

## Which supplied application is used

`MANUS_HANDOFF.md` identifies the complete original `!started` application, supplied as `original_step8.html`, as the authoritative feature-complete source. That version contains the NASA image API and uploads, the panoramic Surface explorer, diary, blueprint, dust simulator, lessons, time machine, last-message dramatization, and PNG certificate. It is now the main `index.html`, with only intro/audio-unlock wiring changed.

The package's previous `index.html` was a different simplified immersive Moon/Mars variant that did not contain several of those required systems. It is retained without code edits as `immersive_explorer.html`. The original full-featured `original_step8.html`, complete `MANUS_HANDOFF.md`, extended NSSDCA data file, and supplied images/audio/public mirrors are retained. Existing media are mirrored to legacy mission-ID filenames where there is an exact supplied match, without changing mission data or playback code. NASA and missing-recording fallbacks remain unchanged for assets that were not supplied.

## Files added or changed

`src/components/CinematicIntro.js` and `cinematic-intro.css` implement the isolated opening. `index.html` wires it into the original application. `serve.py` retains the local launcher with configurable port and MP4 range support. `build_static.py` produces `dist/` for static hosting. `tests/preservation.cjs` checks JSX syntax and semantic preservation of all original data/components plus unchanged mission-console markup. Set `BABEL_CHECKER` to a local Babel Standalone CommonJS file when running that development-only check.

The MP4 is an AI-generated fictional scientific visualization, not actual NASA mission footage. No public deployment is performed by this package.
