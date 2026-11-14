"""Browser checks for the multi-media stage and its closed captions.

Verifies that the craft view shows several real NASA media items, that the slideshow and the
filmstrip behave, that a mission video actually resolves and plays, and that the English caption
that belongs to the current narration moment is on screen and advances with the audio.
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
        await page.wait_for_selector(".intro-overlay", timeout=30000)
        await page.evaluate("() => { const v = document.querySelector('.intro-video'); if (v) { v.muted = true; v.currentTime = Math.max(0, (v.duration || 28) - 1.4); } }")
        await page.wait_for_timeout(1900)
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

        # --- English closed captions ------------------------------------------
        has_caption = await page.evaluate("() => !!document.querySelector('.craft-caption')")
        check("caption layer present in the craft stage", has_caption)

        await page.wait_for_function(
            "() => document.querySelector('.craft-caption')?.dataset.present === '1'", timeout=30000)
        first = await page.evaluate("() => document.querySelector('.craft-caption__line')?.textContent || ''")
        label = await page.evaluate("() => document.querySelector('.craft-caption__label')?.textContent || ''")
        check("captions appear while the story plays", bool(first), first[:60])
        check("caption is labelled as the English translation", "EN" in label, label)
        check("caption text is the supplied English translation", "NASA" in first or "I " in first or "my" in first, first[:80])

        await page.wait_for_timeout(7000)
        second = await page.evaluate("() => document.querySelector('.craft-caption__line')?.textContent || ''")
        check("captions advance with the narration", bool(second) and second != first, (first[:35] + " -> " + second[:35]))

        paused = await page.evaluate("""async () => {
            const btn = [...document.querySelectorAll('.craft-hud button')].find(b => /استمع|إيقاف/.test(b.textContent));
            if (btn) btn.click();
            await new Promise(r => setTimeout(r, 900));
            return document.querySelector('.craft-caption')?.dataset.present;
        }""")
        check("caption keeps the paused line visible", paused == "1", str(paused))
        await page.screenshot(path=str(CAPTURES / "craft_captions.png"))

        # --- mobile ------------------------------------------------------------
        mobile = await browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        mobile.on("pageerror", lambda e: errors.append(str(e)))
        await mobile.add_init_script(ARCS)
        await mobile.goto("http://127.0.0.1:3000/", wait_until="load")
        await mobile.wait_for_selector(".intro-overlay", timeout=30000)
        await mobile.evaluate("() => { const v = document.querySelector('.intro-video'); if (v) { v.muted = true; v.currentTime = Math.max(0, (v.duration || 28) - 1.4); } }")
        await mobile.wait_for_timeout(1900)
        await mobile.wait_for_timeout(2400)
        await land(mobile, "أوبورتيونيتي")
        await mobile.click('.surface-root button[aria-label="أوبورتيونيتي"]')
        await mobile.wait_for_selector(".craft-hud", timeout=8000)
        await mobile.wait_for_timeout(2500)
        fits = await mobile.evaluate("""() => {
            const r = document.querySelector('.craft-caption').getBoundingClientRect();
            const s = document.querySelector('.craft-strip-wrap').getBoundingClientRect();
            return {ok: r.left >= -1 && r.right <= innerWidth + 1 && r.width > 200,
                    box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]};
        }""")
        check("mobile caption fits the media area", fits["ok"], str(fits["box"]))
        await mobile.screenshot(path=str(CAPTURES / "companion_mobile.png"))

        check("no page errors", not errors, "; ".join(errors[:2]))
        await browser.close()

    print(json.dumps({"failures": FAILS}, ensure_ascii=False))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
