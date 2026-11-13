# Forgotten Explorers intro integration

The user's supplied MANUS_HANDOFF.md remains the feature specification. The main app is the full-featured `original_step8.html`, now `index.html`; the simplified packaged variant is retained as `immersive_explorer.html` and all supplied assets/source are kept.

- [x] Rebuild the intro so the camera zoom-out decelerates and stops at our Solar System instead of the galaxy: the last 7 s render a warm #ffb347 Sun at the canvas centre with the five elliptical orbits (Venus, Earth/Moon, Mars, Titan with ring, Deep Space) over #05070d, easing out to a held final framing.
- [x] Remove the original `!started` title/subtitle/"ادخل الفضاء / Enter space" splash and render the live interactive `<Space />` canvas with `view = "solar"` immediately behind the full-screen (100vw × 100vh, object-cover) video, sharing the same centre alignment.
- [x] During the final 1.2 s of the video, cross-dissolve the video layer into the canvas with an opacity transition on `cubic-bezier(0.22, 1, 0.36, 1)`, a subtle scale match and a warm Sun bloom, then set `started = true`; no black flash, hard cut or jump. The glassmorphic "تخطي / Skip" button triggers the identical dissolve early.
- [x] Initialize/resume Web Audio (`ac()`, `ambient(true)`) only from real gestures — Skip, the audio control, any planet click, or the first pointer/keyboard interaction — and never from autoplay.
- [x] Keep every existing feature intact: AR/EN toggle, spacecraft diaries and voiceovers, NASA Image Library integration and photo uploads, blueprint, dust simulator, Time Machine, quiz, certificate generator, and all supplied data and assets.
