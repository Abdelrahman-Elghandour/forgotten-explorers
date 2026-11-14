"""Compare the local precompiled Tailwind build with the previous CDN build.

Both pages are screenshotted on the Solar System and on two dialog screens,
which between them use most of the utility classes in the app.
"""
import asyncio
import shutil
from pathlib import Path

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT / "_parity_old.html"
URL = "http://127.0.0.1:8765/"
CAPTURES = ROOT / "tests" / "captures"

DISMISS = """() => {
  const o = document.querySelector('.intro-overlay');
  if (o) o.remove();
  document.querySelectorAll('[inert]').forEach(e => e.removeAttribute('inert'));
  document.querySelectorAll('[aria-hidden="true"]').forEach(e => e.setAttribute('aria-hidden', 'false'));
}"""


async def capture(browser, filename, tag):
    ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await page.goto(URL + filename, wait_until="commit")
    await page.wait_for_selector("#root canvas", state="attached", timeout=40000)
    await page.evaluate(DISMISS)
    await page.wait_for_timeout(1800)

    out = []
    for name, opener in (("solar", None), ("quiz", "الاختبار"), ("sources", "المصادر")):
        if opener:
            await page.click(f"header button:has-text('{opener}')")
            await page.wait_for_timeout(900)
        path = CAPTURES / f"parity_{tag}_{name}.png"
        CAPTURES.mkdir(exist_ok=True)
        await page.screenshot(path=str(path))
        out.append(path)
        if opener:
            await page.keyboard.press("Escape")
            await page.click("[role='dialog'] button[aria-label='close']", timeout=5000)
            await page.wait_for_timeout(500)

    print(tag, "errors:", errors[:3])
    await ctx.close()
    return out


async def main():
    shutil.copyfile(ROOT / "tests" / "fixtures" / "pre-always-audio.html", OLD)
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
            old = await capture(browser, "_parity_old.html", "old")
            new = await capture(browser, "index.html", "new")
            await browser.close()
        for o, n in zip(old, new):
            a, c = Image.open(o).convert("RGB"), Image.open(n).convert("RGB")
            if a.size != c.size:
                print(o.name, "size differs", a.size, c.size)
                continue
            diff = ImageChops.difference(a, c).convert("L")
            px = sum(1 for v in diff.getdata() if v > 24)
            total = a.size[0] * a.size[1]
            print(f"{o.name.split('_', 2)[2]}: {px} differing px ({px / total * 100:.3f}%), bbox={diff.getbbox()}")
    finally:
        OLD.unlink(missing_ok=True)


asyncio.run(main())
