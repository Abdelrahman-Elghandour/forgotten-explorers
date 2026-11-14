import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = "http://127.0.0.1:8765/"

async def run(browser, label, blocked=False):
    ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
    page = await ctx.new_page()
    if blocked:
        await page.route("https://images-api.nasa.gov/**", lambda r: r.abort())
        await page.route("https://images-assets.nasa.gov/**", lambda r: r.abort())
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await page.goto(URL, wait_until="commit")
    await page.wait_for_selector("#root canvas", state="attached", timeout=30000)
    await page.wait_for_selector("text=مستكشفون نسيهم الزمن", timeout=30000)
    t = await page.evaluate("""() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const paint = performance.getEntriesByName('first-contentful-paint')[0];
      return {
        fcp: paint ? Math.round(paint.startTime) : null,
        domInteractive: Math.round(nav.domInteractive || 0),
        loadEnd: Math.round(nav.loadEventEnd || 0),
        intro: !!document.querySelector('.intro-overlay'),
        title: !!document.querySelector('h1'),
        canvas: !!document.querySelector('#root canvas'),
        buttons: [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim()).filter(Boolean).slice(0, 8),
      };
    }""")
    await page.wait_for_timeout(1200)
    audio = await page.evaluate("""() => {
      const a = [...document.querySelectorAll('audio')].find(x => x.dataset.ambient === 'space');
      return a ? { paused: a.paused, muted: a.muted, volume: +a.volume.toFixed(3), t: +a.currentTime.toFixed(1) } : null;
    }""")
    print(label, {**t, "ambient": audio, "errors": errors[:3]})
    await ctx.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        for i in range(3):
            await run(browser, f"warm{i+1}")
        await run(browser, "nasa-offline", blocked=True)
        await browser.close()

asyncio.run(main())
