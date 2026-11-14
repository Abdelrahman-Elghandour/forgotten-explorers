"""Real-media tests: audible autoplay, automatic gesture recovery, timing and captions."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parents[1]
INSTRUMENT = """(() => {
 const NativeAudio=window.Audio;window.__introAudio=null;window.__voiceEvents=[];
 window.Audio=function(src){const a=new NativeAudio(src);
 a.addEventListener('playing',()=>{if(a.dataset.narration==='intro'&&!a.muted){window.__introAudio=a;window.__voiceEvents.push({video:document.querySelector('.intro-video')?.currentTime,audio:a.currentTime});}});
 const mark=setInterval(()=>{if(a.dataset.narration==='intro'){window.__introAudio=a;clearInterval(mark);}},10);return a;};
 window.Audio.prototype=NativeAudio.prototype;
})();"""
async def check(p,blocked):
 browser=await p.chromium.launch(args=['--autoplay-policy='+('user-gesture-required' if blocked else 'no-user-gesture-required')])
 page=await browser.new_page(viewport={'width':1600,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 await page.add_init_script(INSTRUMENT)
 await page.goto('http://127.0.0.1:3000/',wait_until='load')
 await page.click("header button[aria-label='Play the opening film']")
 await page.wait_for_selector('.intro-video')
 assert await page.locator('.intro-audio-control,header button[aria-label="mute"]').count()==0
 assert not await page.evaluate('document.querySelector(".intro-video").muted')
 await page.wait_for_function('!document.querySelector(".intro-video").paused && !document.querySelector(".intro-video").muted')
 await page.wait_for_function('window.__introAudio && __introAudio.readyState >= 2')
 await page.evaluate('document.querySelector(".intro-video").currentTime=11.4')
 await page.wait_for_timeout(100)
 assert await page.evaluate('__introAudio.paused'),'Narration must not begin before the black frame'
 await page.wait_for_function('__voiceEvents.some(e=>e.video>=11.82)')
 event=await page.evaluate('__voiceEvents.find(e=>e.video>=11.82)')
 assert 11.82<=event['video']<=12.12,event
 await page.wait_for_selector('.intro-caption')
 await page.wait_for_timeout(550)
 assert await page.evaluate('document.querySelector(".intro-video").volume')<.35
 await page.evaluate('document.querySelector(".intro-video").currentTime=17.1')
 await page.wait_for_function('!document.querySelector(".intro-video").seeking && document.querySelector(".intro-video").readyState >= 2 && document.querySelector(".intro-video").currentTime > 17.15 && !__introAudio.paused')
 sync=await page.evaluate('({v:document.querySelector(".intro-video").currentTime,a:__introAudio.currentTime,muted:__introAudio.muted})')
 assert not sync['muted'] and abs(sync['v']-11.833333333333334-sync['a'])<.18,sync
 await page.click('.intro-transcript-toggle')
 await page.wait_for_selector('.intro-transcript-panel')
 await page.click('[aria-label="Close transcript"]')
 await page.evaluate('document.querySelector(".intro-video").currentTime=26.7')
 await page.wait_for_selector('.intro-overlay',state='hidden',timeout=10000)
 assert await page.locator('.intro-overlay').count()==0
 assert await page.evaluate('__introAudio.paused'),'Intro narration cleans up at the unchanged dissolve'
 await page.click('header button:has-text("Transcript")')
 await page.wait_for_selector('.intro-transcript-panel')
 assert not errors,errors
 await browser.close()
 print('PASS:', 'blocked autoplay resumes on Enter without a toggle' if blocked else 'audible autoplay', 'and original narration-clock/caption/ducking/dissolve checks')
async def main():
 # The film is opened by a click now, so it always starts with sound; the
 # blocked-autoplay launch case is covered by tests/browser_launch_audio.py.
 async with async_playwright() as p:
  await check(p,False)
if __name__=='__main__':asyncio.run(main())
