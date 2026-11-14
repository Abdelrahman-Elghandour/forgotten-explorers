"""The exhibit must start on its own: no overlay, no click, and sound attempted
immediately, with automatic recovery when the browser blocks audible autoplay.
"""
import asyncio
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8765/"

PROBE = """(() => {
  window.__plays = [];
  window.__audios = [];
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    window.__plays.push((this.currentSrc || this.src || 'inline').split('/').pop());
    return play.apply(this, arguments);
  };
  const NativeAudio = window.Audio;
  window.Audio = function () {
    const el = new NativeAudio(...arguments);
    window.__audios.push(el);
    return el;
  };
  window.Audio.prototype = NativeAudio.prototype;
})()"""

STATE = """() => {
  const amb = (window.__audios || []).filter(a => a.dataset.ambient === 'space');
  return {
    overlays: document.querySelectorAll('.intro-overlay').length,
    plays: window.__plays || [],
    ambient: amb.map(a => ({ paused: a.paused, muted: a.muted, volume: +a.volume.toFixed(2), t: +a.currentTime.toFixed(1) })),
    title: !!document.querySelector('h1'),
  };
}"""


async def run(browser, label):
    ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
    page = await ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await page.add_init_script(PROBE)
    await page.goto(URL, wait_until="commit")
    await page.wait_for_selector("#root canvas", state="attached", timeout=30000)
    await page.wait_for_timeout(1500)
    before = await page.evaluate(STATE)
    await page.mouse.click(700, 700)  # any ordinary click must recover sound
    await page.wait_for_timeout(1500)
    after = await page.evaluate(STATE)
    print(label, "before:", before)
    print(label, "after :", after, "errors:", errors[:2])
    assert before["overlays"] == 0, "the film must not gate the first screen"
    assert before["title"], "the Solar System title must be visible without interaction"
    assert "background_music.mp4" in before["plays"], "the soundtrack must be requested at launch"
    assert after["ambient"], "the soundtrack element must exist"
    track = after["ambient"][0]
    assert not track["paused"], "the soundtrack must be playing after input"
    assert not track["muted"], "the soundtrack must never be muted"
    assert track["volume"] > 0, "the soundtrack must be audible"
    assert not errors, errors
    await ctx.close()


async def main():
    async with async_playwright() as p:
        allowed = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        await run(allowed, "audible-autoplay")
        await allowed.close()
        blocked = await p.chromium.launch(args=["--autoplay-policy=document-user-activation-required"])
        await run(blocked, "blocked-autoplay")
        await blocked.close()
    print("PASS: direct launch, no overlay, soundtrack at load, sound recovered on first click.")


asyncio.run(main())
