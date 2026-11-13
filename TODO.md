# Forgotten Explorers — cinematic craft view

Intro video, Solar System canvas and planet-surface overview are untouched; this phase upgrades only the view that opens when a craft is selected on a surface.

- [x] Cinematic hero: the selected craft is presented full-bleed from the highest-resolution NASA asset available — `~large` first with `~orig` fallback — starting from the image already on screen and upgrading only when `naturalWidth` is smaller than `innerWidth × dpr`, cross-fading over a blurred darkened plate. Framed with `object-fit: contain` and an inset rounded plate, so the whole robot/lander is visible and never cropped, with depth glow and a slow 54 s drift (off under reduced motion).
- [x] Refined asymmetric mask: bottom, HUD-side and radial gradients darken the edges and the panel side while the spacecraft stays luminous, keeping every foreground label readable.
- [x] Museum-grade glass HUD with every fact on screen at once: bilingual mission name, tagline and era; a five-cell grid for `تاريخ الإطلاق`, `آخر اتصال`, `العمر مقابل المخطط`, `المسافة`, `أهم اكتشاف`; the first-person diary in comfortable leading; NASA credit and photo replacement. The old question chips are gone — no fact needs a click.
- [x] Direct action tiles inside the console open the Blueprint Breakdown (`التفكيك`), Dust & Power Simulator (`المحاكي`, where it applies) and Next Frontier Lesson (`الحدود التالية`) on the requested tab.
- [x] Voice-over hooks mapped by mission id (`opp, spi, vik, ins, pat, eag, sur, lun, ven, huy, voy, kep`) to `./audio/<id>.mp3` then `.ogg`, with a prominent "Listen to story / استمع لقصتها" player, animated equaliser tied to the craft actually speaking, play/pause and replay, plus a quiet missing-recording state. A dedicated `INTRO_VOICE` slot feeds the opening film.
- [x] Responsive layouts (right column ≥1024 px, bottom sheet below) and the console sheet now centres with auto margins instead of a transform its entrance animation resets.
