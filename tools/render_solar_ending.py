"""Render the closing solar-system shot, matching the site's <Space /> canvas geometry.

The camera starts on the Mars disc where the AI pullback ends, then decelerates into
the exact framing, palette and elliptical perspective used by the live canvas, so the
video's last frame and the interactive view are the same image.
"""
from pathlib import Path
import math
import subprocess

import numpy as np
from PIL import Image

W, H, FPS = 1920, 1080, 24
CX, CY = W / 2, H / 2 + 10
R = min(W, H * 1.5) / 2 * 0.95

SHOT_SECONDS = 7.0
FRAMES = int(round(SHOT_SECONDS * FPS))
S0 = 7.8                 # camera scale where the graphic Mars equals the AI Mars disc
ZOOM_SECONDS = 6.0       # deceleration finishes, then the shot holds still
TARGET_SECONDS = 5.0
AI_BLEND_SECONDS = 0.85
HANDOFF = (956.0, 552.0)  # Mars centre and 78 px radius in the AI frame at 8.2 s

ORBITS = [
    dict(k="venus", d=0.22, sp=1.6, r=11, c="#d4a359", a0=1.0),
    dict(k="moon", d=0.36, sp=1.0, r=12, c="#4f8cff", a0=3.0, earth=True),
    dict(k="mars", d=0.50, sp=0.7, r=10, c="#c85a32", a0=5.0),
    dict(k="titan", d=0.68, sp=0.4, r=17, c="#e0b07a", a0=2.0, ring=True),
    dict(k="deep", d=0.86, sp=0.15, r=6, c="#a78bfa", a0=4.0),
]
BG = (5, 7, 13)


def rgb(value):
    value = value.lstrip("#")
    return np.array([int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32)


def smoothstep(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def radial(cx, cy, rx, ry, inner, outer, power=1.0, bbox=None):
    """Return alpha over the whole frame for an elliptical radial falloff."""
    alpha = np.zeros((H, W), dtype=np.float32)
    x0, x1, y0, y1 = bbox or (0, W, 0, H)
    x0, x1 = max(0, int(x0)), min(W, int(x1))
    y0, y1 = max(0, int(y0)), min(H, int(y1))
    if x0 >= x1 or y0 >= y1:
        return alpha
    ys = np.arange(y0, y1, dtype=np.float32)[:, None]
    xs = np.arange(x0, x1, dtype=np.float32)[None, :]
    d = np.sqrt(((xs - cx) / rx) ** 2 + ((ys - cy) / ry) ** 2)
    t = np.clip((d - inner) / max(1e-6, outer - inner), 0, 1) ** power
    alpha[y0:y1, x0:x1] = 1 - t
    return alpha


def add(base, color, alpha):
    base += alpha[..., None] * np.asarray(color, dtype=np.float32)


def over(base, color, alpha):
    a = alpha[..., None]
    base *= 1 - a
    base += a * np.asarray(color, dtype=np.float32)


def background():
    base = np.zeros((H, W, 3), dtype=np.float32)
    base[:] = np.array(BG, dtype=np.float32) / 255
    # Mirrors the app's CSS: farthest-corner ellipse, transparent at 45% / 50%.
    over(base, rgb("#2a1260"), radial(0.20 * W, 0.10 * H, 0.36 * W, 0.405 * H, 0, 1, 1.0))
    over(base, rgb("#0b3a5c"), radial(0.85 * W, 0.90 * H, 0.3825 * W, 0.405 * H, 0, 1, 1.0))
    return np.clip(base, 0, 1)


def starfield(seed=7):
    rng = np.random.default_rng(seed)
    layer = np.zeros((H, W), dtype=np.float32)
    for _ in range(300):
        x = rng.integers(2, W - 2)
        y = rng.integers(2, H - 2)
        z = rng.uniform(0.1, 1.0)
        alpha = (0.25 + z * 0.6) * rng.uniform(0.7, 1.0)
        size = z * 2.0
        span = 2 if size < 1.4 else 3
        layer[y:y + 1, x:x + 1] += alpha
        if span == 3:
            layer[y, x + 1] += alpha * 0.45
            layer[y + 1, x] += alpha * 0.45
    return np.clip(layer, 0, 1)


def sun_patch(radius):
    pad = int(radius * 1.55) + 2
    size = pad * 2 + 1
    ys, xs = np.mgrid[-pad:pad + 1, -pad:pad + 1].astype(np.float32)
    d = np.sqrt(xs ** 2 + ys ** 2) / radius
    # Matches the canvas: #fff7c2 -> #ffb347 at 25% -> warm falloff to zero.
    stops = [(0.0, (255, 247, 194)), (0.25, (255, 179, 71)), (0.6, (255, 110, 0)), (1.0, (255, 120, 0))]
    out = np.zeros((size, size, 3), dtype=np.float32)
    alpha = np.zeros((size, size), dtype=np.float32)
    for i in range(len(stops) - 1):
        p0, c0 = stops[i]
        p1, c1 = stops[i + 1]
        mask = (d >= p0) & (d < p1)
        t = ((d - p0) / (p1 - p0))[mask][:, None]
        col = (1 - t) * np.array(c0, dtype=np.float32) / 255 + t * np.array(c1, dtype=np.float32) / 255
        out[mask] = col
        alpha[mask] = 1 - (p0 + (p1 - p0) * ((d[mask] - p0) / (p1 - p0))) ** 1.6
    return out, alpha


SUN_COLORS, SUN_ALPHA = sun_patch(110.0)


def draw_sun(frame, x, y, scale, alpha):
    if alpha <= 0.001:
        return
    # Angular size stays modest as the camera recedes, then matches the canvas at scale 1.
    r = 110.0 * (scale ** 0.35)
    size = int(r * 1.55)
    if size < 2:
        return
    colors = np.asarray(Image.fromarray((SUN_COLORS * 255).astype(np.uint8)).resize((size * 2 + 1, size * 2 + 1), Image.BILINEAR), dtype=np.float32) / 255
    a = np.asarray(Image.fromarray((SUN_ALPHA * 255).astype(np.uint8)).resize((size * 2 + 1, size * 2 + 1), Image.BILINEAR), dtype=np.float32) / 255
    x0, y0 = int(round(x)) - size, int(round(y)) - size
    fx0, fy0 = max(0, x0), max(0, y0)
    fx1, fy1 = min(W, x0 + colors.shape[1]), min(H, y0 + colors.shape[0])
    if fx0 >= fx1 or fy0 >= fy1:
        return
    sub_c = colors[fy0 - y0:fy1 - y0, fx0 - x0:fx1 - x0]
    sub_a = a[fy0 - y0:fy1 - y0, fx0 - x0:fx1 - x0] * alpha
    region = frame[fy0:fy1, fx0:fx1]
    region += sub_c * sub_a[..., None] * 0.95


def ellipse_stroke(frame, cx, cy, rx, ry, color, alpha, width=1.0, dash=None):
    if rx < 2 or ry < 2:
        return
    x0, x1 = max(0, int(cx - rx - 3)), min(W, int(cx + rx + 4))
    y0, y1 = max(0, int(cy - ry - 3)), min(H, int(cy + ry + 4))
    if x0 >= x1 or y0 >= y1:
        return
    ys = np.arange(y0, y1, dtype=np.float32)[:, None]
    xs = np.arange(x0, x1, dtype=np.float32)[None, :]
    u = np.sqrt(((xs - cx) / rx) ** 2 + ((ys - cy) / ry) ** 2)
    band = np.exp(-(((u - 1) * rx) ** 2) / (2 * (width * 0.85) ** 2))
    if dash:
        on, off = dash
        theta = np.arctan2((ys - cy) / ry, (xs - cx) / rx)
        arc = np.abs(theta) * math.sqrt((rx ** 2 + ry ** 2) / 2)
        band *= ((arc % (on + off)) < on).astype(np.float32)
    a = band * alpha
    region = frame[y0:y1, x0:x1]
    region *= (1 - a[..., None])
    region += a[..., None] * np.asarray(color, dtype=np.float32)


def ball(frame, x, y, r, color, glow=0.55):
    if r < 0.6:
        return
    pad = int(r * 3.0) + 2
    x0, y0 = int(round(x)) - pad, int(round(y)) - pad
    fx0, fy0 = max(0, x0), max(0, y0)
    fx1, fy1 = min(W, x0 + pad * 2), min(H, y0 + pad * 2)
    if fx0 >= fx1 or fy0 >= fy1:
        return
    ys = np.arange(fy0, fy1, dtype=np.float32)[:, None]
    xs = np.arange(fx0, fx1, dtype=np.float32)[None, :]
    dx, dy = xs - x, ys - y
    dist = np.sqrt(dx ** 2 + dy ** 2)
    # Canvas radial gradient: light source offset by r/3 toward upper-left.
    gx, gy = x - r / 3, y - r / 3
    gd = np.sqrt((xs - gx) ** 2 + (ys - gy) ** 2)
    t = np.clip((gd - r / 6) / (r - r / 6), 0, 1)
    col = np.where((t < 0.25)[..., None],
                   (1 - (t / 0.25))[..., None] * np.array([1, 1, 1], dtype=np.float32) + (t / 0.25)[..., None] * np.asarray(color, dtype=np.float32),
                   (1 - (t - 0.25) / 0.75)[..., None] * np.asarray(color, dtype=np.float32) + ((t - 0.25) / 0.75)[..., None] * np.array(BG, dtype=np.float32) / 255)
    disc = np.clip((r - dist) / max(0.8, r * 0.06), 0, 1)
    halo = np.exp(-((dist - r).clip(0) ** 2) / (2 * (r * 0.85) ** 2)) * (dist > r) * glow
    halo *= np.clip((pad - dist) / (0.4 * pad), 0, 1)
    region = frame[fy0:fy1, fx0:fx1]
    region += halo[..., None] * np.asarray(color, dtype=np.float32) * 0.35
    region *= (1 - disc[..., None])
    region += disc[..., None] * col


def ring(frame, x, y, r, color):
    rx, ry = r * 1.9, r * 0.5
    rot = -0.3
    pad = int(rx * 1.2) + 2
    x0, x1 = max(0, int(x - pad)), min(W, int(x + pad))
    y0, y1 = max(0, int(y - pad)), min(H, int(y + pad))
    if x0 >= x1 or y0 >= y1:
        return
    ys = np.arange(y0, y1, dtype=np.float32)[:, None]
    xs = np.arange(x0, x1, dtype=np.float32)[None, :]
    dx, dy = xs - x, ys - y
    ca, sa = math.cos(rot), math.sin(rot)
    ux, uy = dx * ca + dy * sa, -dx * sa + dy * ca
    u = np.sqrt((ux / rx) ** 2 + (uy / ry) ** 2)
    band = np.exp(-(((u - 1) * rx) ** 2) / (2 * 0.9 ** 2)) * 0.75
    region = frame[y0:y1, x0:x1]
    region *= (1 - band[..., None])
    region += band[..., None] * np.asarray(color, dtype=np.float32)


def world_positions(t):
    out = []
    for o in ORBITS:
        a = o["a0"] + t * o["sp"]
        rx = o["d"] * R
        out.append((math.cos(a) * rx, math.sin(a) * rx * 0.38))
    return out


def camera(t):
    u = min(1.0, t / ZOOM_SECONDS)
    s = 1.0 + (S0 - 1.0) * (1.0 - u) ** 3
    v = smoothstep(t / TARGET_SECONDS)
    mars = world_positions(0.0)[2]
    tx, ty = mars[0] * (1 - v), mars[1] * (1 - v)
    return s, tx, ty


_BASE = background()
_STARS = starfield()
_AI = np.asarray(
    Image.open(Path(__file__).resolve().parent / "mars_8.2.jpg").convert("RGB"),
    dtype=np.float32,
) / 255


def render_frame(index):
    """Render one frame as an RGB uint8 image."""
    t = index / FPS
    s, tx, ty = camera(t)
    frame = _BASE.copy()
    add(frame, (1, 1, 1), _STARS * 0.9)

    sun_x = CX + (0 - tx) * s
    sun_y = CY + (0 - ty) * s
    draw_sun(frame, sun_x, sun_y, s, smoothstep(t / 1.4))

    orbit_alpha = 0.14 * smoothstep((t - 0.35) / 1.5)
    for o in ORBITS:
        rx = o["d"] * R * s
        ellipse_stroke(frame, sun_x, sun_y, rx, rx * 0.38, rgb("#8bd3ff"), orbit_alpha,
                       width=max(1.0, s * 0.8), dash=(4, 8) if o["k"] == "deep" else None)

    planets = [(o, CX + (wx - tx) * s, CY + (wy - ty) * s)
               for o, (wx, wy) in zip(ORBITS, world_positions(0.0))]

    for o, x, y in planets:
        r = o["r"] * s
        if o.get("ring"):
            ring(frame, x, y, r, rgb("#e0b07a"))
        ball(frame, x, y, r, rgb(o["c"]))
        if o.get("earth"):
            ball(frame, x + 26 * s, y, 5.5 * s, rgb("#c4c8d4"), glow=0.4)

    # Keep the photoreal Mars while it is large, then resolve into the graphic planet.
    blend = 1.0 - smoothstep((2.6 - s) / 0.9)
    if blend > 0.002:
        k = s / S0
        mars_x, mars_y = planets[2][1], planets[2][2]
        nw, nh = max(2, int(_AI.shape[1] * k)), max(2, int(_AI.shape[0] * k))
        still = np.asarray(
            Image.fromarray((_AI * 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS),
            dtype=np.float32,
        ) / 255
        px = int(round(mars_x - HANDOFF[0] * k))
        py = int(round(mars_y - HANDOFF[1] * k))
        fx0, fy0 = max(0, px), max(0, py)
        fx1, fy1 = min(W, px + nw), min(H, py + nh)
        if fx0 < fx1 and fy0 < fy1:
            sub = still[fy0 - py:fy1 - py, fx0 - px:fx1 - px]
            ys = np.arange(fy0, fy1, dtype=np.float32)[:, None]
            xs = np.arange(fx0, fx1, dtype=np.float32)[None, :]
            disc_r = 10.0 * s
            dist = np.sqrt((xs - mars_x) ** 2 + (ys - mars_y) ** 2)
            mask = np.clip((disc_r * 1.04 - dist) / (disc_r * 0.07), 0, 1) * blend
            frame[fy0:fy1, fx0:fx1] = frame[fy0:fy1, fx0:fx1] * (1 - mask[..., None]) + sub * mask[..., None]

    return (np.clip(frame, 0, 1) * 255).astype(np.uint8)


def main():
    out = Path(__file__).resolve().parent / "solar_frames"
    out.mkdir(parents=True, exist_ok=True)
    for i in range(FRAMES):
        Image.fromarray(render_frame(i)).save(out / f"f_{i:04d}.png")
        if i % 24 == 0:
            print(f"frame {i}/{FRAMES}", flush=True)
    print("rendered", FRAMES, "frames to", out, flush=True)


if __name__ == "__main__":
    main()
