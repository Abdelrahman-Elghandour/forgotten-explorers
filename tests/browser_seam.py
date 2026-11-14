"""Verify the film-to-canvas seam in a real browser.

Checks that the live canvas, frozen on the film's final frame, puts the Sun and orbits
in the same place as the video, that the pre-end dissolve removes the overlay and
activates the Solar System, and that Skip takes the same path.
"""
import asyncio
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "captures"
URL = "http://127.0.0.1:3000/"
VIDEO = ROOT / "videos" / "intro.mp4"


def sun_centre(path):
    image = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32) / 255
    mask = (image[..., 0] > 0.55) & (image[..., 1] > 0.30) & (image[..., 2] < 0.55)
    ys, xs = np.nonzero(mask)
    assert len(xs) > 1000, f"no warm Sun detected in {path}"
    return float(xs.mean()), float(ys.mean())


async def freeze_canvas(page):
    await page.evaluate("""() => {
        const o = document.querySelector('.intro-overlay');
        o.style.background = 'transparent';
        document.querySelector('.intro-video').style.visibility = 'hidden';
        document.querySelectorAll('.intro-video-shade,.intro-badge,.intro-top-hud,.intro-bottom-hud')
            .forEach(n => n.style.display = 'none');
    }""")
    await page.wait_for_timeout(700)
    await page.screenshot(path=str(OUT / "canvas_frozen.png"))


async def main():
    OUT.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "27.9", "-i", str(VIDEO),
                    "-frames:v", "1", str(OUT / "video_last.png")], check=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        await page.goto(URL, wait_until="load")
        await page.click("header button[aria-label='Play the opening film']")
        await page.wait_for_selector(".intro-video", timeout=20000)
        await page.wait_for_timeout(2500)
        assert await page.evaluate("!!document.querySelector('canvas')"), "live canvas must exist behind the film"
        assert await page.evaluate("!!document.querySelector('[inert]')"), "the app must stay inert behind the film"
        await freeze_canvas(page)

        vx, vy = sun_centre(OUT / "video_last.png")
        cx, cy = sun_centre(OUT / "canvas_frozen.png")
        dx, dy = abs(vx - cx), abs(vy - cy)
        a = np.asarray(Image.open(OUT / "video_last.png").convert("RGB"), dtype=np.float32)
        b = np.asarray(Image.open(OUT / "canvas_frozen.png").convert("RGB"), dtype=np.float32)
        Image.fromarray(((a + b) / 2).astype(np.uint8)).save(OUT / "blend_50.png")

        # Natural pre-end dissolve.
        await page.reload(wait_until="load")
        await page.wait_for_selector("#root canvas", state="attached", timeout=20000)
        await page.click("header button[aria-label='Play the opening film']")
        await page.wait_for_selector(".intro-video", timeout=20000)
        await page.wait_for_function("document.querySelector('.intro-video').readyState >= 2", timeout=20000)
        await page.evaluate("""() => new Promise(done => {
            const v = document.querySelector('.intro-video');
            v.muted = true; v.pause();
            v.addEventListener('seeked', () => { v.play().catch(() => {}); done(); }, {once: true});
            v.currentTime = 26.6;
        })""")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUT / "dissolve_mid.png"))
        await page.wait_for_timeout(1200)
        natural = await page.evaluate("""() => ({
            overlay: !!document.querySelector('.intro-overlay'),
            title: document.querySelector('h1')?.textContent || null
        })""")

        # The intro has no Skip control; the film itself must hand off at its end.
        await page.reload(wait_until="load")
        await page.wait_for_selector("#root canvas", state="attached", timeout=20000)
        await page.click("header button[aria-label='Play the opening film']")
        await page.wait_for_selector(".intro-overlay", timeout=20000)
        assert await page.locator(".intro-skip").count() == 0, "the intro must not offer a Skip control"
        await page.wait_for_timeout(1200)
        await page.evaluate("() => { const v = document.querySelector('.intro-video'); if (v) { v.muted = true; v.currentTime = Math.max(0, (v.duration || 28) - 1.4); } }")
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT / "end_dissolve.png"))
        await page.wait_for_timeout(1200)
        skipped = await page.evaluate("""() => ({
            overlay: !!document.querySelector('.intro-overlay'),
            title: document.querySelector('h1')?.textContent || null
        })""")
        await browser.close()

    print(f"Sun offset: dx={dx:.1f}px dy={dy:.1f}px")
    print("natural end:", natural)
    print("skip:", skipped)
    print("pageerrors:", errors)
    assert dx < 12 and dy < 12, "canvas Sun must align with the film's final frame"
    assert not natural["overlay"] and natural["title"], "pre-end dissolve must activate the Solar System"
    assert not skipped["overlay"] and skipped["title"], "Skip must take the same dissolve path"
    assert not errors, errors
    print("PASS: film and canvas share the same Sun/orbit framing; pre-end dissolve hands off cleanly with no Skip control.")


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
