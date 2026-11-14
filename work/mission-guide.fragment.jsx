/* MissionGuide — injected into the existing React 18 inline Babel surface. */
function MissionGuide({ mission, en, live, time, duration, muted, onToggle, onReplay }) {
  const [open, setOpen] = React.useState(true);
  const [imageFailed, setImageFailed] = React.useState(false);
  const closeButtonRef = React.useRef(null);
  const reopenButtonRef = React.useRef(null);
  const restoreFocus = React.useRef(false);
  const playbackSnapshot = React.useRef({ wasLive: false, lastTime: 0, lastDuration: 0 });
  const pearlId = `missionGuidePearl${React.useId().replace(/:/g, "")}`;
  const cyanId = `missionGuideCyan${React.useId().replace(/:/g, "")}`;
  const missionId = mission && mission.id;

  React.useEffect(() => {
    setOpen(true);
    setImageFailed(false);
    playbackSnapshot.current = { wasLive: false, lastTime: 0, lastDuration: 0 };
    restoreFocus.current = false;
  }, [missionId]);

  React.useEffect(() => {
    if (!restoreFocus.current) return;
    if (open) closeButtonRef.current && closeButtonRef.current.focus();
    else reopenButtonRef.current && reopenButtonRef.current.focus();
    if (open) restoreFocus.current = false;
  }, [open]);

  if (!mission) return null;

  const facts = {
    opp: {
      en: "Evidence of past water on Mars.",
      ar: "أدلة على وجود مياه قديمة على المريخ."
    },
    spi: {
      en: "Silica-rich soil pointed to past hot springs.",
      ar: "تربة غنية بالسيليكا أشارت إلى ينابيع حارة قديمة."
    },
    lun: {
      en: "The first successful remotely operated rover on another world.",
      ar: "أول عربة ناجحة تُقاد عن بُعد على عالم آخر."
    }
  };
  const names = {
    opp: "Opportunity",
    spi: "Spirit",
    lun: "Lunokhod 1"
  };
  const fact = facts[missionId] || {
    en: "A field-tested machine extended what humans could explore.",
    ar: "آلة ميدانية وسّعت حدود ما يستطيع البشر استكشافه."
  };
  const missionName = en ? (mission.enName || names[missionId] || mission.name || mission.n || missionId) : (mission.n || mission.arName || mission.name || names[missionId] || missionId);
  const guideAccent = missionId === "spi" ? "#8bd3ff" : missionId === "lun" ? "#f3c777" : "#82e8df";
  const voiceData = typeof window !== "undefined" && window.VOICE_ENVELOPES;
  const rate = voiceData && Number(voiceData.rate) > 0 ? Number(voiceData.rate) : 20;
  const envelope = voiceData && Array.isArray(voiceData[missionId]) ? voiceData[missionId] : null;
  const sampleIndex = Math.max(0, Math.min(envelope ? envelope.length - 1 : 0, Math.floor(Math.max(0, Number(time) || 0) * rate)));
  const sampledLevel = live && !muted && envelope && envelope.length ? Number(envelope[sampleIndex]) || 0 : 0;
  const speechLevel = Math.max(0, Math.min(1, sampledLevel));
  const numericTime = Math.max(0, Number(time) || 0);
  const numericDuration = Math.max(0, Number(duration) || 0);
  if (live) {
    playbackSnapshot.current = { wasLive: true, lastTime: numericTime, lastDuration: numericDuration };
  }
  const reachedEnd = numericDuration > 0 && numericTime >= Math.max(0, numericDuration - 0.25);
  const parentResetAfterEnd = !live && numericTime === 0 && numericDuration === 0 && playbackSnapshot.current.wasLive && playbackSnapshot.current.lastDuration > 0;
  const ended = reachedEnd || parentResetAfterEnd;
  const mode = muted ? "muted" : ended ? "ended" : live ? "speaking" : numericTime > 0.08 ? "paused" : "ready";
  const modeText = {
    speaking: en ? "Speaking" : "يتحدث",
    paused: en ? "Paused" : "متوقف مؤقتاً",
    ready: en ? "Ready" : "جاهز",
    ended: en ? "Ended" : "انتهى",
    muted: en ? "Muted" : "صامت"
  }[mode];
  const playLabel = mode === "muted" ? (en ? "Enable sound and listen" : "تشغيل الصوت والاستماع") : mode === "speaking"
    ? (en ? "Pause narration" : "إيقاف السرد مؤقتاً")
    : mode === "ended"
      ? (en ? "Replay narration" : "إعادة تشغيل السرد")
      : (en ? (mode === "paused" ? "Resume narration" : "Play narration") : (mode === "paused" ? "استئناف السرد" : "تشغيل السرد"));
  const barHeights = [0.42, 0.72, 0.54, 0.9, 0.62, 0.78, 0.46].map((weight, index) => {
    const idle = 0.22 + ((index * 7) % 4) * 0.035;
    return `${Math.round(100 * (mode === "speaking" ? idle + speechLevel * weight : idle))}%`;
  });
  const cardStyle = {
    "--guide-accent": guideAccent,
    "--speech-level": speechLevel,
    "--speech-opacity": mode === "speaking" ? 1 : 0.48
  };
  const handlePlay = () => {
    if (mode === "ended") onReplay && onReplay(mission);
    else onToggle && onToggle(mission);
  };
  const hideGuide = () => {
    restoreFocus.current = true;
    setOpen(false);
  };
  const restoreGuide = () => {
    restoreFocus.current = true;
    setOpen(true);
  };

  return (
    <div className="mission-guide" style={cardStyle} data-open={open ? "1" : "0"} data-mode={mode} data-mission={missionId} dir="ltr" onPointerDown={(event) => event.stopPropagation()}>
      {open ? (
        <section className="mission-guide__card" aria-label={en ? `Mission guide for ${missionName}` : `دليل المهمة ${missionName}`}>
          <div className="mission-guide__avatar" aria-hidden="true">
            {!imageFailed ? (
              <img src="./images/mission-guide.webp" alt="" onError={() => setImageFailed(true)} />
            ) : (
              <svg className="mission-guide__robot" data-guide-fallback="true" viewBox="0 0 120 148" role="presentation">
                <defs>
                  <linearGradient id={pearlId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="0.55" stopColor="#dce8ef" />
                    <stop offset="1" stopColor="#9cacbb" />
                  </linearGradient>
                  <linearGradient id={cyanId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#9cf8f0" />
                    <stop offset="1" stopColor="#31b8d5" />
                  </linearGradient>
                </defs>
                <path d="M60 10v10" stroke="#91e8e1" strokeWidth="3" strokeLinecap="round" />
                <circle cx="60" cy="8" r="4" fill="#f3c777" />
                <rect x="17" y="26" width="86" height="67" rx="25" fill="#111b2b" stroke="#e9f5fb" strokeOpacity=".8" strokeWidth="3" />
                <rect x="24" y="33" width="72" height="53" rx="19" fill="#1a293c" />
                <circle cx="45" cy="58" r="9" fill={`url(#${cyanId})`} />
                <circle cx="75" cy="58" r="9" fill={`url(#${cyanId})`} />
                <circle cx="42" cy="55" r="2.5" fill="#ffffff" opacity=".9" />
                <circle cx="72" cy="55" r="2.5" fill="#ffffff" opacity=".9" />
                <path d={speechLevel > 0.18 ? "M47 75 Q60 84 73 75" : "M49 76 Q60 79 71 76"} fill="none" stroke="#f3b86c" strokeWidth="4" strokeLinecap="round" />
                <path d="M16 71H9M104 71h7" stroke="#91e8e1" strokeWidth="3" strokeLinecap="round" />
                <rect x="27" y="91" width="66" height="42" rx="18" fill={`url(#${pearlId})`} stroke="#ffffff" strokeOpacity=".72" strokeWidth="2" />
                <path d="M43 101v15M60 101v15M77 101v15" stroke="#7890a0" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
                <circle cx="60" cy="124" r="4" fill="#f3c777" />
                <path d="M33 133l-8 8M87 133l8 8" stroke="#b8c9d4" strokeWidth="6" strokeLinecap="round" />
              </svg>
            )}
            <span className="mission-guide__signal" aria-hidden="true">
              <i /><i /><i />
            </span>
          </div>

          <div className="mission-guide__content" dir={en ? "ltr" : "rtl"}>
            <div className="mission-guide__topline">
              <div className="mission-guide__identity">
                <span className="mission-guide__label">MISSION GUIDE · دليل المهمة</span>
                <strong className="mission-guide__name" title={missionName}>{missionName}</strong>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="mission-guide__close mission-guide__hide"
                onClick={hideGuide}
                aria-label={en ? "Hide mission guide" : "إخفاء دليل المهمة"}
                title={en ? "Hide guide" : "إخفاء الدليل"}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
              </button>
            </div>

            <div className="mission-guide__status" role="status" aria-live="polite">
              <span className="mission-guide__status-dot" aria-hidden="true" />
              <span>{modeText}</span>
              <span className="mission-guide__bars" aria-hidden="true">
                {barHeights.map((height, index) => <i key={index} style={{ height }} />)}
              </span>
            </div>

            <div className="mission-guide__fact" aria-label={en ? "Why it matters" : "أثر المهمة"}>
              <span className="mission-guide__fact-label">WHY IT MATTERS / أثر المهمة</span>
              <span className="mission-guide__fact-text" title={en ? fact.en : fact.ar}>{en ? fact.en : fact.ar}</span>
            </div>

            {mode === "speaking" && (
              <p className="mission-guide__follow" lang={en ? "en" : "ar"}>
                {en ? "Follow the English captions below." : "تابع الترجمة الإنجليزية أسفل الصورة."}
              </p>
            )}

            <div className="mission-guide__controls">
              <button
                type="button"
                className="mission-guide__play"
                onClick={handlePlay}
                aria-label={playLabel}
                aria-pressed={mode === "speaking"}
                title={playLabel}
              >
                {mode === "speaking" ? (
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4h3v12H5zM12 4h3v12h-3z" /></svg>
                ) : (
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4.8v10.4a1 1 0 0 0 1.5.86l7.1-5.2a1 1 0 0 0 0-1.62l-7.1-5.2A1 1 0 0 0 7 4.8z" /></svg>
                )}
                <span>{mode === "speaking" ? (en ? "Pause" : "إيقاف") : mode === "paused" ? (en ? "Resume" : "استئناف") : mode === "ended" ? (en ? "Replay" : "إعادة") : (en ? "Play" : "تشغيل")}</span>
              </button>
              <button
                type="button"
                className="mission-guide__replay"
                onClick={() => onReplay && onReplay(mission)}
                aria-label={en ? "Replay narration from the beginning" : "إعادة السرد من البداية"}
                title={en ? "Replay from start" : "إعادة من البداية"}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 9a6 6 0 1 0 0 4M16 9V4m0 5h-5" /></svg>
                <span>{en ? "Replay" : "إعادة"}</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <button
          ref={reopenButtonRef}
          type="button"
          className="mission-guide__reopen"
          onClick={restoreGuide}
          aria-label={en ? "Show mission guide" : "إظهار دليل المهمة"}
          aria-expanded={false}
          title={en ? "Show mission guide" : "إظهار دليل المهمة"}
        >
          <span className="mission-guide__reopen-dot" aria-hidden="true" />
          <span>GUIDE</span>
        </button>
      )}
    </div>
  );
}
