"""Record the real application for the 30-second submission film.

Each scene runs in its own browser context so the resulting WebM starts at the
page load; the script logs the offset of every scripted action so the edit can
trim to the exact moment the interface is settled.
"""
import asyncio
import runpy
import time
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "film" / "raw"
URL = "http://127.0.0.1:3000/"
H = runpy.run_path(str(ROOT / "tests" / "browser_craft.py"))
ARCS = H["ARCS"]
land = H["land"]
planets = H["planets"]

VIEW = {"width": 1920, "height": 1080}


async def enter(page):
    """Wait for the intro and hand off to the live canvas."""
    await page.wait_for_selector(".intro-overlay", timeout=40000)
    await page.evaluate(
        "() => { const v = document.querySelector('.intro-video');"
        " if (v) { v.muted = true; v.currentTime = 26.6; } }"
    )
    await page.wait_for_timeout(2400)
    await page.wait_for_selector(".intro-overlay", state="detached", timeout=15000)


async def scene(browser, name, body):
    ctx = await browser.new_context(
        viewport=VIEW,
        record_video_dir=str(RAW),
        record_video_size=VIEW,
        device_scale_factor=1,
    )
    page = await ctx.new_page()
    await page.add_init_script(ARCS)
    t0 = time.time()

    def mark(label):
        print(f"[{name}] {label} {time.time() - t0:6.2f}s", flush=True)

    await page.goto(URL, wait_until="load")
    await enter(page)
    mark("app")
    await body(page, mark)
    video = page.video
    await ctx.close()
    path = await video.path()
    print(f"[{name}] file {path}", flush=True)


async def solar(page, mark):
    await page.wait_for_timeout(700)
    pts = await planets(page)
    if pts:
        x, y, _ = pts[1 % len(pts)]
        await page.mouse.move(x, y, steps=24)
        mark("hover-a")
        await page.wait_for_timeout(1300)
        x2, y2, _ = pts[3 % len(pts)]
        await page.mouse.move(x2, y2, steps=24)
        mark("hover-b")
        await page.wait_for_timeout(1300)
    await page.mouse.move(960, 540, steps=30)
    await page.wait_for_timeout(900)
    mark("settle")


async def mars(page, mark):
    await land(page, "أوبورتيونيتي")
    mark("surface")
    await page.wait_for_timeout(1400)
    await page.hover('.surface-root button[aria-label*="سبيريت"]')
    mark("hover-spirit")
    await page.wait_for_timeout(1300)
    await page.hover('.surface-root button[aria-label*="أوبورتيونيتي"]')
    mark("hover-opp")
    await page.wait_for_timeout(900)
    await page.mouse.move(1500, 820)
    await page.mouse.down()
    for i in range(1, 26):
        await page.mouse.move(1500 - i * 22, 820)
        await page.wait_for_timeout(16)
    await page.mouse.up()
    mark("pan")
    await page.wait_for_timeout(1300)


async def console(page, mark):
    await land(page, "أوبورتيونيتي")
    await page.wait_for_timeout(700)
    await page.click('.surface-root button[aria-label*="أوبورتيونيتي"]')
    mark("open")
    await page.wait_for_timeout(2900)
    await page.click('.craft-hud button:has-text("التفكيك")')
    mark("blueprint")
    await page.wait_for_timeout(2700)
    await page.click('.craft-hud button:has-text("المحاكي")')
    mark("simulator")
    await page.wait_for_timeout(2600)


async def english(page, mark):
    await land(page, "أوبورتيونيتي")
    await page.wait_for_timeout(600)
    await page.click('.surface-root button[aria-label*="أوبورتيونيتي"]')
    await page.wait_for_timeout(2200)
    await page.click('header button:has-text("EN")')
    mark("english")
    await page.wait_for_timeout(2600)


async def main():
    RAW.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        await scene(browser, "solar", solar)
        await scene(browser, "mars", mars)
        await scene(browser, "console", console)
        await scene(browser, "english", english)
        await browser.close()


asyncio.run(main())
