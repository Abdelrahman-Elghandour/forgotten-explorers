"""Browser checks for the multi-media stage and the 3D companion.

Verifies that the craft view shows several real NASA media items, that the slideshow and the
filmstrip behave, that a mission video actually resolves and plays, and that the robot renders,
rotates on drag, and speaks the transcript sentence that belongs to the current narration time.
"""
import asyncio
import json
import runpy
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
CAPTURES = ROOT / "tests" / "captures"
CAPTURES.mkdir(exist_ok=True)
HELPERS = runpy.run_path(str(ROOT / "tests" / "browser_craft.py"))
ARCS, land = HELPERS["ARCS"], HELPERS["land"]

FAILS = []


def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f" — {detail}" if detail else ""))
    if not ok:
        FAILS.append(name)


async def open_craft(page, label):
    await page.click(f'.surface-root button[aria-label="{label}"]')
    await page.wait_for_selector(".craft-stage", timeout=8000)
    await page.wait_for_selector(".craft-hud", timeout=8000)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        page = await browser.new_page(viewport={"width": 1600, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.add_init_script(ARCS)
        await page.goto("http://127.0.0.1:3000/", wait_until="load")
        await page.wait_for_selector(".intro-skip", timeout=30000)
        await page.click(".intro-skip")
        await page.wait_for_timeout(2400)
        await land(page, "أوبورتيونيتي")
        await open_craft(page, "أوبورتيونيتي")

        # --- multi-media stage -------------------------------------------------
        await page.wait_for_function("document.querySelectorAll('.craft-thumb').length >= 6", timeout=20000)
        slides = await page.locator(".craft-thumb").count()
        check("carousel shows 6–8 NASA items", 6 <= slides <= 8, f"{slides} slides")

        kinds = await page.evaluate("""() => [...document.querySelectorAll('.craft-thumb')]
            .map(t => t.querySelector('.craft-thumb__badge') ? 'video' : 'image')""")
        check("carousel mixes photos and mission video", "video" in kinds and "image" in kinds, str(kinds))

        first = await page.evaluate("() => document.querySelector('.craft-frame img.craft-hero')?.currentSrc || ''")
        await page.click(".craft-nav.next")
        await page.wait_for_timeout(1200)
        second = await page.evaluate("() => document.querySelector('.craft-frame img.craft-hero')?.currentSrc || ''")
        check("arrow advances to a different image", bool(first) and first != second, second[-42:])

        paused = await page.evaluate("() => !document.querySelector('.craft-strip__play.on')")
        check("manual navigation pauses the slideshow", paused)

        await page.screenshot(path=str(CAPTURES / "companion_desktop.png"))

        # --- mission video -----------------------------------------------------
        video_index = kinds.index("video")
        await page.locator(".craft-thumb").nth(video_index).click()
        # The first candidate size may 404, so wait for a file that actually loaded.
        await page.wait_for_function(
            "() => { const v = document.querySelector('.craft-frame video');"
            " return !!v && v.readyState >= 2 && (v.currentSrc || '').endsWith('.mp4'); }", timeout=30000)
        src = await page.evaluate("() => document.querySelector('.craft-frame video')?.currentSrc || ''")
        check("video slide resolves a playable NASA mp4", src.endswith(".mp4"), src[-48:])
        await page.evaluate("""() => { const v = document.querySelector('.craft-frame video');
            v.muted = true; return v.play().then(() => true).catch(() => false); }""")
        await page.wait_for_timeout(2500)
        played = await page.evaluate("() => { const v = document.querySelector('.craft-frame video'); return v.currentTime > 0.2 && !v.paused; }")
        check("mission video plays inside the stage", played)
        await page.screenshot(path=str(CAPTURES / "companion_video.png"))
        await page.evaluate("() => document.querySelector('.craft-frame video')?.pause()")

        # --- 3D companion ------------------------------------------------------
        has_gl = await page.evaluate("""() => { const c = document.querySelector('.robot-canvas canvas');
            return !!c && !!(c.getContext('webgl2') || c.getContext('webgl')); }""")
        check("3D robot renders with WebGL", has_gl)

        canvas = page.locator(".robot-canvas canvas")
        before = await canvas.screenshot()
        box = await canvas.bounding_box()
        await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        await page.mouse.down()
        await page.mouse.move(box["x"] + box["width"] / 2 + 55, box["y"] + box["height"] / 2 + 12, steps=8)
        await page.mouse.up()
        await page.wait_for_timeout(900)
        after = await canvas.screenshot()
        diff = sum(abs(a - b) for a, b in zip(before[::97], after[::97])) / max(1, len(before[::97]))
        check("dragging rotates the 3D model", diff > 4, f"pixel delta {diff:.1f}")

        # --- live transcript ---------------------------------------------------
        await page.wait_for_function("() => document.querySelector('.robot-bubble__line')", timeout=20000)
        sentences = await page.evaluate("() => window.MISSION_SENTENCES.opp.map(s => s.text)")
        seen = set()
        for _ in range(9):
            line = await page.evaluate("() => document.querySelector('.robot-bubble__line')?.textContent || ''")
            if line:
                seen.add(line)
            await page.wait_for_timeout(1400)
        check("bubble speaks the recorded English sentences",
              bool(seen) and all(s in sentences for s in seen), f"{len(seen)} distinct lines")
        check("bubble advances sentence by sentence", len(seen) >= 2, str(sorted(seen))[:120])

        head = await page.evaluate("() => document.querySelector('.robot-bubble__who')?.textContent || ''")
        check("bubble names the craft in English", "Opportunity" in head, head)

        await page.screenshot(path=str(CAPTURES / "companion_live.png"))

        # --- lunar craft uses the Lunokhod model -------------------------------
        await page.click('header button:has-text("المجموعة الشمسية")')
        await page.wait_for_timeout(1500)
        await land(page, "لونوخود")
        await open_craft(page, "لونوخود 1")
        await page.wait_for_timeout(3000)
        lun_gl = await page.evaluate("() => !!document.querySelector('.robot-canvas canvas')")
        check("Lunokhod 1 builds its own 3D model", lun_gl)
        await page.locator(".robot-host").screenshot(path=str(CAPTURES / "companion_lunokhod.png"))

        # --- mobile ------------------------------------------------------------
        mobile = await browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        mobile.on("pageerror", lambda e: errors.append(str(e)))
        await mobile.add_init_script(ARCS)
        await mobile.goto("http://127.0.0.1:3000/", wait_until="load")
        await mobile.wait_for_selector(".intro-skip", timeout=30000)
        await mobile.click(".intro-skip")
        await mobile.wait_for_timeout(2400)
        await land(mobile, "أوبورتيونيتي")
        await mobile.click('.surface-root button[aria-label="أوبورتيونيتي"]')
        await mobile.wait_for_selector(".craft-hud", timeout=8000)
        await mobile.wait_for_timeout(2500)
        fits = await mobile.evaluate("""() => {
            const r = document.querySelector('.robot-host').getBoundingClientRect();
            const s = document.querySelector('.craft-strip-wrap').getBoundingClientRect();
            return {ok: r.left >= -1 && r.right <= innerWidth + 1 && r.bottom <= s.top + 1,
                    box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]};
        }""")
        check("mobile companion stays inside the media area", fits["ok"], str(fits["box"]))
        await mobile.screenshot(path=str(CAPTURES / "companion_mobile.png"))

        check("no page errors", not errors, "; ".join(errors[:2]))
        await browser.close()

    print(json.dumps({"failures": FAILS}, ensure_ascii=False))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
