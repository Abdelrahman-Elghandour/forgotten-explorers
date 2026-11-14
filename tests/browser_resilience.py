"""The craft view must open even when its optional layers are unavailable.

The 3D companion and the NASA media slideshow are enhancements: a missing browser API, a
blocked CDN or an offline image API has to degrade to the still photograph, never take the
React tree down with it (which would leave every rover unclickable).
"""
import asyncio
import json
import runpy
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
HELPERS = runpy.run_path(str(ROOT / "tests" / "browser_craft.py"))
ARCS, land = HELPERS["ARCS"], HELPERS["land"]
URL = "http://127.0.0.1:3000/"

FAILS = []


def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f" — {detail}" if detail else ""))
    if not ok:
        FAILS.append(name)


async def open_opportunity(browser, init_script="", routes=()):
    page = await browser.new_page(viewport={"width": 1500, "height": 880})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    for pattern, action in routes:
        async def handler(route, action=action):
            if action == "abort":
                await route.abort()
            else:
                await route.fulfill(status=503, body="unavailable")
        await page.route(pattern, handler)
    await page.add_init_script(init_script + ARCS)
    await page.goto(URL, wait_until="load")
    await page.wait_for_selector(".intro-overlay", timeout=30000)
    await page.evaluate("() => { const v = document.querySelector('.intro-video'); if (v) { v.muted = true; v.currentTime = Math.max(0, (v.duration || 28) - 1.4); } }")
    await page.wait_for_timeout(1900)
    await page.wait_for_timeout(2400)
    await land(page, "أوبورتيونيتي")
    await page.click('.surface-root button[aria-label="أوبورتيونيتي"]')
    await page.wait_for_timeout(3000)
    state = await page.evaluate("""() => ({
        hud: !!document.querySelector('.craft-hud'),
        title: (document.querySelector('.craft-title') || {}).textContent || '',
        body: document.body.innerText.length,
        rootKids: document.getElementById('root').children.length,
        image: !!document.querySelector('.craft-frame img, .craft-hero'),
    })""")
    return page, state, errors


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])

        # 1. A browser without ResizeObserver (older/embedded webviews).
        page, state, errors = await open_opportunity(browser, "delete window.ResizeObserver;")
        check("opens without ResizeObserver", state["hud"] and state["body"] > 500, str(state))
        check("keeps the still photograph without ResizeObserver", state["image"])
        await page.close()

        # 2. The Three.js CDN is blocked.
        page, state, errors = await open_opportunity(browser, "", [("**/three*.js", "abort")])
        check("opens when the 3D library is blocked", state["hud"] and state["body"] > 500, str(state))
        await page.close()

        # 3. The NASA image API is offline.
        page, state, errors = await open_opportunity(browser, "", [("**/images-api.nasa.gov/**", "block")])
        check("opens when the NASA API is unavailable", state["hud"] and state["body"] > 500, str(state))
        check("falls back to the bundled photograph", state["image"], str(state))
        await page.close()

        # 4. Every external media/CDN host is unreachable: the bundled set must carry the stage.
        page, state, errors = await open_opportunity(browser, "", [
            ("**images-api.nasa.gov/**", "block"),
            ("**images-assets.nasa.gov/**", "block"),
            ("**cdn.jsdelivr.net/**", "block"),
        ])
        offline = await page.evaluate("""() => ({
            slides: document.querySelectorAll('.craft-thumb').length,
            caption: !!document.querySelector('.craft-caption'),
            credit: (document.querySelector('.craft-credit a') || {}).textContent || '',
        })""")
        check("bundled photographs keep the slideshow alive", offline["slides"] >= 4, str(offline))
        check("caption layer renders from bundled code", offline["caption"], str(offline))
        check("bundled slide carries a NASA credit", "NASA" in offline["credit"], offline["credit"])
        await page.close()

        # 5. The media component file itself fails to load.
        page, state, errors = await open_opportunity(browser, "", [("**/src/data/craft-gallery.js", "abort")])
        check("opens when the media component is missing", state["hud"] and state["body"] > 500, str(state))
        await page.close()

        await browser.close()

    print(json.dumps({"failures": FAILS}, ensure_ascii=False))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
