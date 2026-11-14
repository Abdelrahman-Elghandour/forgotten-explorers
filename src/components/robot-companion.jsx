/* 3D talking robot companion.
 *
 * A small Three.js scene in the corner of the craft view that builds the selected rover
 * from primitives, breathes while the narration plays, and pulses its optics from the
 * recording's own RMS envelope (src/data/voice-envelopes.js) so the light follows the voice.
 * The glass bubble beside it shows the English transcript sentence by sentence.
 */
(function () {
  const React = window.React;
  if (!React) return;
  const { useEffect, useMemo, useRef, useState } = React;
  const h = React.createElement;

  const KINDS = { opp: "mer", spi: "mer", lun: "lunokhod" };
  const DARK = 0x11182a;

  function mat(THREE, color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({ color, metalness: 0.45, roughness: 0.55 }, opts || {}));
  }

  function wheel(THREE, r, w) {
    const g = new THREE.Group();
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 22), mat(THREE, 0x2a3244, { metalness: 0.25, roughness: 0.85 }));
    tyre.rotation.z = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.42, w * 1.06, 12), mat(THREE, 0xb9c4d6, { metalness: 0.8, roughness: 0.35 }));
    hub.rotation.z = Math.PI / 2;
    g.add(tyre, hub);
    return g;
  }

  /* Mars Exploration Rover (Spirit / Opportunity): six wheels, solar decks, mast cam. */
  function buildMer(THREE, accent) {
    const g = new THREE.Group();
    const shell = mat(THREE, 0xd7dde9, { metalness: 0.55, roughness: 0.42 });
    const gold = mat(THREE, 0xc9a45e, { metalness: 0.85, roughness: 0.35 });
    const panel = mat(THREE, 0x1d3157, { metalness: 0.55, roughness: 0.32, emissive: 0x122447, emissiveIntensity: 0.5 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.46, 1.5), gold);
    body.position.y = 0.62;
    g.add(body);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.07, 1.72), panel);
    deck.position.y = 0.9;
    g.add(deck);

    [-1, 1].forEach((s) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 1.5), panel);
      wing.position.set(s * 1.02, 0.9, 0);
      wing.rotation.z = s * 0.06;
      g.add(wing);
    });

    [-1, 1].forEach((s) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 1.5), shell);
      arm.position.set(s * 0.66, 0.55, 0);
      g.add(arm);
      [-0.55, 0, 0.55].forEach((z) => {
        const w = wheel(THREE, 0.26, 0.2);
        w.position.set(s * 0.74, 0.26, z);
        g.add(w);
      });
    });

    const mastBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.16, 10), shell);
    mastBase.position.set(0.34, 0.98, -0.34);
    g.add(mastBase);

    const mast = new THREE.Group();
    mast.position.set(0.34, 1.06, -0.34);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.74, 10), shell);
    tube.position.y = 0.37;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.24), mat(THREE, 0xe6ebf5, { metalness: 0.6, roughness: 0.3 }));
    head.position.y = 0.8;
    mast.add(tube, head);
    [-0.07, 0.07].forEach((x) => {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.09, 14), mat(THREE, 0x0b1220, { metalness: 0.9, roughness: 0.15 }));
      lens.rotation.x = Math.PI / 2;
      lens.position.set(x, 0.8, 0.15);
      mast.add(lens);
    });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2, roughness: 0.3 }));
    eye.position.set(0, 0.9, 0.13);
    mast.add(eye);
    g.add(mast);

    const hga = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.05, 20), mat(THREE, 0xe8eef8, { metalness: 0.7, roughness: 0.3 }));
    hga.position.set(-0.3, 1.08, 0.3);
    hga.rotation.x = 0.42;
    g.add(hga);

    const uhf = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), shell);
    uhf.position.set(-0.05, 1.18, 0.52);
    g.add(uhf);

    const status = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.4 }));
    status.position.set(0.0, 0.78, 0.76);
    g.add(status);

    return {
      group: g,
      wheels: g.children.filter((c) => c.type === "Group"),
      update(t, energy, speaking) {
        mast.rotation.y = Math.sin(t * 0.55) * 0.2 + (energy - 0.45) * 0.16;
        mast.rotation.x = Math.sin(t * 0.8 + 1) * 0.07 - 0.04;
        eye.material.emissiveIntensity = 0.6 + energy * 2.6;
        status.material.emissiveIntensity = 0.4 + energy * 1.8;
        g.position.y = Math.sin(t * 1.05) * 0.012 + energy * 0.022;
        if (speaking) this.wheels.forEach((w, i) => { w.rotation.x -= 0.004 + energy * 0.012 + i * 0.0002; });
      },
    };
  }

  /* Lunokhod 1: eight wheels, sealed tub, hinged lid with its solar panel. */
  function buildLunokhod(THREE, accent) {
    const g = new THREE.Group();
    const shell = mat(THREE, 0xc3ccdb, { metalness: 0.5, roughness: 0.5 });
    const panel = mat(THREE, 0x1b2d50, { metalness: 0.55, roughness: 0.34, emissive: 0x122447, emissiveIntensity: 0.5 });

    const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.55, 10, 1, false, 0, Math.PI), shell);
    tub.rotation.z = Math.PI / 2;
    tub.rotation.y = Math.PI / 2;
    tub.position.y = 0.62;
    g.add(tub);

    const belly = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.34, 1.5), mat(THREE, 0x8f99ab, { metalness: 0.6, roughness: 0.45 }));
    belly.position.y = 0.42;
    g.add(belly);

    const lid = new THREE.Group();
    lid.position.set(0, 0.9, -0.78);
    const lidShell = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.62), shell);
    lidShell.position.set(0, 0, 0.78);
    const lidPanel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.03, 1.42), panel);
    lidPanel.position.set(0, 0.06, 0.78);
    lid.add(lidShell, lidPanel);
    lid.rotation.x = -0.42;
    g.add(lid);

    [-1, 1].forEach((s) => {
      [-0.75, -0.25, 0.25, 0.75].forEach((z) => {
        const w = wheel(THREE, 0.28, 0.16);
        w.position.set(s * 0.78, 0.28, z);
        g.add(w);
      });
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 1.7), shell);
      skirt.position.set(s * 0.72, 0.46, 0);
      g.add(skirt);
    });

    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), shell);
    dome.position.set(0.24, 0.98, 0.62);
    g.add(dome);

    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 14), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2, roughness: 0.25 }));
    eye.rotation.x = Math.PI / 2;
    eye.position.set(-0.34, 0.9, 0.76);
    g.add(eye);

    [-0.5, 0.5].forEach((x) => {
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.62, 6), shell);
      antenna.position.set(x, 1.24, -0.42);
      antenna.rotation.x = -0.22;
      g.add(antenna);
    });

    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16), mat(THREE, 0xe8eef8, { metalness: 0.75, roughness: 0.3 }));
    dish.position.set(0.46, 1.02, -0.5);
    dish.rotation.x = 0.5;
    g.add(dish);

    return {
      group: g,
      wheels: [],
      update(t, energy) {
        lid.rotation.x = -0.42 - Math.sin(t * 0.45) * 0.06 - energy * 0.04;
        eye.material.emissiveIntensity = 0.5 + energy * 2.4;
        dome.rotation.y = Math.sin(t * 0.4) * 0.5;
        g.position.y = Math.sin(t * 0.95 + 0.6) * 0.01 + energy * 0.02;
        g.rotation.z = Math.sin(t * 0.7) * 0.008;
      },
    };
  }

  function RobotCanvas({ id, accent, speaking, timeRef, compact }) {
    const host = useRef(null);
    const [ready, setReady] = useState(!!window.__THREE);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
      if (window.__THREE) { setReady(true); return undefined; }
      const on = () => setReady(true);
      window.addEventListener("three-ready", on);
      return () => window.removeEventListener("three-ready", on);
    }, []);

    useEffect(() => {
      if (!ready || !host.current) return undefined;
      const THREE = window.__THREE;
      if (!THREE) return undefined;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch (e) {
        setFailed(true);
        return undefined;
      }
      const el = host.current;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      renderer.domElement.setAttribute("aria-hidden", "true");
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
      camera.position.set(4.4, 3.3, 6.9);
      camera.lookAt(0, 0.72, 0);

      scene.add(new THREE.HemisphereLight(0x9fc4ff, 0x0b0f1c, 1.25));
      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(3, 5, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x7fb2ff, 1.6);
      rim.position.set(-4, 2.5, -3);
      scene.add(rim);
      const fill = new THREE.DirectionalLight(0xbcd8ff, 0.8);
      fill.position.set(0, 1.5, 6);
      scene.add(fill);
      const warm = new THREE.PointLight(0xffb347, 14, 9, 2);
      warm.position.set(1.6, 1.2, 1.6);
      scene.add(warm);

      const built = (KINDS[id] === "lunokhod" ? buildLunokhod : buildMer)(THREE, accent);
      const rig = new THREE.Group();
      rig.add(built.group);
      scene.add(rig);

      // Normalise every robot to the same visual size and centre it in the canvas.
      const bounds = new THREE.Box3().setFromObject(built.group);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 2.85 / Math.max(size.x, size.z * 1.08, size.y * 1.7);
      rig.scale.setScalar(scale);
      const centre = bounds.getCenter(new THREE.Vector3()).multiplyScalar(scale);
      rig.position.x = -centre.x;
      rig.position.z = -centre.z;
      camera.lookAt(0, centre.y * 0.92, 0);

      const state = { yaw: 0.55, pitch: 0.1, wantYaw: 0.55, wantPitch: 0.1, drag: null };
      const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const onDown = (e) => { state.drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture && el.setPointerCapture(e.pointerId); el.classList.add("grabbing"); };
      const onMove = (e) => {
        if (!state.drag) return;
        state.wantYaw = Math.max(-1.1, Math.min(1.1, state.wantYaw + (e.clientX - state.drag.x) * 0.01));
        state.wantPitch = Math.max(-0.35, Math.min(0.5, state.wantPitch + (e.clientY - state.drag.y) * 0.006));
        state.drag = { x: e.clientX, y: e.clientY };
      };
      const onUp = () => { state.drag = null; el.classList.remove("grabbing"); };
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
      el.addEventListener("pointerleave", onUp);

      const resize = () => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        renderer.setSize(r.width, r.height, false);
        camera.aspect = r.width / r.height;
        camera.updateProjectionMatrix();
        // Fit the whole craft in view: distance from the container's own aspect ratio.
        const half = Math.tan((camera.fov * Math.PI) / 360);
        const dist = Math.max(3.05 / (2 * half * camera.aspect), 2.35 / (2 * half));
        const dir = new THREE.Vector3(0.6, 0.4, 0.92).normalize().multiplyScalar(dist);
        camera.position.set(dir.x, dir.y + centre.y * 0.92, dir.z);
        camera.lookAt(0, centre.y * 0.92, 0);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      const clock = new THREE.Clock();
      let raf = 0, alive = true;
      const env = (window.VOICE_ENVELOPES || {})[id] || [];
      const rate = (window.VOICE_ENVELOPES && window.VOICE_ENVELOPES.rate) || 20;
      let energy = 0;

      const frame = () => {
        if (!alive) return;
        raf = requestAnimationFrame(frame);
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        const now = timeRef.current || 0;
        const idx = Math.min(env.length - 1, Math.max(0, Math.floor(now * rate)));
        const target = env[idx] || 0;
        energy += (target - energy) * Math.min(1, dt * 9);
        if (!state.drag) state.wantYaw = 0.55 + Math.sin(t * 0.22) * 0.22;
        state.yaw += (state.wantYaw - state.yaw) * Math.min(1, dt * 5);
        state.pitch += (state.wantPitch - state.pitch) * Math.min(1, dt * 5);
        rig.rotation.y = state.yaw;
        rig.rotation.x = -state.pitch * 0.5;
        if (!reduced) built.update(t, speaking.current ? energy : energy * 0.25, speaking.current);
        else built.update(0, energy * 0.5, false);
        renderer.render(scene, camera);
      };
      frame();

      return () => {
        alive = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        el.removeEventListener("pointerleave", onUp);
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        });
        renderer.dispose();
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      };
    }, [ready, id, accent]);

    if (failed) return h("div", { className: "robot-canvas robot-canvas--flat", "aria-hidden": "true" });
    return h("div", {
      ref: host,
      className: "robot-canvas" + (compact ? " robot-canvas--compact" : "") + (ready ? " on" : ""),
      role: "img",
      "aria-label": "3D model of the selected spacecraft",
      title: "Drag to inspect",
    });
  }

  function RobotCompanion({ mission, en, speaking, time, compact, label }) {
    const timeRef = useRef(0);
    const speakRef = useRef(false);
    timeRef.current = time || 0;
    speakRef.current = !!speaking;

    const sentences = (window.MISSION_SENTENCES && window.MISSION_SENTENCES[mission.id]) || [];
    const rows = sentences.length ? sentences : [{ start: 0, end: 0, text: mission.enDiary || "" }];
    const active = useMemo(() => {
      if (!speaking) return -1;
      const t = time || 0;
      const i = rows.findIndex((r) => t >= r.start && t < r.end);
      return i < 0 ? (t >= rows[rows.length - 1].end ? rows.length - 1 : 0) : i;
    }, [rows, time, speaking]);

    const current = active >= 0 ? rows[active] : null;
    const next = active >= 0 && active + 1 < rows.length ? rows[active + 1] : null;
    const progress = current && current.end > current.start ? Math.max(0, Math.min(1, ((time || 0) - current.start) / (current.end - current.start))) : 0;

    return h("div", { className: "robot-host" + (compact ? " robot-host--compact" : "") },
      h(RobotCanvas, { id: mission.id, accent: "#8bd3ff", speaking: speakRef, timeRef, compact }),
      h("div", { className: "robot-bubble" + (current ? " live" : ""), dir: "ltr", "aria-live": "polite" },
        h("div", { className: "robot-bubble__head" },
          h("span", { className: "robot-bubble__dot" }),
          h("span", { className: "robot-bubble__who" }, (label || mission.n) + " · live English"),
          h("span", { className: "robot-bubble__mode" }, en ? "EN" : "AR voice")),
        current
          ? h("p", { className: "robot-bubble__line" }, current.text)
          : h("p", { className: "robot-bubble__idle" },
              speaking ? "…" : (en ? "Press play and I'll tell you my story." : "اضغط تشغيل وسأحكي لك حكايتي.")),
        current && h("div", { className: "robot-bubble__bar", "aria-hidden": "true" }, h("i", { style: { width: `${progress * 100}%` } })),
        next && h("p", { className: "robot-bubble__next" }, next.text)
      )
    );
  }

  window.RobotCompanion = RobotCompanion;
})();
