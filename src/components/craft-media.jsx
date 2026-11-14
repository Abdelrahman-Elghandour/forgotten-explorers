/* Multi-media stage for a selected craft.
 *
 * Replaces the single still with a carousel of real NASA photographs and mission footage from
 * images-api.nasa.gov. Photos and videos are searched separately (the API takes one media_type
 * per request), and a video's playable file is derived from its own asset path — the manifest
 * JSON is not CORS-readable from the browser, so ~small/~mobile/~preview/~orig are tried in turn.
 * A thumbnail filmstrip allows manual browsing, and the slideshow advances on its own until the
 * visitor picks a slide or plays a video.
 */
(function () {
  const React = window.React;
  if (!React) return;
  const { useCallback, useEffect, useMemo, useRef, useState } = React;
  const h = React.createElement;

  const CACHE = new Map();
  const SEARCH = "https://images-api.nasa.gov/search";
  const SLIDE_MS = 7000;
  const VIDEO_SIZES = ["~small.mp4", "~mobile.mp4", "~preview.mp4", "~orig.mp4"];
  const VIDEO_FALLBACK = { opp: "Mars rover", spi: "Mars rover", lun: "Luna 17" };

  const withTimeout = (p, ms) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return p(ctrl.signal).finally(() => clearTimeout(timer));
  };

  const sized = (url, size) => (url || "").replace(/~(thumb|small|medium|large|orig)(?=\.)/, size);
  const secure = (u) => (u || "").replace(/^http:\/\//i, "https://");

  async function searchJson(q, media, size) {
    const res = await withTimeout((signal) => fetch(
      `${SEARCH}?q=${encodeURIComponent(q)}&media_type=${media}&page_size=${size}`, { signal }), 9000);
    if (!res.ok) throw new Error("nasa " + res.status);
    return res.json();
  }

  const itemsOf = (json) => (json && json.collection && json.collection.items) || [];

  function toImage(it) {
    const meta = (it.data && it.data[0]) || {};
    const thumb = it.links && it.links[0] && it.links[0].href;
    if (!thumb || !meta.nasa_id || meta.media_type !== "image") return null;
    return {
      kind: "image",
      thumb: sized(secure(thumb), "~thumb"),
      // NASA only generates ~medium/~large for some items; ~orig and ~thumb always exist.
      src: sized(secure(thumb), "~orig"),
      large: sized(secure(thumb), "~large"),
      orig: sized(secure(thumb), "~orig"),
      title: meta.title || "NASA",
      nasaId: meta.nasa_id,
    };
  }

  function toVideo(it) {
    const meta = (it.data && it.data[0]) || {};
    const thumb = it.links && it.links[0] && it.links[0].href;
    if (!thumb || !meta.nasa_id || meta.media_type !== "video") return null;
    const base = secure(thumb).replace(/~[a-z0-9_]+\.(jpe?g|png)$/i, "");
    return {
      kind: "video",
      thumb: sized(secure(thumb), "~thumb"),
      poster: secure(thumb),
      sources: VIDEO_SIZES.map((s) => base + s),
      title: meta.title || "NASA",
      nasaId: meta.nasa_id,
    };
  }

  async function fetchMedia(query, seed, id) {
    if (CACHE.has(query)) return CACHE.get(query);
    const build = async () => {
      const images = searchJson(query, "image", 14)
        .then((j) => itemsOf(j).map(toImage).filter(Boolean))
        .catch(() => []);
      const videos = searchJson(query, "video", 8)
        .then((j) => itemsOf(j).map(toVideo).filter(Boolean))
        .catch(() => [])
        .then(async (list) => {
          if (list.length) return list;
          const j = await searchJson(VIDEO_FALLBACK[id] || "NASA mission", "video", 8).catch(() => null);
          return j ? itemsOf(j).map(toVideo).filter(Boolean) : [];
        });
      const [imgs, vids] = await Promise.all([images, videos]);
      const out = [];
      const left = vids.slice(0, 3);
      imgs.slice(0, 5).forEach((im, i) => {
        out.push(im);
        if (i === 1 || i === 3) { const v = left.shift(); if (v) out.push(v); }
      });
      left.forEach((v) => out.push(v));
      return out.filter((x) => x.nasaId !== seed.nasaId).slice(0, 8);
    };
    const promise = build().catch(() => []);
    CACHE.set(query, promise);
    return promise;
  }

  function CraftMedia({ id, mission, im, query, en, onCredit, accent }) {
    const seed = useMemo(() => ({
      kind: "image",
      thumb: im && (im.u || im.f),
      src: im && (im.u || im.f),
      large: im && im.f ? sized(im.f, "~large") : null,
      orig: im && im.f ? sized(im.f, "~orig") : null,
      title: (im && (im.ft || im.t)) || mission.n,
      nasaId: (im && im.fi) || null,
    }), [im && im.u, im && im.f, mission.id]);

    // Bundled photographs guarantee a real slideshow even with no network.
    const localList = useMemo(() => {
      const bundled = ((window.CRAFT_GALLERY || {})[id] || []).map((g) => ({
        kind: "image",
        thumb: g.src,
        src: g.src,
        large: g.src,
        title: g.title || mission.n,
        nasaId: g.nasaId,
      })).filter((g) => g.nasaId !== (seed && seed.nasaId));
      // The bundled NASA set is sharper and credited, so it leads; the pinned still is the fallback.
      if (bundled.length) return bundled;
      return seed && seed.src ? [seed] : [seed];
    }, [id, seed]);

    const [items, setItems] = useState(localList);
    const [idx, setIdx] = useState(0);
    const [auto, setAuto] = useState(true);
    const [hi, setHi] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [gone, setGone] = useState(false);
    const [vTry, setVTry] = useState(0);
    const [vDead, setVDead] = useState(false);
    const videoRef = useRef(null);
    const stripRef = useRef(null);

    useEffect(() => {
      let dead = false;
      setItems(localList); setIdx(0); setAuto(true); setHi(0); setLoaded(false); setGone(false);
      fetchMedia(query, seed, id).then((more) => {
        if (dead) return;
        // Live results extend the bundled set: two mission videos, then extra photographs.
        const next = localList.slice();
        const vids = more.filter((m) => m.kind === "video").slice(0, 2);
        const imgs = more.filter((m) => m.kind === "image");
        if (vids[0]) next.splice(Math.min(2, next.length), 0, vids[0]);
        if (vids[1]) next.splice(Math.min(5, next.length), 0, vids[1]);
        imgs.forEach((im) => {
          if (next.length >= 8) return;
          if (!next.some((x) => x.nasaId === im.nasaId)) next.push(im);
        });
        setItems(next);
      });
      return () => { dead = true; };
    }, [id, query, seed, localList]);

    const item = items[Math.min(idx, items.length - 1)] || seed;

    useEffect(() => { setHi(0); setLoaded(false); setGone(false); setVTry(0); setVDead(false); }, [idx, item.src]);

    // Full resolution first, then the smaller sizes if an item lacks it.
    const chain = item.kind === "image"
      ? [...new Set([item.src, item.large, item.thumb].filter(Boolean))]
      : [];
    const src = chain[Math.min(hi, chain.length - 1)];

    useEffect(() => {
      if (onCredit) onCredit({ t: item.title, i: item.nasaId });
    }, [item.title, item.nasaId]);

    const stopAuto = useCallback(() => setAuto(false), []);
    const go = useCallback((next) => {
      stopAuto();
      setIdx(((next % items.length) + items.length) % items.length);
    }, [items.length, stopAuto]);

    // Slideshow: advance on a timer, never autoplaying a video.
    useEffect(() => {
      if (!auto || items.length < 2 || item.kind === "video") return undefined;
      const t = setTimeout(() => {
        let n = idx;
        for (let i = 0; i < items.length; i += 1) {
          n = (n + 1) % items.length;
          if (items[n].kind === "image") break;
        }
        setIdx(n);
      }, SLIDE_MS);
      return () => clearTimeout(t);
    }, [auto, idx, items, item.kind]);

    useEffect(() => {
      const onHide = () => { if (document.hidden) setAuto(false); };
      document.addEventListener("visibilitychange", onHide);
      return () => document.removeEventListener("visibilitychange", onHide);
    }, []);

    useEffect(() => {
      const strip = stripRef.current;
      const active = strip && strip.querySelector('[data-active="1"]');
      if (active && active.scrollIntoView) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }, [idx]);

    const videoSrc = item.kind === "video" && !vDead ? item.sources[Math.min(vTry, item.sources.length - 1)] : null;
    const credit = { t: item.title, i: item.nasaId };

    return h("div", { className: "craft-media__inner", onPointerDown: (e) => e.stopPropagation() },
      item.kind === "video"
        ? h("div", { className: "craft-frame" },
            videoSrc
              ? h("video", {
                  key: videoSrc,
                  ref: videoRef,
                  className: "craft-hero craft-hero--video on",
                  src: videoSrc,
                  poster: item.poster,
                  controls: true,
                  playsInline: true,
                  preload: "metadata",
                  onPlay: stopAuto,
                  onError: () => {
                    if (vTry + 1 < item.sources.length) setVTry(vTry + 1);
                    else setVDead(true);
                  },
                  "aria-label": item.title,
                })
              : h("div", { className: "craft-video-wait" },
                  h("span", null, "NASA"),
                  h("small", null, en ? "This recording is not available right now." : "هذا التسجيل غير متاح الآن.")))
        : src && !gone
          ? h("div", { className: "craft-frame" },
              h("img", {
                className: "craft-hero craft-hero--blur",
                src: item.thumb,
                alt: "",
                "aria-hidden": "true",
                referrerPolicy: "no-referrer",
              }),
              h("img", {
                key: src,
                src,
                alt: credit.t || mission.n,
                referrerPolicy: "no-referrer",
                decoding: "async",
                className: "craft-hero" + (loaded ? " on" : ""),
                onLoad: () => setLoaded(true),
                onError: () => { if (hi + 1 < chain.length) setHi(hi + 1); else setGone(true); },
              }))
          : h("p", { className: "craft-empty" }, en ? "No photograph for this craft yet." : "لا توجد صورة لهذه المركبة بعد."),

      items.length > 1 && h(React.Fragment, null,
        h("button", { className: "craft-nav prev", onClick: () => go(idx - 1), "aria-label": en ? "Previous media" : "السابق" }, "‹"),
        h("button", { className: "craft-nav next", onClick: () => go(idx + 1), "aria-label": en ? "Next media" : "التالي" }, "›")
      ),

      h("div", { className: "craft-credit", dir: "ltr" },
        credit.i
          ? h("a", { href: `https://images.nasa.gov/details/${credit.i}`, target: "_blank", rel: "noreferrer" }, "NASA · " + credit.t)
          : h("span", null, "NASA / JPL"),
        h("span", { className: "craft-credit__count" }, `${idx + 1}/${items.length}`)
      ),

      h("div", { className: "craft-strip-wrap" },
        h("button", {
          className: "craft-strip__play" + (auto ? " on" : ""),
          onClick: () => { setAuto((v) => !v); if (videoRef.current) videoRef.current.pause(); },
          "aria-label": auto ? (en ? "Pause slideshow" : "إيقاف العرض") : (en ? "Play slideshow" : "تشغيل العرض"),
          title: auto ? "Slideshow on" : "Slideshow paused",
        }, auto ? "❚❚" : "▶"),
        h("div", { className: "craft-strip", ref: stripRef, dir: "ltr" },
          items.map((it, i) => h("button", {
            key: it.nasaId + "-" + i,
            className: "craft-thumb" + (i === idx ? " on" : ""),
            "data-active": i === idx ? "1" : "0",
            onClick: () => go(i),
            "aria-label": it.title,
            title: it.title,
          },
            h("img", { src: it.thumb, alt: "", referrerPolicy: "no-referrer", loading: "lazy" }),
            it.kind === "video" && h("span", { className: "craft-thumb__badge" }, "▶")
          ))
        )
      )
    );
  }

  window.CraftMedia = CraftMedia;
})();
