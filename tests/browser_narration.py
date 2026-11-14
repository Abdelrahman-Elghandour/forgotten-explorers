"""Concrete media-policy/timing checks for the new narration layer; no app navigation changes."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'captures'
INSTRUMENT = """
window.__introAudio = null; window.__voiceEvents = [];
const NativeAudio = window.Audio;
window.Audio = function(src) {
  const a = new NativeAudio(src);
  a.addEventListener('playing', () => {
    if (a.dataset.narration === 'intro') {
      window.__introAudio = a;
      window.__voiceEvents.push({video:document.querySelector('.intro-video')?.currentTime,audio:a.currentTime});
    }
  });
  const mark = setInterval(() => {if(a.dataset.narration === 'intro'){window.__introAudio=a;clearInterval(mark);}},10);
  return a;
};
window.Audio.prototype = NativeAudio.prototype;
"""

async def audible(p):
    browser = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    page = await browser.new_page(viewport={'width':1600,'height':900})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    await page.add_init_script(INSTRUMENT)
    await page.goto('http://127.0.0.1:3000/',wait_until='load')
    await page.wait_for_selector('.intro-video')
    await page.wait_for_function('window.__introAudio && __introAudio.readyState >= 2')
    await page.evaluate("document.querySelector('.intro-video').currentTime=11.4")
    await page.wait_for_timeout(130)
    assert await page.evaluate('__introAudio.paused'), 'Narrator must not speak before the blackout'
    await page.wait_for_function('__voiceEvents.length > 0')
    event = await page.evaluate('__voiceEvents[0]')
    print('blackout start:',event)
    assert 11.82 <= event['video'] <= 12.1, event
    await page.wait_for_selector('.intro-caption')
    first = await page.locator('.intro-caption').inner_text()
    assert "Don't worry" in first, first
    await page.wait_for_timeout(700)
    volume=await page.evaluate('document.querySelector(".intro-video").volume')
    assert volume < .35, volume
    await page.screenshot(path=str(OUT/'intro_english_caption.png'))
    await page.evaluate("document.querySelector('.intro-video').currentTime=17.1")
    await page.wait_for_timeout(400)
    sync=await page.evaluate('({v:document.querySelector(".intro-video").currentTime,a:__introAudio.currentTime})')
    assert abs((sync['v']-11.833333333333334)-sync['a']) < .18, sync
    text=await page.locator('.intro-caption').inner_text()
    assert 'Through your eyes' in text, text
    await page.click('.intro-transcript-toggle')
    await page.wait_for_selector('.intro-transcript-panel')
    assert 'bring your story back into the light' in await page.locator('.intro-transcript-panel').inner_text()
    await page.click('[aria-label="Close transcript"]')
    await page.click('.intro-audio-control')
    await page.wait_for_timeout(150)
    assert await page.evaluate('__introAudio.paused')
    before=await page.evaluate('document.querySelector(".intro-video").currentTime')
    await page.click('.intro-audio-control')
    await page.wait_for_timeout(300)
    sync=await page.evaluate('({v:document.querySelector(".intro-video").currentTime,a:__introAudio.currentTime,p:__introAudio.paused})')
    assert before <= sync['v'] <= before+1, sync
    assert not sync['p'] and abs((sync['v']-11.833333333333334)-sync['a'])<.18, sync
    await page.evaluate("() => { const v = document.querySelector('.intro-video'); if (v) { v.muted = true; v.currentTime = Math.max(0, (v.duration || 28) - 1.4); } }")
    await page.wait_for_timeout(1600)
    assert await page.locator('.intro-overlay').count()==0
    assert await page.evaluate('__introAudio.paused')
    await page.click('header button:has-text("Transcript")')
    await page.wait_for_selector('.intro-transcript-panel')
    assert 'forgotten you' in await page.locator('.intro-transcript-panel').inner_text()
    assert not errors,errors
    await browser.close()

async def blocked(p):
    browser=await p.chromium.launch()
    page=await browser.new_page(viewport={'width':390,'height':844})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    await page.add_init_script(INSTRUMENT)
    await page.goto('http://127.0.0.1:3000/',wait_until='load')
    await page.wait_for_selector('.intro-audio-control')
    await page.wait_for_function('document.querySelector(".intro-video").muted')
    await page.evaluate("document.querySelector('.intro-video').currentTime=16")
    await page.wait_for_timeout(300)
    assert 'Unmute' in await page.locator('.intro-audio-control').inner_text()
    before=await page.evaluate('document.querySelector(".intro-video").currentTime')
    await page.click('.intro-audio-control')
    await page.wait_for_timeout(400)
    sync=await page.evaluate('({v:document.querySelector(".intro-video").currentTime,a:__introAudio.currentTime,p:__introAudio.paused})')
    assert before <= sync['v'] <= before+1, sync
    assert not sync['p'] and abs((sync['v']-11.833333333333334)-sync['a'])<.18,sync
    await page.screenshot(path=str(OUT/'intro_mobile_caption.png'))
    assert not errors,errors
    await browser.close()

async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        await audible(p)
        await blocked(p)
    print('PASS: blackout timing, English phrase subtitles, ducking, no-restart mid-video unmute, skip cleanup and post-intro transcript.')

if __name__=='__main__':asyncio.run(main())
