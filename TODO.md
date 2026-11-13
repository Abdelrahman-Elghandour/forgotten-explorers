# Forgotten Explorers intro integration

The user's supplied MANUS_HANDOFF.md is the existing implementation/design specification. Modify the full-featured original_step8.html application, not the simplified packaged index.html; retain the latter as immersive_explorer.html and all original assets/source files.

- [x] Replace the original !started static title/subtitle and ادخل الفضاء / Enter space button overlay with the generated 28-second video in a full-screen 100vw × 100vh object-cover player matching #05070d. Include a subtle glassmorphic تخطي / Skip corner button.
- [x] On either video ended or Skip, use one guarded cinematic fade/radial light warp dissolve lasting approximately 800ms, directly revealing active Solar System with started = true and view = solar. No second splash or manual entry screen.
- [x] Attempt unmuted autoplay, fall back promptly to muted playback when blocked, show bilingual audio unlock controls, and provide global first pointer/keyboard interaction support. Initialize/resume ac() in user gestures and start ambient(true) at handoff or the first post-video interaction; all synthesized SFX must remain usable, with explicit mute respected.
- [x] Retain the handoff's telemetry badge and live progress/timecode, adapting duration to the new 28-second video; provide a nonblocking playback/media-error fallback, responsive sizing and reduced-motion behavior.
- [x] Keep every existing bilingual dictionary, AR/EN toggle, data entry/photo uploads/local storage, scientific data, NASA API integration, Solar System canvas, Surface explorer, diary and voiceovers, simulator, blueprint, lessons, last message, time machine, and certificate generator unchanged outside the intro/audio unlock integration. Preserve packaged original versions and media.
- [x] Save the managed project checkpoint and provide the complete updated portable package with local video fallback and the existing Python/Windows launch workflow.
