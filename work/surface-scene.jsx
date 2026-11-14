/* ============ PLANET SURFACE SCENE ============ */
/* Layered, textured panorama with hand-drawn craft that sit on the terrain.
 * Pure SVG/CSS: no WebGL, no network, no canvas. Parallax reuses the original
 * `layer(w)` transform, so drag-to-pan behaves exactly as before.
 *
 * Projection note: each layer is `w` percent wide and full height, so its viewBox is
 * `0 0 w 100`. That keeps units square — ridges stay steep and craters stay round. */

const S_PALETTE = {
  mars: { deep: "#1a0c07", far: "#4d2318", mid: "#7c3a21", near: "#a0502c", hi: "#cf7f4b", haze: "#e9a97a", rim: "#ffcf9d", mote: "236,184,138", sun: "#ffe8c8" },
  moon: { deep: "#05070c", far: "#181b22", mid: "#33363f", near: "#4d505a", hi: "#82868f", haze: "#8ea3c6", rim: "#e8f0ff", mote: "210,220,236", sun: "#ffffff" },
  venus: { deep: "#191004", far: "#5f4319", mid: "#96702c", near: "#c09648", hi: "#edd089", haze: "#f7e2ac", rim: "#fff3c6", mote: "246,224,172", sun: "#fff3c4" },
  titan: { deep: "#0c0a05", far: "#43351c", mid: "#715a2e", near: "#93743f", hi: "#c5a367", haze: "#d8ba80", rim: "#ffe7b2", mote: "234,206,152", sun: "#ffeab8" },
  deep: { deep: "#05070d", far: "#191e33", mid: "#293050", near: "#3a436b", hi: "#6b78a8", haze: "#5d72b6", rim: "#cfdbff", mote: "182,202,242", sun: "#e6ecff" },
};
const sPal = (k) => S_PALETTE[k] || S_PALETTE.mars;
let sSeq = 0;
const sUid = () => "srf" + (++sSeq);

/* One ground line, shared by the terrain path and the craft, so feet meet soil exactly.
 * `t` runs 0..250 across the near layer (2.5x the viewport width). */
const sGroundY = (t) => 61 + 5.4 * Math.sin(t * 0.021 + 1.15) + 2.7 * Math.sin(t * 0.049 + 2.4) + 1.1 * Math.sin(t * 0.127 + 0.7);
const sGroundPath = () => {
  let d = "M0,100 L0," + sGroundY(0).toFixed(2) + " ";
  for (let t = 0; t <= 250; t += 1) d += "L" + t + "," + sGroundY(t).toFixed(2) + " ";
  return d + "L250,100 Z";
};
/* Rocky crest: low-frequency mass, mid-frequency spurs, and a fine jagged edge. */
const sRidgePath = (seed, amp, base, jag, width) => {
  let d = "M0,100 ";
  for (let t = 0; t <= width; t += 0.5) {
    const y = base - amp * Math.sin(t * 0.031 + seed) - amp * 0.42 * Math.sin(t * 0.086 + seed * 1.7) - amp * 0.2 * jag * Math.sin(t * 0.31 + seed * 2.6) - amp * 0.08 * jag * Math.sin(t * 0.77 + seed * 3.4);
    d += "L" + t + "," + y.toFixed(2) + " ";
  }
  return d + "L" + width + ",100 Z";
};
const sRand = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

/* Sky: sun, second world, star field and the atmospheric limb. */
const SurfaceSky = ({ kind }) => {
  const p = sPal(kind);
  const stars = useMemo(() => { const r = sRand(kind === "moon" ? 41 : 17); return Array.from({ length: kind === "moon" ? 110 : 58 }).map(() => ({ x: r() * 100, y: r() * 58, s: 0.6 + r() * 1.7, o: 0.2 + r() * 0.65, d: r() * 9 })); }, [kind]);
  const bodies = SKY[kind] || [];
  return (
    <div className="surface-sky" aria-hidden="true">
      <div className="surface-stars">{stars.map((s, i) => (
        <i key={i} style={{ left: s.x + "%", top: s.y + "%", width: s.s + "px", height: s.s + "px", "--o": s.o, animationDelay: s.d + "s" }} />))}</div>
      {bodies.map((o, i) => (
        <div key={i} className="surface-body" style={{ left: o.l + "%", top: o.t + "%", width: o.s, height: o.s, background: o.bg, boxShadow: i === 0 ? `0 0 ${o.s * 1.5}px ${p.sun}66` : "none" }}>
          {o.ring && <span className="surface-body__ring" />}
        </div>))}
      <div className="surface-limb" style={{ background: `radial-gradient(140% 80% at 62% 96%, ${p.haze}4d 0%, ${p.deep}00 60%)` }} />
    </div>
  );
};

/* Wind-borne dust (Mars) or a faint glimmer of regolith in low sunlight (Moon). */
const SurfaceMotes = ({ kind }) => {
  const p = sPal(kind);
  const motes = useMemo(() => { const r = sRand(kind === "moon" ? 7 : 23); return Array.from({ length: kind === "moon" ? 12 : 30 }).map(() => ({ x: r() * 100, y: 30 + r() * 64, s: 1 + r() * 3.2, d: 11 + r() * 14, delay: r() * 16, o: 0.18 + r() * 0.42 })); }, [kind]);
  return <div className="surface-motes" aria-hidden="true">{motes.map((m, i) => (
    <i key={i} style={{ left: m.x + "%", top: m.y + "%", width: m.s + "px", height: m.s + "px", "--o": m.o, animationDuration: m.d + "s", animationDelay: "-" + m.delay + "s", background: `rgba(${p.mote},.9)` }} />))}</div>;
};

/* Far and mid ridges, separated by atmospheric haze, with crater bowls on the mid slope. */
const SurfaceRidges = ({ kind, layer }) => {
  const p = sPal(kind);
  const geo = useMemo(() => {
    const r = sRand(kind === "moon" ? 13 : 5);
    return {
      far: sRidgePath(2.4, 9, 55, 0.6, 132), far2: sRidgePath(6.1, 6.5, 60, 1.0, 132),
      mid: sRidgePath(4.3, 7, 64, 0.8, 186), mid2: sRidgePath(8.9, 5, 70, 1.3, 186),
      craters: Array.from({ length: 9 }).map(() => ({ x: 10 + r() * 170, y: 66 + r() * 7, rx: 3 + r() * 8, ry: 1.6 + r() * 3.4, o: 0.35 + r() * 0.4 })),
    };
  }, [kind]);
  return (
    <React.Fragment>
      <div className="surface-layer" style={layer(132)} aria-hidden="true">
        <svg viewBox="0 0 132 100" preserveAspectRatio="none" className="surface-svg">
          <defs><linearGradient id={p.far + "f"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.far} /><stop offset="1" stopColor={p.mid} stopOpacity=".85" /></linearGradient></defs>
          <path d={geo.far} fill={`url(#${p.far}f)`} opacity=".62" />
          <path d={geo.far2} fill={p.far} opacity=".78" />
          <path d={geo.far} fill="none" stroke={p.rim} strokeOpacity=".26" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="surface-haze-band" style={{ background: `linear-gradient(to top, ${p.haze}59 0%, ${p.haze}1f 42%, ${p.haze}00 82%)` }} aria-hidden="true" />
      <div className="surface-layer" style={layer(186)} aria-hidden="true">
        <svg viewBox="0 0 186 100" preserveAspectRatio="none" className="surface-svg">
          <defs><linearGradient id={p.mid + "m"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.mid} /><stop offset="1" stopColor={p.near} /></linearGradient></defs>
          <path d={geo.mid} fill={`url(#${p.mid}m)`} opacity=".92" />
          <path d={geo.mid2} fill={p.mid} opacity=".92" />
          {geo.craters.map((c, i) => (
            <g key={i} opacity={c.o}>
              <ellipse cx={c.x} cy={c.y + 1.2} rx={c.rx} ry={c.ry} fill={p.deep} opacity=".45" />
              <ellipse cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={p.mid} />
              <ellipse cx={c.x} cy={c.y + c.ry * 0.3} rx={c.rx * 0.84} ry={c.ry * 0.62} fill={p.deep} opacity=".4" />
              <path d={`M${c.x - c.rx},${c.y} a${c.rx},${c.ry} 0 0 0 ${c.rx * 2},0`} fill="none" stroke={p.rim} strokeOpacity=".55" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </g>))}
        </svg>
      </div>
    </React.Fragment>
  );
};

/* Near ground: graded regolith, dune shading, crater rims, rock scatter and wind ripples. */
const SurfaceGround = ({ kind, layer, children }) => {
  const p = sPal(kind);
  const geo = useMemo(() => {
    const r = sRand(kind === "moon" ? 31 : 19);
    return {
      rocks: Array.from({ length: 30 }).map(() => ({ x: r() * 250, y: 68 + r() * 30, w: 0.8 + r() * 3.4, h: 0.5 + r() * 1.8, o: 0.28 + r() * 0.5 })),
      ripples: Array.from({ length: kind === "moon" ? 7 : 13 }).map(() => ({ x: r() * 240, y: 70 + r() * 27, w: 10 + r() * 34, o: 0.1 + r() * 0.2 })),
      bowls: Array.from({ length: 3 }).map(() => ({ x: 20 + r() * 210, y: 66 + r() * 3, rx: 5 + r() * 8, ry: 1.4 + r() * 1.8 })),
    };
  }, [kind]);
  return (
    <div className="surface-layer surface-ground" style={layer(250)}>
      <svg viewBox="0 0 250 100" preserveAspectRatio="none" className="surface-svg" aria-hidden="true">
        <defs>
          <linearGradient id={p.near + "gr"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.hi} /><stop offset=".14" stopColor={p.near} /><stop offset=".46" stopColor={p.mid} /><stop offset="1" stopColor={p.deep} />
          </linearGradient>
          <radialGradient id={p.near + "dune"} cx="50%" cy="30%" r="70%"><stop offset="0" stopColor={p.hi} stopOpacity=".5" /><stop offset="1" stopColor={p.hi} stopOpacity="0" /></radialGradient>
          <radialGradient id={p.near + "fg"} cx="50%" cy="100%" r="70%"><stop offset="0" stopColor={p.deep} stopOpacity=".75" /><stop offset="1" stopColor={p.deep} stopOpacity="0" /></radialGradient>
        </defs>
        <path d={sGroundPath()} fill={`url(#${p.near}gr)`} />
        {/* soft dune shading breaks up the plain without hard blobs */}
        {[40, 118, 196].map((x, i) => <ellipse key={i} cx={x} cy={76 + (i % 2) * 6} rx={62} ry={11} fill={`url(#${p.near}dune)`} opacity={0.26} />)}
        <ellipse cx="125" cy="104" rx="150" ry="26" fill={`url(#${p.near}fg)`} />
        {/* crater bowls on the near plain */}
        {geo.bowls.map((c, i) => (
          <g key={"b" + i}>
            <ellipse cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={p.deep} opacity=".2" />
            <path d={`M${c.x - c.rx},${c.y} a${c.rx},${c.ry} 0 0 0 ${c.rx * 2},0`} fill="none" stroke={p.rim} strokeOpacity=".3" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            <path d={`M${c.x - c.rx * 0.86},${c.y - c.ry * 0.1} a${c.rx * 0.86},${c.ry * 0.86} 0 0 1 ${c.rx * 1.72},0`} fill="none" stroke={p.deep} strokeOpacity=".32" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          </g>))}
        {geo.ripples.map((r, i) => <path key={"r" + i} d={`M${r.x},${r.y} q${r.w / 2},${-1.6} ${r.w},0`} stroke={p.rim} strokeOpacity={r.o} strokeWidth="1.1" fill="none" vectorEffect="non-scaling-stroke" />)}
        {geo.rocks.map((r, i) => (
          <g key={"k" + i}>
            <ellipse cx={r.x + r.w * 0.2} cy={r.y + r.h * 0.5} rx={r.w} ry={r.h * 0.7} fill={p.deep} opacity={r.o * 0.7} />
            <ellipse cx={r.x} cy={r.y} rx={r.w} ry={r.h} fill={p.mid} opacity={r.o + 0.15} />
            <ellipse cx={r.x - r.w * 0.2} cy={r.y - r.h * 0.3} rx={r.w * 0.7} ry={r.h * 0.5} fill={p.rim} opacity={r.o * 0.5} />
          </g>))}
        <path d="M0,100 L0,91 q34,-9 66,-2 q42,9 84,1 q40,-8 68,2 q18,6 32,4 L250,100 Z" fill={p.deep} opacity=".55" />
        <path d="M0,91 q34,-9 66,-2 q42,9 84,1 q40,-8 68,2 q18,6 32,4" fill="none" stroke={p.rim} strokeOpacity=".22" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="surface-grain" aria-hidden="true" />
      {children}
    </div>
  );
};

/* ---------- craft illustrations ---------- */
const sArtDefs = (id, p) => (
  <defs>
    <linearGradient id={id + "body"} x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stopColor="#f6efe3" /><stop offset=".46" stopColor="#d5c8b4" /><stop offset="1" stopColor="#8a8073" /></linearGradient>
    <linearGradient id={id + "deck"} x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stopColor="#465873" /><stop offset=".55" stopColor="#25324a" /><stop offset="1" stopColor="#111927" /></linearGradient>
    <linearGradient id={id + "metal"} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#e6eaf1" /><stop offset=".5" stopColor="#a9b1be" /><stop offset="1" stopColor="#5a616d" /></linearGradient>
    <radialGradient id={id + "lens"}><stop offset="0" stopColor="#dcf5ff" /><stop offset=".42" stopColor="#3f8fc4" /><stop offset="1" stopColor="#07121e" /></radialGradient>
    <linearGradient id={id + "dust"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.hi} stopOpacity=".58" /><stop offset="1" stopColor={p.mid} stopOpacity=".1" /></linearGradient>
    <radialGradient id={id + "pile"} cx="50%" cy="92%" r="62%"><stop offset="0" stopColor={p.near} stopOpacity=".62" /><stop offset=".5" stopColor={p.mid} stopOpacity=".4" /><stop offset="1" stopColor={p.mid} stopOpacity="0" /></radialGradient>
  </defs>
);

const OpportunityArt = ({ id, p }) => (
  <svg className="s-art" viewBox="0 0 280 200" role="presentation">
    {sArtDefs(id, p)}
    <g transform="rotate(-3.2 140 150)">
      <g opacity=".5"><circle cx="80" cy="152" r="14" fill="#121821" /><circle cx="140" cy="152" r="14" fill="#121821" /><circle cx="200" cy="152" r="14" fill="#121821" /></g>
      <path d="M96,140 L120,152 M184,140 L160,152 M96,140 L80,152" stroke="#8d94a1" strokeWidth="4" strokeLinecap="round" />
      <rect x="46" y="110" width="188" height="14" rx="3" fill={`url(#${id}deck)`} />
      {Array.from({ length: 17 }).map((_, i) => <line key={i} x1={51 + i * 11} y1="110.5" x2={51 + i * 11} y2="123.5" stroke="#7f93b4" strokeOpacity=".38" strokeWidth=".8" />)}
      <rect x="46" y="110" width="188" height="14" rx="3" fill={`url(#${id}dust)`} opacity=".55" />
      <rect x="46" y="110" width="188" height="2.6" rx="1.3" fill="#cfe4ff" opacity=".28" />
      <rect x="104" y="124" width="72" height="30" rx="7" fill={`url(#${id}body)`} />
      <rect x="104" y="124" width="72" height="30" rx="7" fill={`url(#${id}dust)`} opacity=".38" />
      <rect x="112" y="131" width="26" height="14" rx="3" fill="#6d6558" opacity=".5" />
      {[84, 140, 196].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy="166" r="17" fill="#20262f" />
          <circle cx={cx} cy="166" r="17" fill="none" stroke="#4a525f" strokeWidth="2" />
          <circle cx={cx} cy="166" r="7" fill={`url(#${id}metal)`} />
          <circle cx={cx} cy="166" r="2.2" fill="#2b323c" />
        </g>))}
      <path d="M126,110 L120,70" stroke="#c8d0dc" strokeWidth="4" strokeLinecap="round" />
      <g transform="rotate(-6 120 56)">
        <rect x="100" y="44" width="40" height="24" rx="7" fill="#2b3341" />
        <rect x="100" y="44" width="40" height="24" rx="7" fill="none" stroke="#7c8798" strokeWidth="1.2" />
        <circle cx="112" cy="56" r="6.4" fill={`url(#${id}lens)`} /><circle cx="130" cy="56" r="6.4" fill={`url(#${id}lens)`} />
        <ellipse className="s-idle-glint" cx="110" cy="53" rx="2.6" ry="1.5" fill="#ffffff" opacity="0" />
        <ellipse className="s-idle-glint" cx="128" cy="53" rx="2.6" ry="1.5" fill="#ffffff" opacity="0" />
      </g>
      <ellipse cx="150" cy="68" rx="10" ry="4" fill={`url(#${id}metal)`} opacity=".8" />
      <circle className="s-idle-beacon" cx="150" cy="68" r="1.8" fill="#ffb86b" />
    </g>
    {/* regolith drifted against the tyres */}
    {[84, 140, 196].map((cx, i) => <path key={i} d={`M${cx - 19},${184 - (i === 1 ? 2 : 0)} q19,-8 38,0 q-4,10 -19,10 q-15,0 -19,-10 z`} fill={p.near} opacity=".7" />)}
    <path d="M66,184 q34,-6 74,0 q40,6 74,-4" fill="none" stroke={p.hi} strokeOpacity=".42" strokeWidth="1.4" />
  </svg>
);

const SpiritArt = ({ id, p }) => (
  <svg className="s-art" viewBox="0 0 280 200" role="presentation">
    {sArtDefs(id, p)}
    <g transform="rotate(-9 140 148)">
      <g opacity=".45"><circle cx="82" cy="150" r="14" fill="#121821" /><circle cx="140" cy="150" r="14" fill="#121821" /></g>
      <path d="M98,138 L122,150 M182,138 L160,150 M98,138 L82,150" stroke="#8d94a1" strokeWidth="4" strokeLinecap="round" />
      <rect x="48" y="108" width="184" height="14" rx="3" fill={`url(#${id}deck)`} />
      {Array.from({ length: 16 }).map((_, i) => <line key={i} x1={53 + i * 11} y1="108.5" x2={53 + i * 11} y2="121.5" stroke="#7f93b4" strokeOpacity=".32" strokeWidth=".8" />)}
      <rect x="48" y="108" width="184" height="14" rx="3" fill={`url(#${id}dust)`} opacity=".72" />
      <path d="M62,112 q30,4 62,-1 q26,-4 58,2" fill="none" stroke={p.hi} strokeOpacity=".55" strokeWidth="2.6" />
      <rect x="106" y="122" width="70" height="30" rx="7" fill={`url(#${id}body)`} />
      <rect x="106" y="122" width="70" height="30" rx="7" fill={`url(#${id}dust)`} opacity=".48" />
      <rect x="114" y="129" width="24" height="13" rx="3" fill="#6d6558" opacity=".48" />
      {[86, 140].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy="164" r="17" fill="#20262f" />
          <circle cx={cx} cy="164" r="17" fill="none" stroke="#4a525f" strokeWidth="2" />
          <circle cx={cx} cy="164" r="7" fill={`url(#${id}metal)`} />
        </g>))}
      <g>
        <circle cx="196" cy="172" r="17" fill="#20262f" />
        <circle cx="196" cy="172" r="17" fill="none" stroke="#4a525f" strokeWidth="2" />
        <circle cx="196" cy="172" r="7" fill={`url(#${id}metal)`} />
        <path d="M178,180 q18,-9 36,0 l0,10 l-36,0 z" fill={p.near} opacity=".7" />
      </g>
      <path d="M128,108 L124,70" stroke="#c8d0dc" strokeWidth="4" strokeLinecap="round" />
      <g transform="rotate(-9 124 56)">
        <rect x="104" y="44" width="40" height="24" rx="7" fill="#2b3341" />
        <rect x="104" y="44" width="40" height="24" rx="7" fill="none" stroke="#7c8798" strokeWidth="1.2" />
        <circle cx="116" cy="56" r="6.4" fill={`url(#${id}lens)`} /><circle cx="134" cy="56" r="6.4" fill={`url(#${id}lens)`} />
        <ellipse className="s-idle-glint" cx="114" cy="53" rx="2.6" ry="1.5" fill="#ffffff" opacity="0" />
      </g>
      <ellipse cx="152" cy="66" rx="10" ry="4" fill={`url(#${id}metal)`} opacity=".8" />
      <circle className="s-idle-beacon" cx="152" cy="66" r="1.8" fill="#ffb86b" />
    </g>
    {/* soft pit and ripple rings where the wheel dug in */}
    <ellipse cx="198" cy="188" rx="34" ry="10" fill={`url(#${id}pile)`} opacity=".8" />
    <ellipse cx="198" cy="184" rx="30" ry="7" fill={p.deep} opacity=".26" />
    <ellipse cx="198" cy="182" rx="34" ry="8" fill="none" stroke={p.rim} strokeOpacity=".34" strokeWidth="1.4" />
    {[0, 1, 2].map((i) => <path key={i} d={`M${150 - i * 4},${192 + i * 3} q30,${-6 + i * 2} 60,${-1 + i}`} fill="none" stroke={p.rim} strokeOpacity={0.26 - i * 0.06} strokeWidth="1.4" />)}
  </svg>
);

const InSightArt = ({ id, p }) => (
  <svg className="s-art" viewBox="0 0 280 200" role="presentation">
    {sArtDefs(id, p)}
    <g>
      {[[100, 186], [146, 190], [186, 184]].map(([x, y], i) => (
        <g key={i}><line x1={140 - (i - 1) * 14} y1="132" x2={x} y2={y} stroke="#8f8779" strokeWidth="7" strokeLinecap="round" /><line x1={140 - (i - 1) * 14} y1="132" x2={x} y2={y} stroke="#cfc6b6" strokeWidth="3.4" strokeLinecap="round" /></g>))}
      {[76, 204].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy="118" r="42" fill="#182338" />
          <circle cx={cx} cy="118" r="42" fill={`url(#${id}deck)`} />
          {Array.from({ length: 12 }).map((_, k) => <line key={k} x1={cx} y1="78" x2={cx} y2="158" stroke="#8fa6c8" strokeOpacity=".28" strokeWidth=".8" transform={`rotate(${k * 15} ${cx} 118)`} />)}
          <circle cx={cx} cy="118" r="42" fill={`url(#${id}dust)`} opacity=".6" />
          <circle cx={cx} cy="118" r="42" fill="none" stroke="#cfe0f4" strokeOpacity=".5" strokeWidth="1.6" />
          <circle cx={cx} cy="118" r="9" fill={`url(#${id}metal)`} opacity=".9" />
        </g>))}
      <ellipse cx="140" cy="116" rx="52" ry="17" fill={`url(#${id}body)`} />
      <path d="M88,116 q6,26 52,26 q46,0 52,-26 z" fill={`url(#${id}body)`} opacity=".92" />
      <path d="M88,116 q6,26 52,26 q46,0 52,-26 z" fill={`url(#${id}dust)`} opacity=".42" />
      <ellipse cx="140" cy="116" rx="52" ry="17" fill="none" stroke="#f6efe2" strokeOpacity=".45" strokeWidth="1.4" />
      <ellipse cx="140" cy="116" rx="26" ry="8" fill="#3d4b60" opacity=".5" />
      <path d="M158,120 q26,14 30,34 q2,12 -8,16" fill="none" stroke="#b9c2ce" strokeWidth="4" strokeLinecap="round" />
      <path d="M158,120 q26,14 30,34" fill="none" stroke="#eef3f9" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
      <circle cx="180" cy="170" r="4.4" fill={`url(#${id}metal)`} />
      <ellipse cx="62" cy="182" rx="26" ry="7" fill={p.deep} opacity=".4" />
      <path d="M40,180 a22,17 0 0 1 44,0 z" fill={`url(#${id}metal)`} />
      <path d="M40,180 a22,17 0 0 1 44,0" fill="none" stroke="#f4f8fd" strokeOpacity=".7" strokeWidth="1.6" />
      <path d="M40,180 h44" stroke="#4c535e" strokeWidth="2" />
      <path d="M84,180 q22,4 44,-4" fill="none" stroke="#3a424d" strokeWidth="1.6" opacity=".7" />
      <path d="M168,116 L172,84" stroke="#c8d0dc" strokeWidth="3" strokeLinecap="round" />
      <circle className="s-idle-beacon" cx="172" cy="82" r="2.2" fill="#ffc46b" />
    </g>
    <ellipse cx="140" cy="192" rx="120" ry="16" fill={`url(#${id}pile)`} opacity=".7" />
  </svg>
);

const LunokhodArt = ({ id, p }) => (
  <svg className="s-art" viewBox="0 0 280 200" role="presentation">
    {sArtDefs(id, p)}
    <defs>
      <linearGradient id={id + "hull"} x1="0" y1="0" x2="0.22" y2="1"><stop offset="0" stopColor="#cfd6df" /><stop offset=".38" stopColor="#98a1ac" /><stop offset=".74" stopColor="#5f6873" /><stop offset="1" stopColor="#3a4048" /></linearGradient>
    </defs>
    <g opacity=".3" stroke={p.deep} strokeWidth="4" fill="none" strokeDasharray="10 9" strokeLinecap="round">
      <path d="M2,194 q44,-7 88,-3" /><path d="M0,181 q46,-7 90,-3" />
    </g>
    {/* open solar lid hinged at the rear edge of the tub */}
    <g transform="rotate(-9 116 112)">
      <ellipse cx="116" cy="92" rx="68" ry="23" fill="#1d3352" />
      <ellipse cx="116" cy="92" rx="68" ry="23" fill={`url(#${id}deck)`} />
      {Array.from({ length: 10 }).map((_, i) => <line key={i} x1={52 + i * 14.2} y1="70" x2={52 + i * 14.2} y2="114" stroke="#8fa6c8" strokeOpacity=".3" strokeWidth=".9" />)}
      <ellipse cx="116" cy="92" rx="68" ry="23" fill={`url(#${id}dust)`} opacity=".22" />
      <ellipse cx="116" cy="92" rx="68" ry="23" fill="none" stroke="#dbe7f6" strokeOpacity=".5" strokeWidth="1.6" />
      <rect x="112" y="104" width="52" height="6" rx="3" fill="#6d7682" />
    </g>
    {/* flat tub hull */}
    <path d="M64,120 q76,-14 152,0 q8,2 8,10 l0,12 q0,12 -16,12 l-136,0 q-16,0 -16,-12 l0,-12 q0,-8 8,-10 z" fill={`url(#${id}hull)`} />
    <path d="M64,120 q76,-14 152,0" fill="none" stroke="#f2f7fc" strokeOpacity=".8" strokeWidth="1.8" />
    <path d="M60,138 q80,10 160,0" fill="none" stroke="#333a43" strokeOpacity=".45" strokeWidth="1.6" />
    <path d="M60,146 q80,10 160,0 l0,4 q0,12 -16,12 l-128,0 q-16,0 -16,-12 z" fill="#2f353d" opacity=".5" />
    <ellipse cx="140" cy="128" rx="26" ry="7" fill="#2b323b" opacity=".3" />
    <rect x="104" y="124" width="72" height="6" rx="3" fill="#a9b2bd" opacity=".3" />
    {/* cone antenna with spiral */}
    <path d="M204,120 L215,48 L226,120 z" fill={`url(#${id}hull)`} />
    <path d="M206,113 q12,-12 3,-24 q-9,-11 2,-21 q10,-10 2,-19" fill="none" stroke="#454c56" strokeWidth="1.8" opacity=".9" />
    <circle cx="215" cy="46" r="3.2" fill="#ffd79a" />
    {/* eight wheels, four visible and larger than the hull height */}
    {[90, 127, 164, 201].map((cx, i) => (
      <g key={i}>
        <circle cx={cx} cy="166" r="21" fill="#191f27" />
        <circle cx={cx} cy="166" r="21" fill="none" stroke="#666e79" strokeWidth="2.4" />
        <circle cx={cx} cy="166" r="8" fill={`url(#${id}metal)`} />
        {[0, 1, 2, 3, 4, 5].map((k) => <line key={k} x1={cx} y1="146" x2={cx} y2="186" stroke="#3a424c" strokeWidth="1.6" transform={`rotate(${k * 30} ${cx} 166)`} />)}
      </g>))}
    <circle className="s-idle-beacon" cx="96" cy="126" r="2.2" fill="#9adcff" />
    {[90, 127, 164, 201].map((cx, i) => <path key={i} d={`M${cx - 22},${186} q22,-9 44,0 q-5,9 -22,9 q-17,0 -22,-9 z`} fill={p.near} opacity=".55" />)}
    <path d="M56,190 q46,-6 92,-1 q42,4 78,-3" fill="none" stroke={p.rim} strokeOpacity=".26" strokeWidth="1.4" />
  </svg>
);

const S_ART = { opp: OpportunityArt, spi: SpiritArt, ins: InSightArt, lun: LunokhodArt };

/* A craft planted on the ground: contact shadow, soft drift, hover glow and sonar rings. */
const SurfaceCraft = ({ m, p, on, im, real, tag }) => {
  const uid = useMemo(sUid, []);
  const Art = S_ART[m.id];
  const [bad, setBad] = useState(0);
  useEffect(() => setBad(0), [im && im.u]);
  const src = real && im ? (bad === 0 ? im.u : bad === 1 ? im.f : null) : null;
  return (
    <React.Fragment>
      <span className="s-glow" aria-hidden="true" style={{ background: `radial-gradient(closest-side, ${p.rim}4d, ${p.rim}00 72%)` }} />
      <span className="s-sonar" aria-hidden="true"><i /><i /><i /></span>
      <span className="s-shadow" aria-hidden="true" />
      <span className="s-drift" aria-hidden="true" style={{ background: `radial-gradient(60% 100% at 50% 100%, ${p.hi}99, ${p.hi}00 74%)` }} />
      {src
        ? <img className="s-photo" src={src} alt="" referrerPolicy="no-referrer" onError={() => setBad((b) => b + 1)} />
        : Art ? <Art id={uid} p={p} /> : null}
      <span className="surface-tag" style={{ "--tag": p.rim }}>{tag}</span>
    </React.Fragment>
  );
};

