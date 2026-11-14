# Forgotten Explorers — direct launch

The exhibit must open on its own, with no splash, no click and no film gate, and it must be on screen as fast as the browser can paint.

- [x] Remove the opening gate: `started` is true and `view` is `solar` on the first render, so the live Solar System canvas, header and title are interactive immediately. No overlay, no "Enter space" button, no waiting for the film.
- [x] Keep the 28-second film available on demand from the header (`الفيلم / Film`), with its unmuted playback, the 1.2-second cross-dissolve into the canvas, the transcript and CC controls, and a Close control that always returns to the exhibit. Opening the film still marks the app inert behind it.
- [x] Attempt the soundtrack at launch, unmuted, with no mute toggles anywhere; if the browser refuses audible autoplay, the first ordinary click or key recovers sound without changing any setting.
- [x] Make startup fast: React and ReactDOM are served from `vendor/`, Tailwind is a precompiled 15 KB stylesheet instead of the runtime CDN, the JSX is precompiled into `app.js` so Babel never runs in the browser, and the 10 MB score is fetched as audio only.
- [x] Keep every feature intact: bilingual AR/EN, surfaces, craft HUDs, diary, narration and captions, gallery, blueprint, simulator, lessons, Time Machine, quiz and certificate.
- [x] Verify: direct-launch timing, launch audio under allowed and blocked autoplay, visual parity with the previous build, the film seam, and the full browser regression suite.
