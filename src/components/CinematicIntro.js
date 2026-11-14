(function (global) {
  "use strict";

  var React = global.React;
  if (!React) return;

  var h = React.createElement;
  var DISSOLVE_MS = 1200;
  var DISSOLVE_LEAD = 1.2; // seconds before the end where the canvas takes over
  var MUSIC_LEAD = 6; // the homepage score enters softly before the visual dissolve

  function isIntroControl(target) {
    var node = target;
    while (node && node !== document) {
      if (node.getAttribute && node.getAttribute("data-intro-control") !== null) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  function formatTime(value) {
    var seconds = Math.max(0, Math.floor(Number(value) || 0));
    var minutes = Math.floor(seconds / 60);
    var remainder = String(seconds % 60).padStart(2, "0");
    return String(minutes).padStart(2, "0") + ":" + remainder;
  }

  global.CinematicIntro = function CinematicIntro(props) {
    props = props || {};

    var lang = props.lang === "ar" ? "ar" : "en";
    var isArabic = lang === "ar";
    var localSource = "./videos/intro.mp4";
    var hostedSource = "/manus-storage/intro_73087b23.mp4";
    var location = global.location || {};
    var isLocalHost = location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
    var sources = isLocalHost ? [localSource, hostedSource] : [hostedSource, localSource];
    // Dedicated slot for a recorded narration of the opening film; when the file is
    // absent the film keeps its own soundtrack and nothing about the scene changes.
    var voiceSource = typeof props.voiceSource === "string" ? props.voiceSource : "";

    var sourceState = React.useState(0);
    var sourceIndex = sourceState[0];
    var setSourceIndex = sourceState[1];
    var mutedState = React.useState(Boolean(props.muted));
    var isMuted = mutedState[0];
    var setIsMuted = mutedState[1];
    var durationState = React.useState(28);
    var duration = durationState[0];
    var setDuration = durationState[1];
    var currentTimeState = React.useState(0);
    var currentTime = currentTimeState[0];
    var setCurrentTime = currentTimeState[1];
    var fadingState = React.useState(false);
    var fading = fadingState[0];
    var setFading = fadingState[1];
    var tapState = React.useState(false);
    var needsTap = tapState[0];
    var setNeedsTap = tapState[1];
    var errorState = React.useState(false);
    var mediaError = errorState[0];
    var setMediaError = errorState[1];

    var videoRef = React.useRef(null);
    var mutedRef = React.useRef(Boolean(props.muted));
    var explicitMuteRef = React.useRef(false);
    var interactionConsumedRef = React.useRef(false);
    var completedRef = React.useRef(false);
    var musicLeadRef = React.useRef(false);
    var playEpochRef = React.useRef(0);
    var completionTimerRef = React.useRef(null);
    var volumeRampRef = React.useRef(null);
    var sourceErrorRef = React.useRef(-1);
    var fallbackUsedRef = React.useRef(false);
    var removeInteractionListenersRef = React.useRef(function () {});
    var startPlaybackRef = React.useRef(function () {});
    var firstInteractionRef = React.useRef(props.onFirstInteraction);
    var mutedChangeRef = React.useRef(props.onMutedChange);
    var beginTransitionRef = React.useRef(props.onBeginTransition);
    var musicLeadCallbackRef = React.useRef(props.onMusicLeadIn);
    var completeRef = React.useRef(props.onComplete);
    var languageToggleRef = React.useRef(props.onLanguageToggle);
    var source = sources[sourceIndex] || sources[0];

    var narration = global.useIntroNarration
      ? global.useIntroNarration(videoRef, voiceSource)
      : { blocked: false, elapsed: -1, unlock: function () {}, stop: function () {}, sync: function () {} };
    var transcriptState = React.useState(false);
    var transcriptOpen = transcriptState[0], setTranscriptOpen = transcriptState[1];
    var captionState = React.useState(true);
    var captionsOn = captionState[0], setCaptionsOn = captionState[1];
    var introData = global.INTRO_NARRATION || {};
    var currentCue = (global.SpaceNarration && global.SpaceNarration.cueAt(introData.cues, narration.elapsed)) || null;

    mutedRef.current = Boolean(props.muted);
    firstInteractionRef.current = props.onFirstInteraction;
    mutedChangeRef.current = props.onMutedChange;
    beginTransitionRef.current = props.onBeginTransition;
    musicLeadCallbackRef.current = props.onMusicLeadIn;
    completeRef.current = props.onComplete;
    languageToggleRef.current = props.onLanguageToggle;

    function updateMuted(next, notifyParent) {
      var value = Boolean(next);
      mutedRef.current = value;
      setIsMuted(value);
      if (notifyParent && typeof mutedChangeRef.current === "function") {
        mutedChangeRef.current(value);
      }
    }

    function startPlayback(allowUnmute) {
      var video = videoRef.current;
      if (!video || completedRef.current) return;

      var epoch = playEpochRef.current + 1;
      playEpochRef.current = epoch;
      var shouldMute = Boolean(mutedRef.current);
      if (allowUnmute && !explicitMuteRef.current) {
        shouldMute = false;
      }

      video.muted = shouldMute;
      updateMuted(shouldMute, true);
      setNeedsTap(false);
      if (allowUnmute && !shouldMute) narration.unlock();

      var playResult;
      try {
        playResult = video.play();
      } catch (error) {
        playResult = Promise.reject(error);
      }

      Promise.resolve(playResult).then(function () {
        if (epoch !== playEpochRef.current || completedRef.current) return;
        setNeedsTap(false);
        updateMuted(video.muted, false);
      }).catch(function () {
        if (epoch !== playEpochRef.current || completedRef.current) return;

        if (!shouldMute && !explicitMuteRef.current) {
          var fallbackEpoch = playEpochRef.current + 1;
          playEpochRef.current = fallbackEpoch;
          video.muted = true;
          // Autoplay policy mutes only this video, not the visitor's app-wide preference.
          updateMuted(true, false);
          var mutedPlay;
          try {
            mutedPlay = video.play();
          } catch (mutedError) {
            mutedPlay = Promise.reject(mutedError);
          }
          Promise.resolve(mutedPlay).then(function () {
            if (fallbackEpoch !== playEpochRef.current || completedRef.current) return;
            setNeedsTap(false);
          }).catch(function () {
            if (fallbackEpoch === playEpochRef.current && !completedRef.current) {
              setNeedsTap(true);
            }
          });
        } else {
          setNeedsTap(true);
        }
      });
    }

    startPlaybackRef.current = startPlayback;

    function unlockFromControl() {
      interactionConsumedRef.current = true;
      removeInteractionListenersRef.current();
      if (typeof firstInteractionRef.current === "function") {
        firstInteractionRef.current();
      }
    }

    function finishIntro() {
      if (completedRef.current) return;
      completedRef.current = true;
      narration.stop();
      interactionConsumedRef.current = true;
      removeInteractionListenersRef.current();
      playEpochRef.current += 1;

      if (completionTimerRef.current) {
        global.clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }

      var video = videoRef.current;
      // The video keeps running underneath while it fades, so motion never stops mid-dissolve.
      if (video) {
        var startVolume = video.volume;
        var startedAt = Date.now();
        volumeRampRef.current = global.setInterval(function () {
          var progress = Math.min(1, (Date.now() - startedAt) / DISSOLVE_MS);
          try { video.volume = Math.max(0, startVolume * (1 - progress)); } catch (error) { /* detached */ }
          if (progress >= 1) {
            global.clearInterval(volumeRampRef.current);
            volumeRampRef.current = null;
            try { video.pause(); } catch (error) { /* detached */ }
          }
        }, 60);
      }
      setFading(true);

      if (typeof beginTransitionRef.current === "function") {
        beginTransitionRef.current();
      }

      completionTimerRef.current = global.setTimeout(function () {
        completionTimerRef.current = null;
        if (typeof completeRef.current === "function") {
          completeRef.current();
        }
      }, DISSOLVE_MS);
    }

    function handleLanguageToggle() {
      unlockFromControl();
      if (typeof languageToggleRef.current === "function") {
        languageToggleRef.current();
      }
      startPlayback(!explicitMuteRef.current);
    }

    function handleMuteToggle() {
      unlockFromControl();
      var video = videoRef.current;
      var next = narration.blocked ? false : !(video ? video.muted : mutedRef.current);
      explicitMuteRef.current = next;
      if (video) video.muted = next;
      updateMuted(next, true);
      if (!next) startPlayback(true);
    }

    function handleTapToPlay() {
      unlockFromControl();
      startPlayback(!explicitMuteRef.current);
    }

    function handleVideoError() {
      if (completedRef.current || sourceErrorRef.current === sourceIndex) return;
      sourceErrorRef.current = sourceIndex;

      if (sourceIndex < sources.length - 1 && !fallbackUsedRef.current) {
        fallbackUsedRef.current = true;
        setMediaError(false);
        setNeedsTap(false);
        setSourceIndex(sourceIndex + 1);
      } else {
        setMediaError(true);
        setNeedsTap(true);
      }
    }

    function handleLoadedMetadata(event) {
      var video = event.currentTarget;
      var nextDuration = Number(video.duration);
      if (!isFinite(nextDuration) || nextDuration <= 0) nextDuration = 28;
      setDuration(nextDuration);
      setCurrentTime(Number(video.currentTime) || 0);
      setMediaError(false);
    }

    function handleTimeUpdate(event) {
      var video = event.currentTarget;
      var time = Number(video.currentTime) || 0;
      setCurrentTime(time);
      var length = Number(video.duration);
      if (!completedRef.current && !musicLeadRef.current && isFinite(length) && length > MUSIC_LEAD && time >= length - MUSIC_LEAD) {
        musicLeadRef.current = true;
        if (typeof musicLeadCallbackRef.current === "function") musicLeadCallbackRef.current();
      }
      if (!completedRef.current && isFinite(length) && length > DISSOLVE_LEAD && time >= length - DISSOLVE_LEAD) {
        finishIntro();
      }
    }

    function handleVolumeChange(event) {
      var video = event.currentTarget;
      setIsMuted(Boolean(video.muted));
      mutedRef.current = Boolean(video.muted);
    }

    React.useEffect(function () {
      var video = videoRef.current;
      if (!video) return undefined;

      video.muted = Boolean(props.muted);
      video.defaultMuted = false;
      try { video.volume = 1; } catch (error) { /* detached */ }
      mutedRef.current = Boolean(props.muted);
      setIsMuted(Boolean(props.muted));
      video.load();
      // Sound is the default: attempt audible playback first. Only a browser policy
      // refusal falls back to a silent start, and the first interaction then unmutes.
      startPlayback(true);

      return function () {
        playEpochRef.current += 1;
      };
    }, [sourceIndex]);

    React.useEffect(function () {
      var video = videoRef.current;
      if (!video) return undefined;
      video.muted = Boolean(props.muted);
      mutedRef.current = Boolean(props.muted);
      setIsMuted(Boolean(props.muted));
      return undefined;
    }, [props.muted]);

    React.useEffect(function () {
      function handleEligibleInteraction(event) {
        if (interactionConsumedRef.current || completedRef.current) return;
        if (isIntroControl(event.target)) return;

        interactionConsumedRef.current = true;
        removeInteractionListenersRef.current();
        if (typeof firstInteractionRef.current === "function") {
          firstInteractionRef.current();
        }
        startPlaybackRef.current(!explicitMuteRef.current);
      }

      function removeListeners() {
        document.removeEventListener("pointerdown", handleEligibleInteraction, true);
        document.removeEventListener("keydown", handleEligibleInteraction, true);
      }

      removeInteractionListenersRef.current = removeListeners;
      document.addEventListener("pointerdown", handleEligibleInteraction, true);
      document.addEventListener("keydown", handleEligibleInteraction, true);

      return removeListeners;
    }, []);

    React.useEffect(function () {
      return function () {
        playEpochRef.current += 1;
        if (completionTimerRef.current) {
          global.clearTimeout(completionTimerRef.current);
          completionTimerRef.current = null;
        }
        if (volumeRampRef.current) {
          global.clearInterval(volumeRampRef.current);
          volumeRampRef.current = null;
        }
        removeInteractionListenersRef.current();
        var video = videoRef.current;
        if (video) {
          video.pause();
          video.removeAttribute("src");
          video.load();
        }
      };
    }, []);

    var progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
    var rootClass = "intro-overlay" + (fading ? " intro-overlay--fading" : "");
    var muteLabel = isMuted || narration.blocked
      ? "Unmute / تشغيل الصوت"
      : "Mute / كتم الصوت";
    var languageLabel = isArabic ? "EN" : "عربي";
    var errorLabel = isArabic ? "تعذر تحميل الفيديو. يمكنك التخطي أو المحاولة مرة أخرى." : "The cinematic video could not load. You can skip or try again.";
    var tapLabel = isArabic ? "اضغط للتشغيل" : "Tap to play";

    return h(
      "section",
      {
        className: rootClass,
        dir: isArabic ? "rtl" : "ltr",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": isArabic ? "المقدمة السينمائية" : "Cinematic introduction"
      },
      h("video", {
        ref: videoRef,
        className: "intro-video",
        src: source,
        playsInline: true,
        preload: "auto",
        "aria-label": isArabic ? "فيديو مقدمة فضائية" : "Space cinematic introduction",
        onError: handleVideoError,
        onLoadedMetadata: handleLoadedMetadata,
        onTimeUpdate: handleTimeUpdate,
        onVolumeChange: handleVolumeChange,
        onEnded: finishIntro
      }),
      h("div", { className: "intro-video-shade", "aria-hidden": "true" }),
      h("div", { className: "intro-radial-glow", "aria-hidden": "true" }),
      captionsOn && currentCue && h("div", {
        className: "intro-caption voice-caption", dir: "ltr", lang: "en",
        "aria-live": "off", "data-audio-time": String(narration.elapsed)
      }, h("span", null, currentCue.text)),
      transcriptOpen && h("div", {
        className: "intro-transcript-backdrop", "data-intro-control": "true",
        onClick: function (event) { if (event.target === event.currentTarget) setTranscriptOpen(false); }
      }, h("section", {
        className: "intro-transcript-panel", dir: "ltr", lang: "en",
        "aria-label": "English intro transcript"
      }, h("div", { className: "intro-transcript-panel__head" },
        h("span", null, "INTRO TRANSCRIPT / النص"),
        h("button", { type: "button", "data-intro-control": "true", "aria-label": "Close transcript", onClick: function () { setTranscriptOpen(false); } }, "×")
      ), h("h2", null, "Forgotten Explorers"),
      h("p", null, introData.text || "The intro transcript is loading."),
      h("p", { className: "intro-transcript-original", dir: "rtl", lang: "ar" }, introData.arabic || ""))) ,
      h(
        "div",
        { className: "intro-badge", dir: "ltr" },
        h("span", { className: "intro-badge__mark", "aria-hidden": "true" }),
        h("span", null, "NASA SPACE APPS 2026 | BEYOND THE SIGNAL")
      ),
      h(
        "nav",
        { className: "intro-top-hud", dir: "ltr", "aria-label": isArabic ? "أدوات المقدمة" : "Introduction controls" },
        h("button", {
          type: "button", className: "voice-transcript-toggle intro-transcript-toggle",
          "data-intro-control": "true", "aria-expanded": transcriptOpen,
          onClick: function () { unlockFromControl(); setTranscriptOpen(!transcriptOpen); }
        }, "Transcript / النص"),
        h("button", {
          type: "button", className: "voice-transcript-toggle intro-captions-toggle",
          "data-intro-control": "true", "aria-pressed": captionsOn,
          "aria-label": "English captions",
          onClick: function () { unlockFromControl(); setCaptionsOn(!captionsOn); }
        }, "CC"),
          h(
            "button",
            {
              type: "button",
              className: "intro-audio-control intro-audio-control--corner",
              "data-intro-control": "true",
              onClick: handleMuteToggle,
              "aria-pressed": !(isMuted || narration.blocked),
              "aria-label": muteLabel,
              dir: isArabic ? "rtl" : "ltr"
            },
            h("span", { className: isMuted || narration.blocked ? "intro-audio-icon intro-audio-icon--muted" : "intro-audio-icon", "aria-hidden": "true" }),
            h("span", null, muteLabel)
          ),
        h(
          "button",
          {
            type: "button",
            className: "intro-language",
            "data-intro-control": "true",
            onClick: handleLanguageToggle,
            "aria-label": isArabic ? "Switch to English" : "التبديل إلى العربية"
          },
          languageLabel
        ),
      ),
      h(
        "div",
        { className: "intro-bottom-hud" },
        h(
          "div",
          { className: "intro-status-row" },
          h(
            "span",
            { className: "intro-timecode", dir: "ltr", "aria-label": isArabic ? "الوقت المنقضي" : "Elapsed time" },
            formatTime(currentTime),
            " / ",
            formatTime(duration || 28)
          )
        ),
        h(
          "div",
          {
            className: "intro-progress",
            role: "progressbar",
            "aria-valuemin": "0",
            "aria-valuemax": String(duration || 28),
            "aria-valuenow": String(Math.min(duration || 28, currentTime)),
            "aria-label": isArabic ? "تقدم الفيديو" : "Video progress"
          },
          h("span", { className: "intro-progress__fill", style: { width: String(progress) + "%" } })
        ),
        (needsTap || mediaError) && h(
          "div",
          { className: "intro-recovery", role: "status", "aria-live": "polite" },
          h("p", { className: "intro-recovery__message" }, mediaError ? errorLabel : (isArabic ? "اضغط لبدء الفيديو." : "Tap to start the video.")),
          h(
            "button",
            {
              type: "button",
              className: "intro-tap-play",
              "data-intro-control": "true",
              onClick: handleTapToPlay,
              "aria-label": tapLabel
            },
            tapLabel
          ),
          mediaError && h(
            "button",
            {
              type: "button",
              className: "intro-tap-play",
              "data-intro-control": "true",
              onClick: finishIntro,
              "aria-label": isArabic ? "متابعة" : "Continue"
            },
            isArabic ? "متابعة" : "Continue"
          )
        )
      )
    );
  };
})(window);
