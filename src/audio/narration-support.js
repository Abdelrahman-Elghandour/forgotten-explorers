(function (global) {
  "use strict";
  var owners = new Set();
  function duck(owner, active) {
    if (active) owners.add(owner); else owners.delete(owner);
    global.dispatchEvent(new CustomEvent("fe:narration-duck", {
      detail: { ducked: owners.size > 0, owners: Array.from(owners) }
    }));
  }
  function cueAt(cues, time) {
    if (!Array.isArray(cues) || !isFinite(time)) return null;
    for (var i = 0; i < cues.length; i += 1) {
      if (time >= cues[i].start && time < cues[i].end) return cues[i];
    }
    return null;
  }
  global.SpaceNarration = {
    duck: duck,
    cueAt: cueAt,
    isDucked: function () { return owners.size > 0; }
  };
})(window);
