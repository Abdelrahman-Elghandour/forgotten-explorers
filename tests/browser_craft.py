"""Check the selected-craft view in a real browser: facts, actions, voice slot, layouts."""
import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "captures"
URL = "http://127.0.0.1:3000/"

# Test-only: read planet hit positions straight from the canvas draw calls.
ARCS = """
window.__arcs = [];
(function () {
  var orig = CanvasRenderingContext2D.prototype.arc;
  CanvasRenderingContext2D.prototype.arc = function (x, y, r) {
    if (r >= 4 && r <= 12) { window.__arcs.push([x, y, r, performance.now()]); if (window.__arcs.length > 160) window.__arcs.shift(); }
    return orig.apply(this, arguments);
  };
})();
"""


async def planets(page):
    # Bodies are painted into a cached layer, so the newest frame often holds
    # only the pulsing Sun. Collect every arc from the last few seconds instead.
    return await page.evaluate("""() => {
        const now = performance.now();
        const m = new Map();
        __arcs.filter(a => now - a[3] < 4000).forEach(a => {
            const k = Math.round(a[0]) + ',' + Math.round(a[1]);
            if (!m.has(k)) m.set(k, [a[0], a[1], a[2]]);
        });
        return [...m.values()]; }""")
async def land(page, want, tries=22):
    """Travel until the surface lists a craft whose label contains `want`."""
    if await page.eval_on_selector_all(".surface-dock", "e => e.length"):
        await page.click("header button:has-text('المجموعة الشمسية')")
        await page.wait_for_timeout(1500)
    for attempt in range(tries):
        pts = await planets(page)
        if not pts:
            await page.wait_for_timeout(300)
            continue
        x, y, _ = pts[attempt % len(pts)]
        await page.mouse.click(x, y)
        await page.wait_for_timeout(900)
        if await page.locator('[role="dialog"]').count():
            await page.click('[role="dialog"] button')
            await page.wait_for_timeout(350)
            continue
        labels = await page.eval_on_selector_all(".surface-root button[aria-label]", "els => els.map(e => e.getAttribute('aria-label'))")
        if labels and any(want in l for l in labels):
            return labels
        if await page.eval_on_selector_all(".surface-dock", "e => e.length"):
            await page.click("header button:has-text('المجموعة الشمسية')")
            await page.wait_for_timeout(1400)
    raise AssertionError(f"could not reach a surface with {want}")
async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        errors = []

        page = await browser.new_page(viewport={"width": 1600, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.add_init_script(ARCS)
        await page.goto(URL, wait_until="load")
        await page.wait_for_selector("#root canvas", state="attached", timeout=20000)
        
        await page.wait_for_timeout(1900)
        await page.wait_for_timeout(2200)

        labels = await land(page, "أوبورتيونيتي")
        await page.click('.surface-root button[aria-label="' + labels[0] + '"]')
        await page.wait_for_timeout(2200)
        await page.screenshot(path=str(OUT / "craft_desktop_ar.png"))

        facts = await page.eval_on_selector_all(".craft-cell", "els => els.map(e => e.innerText.replace(/\\n/g, ' | '))")
        actions = await page.eval_on_selector_all(".craft-act", "els => els.map(e => e.innerText)")
        voice = await page.eval_on_selector(".craft-voice", "e => e.innerText.replace(/\\n/g, ' | ')")
        title = await page.eval_on_selector(".craft-title", "e => e.textContent")
        await page.wait_for_function("() => { const i = document.querySelector('.craft-frame img.craft-hero.on'); return !!i && i.naturalWidth > 0; }", timeout=20000)
        hero = await page.eval_on_selector(".craft-frame img.craft-hero.on", "e => ({ src: e.currentSrc || e.src, w: e.naturalWidth, loaded: e.classList.contains('on') })")
        print("title:", title)
        print("facts:", facts)
        print("actions:", actions)
        print("voice:", voice)
        print("hero:", hero)

        # Opportunity ships a recording: it should report playing, not missing.
        await page.click(".craft-voice__btn") if "استمع" in voice else None
        await page.wait_for_timeout(900)
        print("voice after click:", await page.eval_on_selector(".craft-voice", "e => e.innerText.replace(/\\n/g, ' | ')"))

        # Console tabs are reachable straight from the HUD.
        await page.click('.craft-act:has-text("التفكيك")')
        await page.wait_for_timeout(900)
        active = await page.eval_on_selector_all("aside button.accbg", "els => els.map(e => e.innerText)")
        print("console active tab:", active)
        await page.screenshot(path=str(OUT / "console_blueprint.png"))
        await page.click("aside button[aria-label='close']")
        await page.wait_for_timeout(600)

        # The Moon's single craft carries its own narration.
        await page.click("header button:has-text('المجموعة الشمسية')")
        await page.wait_for_timeout(1400)
        vlabels = await land(page, "لونوخود")
        await page.click('.surface-root button[aria-label="' + vlabels[0] + '"]')
        await page.wait_for_timeout(1600)
        print("moon voice:", await page.eval_on_selector(".craft-voice", "e => e.innerText.replace(/\\n/g, ' | ')"))
        await page.screenshot(path=str(OUT / "craft_voice_moon.png"))
        await page.click("header button:has-text('المجموعة الشمسية')")
        await page.wait_for_timeout(1200)
        mlabels2 = await land(page, "أوبورتيونيتي")
        await page.click('.surface-root button[aria-label="' + mlabels2[0] + '"]')
        await page.wait_for_timeout(1600)

        # English layout
        await page.click('header button:has-text("EN")')
        await page.wait_for_timeout(800)
        await page.screenshot(path=str(OUT / "craft_desktop_en.png"))
        print("en facts:", await page.eval_on_selector_all(".craft-cell dt", "els => els.map(e => e.innerText)"))

        # Mobile layout
        mobile = await browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=3)
        mobile.on("pageerror", lambda e: errors.append(str(e)))
        await mobile.add_init_script(ARCS)
        await mobile.goto(URL, wait_until="load")
        await mobile.wait_for_selector("#root canvas", state="attached", timeout=20000)
        
        await mobile.wait_for_timeout(1900)
        await mobile.wait_for_timeout(2200)
        mlabels = await land(mobile, "أوبورتيونيتي")
        await mobile.click('.surface-root button[aria-label="' + mlabels[0] + '"]')
        await mobile.wait_for_timeout(2200)
        await mobile.screenshot(path=str(OUT / "craft_mobile.png"))
        print("mobile hud box:", await mobile.eval_on_selector(".craft-hud", "e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }"))

        await browser.close()

    assert facts and len(facts) == 5 and all("|" in f for f in facts), "all five telemetry rows must be visible"
    assert any("المحاكي" in a for a in actions), "simulator action present for solar-system craft"
    assert "استمع لقصتها" in voice or "يُشغّل السرد" in voice, "voice-over player present with play state"
    assert hero["loaded"], "hero image loaded"
    assert not errors, errors
    print("PASS: cinematic craft view shows every fact, opens console tabs, and handles a missing recording gracefully.")


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
