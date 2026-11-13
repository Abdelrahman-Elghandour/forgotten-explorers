import asyncio
import json
import runpy
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parent.parent
helpers = runpy.run_path(str(ROOT / 'tests' / 'browser_craft.py'))
ARCS, land = helpers['ARCS'], helpers['land']
MEDIA='''window.__audioElements=[];const OriginalAudio=window.Audio;
window.Audio=function(src){const a=new OriginalAudio(src);__audioElements.push(a);return a;};window.Audio.prototype=OriginalAudio.prototype;'''

async def main():
    expected=json.loads((ROOT/'tests/fixtures/user-english-transcripts.json').read_text())
    async with async_playwright() as p:
        browser=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        page=await browser.new_page(viewport={'width':1600,'height':900})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        await page.add_init_script(ARCS+MEDIA)
        await page.goto('http://127.0.0.1:3000/',wait_until='load')
        await page.wait_for_selector('.intro-skip')
        await page.click('.intro-skip');await page.wait_for_timeout(1450)
        labels=await land(page,'أوبورتيونيتي')
        await page.click('.surface-root button[aria-label="'+labels[0]+'"]')
        await page.wait_for_timeout(800)
        assert await page.locator('.craft-hud .voice-transcript-readable').count()==0,'Arabic transcript stays opt-in'
        await page.click('.craft-hud .voice-transcript-toggle')
        assert expected['opp'] in await page.locator('.craft-hud .voice-transcript-readable').inner_text()
        # Every runtime mission has its own exact enDiary field, with Arabic kept separate.
        runtime=await page.evaluate('M.map(m=>({id:m.id,enDiary:m.enDiary,diary:m.diary}))')
        assert len(runtime)==12
        for m in runtime:
            assert m['enDiary']==expected[m['id']]
            assert m['diary']!=m['enDiary']
        await page.wait_for_function('__audioElements.some(a=>a.src.includes("audio/opp.")&&!a.paused)')
        time=await page.evaluate('__audioElements.find(a=>a.src.includes("audio/opp.")).currentTime')
        await page.click('.craft-voice__btn');await page.wait_for_timeout(250)
        paused=await page.evaluate('({time:__audioElements.find(a=>a.src.includes("audio/opp.")).currentTime,paused:__audioElements.find(a=>a.src.includes("audio/opp.")).paused})')
        assert paused['paused']
        await page.wait_for_timeout(300)
        held=await page.evaluate('__audioElements.find(a=>a.src.includes("audio/opp.")).currentTime')
        assert abs(held-paused['time'])<.02
        await page.click('.craft-voice__btn');await page.wait_for_timeout(300)
        resumed=await page.evaluate('({time:__audioElements.find(a=>a.src.includes("audio/opp.")).currentTime,paused:__audioElements.find(a=>a.src.includes("audio/opp.")).paused})')
        assert not resumed['paused'] and resumed['time']>=paused['time'],'Resume must not restart narration'
        await page.click('header button:has-text("EN")');await page.wait_for_timeout(200)
        assert expected['opp'] in await page.locator('.craft-quote').inner_text()
        assert await page.locator('.craft-quote').get_attribute('dir')=='ltr'
        assert 'awaiting matched narration timing' in await page.locator('.craft-hud .voice-caption').inner_text()
        # Test-only measured-cue stub proves ready-to-plug exact timing uses actual playback time.
        await page.evaluate("MISSION_CAPTION_CUES.opp=[{start:0,end:10,text:'Measured-cue test phrase'}]")
        await page.wait_for_timeout(500)
        assert 'Measured-cue test phrase' in await page.locator('.craft-hud .voice-caption').inner_text()
        assert 'awaiting' not in await page.locator('.craft-hud .voice-caption').inner_text()
        await page.click('[aria-label="mute"]')
        assert await page.evaluate('__audioElements.find(a=>a.src.includes("audio/opp.")).muted')
        assert not errors,errors
        await browser.close()
    print('PASS: all twelve exact enDiary fields, Arabic opt-in, EN story, honest untimed fallback, measured-cue hook, real pause/resume and mute.')

if __name__=='__main__':asyncio.run(main())
