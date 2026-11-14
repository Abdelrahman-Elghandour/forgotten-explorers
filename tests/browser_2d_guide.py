"""Verify the inline 2D guide in file:// and served browsers, including failed assets.

All mission audio and caption timing remain real, existing recordings. We exercise the
same controls users see; no mock audio, fake guide, or synthetic narration is introduced.
"""
import asyncio
import json
import runpy
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
HELPERS = runpy.run_path(str(ROOT / "tests/browser_craft.py"))
ARCS, land = HELPERS["ARCS"], HELPERS["land"]
CAPTURES = ROOT / "tests" / "captures"
CAPTURES.mkdir(exist_ok=True)


async def open_mission(page, label):
    await land(page, label)
    await page.click(f'.surface-root button[aria-label="{label}"]')
    await page.wait_for_selector(".mission-guide", timeout=12000)
    await page.wait_for_selector(".craft-hud", timeout=8000)


async def main():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        page = await browser.new_page(viewport={"width": 1500, "height": 900})
        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))
        # Third-party mission content is unavailable, but local code, audio and photos must work.
        await page.route("**images-api.nasa.gov/**", lambda route: route.abort())
        await page.route("**images-assets.nasa.gov/**", lambda route: route.abort())
        await page.route("**cdn.jsdelivr.net/**", lambda route: route.abort())
        await page.add_init_script(ARCS)
        await page.goto((ROOT / "index.html").as_uri(), wait_until="load")
        await page.wait_for_selector("#root canvas", state="attached", timeout=30000)
        
        await page.wait_for_timeout(1900)
        await page.wait_for_timeout(2200)

        for label, mid in [("أوبورتيونيتي", "opp"), ("سبيريت", "spi"), ("لونوخود 1", "lun")]:
            await open_mission(page, label)
            await page.wait_for_function("document.querySelector('.mission-guide')?.dataset.mode === 'speaking'", timeout=12000)
            guide = await page.evaluate("""() => ({
                mode: document.querySelector('.mission-guide').dataset.mode,
                mission: document.querySelector('.mission-guide').dataset.mission,
                slides: document.querySelectorAll('.craft-thumb').length,
                externalComponent: !!document.querySelector('script[type="text/babel"][src]'),
                webgl: !!document.querySelector('.robot-canvas'),
            })""")
            assert guide["mission"] == mid, guide
            assert guide["slides"] >= 3, guide
            assert not guide["externalComponent"] and not guide["webgl"], guide
            await page.wait_for_function("document.querySelector('.craft-caption')?.dataset.present === '1'", timeout=10000)
            current = await page.evaluate("document.querySelector('.craft-caption__line').textContent")
            assert current, "Real caption must accompany the Arabic narration"

            await page.click(".mission-guide__play")
            await page.wait_for_function("document.querySelector('.mission-guide')?.dataset.mode === 'paused'", timeout=4000)
            paused_caption = await page.evaluate("document.querySelector('.craft-caption__line')?.textContent")
            await page.wait_for_timeout(700)
            assert await page.evaluate("document.querySelector('.craft-caption__line')?.textContent") == paused_caption
            await page.click(".craft-cc-control")
            assert await page.evaluate("document.querySelector('.craft-caption').dataset.present") == "0"
            await page.click(".craft-cc-control")
            assert await page.evaluate("document.querySelector('.craft-caption').dataset.present") == "1"

            await page.click(".mission-guide__play")
            await page.wait_for_function("document.querySelector('.mission-guide')?.dataset.mode === 'speaking'", timeout=4000)
            await page.click(".mission-guide__replay")
            await page.wait_for_timeout(700)
            assert await page.evaluate("document.querySelector('.mission-guide').dataset.mode") == "speaking"
            # Collapse never removes the slideshow or closed captions.
            await page.click(".mission-guide__hide")
            await page.wait_for_selector(".mission-guide__reopen")
            assert await page.locator(".craft-thumb").count() >= 3
            await page.click(".mission-guide__reopen")
            await page.wait_for_selector(".mission-guide__play")
            results.append({"mission": mid, "fileProtocol": True, "slides": guide["slides"], "controls": "pause/resume/replay/CC/hide/reopen"})
            if mid == "opp":
                await page.screenshot(path=str(CAPTURES / "2d_guide_desktop.png"))
            # Real back control stops the story before landing on the next body.
            await page.click('header button:has-text("المجموعة الشمسية")')
            await page.wait_for_timeout(1300)

        # Failed illustration must leave a visible 2D SVG guide, not an empty card.
        mobile = await browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, reduced_motion="reduce")
        mobile.on("pageerror", lambda err: errors.append(str(err)))
        await mobile.route("**/images/mission-guide*", lambda route: route.abort())
        await mobile.route("**images-api.nasa.gov/**", lambda route: route.abort())
        await mobile.add_init_script(ARCS)
        await mobile.goto("http://127.0.0.1:3000/", wait_until="load")
        await mobile.wait_for_selector("#root canvas", state="attached", timeout=30000)
        
        await mobile.wait_for_timeout(1900)
        await mobile.wait_for_timeout(2200)
        await open_mission(mobile, "أوبورتيونيتي")
        await mobile.wait_for_timeout(1000)
        fallback = await mobile.evaluate("""() => {
            const g = document.querySelector('.mission-guide');
            const r = g.getBoundingClientRect();
            const motion = getComputedStyle(g.querySelector('.mission-guide__avatar img, .mission-guide__robot')).animationName;
            return { svg: !!g.querySelector('svg[data-guide-fallback]'),
                fits: r.left >= 0 && r.right <= innerWidth + 1,
                caption: !!document.querySelector('.craft-caption'), motion };
        }""")
        assert fallback["svg"] and fallback["fits"] and fallback["caption"], fallback
        assert fallback["motion"] == "none", fallback
        await mobile.screenshot(path=str(CAPTURES / "2d_guide_mobile.png"))
        results.append({"failedIllustration": fallback})
        for height in [844, 667]:
            await mobile.set_viewport_size({"width": 390, "height": height})
            await mobile.wait_for_timeout(250)
            separation = await mobile.evaluate("""() => {
                const guide = document.querySelector('.mission-guide').getBoundingClientRect();
                const caption = document.querySelector('.craft-caption').getBoundingClientRect();
                const apart = guide.right <= caption.left || caption.right <= guide.left || guide.bottom <= caption.top || caption.bottom <= guide.top;
                return { apart, height: innerHeight, guide: [guide.left,guide.top,guide.right,guide.bottom], caption: [caption.left,caption.top,caption.right,caption.bottom] };
            }""")
            assert separation["apart"], separation
            results.append({"mobileSeparation": separation})
        assert not errors, errors
        await browser.close()
    print(json.dumps(results, ensure_ascii=False))
    print("PASS: local-file three-mission guide, existing Arabic audio, caption controls, collapsed state, mobile SVG fallback and reduced motion.")


if __name__ == "__main__":
    asyncio.run(main())
