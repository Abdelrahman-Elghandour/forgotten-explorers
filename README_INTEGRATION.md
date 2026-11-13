# Forgotten Explorers — cinematic intro integration

Run `python3 serve.py` (or `python serve.py` on Windows), then open `http://localhost:8000/`. The existing `run_website.bat` launcher is retained. No npm install or bundler is needed. Internet access is still required for the pinned React, Babel, Tailwind and Google Fonts CDN imports and for on-demand NASA image search.

## The opening sequence

The film now runs 28.000 seconds, 1920 × 1080 at 24 fps. Its first 13 seconds are the rover mission, telemetry warning and signal-loss blackout. From there the camera pulls back off the surface, past the rover, to a distant Mars — and then **decelerates into a settled frame of our Solar System** rather than continuing out to the galaxy. The closing shot was rendered from the same geometry as the site's `<Space />` canvas: a warm `#ffb347` Sun at the canvas centre, the five elliptical orbits (`0.38` flattening) for Venus, Earth/Moon, Mars, Titan with its ring, and Deep Space, over a `#05070d` backdrop with the canvas's purple and blue corner glows. The camera's scale follows a cubic ease-out and stops, holding still for the final ~1.5 seconds.

`tools/render_solar_ending.py` regenerates that closing shot (`mars_8.2.jpg` is the AI frame it takes over from), and the assembly is a plain ffmpeg concat: 13 s of the original film, 8.4 s of the original pullback, then the rendered ending, cross-faded at the join and muxed with the original 28-second score.

## The handoff

The live canvas renders behind the film from the first frame, frozen at `t = 0` — which is exactly the frame the film ends on — with parallax and labels held back. The overlay begins its dissolve 1.2 seconds before the end of the video (`onTimeUpdate`), and Skip triggers the identical path. The dissolve is an `opacity` transition of 1200 ms on `cubic-bezier(0.22, 1, 0.36, 1)` with a 1.035 scale match and a warm Sun bloom; the overlay stops taking pointer events immediately, the canvas unfreezes and starts orbiting, labels and the title fade in, and the overlay is removed only when the dissolve finishes. Nothing is unmounted early and there is no black frame, hard cut or jump.

Measured in a real browser at 1920 × 1080, the Sun in the film's last frame and the Sun in the frozen canvas sit **4.3 px apart horizontally and 2.8 px vertically**; a 50/50 blend of the two shows single, crisp planets and orbits with no ghosting. On viewports wider than about 3:2 the `object-fit: cover` crop and the canvas's `min(W, 1.5H)` sizing coincide exactly; on narrow portrait screens the film's system is framed somewhat larger than the canvas's, so the dissolve reads as a gentle settle rather than a pixel match.

Web Audio is created and resumed only inside a real gesture — Skip, the audio control, a planet click, or the first pointer/keyboard interaction. Ambience starts at handoff when audio is already unlocked, otherwise on the first interaction afterwards. A browser-imposed muted autoplay never becomes the visitor's mute preference.

## Which supplied application is used

`MANUS_HANDOFF.md` identifies the complete original `!started` application, supplied as `original_step8.html`, as the authoritative feature-complete source. That version contains the NASA image API and uploads, the panoramic Surface explorer, diary, blueprint, dust simulator, lessons, time machine, last-message dramatization and PNG certificate. It is the main `index.html`, with only the intro, canvas freeze and audio-unlock wiring changed.

The package's previous `index.html` was a different, simplified immersive Moon/Mars variant without several of those systems. It is retained as `immersive_explorer.html`. The unmodified `original_step8.html`, `MANUS_HANDOFF.md`, the extended NSSDCA data file, and all supplied images, audio and public mirrors are kept.

Babel Standalone is pinned to 7.26.4 in both HTML entry points. The unpinned CDN now serves Babel 8, whose `react` preset emits `import … from "react/jsx-runtime"` and breaks this UMD build; the pin is what makes the supplied app load at all.

## Files

`src/components/CinematicIntro.js` and `cinematic-intro.css` own the opening layer. `index.html` wires the freeze, the handoff and the gesture-gated audio. `serve.py` keeps the local launcher with a configurable port and MP4 byte-range support. `build_static.py` writes `dist/` for static hosting.

`tests/preservation.cjs` parses the full JSX and compares every original dataset, dictionary and feature component against `original_step8.html`, plus the unchanged mission-console markup and the canvas geometry constants. `tests/intro_runtime.cjs` drives the player against a mock React/browser runtime: autoplay fallback, policy-versus-explicit mute, first interaction, late-promise races, the 1.2-second pre-end dissolve, Skip, and listener/timer cleanup. `tests/browser_seam.py` is the real-browser check described above and writes its captures to `tests/captures/`.

The MP4 is an AI-generated fictional scientific visualization, not actual NASA mission footage. No public deployment is performed by this package.
