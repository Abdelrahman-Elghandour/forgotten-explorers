"""Regression: no mute UI, one persistent ambient track, gesture/focus recovery, real gallery controls."""
import asyncio,json,runpy
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
helpers=runpy.run_path(str(ROOT/'tests/browser_craft.py'))
TRACK="""(() => {const Native=window.Audio;window.__audios=[];window.Audio=function(...args){const a=new Native(...args);__audios.push(a);return a;};window.Audio.prototype=Native.prototype;})();"""
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
  page=await b.new_page(viewport={'width':1500,'height':900});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.add_init_script(TRACK);await page.add_init_script(helpers['ARCS'])
  async def api(route):
   kind='video' if 'media_type=video' in route.request.url else 'image'
   items=[] if kind=='image' else [{'data':[{'nasa_id':'always-audio-test','media_type':'video','title':'Playback test'}],'links':[{'href':'https://images-assets.nasa.gov/video/always-audio-test/always-audio-test~thumb.jpg'}]}]
   await route.fulfill(json={'collection':{'items':items}},headers={'Access-Control-Allow-Origin':'*'})
  await page.route('https://images-api.nasa.gov/search**',api)
  video_bytes=(ROOT/'videos/intro.mp4').read_bytes()
  async def media(route):
   if not route.request.url.endswith('.mp4'):
    await route.fulfill(path=str(ROOT/'images/mission-guide.webp'),content_type='image/webp');return
   value=route.request.headers.get('range','')
   if value.startswith('bytes='):
    begin,end=value[6:].split('-',1);begin=int(begin or 0);end=min(int(end) if end else len(video_bytes)-1,len(video_bytes)-1)
    body=video_bytes[begin:end+1]
    await route.fulfill(status=206,body=body,content_type='video/mp4',headers={'Accept-Ranges':'bytes','Content-Range':f'bytes {begin}-{end}/{len(video_bytes)}','Content-Length':str(len(body))})
   else:await route.fulfill(body=video_bytes,content_type='video/mp4',headers={'Accept-Ranges':'bytes'})
  await page.route('https://images-assets.nasa.gov/video/always-audio-test/**',media)
  await page.goto((ROOT/'index.html').as_uri(),wait_until='load')
  await page.wait_for_selector('#root canvas',state='attached')
  # The exhibit opens directly now; the film is opened on demand for this check.
  await page.click("header button[aria-label='Play the opening film']")
  await page.wait_for_selector('.intro-video')
  assert await page.locator('.intro-audio-control,header button[aria-label="mute"]').count()==0
  await page.evaluate('document.querySelector(".intro-video").currentTime=26.7')
  await page.wait_for_timeout(2100)
  await page.wait_for_function('__audios.some(a=>a.dataset.ambient==="space"&&!a.paused&&a.volume>.02)')
  await page.evaluate('window.__ambient=__audios.find(a=>a.dataset.ambient==="space")')
  # Autoplay-only ambient also recovers on returning to the tab without a click.
  await page.evaluate('__ambient.pause(); window.dispatchEvent(new Event("focus"))')
  await page.wait_for_function('!__ambient.paused')
  await helpers['land'](page,'أوبورتيونيتي')
  assert await page.evaluate('!__ambient.paused&&!__ambient.muted')
  await page.click('.surface-root button[aria-label="أوبورتيونيتي"]')
  await page.wait_for_function('__audios.some(a=>a.dataset.mission==="opp"&&!a.paused)')
  await page.wait_for_function('document.querySelector(".mission-guide").dataset.mode==="speaking"')
  await page.click('.mission-guide__play')
  await page.wait_for_function('document.querySelector(".mission-guide").dataset.mode==="paused"')
  await page.evaluate('window.__story=__audios.findLast(a=>a.dataset.mission==="opp");__ambient.pause();window.dispatchEvent(new Event("focus"))')
  await page.wait_for_function('!__ambient.paused')
  assert await page.evaluate('__story.paused'), 'Ambient recovery must not restart a deliberately paused story'
  assert await page.evaluate('__audios.filter(a=>a.dataset.ambient==="space").length')==1
  print('PASS: one unmuted background across Solar System/surface/story; automatic focus recovery; paused story preserved.',flush=True)
  await page.click('.craft-thumb[aria-label="Playback test"]')
  await page.wait_for_selector('video.craft-hero--video')
  await page.wait_for_function('document.querySelector("video.craft-hero--video").readyState>=1')
  assert await page.evaluate('!document.querySelector("video.craft-hero--video").muted&&!document.querySelector("video.craft-hero--video").controls')
  await page.click('.craft-video-control--play')
  await page.wait_for_function('!document.querySelector("video.craft-hero--video").paused')
  await page.click('.craft-video-control--play')
  assert await page.evaluate('document.querySelector("video.craft-hero--video").paused')
  await page.wait_for_function('!document.querySelector(".craft-video-seek").disabled && Number(document.querySelector(".craft-video-seek").max)>1')
  await page.locator('.craft-video-seek').focus()
  for _ in range(10):await page.locator('.craft-video-seek').press('ArrowRight')
  print('Keyboard seek',await page.evaluate('({value:document.querySelector(".craft-video-seek").value,max:document.querySelector(".craft-video-seek").max,t:document.querySelector("video.craft-hero--video").currentTime})'),flush=True)
  await page.wait_for_function('document.querySelector("video.craft-hero--video").currentTime>.05')
  await page.click('.craft-video-control--replay')
  await page.wait_for_function('document.querySelector("video.craft-hero--video").currentTime<1&&!document.querySelector("video.craft-hero--video").paused')
  assert await page.locator('[aria-label="mute"],.intro-audio-control,[aria-label="Mute"],[aria-label="Unmute"]').count()==0
  assert not errors,errors
  print('PASS: file:// audio always enabled; one ambient track across views; autoplay-only focus recovery; paused story preserved; audible gallery play/pause/seek/replay; no mute controls.')
  await b.close()
if __name__=='__main__':asyncio.run(main())
