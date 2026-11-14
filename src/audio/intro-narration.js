(function (global) {
  "use strict";
  var React = global.React;
  if (!React) return;

  // Audio never advances the film. Every seek is relative to the preserved video clock.
  global.useIntroNarration = function useIntroNarration(videoRef, voiceSource) {
    var data = global.INTRO_NARRATION || {};
    var offset = Number(data.offset) || 11.833333333333334;
    var length = Number(data.duration) || 14.229333;
    var state = React.useState(false), blocked = state[0], setBlocked = state[1];
    var timeState = React.useState(-1), elapsed = timeState[0], setElapsed = timeState[1];
    var activeState = React.useState(false), active = activeState[0], setActive = activeState[1];
    var control = React.useRef({ unlock: function () {}, stop: function () {}, sync: function () {} });

    React.useEffect(function () {
      var video = videoRef.current;
      if (!video || !global.Audio) return undefined;
      var local = data.sources || [voiceSource || "./audio/intro.mp3", "./audio/intro.ogg"];
      var hosted = ["/manus-storage/intro_f5fa5a3a.mp3", "/manus-storage/intro_9d96128e.ogg"];
      var host = global.location && global.location.hostname;
      var isLocal = host === "localhost" || host === "127.0.0.1" || global.location.protocol === "file:";
      var sources = isLocal ? local.concat(hosted) : hosted.concat(local);
      var audio = new global.Audio();
      audio.preload = "auto";
      audio.loop = false;
      audio.dataset && (audio.dataset.narration = "intro");
      var sourceIndex = 0, dead = false, stopped = false, unavailable = false;
      var pending = false, policyBlocked = false, primed = false, primePending = false;
      var epoch = 0, requestId = null, fadeTimer = null;
      var speaking = false, lastCueTime = -2, duckTarget = 1;
      var listeners = [];

      function listen(node, type, fn) {
        node.addEventListener(type, fn);
        listeners.push(function () { node.removeEventListener(type, fn); });
      }
      function duck(on) {
        if (speaking === on) return;
        speaking = on;
        duckTarget = on ? 0.22 : 1;
        setActive(on);
        if (global.SpaceNarration) global.SpaceNarration.duck("intro", on);
      }
      function pause() {
        epoch += 1;
        pending = false;
        audio.pause();
        duck(false);
      }
      function expectedTime() {
        return (Number(video.currentTime) || 0) - offset;
      }
      function align(time, force) {
        var cap = isFinite(audio.duration) ? Math.max(0, audio.duration - 0.01) : length;
        var expected = Math.max(0, Math.min(time, cap));
        if (force || Math.abs((Number(audio.currentTime) || 0) - expected) > 0.09) {
          try { audio.currentTime = expected; } catch (error) { /* retry after metadata */ }
        }
        audio.playbackRate = Number(video.playbackRate) || 1;
      }
      function playAt(time, gesture) {
        if (dead || stopped || unavailable || pending || (!gesture && policyBlocked)) return;
        align(time, gesture);
        audio.muted = false;
        audio.volume = 1;
        var thisEpoch = ++epoch;
        pending = true;
        var result;
        try { result = audio.play(); } catch (error) { result = Promise.reject(error); }
        Promise.resolve(result).then(function () {
          if (dead || stopped || thisEpoch !== epoch) return;
          pending = false;
          policyBlocked = false;
          setBlocked(false);
          if (!video.paused && !video.muted && expectedTime() >= 0 && expectedTime() < length) duck(true);
          else pause();
        }).catch(function (error) {
          if (dead || stopped || thisEpoch !== epoch) return;
          pending = false;
          duck(false);
          if (error && error.name === "NotAllowedError") {
            policyBlocked = true;
            setBlocked(true);
          }
          // Decode/network errors are handled by the source fallback listener.
        });
      }
      function sync(force, frameTime) {
        if (dead || stopped) return;
        var time = (isFinite(frameTime) ? frameTime : Number(video.currentTime) || 0) - offset;
        if (Math.abs(time - lastCueTime) >= 0.025 || force) {
          lastCueTime = time;
          setElapsed(time >= 0 && time < length ? time : -1);
        }
        if (time < 0 || time >= length || video.paused || video.ended || video.muted) {
          if (!audio.paused && !primePending) pause();
          else duck(false);
        } else {
          align(expectedTime(), force);
          if (audio.paused) playAt(expectedTime(), false);
          else if (!pending) duck(true);
        }
        // Ease the existing film score down/up, never replace its soundtrack.
        var volume = Number(video.volume);
        var next = volume + (duckTarget - volume) * 0.16;
        if (Math.abs(next - volume) > 0.001) {
          try { video.volume = Math.max(0, Math.min(1, next)); } catch (error) { /* detached */ }
        }
      }
      function unlock() {
        if (dead || stopped || unavailable) return;
        policyBlocked = false;
        setBlocked(false);
        var time = expectedTime();
        if (time >= 0 && time < length) {
          // Called synchronously inside the actual click, before awaiting video.play().
          pending = false;
          playAt(time, true);
        } else if (time < 0 && !primed && !primePending) {
          // Prime THIS audio element inside the gesture without starting the story early.
          primePending = true;
          audio.muted = true;
          var promise;
          try { promise = audio.play(); } catch (error) { promise = Promise.reject(error); }
          Promise.resolve(promise).then(function () {
            if (dead || stopped) return;
            primePending = false;
            primed = true;
            audio.pause();
            try { audio.currentTime = 0; } catch (error) { /* metadata pending */ }
            audio.muted = false;
            sync(true);
          }).catch(function () { primePending = false; });
        }
      }
      function stop() {
        if (stopped) return;
        stopped = true;
        epoch += 1;
        pending = false;
        duck(false);
        setElapsed(-1);
        var from = audio.volume, began = Date.now();
        fadeTimer = global.setInterval(function () {
          var p = Math.min(1, (Date.now() - began) / 180);
          audio.volume = Math.max(0, from * (1 - p));
          if (p >= 1) { global.clearInterval(fadeTimer); fadeTimer = null; audio.pause(); }
        }, 30);
      }
      control.current = { unlock: unlock, stop: stop, sync: function () { sync(true); } };
      listen(audio, "error", function () {
        if (dead || stopped) return;
        pause();
        sourceIndex += 1;
        if (sourceIndex < sources.length) { audio.src = sources[sourceIndex]; audio.load(); }
        else { unavailable = true; setBlocked(false); }
      });
      listen(audio, "loadedmetadata", function () { sync(true); });
      listen(audio, "canplay", function () { sync(false); });
      listen(audio, "ended", function () { duck(false); });
      listen(video, "pause", function () { if (!primePending) pause(); });
      listen(video, "seeking", function () { pause(); sync(true); });
      listen(video, "seeked", function () { sync(true); });
      listen(video, "ratechange", function () { sync(true); });
      listen(video, "volumechange", function () {
        if (video.muted) pause();
        else sync(false);
      });
      audio.src = sources[0];
      audio.load();
      // Presented-frame callbacks start at frame 284, the first fully black frame.
      function frame(now, metadata) {
        sync(false, metadata.mediaTime);
        if (!dead && !stopped) requestId = video.requestVideoFrameCallback(frame);
      }
      if (video.requestVideoFrameCallback) requestId = video.requestVideoFrameCallback(frame);
      // Fallback also handles background tabs, a paused/seeking film, and older browsers.
      var ticker = global.setInterval(function () { sync(false); }, 50);
      return function () {
        dead = true;
        epoch += 1;
        global.clearInterval(ticker);
        if (fadeTimer) global.clearInterval(fadeTimer);
        if (requestId !== null && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(requestId);
        listeners.forEach(function (remove) { remove(); });
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        if (global.SpaceNarration) global.SpaceNarration.duck("intro", false);
        control.current = { unlock: function () {}, stop: function () {}, sync: function () {} };
      };
    }, [videoRef, voiceSource]);

    return {
      blocked: blocked,
      active: active,
      elapsed: elapsed,
      unlock: function () { control.current.unlock(); },
      stop: function () { control.current.stop(); },
      sync: function () { control.current.sync(); }
    };
  };
})(window);
