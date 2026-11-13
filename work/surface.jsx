function Surface({ B, name, list, nm, tg, en, onOpen, play, imgs, onUpload, onTell, onToggle, onReplay, speaking, voiceId, notice, real }) {
  const [pan, setPan] = useState(0.3), [focus, setFocus] = useState(null), [drag, setDrag] = useState(null);
  const [hi, setHi] = useState(0), [loaded, setLoaded] = useState(false), [gone, setGone] = useState(false);
  const box = useRef(), moved = useRef(false);
  const far = useMemo(() => hill(1, 7, 55), []), near = useMemo(() => hill(4, 4, 78), []);
  const px = (m) => (8 + m.x * 0.84) / 100, clamp = (v) => Math.max(0, Math.min(1, v));
  const layer = (w) => ({ width: `${w}%`, transform: `translateX(-${(pan * (w - 100)) / w * 100}%)`, transition: drag ? "none" : "transform .9s cubic-bezier(.2,.8,.2,1)" });
  const go = (m) => { play("click"); moved.current = false; setFocus(m.id); setPan(clamp((px(m) * 2.5 - 0.5) / 1.5)); onTell(m); };
  const step = (d) => { const i = list.findIndex((m) => m.id === focus); go(list[(i + d + list.length) % list.length]); };
  const fm = list.find((m) => m.id === focus);
  const im = fm ? imgs[fm.id] : null;
  const live = !!fm && speaking && voiceId === fm.id;

  /* Highest quality first: the mirrored copy, then NASA's ~large, then ~orig for dense screens. */
  const chain = useMemo(() => {
    if (!im) return [];
    const out = [];
    const push = (s) => { if (s && out.indexOf(s) < 0) out.push(s); };
    push(im.u);
    if (im.f) { push(im.f.replace("~medium", "~large")); push(im.f.replace("~medium", "~orig")); }
    return out;
  }, [im && im.u, im && im.f]);
  const key = chain.join("|");

  useEffect(() => { setHi(0); setLoaded(false); setGone(false); }, [key]);
  useEffect(() => { setLoaded(false); }, [key, hi]);
  useEffect(() => {
    if (chain.length < 2) return;
    let cancelled = false;
    const want = Math.min(window.innerWidth || 1600, 1600) * Math.min(window.devicePixelRatio || 1, 2);
    const probe = (i) => {
      if (cancelled || i >= chain.length) return;
      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.onload = () => { if (cancelled) return; setHi(i); setGone(false); if (img.naturalWidth < want * 0.95) probe(i + 1); };
      img.onerror = () => { if (!cancelled) probe(i + 1); };
      img.src = chain[i];
    };
    probe(1);
    return () => { cancelled = true; };
  }, [key]);

  const src = chain[hi];
  const credit = hi > 0 && im && im.fi ? { t: im.ft, i: im.fi } : { t: im && im.t, i: im && im.i };
  const plate = im && (im.u || im.f);
  return (
    <div ref={box} className={"surface-root absolute inset-0 overflow-hidden fin touch-none select-none" + (fm ? " surface-focused" : "")} style={{ cursor: drag ? "grabbing" : "grab", direction: "ltr" }}
      onPointerDown={(e) => { moved.current = false; setDrag({ x: e.clientX, p: pan }); }}
      onPointerMove={(e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 5) moved.current = true; setPan(clamp(drag.p - dx / (box.current.clientWidth * 1.5))); }}
      onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(#05070d 0%, ${B.c}33 75%, ${B.c}66 100%)`, transform: focus ? "scale(1.18)" : "scale(1)", transformOrigin: "50% 70%", transition: "transform .9s" }}>
        <div className="absolute inset-0" style={layer(130)}>{(SKY[B.k] || []).map((o, i) => (
          <div key={i} className="absolute rounded-full" style={{ left: `${o.l}%`, top: `${o.t}%`, width: o.s, height: o.s, background: o.bg }}>{o.ring && <div className="absolute rounded-full border-4" style={{ inset: "35% -35%", borderColor: "#d9b97aaa", transform: "rotate(-18deg)" }} />}</div>))}</div>
        <div className="absolute inset-x-0 bottom-0 h-3/5" style={layer(170)}><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full"><path d={far} fill={B.c} opacity=".35" /></svg></div>
        <div className="absolute inset-x-0 bottom-0 h-1/2" style={layer(250)}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full"><defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={B.c} stopOpacity=".85" /><stop offset="1" stopColor="#05070d" /></linearGradient></defs><path d={near} fill="url(#gr)" /></svg>
          {list.map((m, i) => (
            <button key={m.id} onClick={() => { if (!moved.current) go(m); }} aria-label={nm(m)} className="absolute flex flex-col items-center" style={{ left: `${px(m) * 100}%`, bottom: `${58 - (i % 3) * 8}%`, transform: "translateX(-50%)" }}>
              <CraftIcon c={B.c} on={focus === m.id} im={imgs[m.id]} real={real} />
              <span className="glass rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap mt-1">{nm(m)}</span>
            </button>))}
        </div>
      </div>

      {fm && (
        <div className="craft-stage fin">
          <div className="craft-media">
            {plate && <div className="craft-plate" style={{ backgroundImage: `url("${plate}")` }} />}
            <div className="craft-halo" style={{ background: `radial-gradient(closest-side, ${B.c}44, rgba(255,196,132,.16) 52%, transparent 78%)` }} />
            {src && !gone && (
              <img key={src} src={src} alt={credit.t || nm(fm)} referrerPolicy="no-referrer" decoding="async"
                className={"craft-hero" + (loaded ? " on" : "")}
                onLoad={() => setLoaded(true)}
                onError={() => { if (hi + 1 < chain.length) setHi(hi + 1); else setGone(true); }} />)}
            <div className="craft-mask" />
            {gone && <p className="craft-empty">{en ? "No photograph for this craft yet." : "لا توجد صورة لهذه المركبة بعد."}</p>}
          </div>

          <aside className="craft-hud" dir={en ? "ltr" : "rtl"} onPointerDown={(e) => e.stopPropagation()} aria-label={nm(fm)}>
            <div className="craft-hud__head">
              <div className="flex-1 min-w-0">
                <p className="craft-eyebrow">{en ? "Selected craft" : "المركبة المختارة"} · {name}</p>
                <h2 className="craft-title">{nm(fm)}</h2>
                <p className="craft-alt" dir={en ? "rtl" : "ltr"}>{en ? fm.n : EN[fm.id][0]}</p>
                <p className="craft-tag"><span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: B.c, boxShadow: `0 0 10px ${B.c}` }} />{tg(fm)} · {fm.y}{fm.end !== fm.y ? `–${fm.end >= 2026 ? "…" : fm.end}` : ""}</p>
              </div>
              <button onClick={() => { play("click"); setFocus(null); }} aria-label={en ? "Close" : "إغلاق"} className="glass rounded-full w-8 h-8 grid place-items-center shrink-0"><X size={16} /></button>
            </div>

            <div className="craft-hud__body">
              <dl className="craft-grid">
                {SL[en ? "en" : "ar"].map((label, i) => (
                  <div key={label} className={"craft-cell" + (i === 4 ? " craft-cell--wide" : "")}>
                    <dt>{label}</dt>
                    <dd dir="rtl">{fm.s[i]}</dd>
                  </div>))}
              </dl>

              <div className="craft-diary">
                <p className="craft-eyebrow">{en ? "Diary" : "المذكرات"}</p>
                <p className="craft-quote" dir="rtl">«{fm.diary}»</p>
              </div>

              <div className="craft-actions" style={{ gridTemplateColumns: `repeat(${SOLAR.includes(fm.id) ? 3 : 2},1fr)` }}>
                <button className="craft-act" onClick={() => onOpen(fm.id, "blue")}><Settings size={17} className="acc" />{en ? "Blueprint" : "التفكيك"}</button>
                {SOLAR.includes(fm.id) && <button className="craft-act" onClick={() => onOpen(fm.id, "sim")}><Wind size={17} className="acc" />{en ? "Simulator" : "المحاكي"}</button>}
                <button className="craft-act" onClick={() => onOpen(fm.id, "lesson")}><Rocket size={17} className="acc" />{en ? "Next frontier" : "الحدود التالية"}</button>
              </div>

              <div className={"craft-voice" + (live ? " on" : "")}>
                <button className="craft-voice__btn" onClick={() => { play("click"); onToggle(fm); }} aria-label={live ? (en ? "Pause narration" : "إيقاف السرد") : (en ? "Listen to story" : "استمع لقصتها")}>
                  {live ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <div className="craft-voice__mid">
                  <div className="craft-wave" aria-hidden>{Array.from({ length: 13 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 82}ms`, height: `${7 + ((i * 5) % 13)}px` }} />)}</div>
                  <div className="min-w-0">
                    <p className="craft-voice__label">{live ? (en ? "Playing narration" : "يُشغّل السرد") : (en ? "Listen to story" : "استمع لقصتها")}</p>
                    <p className="craft-voice__hint">{en ? "Narration" : "سرد صوتي"} · {fm.id.toUpperCase()}</p>
                  </div>
                </div>
                <button className="craft-voice__re" onClick={() => { play("click"); onReplay(fm); }} aria-label={en ? "Replay" : "إعادة"}><Replay size={15} /></button>
              </div>

              {notice && <p className="text-xs text-amber-300">{notice}</p>}

              <div className="craft-meta" dir="ltr">
                {credit.i ? <a href={`https://images.nasa.gov/details/${credit.i}`} target="_blank" rel="noreferrer" className="underline truncate">NASA · {credit.t}</a> : <span>NASA / JPL</span>}
                <label className="cursor-pointer glass rounded-full px-3 py-1 text-[10px] font-bold shrink-0 hover:bg-white/15"><input type="file" accept="image/*" hidden onChange={(e) => { onUpload(fm.id, e.target.files[0]); e.target.value = ""; }} />{src ? (en ? "Change photo" : "غيّر الصورة") : (en ? "Add photo" : "أضف صورة")}</label>
              </div>
            </div>
          </aside>
        </div>)}

      <div className="absolute top-16 start-3 z-10 glass rounded-2xl px-4 py-2" style={{ direction: en ? "ltr" : "rtl" }}><b className="acc text-lg">{name}</b>{!en && <p className="text-xs text-slate-300 max-w-[240px] leading-relaxed">{B.fact}</p>}</div>
      {!focus && <p className="absolute top-1/3 inset-x-0 text-center text-slate-200 pointer-events-none px-4" style={{ direction: en ? "ltr" : "rtl" }}>{en ? "Drag to roam the surface, then tap a craft" : "اسحب لتتجول على السطح، ثم اضغط على المركبة"}</p>}

      <div className="surface-dock" onPointerDown={(e) => e.stopPropagation()} style={{ direction: en ? "ltr" : "rtl" }}>
        {fm && <button className="glass rounded-full w-10 h-10 grid place-items-center shrink-0" onClick={() => step(-1)} aria-label="prev"><ArrowRight size={18} /></button>}
        <div className="flex gap-2 overflow-x-auto flex-1 py-1">{list.map((m) => (
          <button key={m.id} onClick={() => go(m)} className={`shrink-0 rounded-xl px-3 py-2 text-start ${focus === m.id ? "accbg" : "glass"}`}><b className="block text-sm">{nm(m)}</b><span className="text-xs opacity-80">{m.y}</span></button>))}</div>
        {fm && <button className="glass rounded-full w-10 h-10 grid place-items-center shrink-0" onClick={() => step(1)} aria-label="next"><ArrowRight size={18} className="rotate-180" /></button>}
      </div>
    </div>
  );
}
