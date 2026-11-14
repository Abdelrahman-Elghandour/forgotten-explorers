"""Check the new voice-overs, measured captions and the restructured rosters in a real browser."""
import asyncio
import runpy
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'tests' / 'captures'
helpers = runpy.run_path(str(ROOT / 'tests' / 'browser_craft.py'))
ARCS, land = helpers['ARCS'], helpers['land']
MEDIA = '''window.__audioElements=[];const OriginalAudio=window.Audio;
window.Audio=function(src){const a=new OriginalAudio(src);__audioElements.push(a);return a;};window.Audio.prototype=OriginalAudio.prototype;'''


async def dismiss_soon(page):
    if await page.locator('[role="dialog"]').count():
        await page.click('[role="dialog"] button')


async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        page = await browser.new_page(viewport={'width': 1600, 'height': 900})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.add_init_script(ARCS + MEDIA)
        await page.goto('http://127.0.0.1:3000/', wait_until='load')
        await page.wait_for_selector(".intro-overlay", timeout=20000)
        await page.evaluate("() => { const v = document.querySelector('.intro-video'); if (v) { v.muted = true; v.currentTime = Math.max(0, (v.duration || 28) - 1.4); } }")
        await page.wait_for_timeout(1900)
        await page.wait_for_timeout(1500)

        # Mars: exactly three crafts, one of them a locked teaser.
        labels = await land(page, 'أوبورتيونيتي')
        assert len(labels) == 3, f'Mars should list three crafts, got {labels}'
        assert any('إنسايت' in l for l in labels), labels
        assert await page.locator('.craft-soon').count() == 1, 'one coming-soon badge on Mars'
        assert 'القصة قريباً' in await page.locator('.craft-soon').inner_text()

        ins = [l for l in labels if 'إنسايت' in l][0]
        await page.eval_on_selector(f'.surface-root button[aria-label="{ins}"]', 'el => el.click()')
        await page.wait_for_timeout(500)
        assert await page.locator('.craft-hud').count() == 0, 'locked teaser must not open the HUD'
        assert await page.locator('[role="dialog"]').count() == 1, 'locked teaser explains itself'
        assert 'قريباً' in await page.locator('[role="dialog"]').inner_text()
        await dismiss_soon(page)

        # Opportunity: full HUD, Arabic script, opt-in English transcript.
        await page.click('.surface-root button[aria-label="أوبورتيونيتي"]')
        await page.wait_for_selector('.craft-hud', timeout=8000)
        assert await page.locator('.craft-cell').count() == 5, 'all five telemetry facts visible'
        quote = await page.locator('.craft-quote').inner_text()
        assert quote.strip('«»').startswith('أهلًا، أنا Opportunity'), quote[:60]
        assert await page.locator('.craft-hud .voice-transcript-readable').count() == 0
        await page.click('.craft-hud .voice-transcript-toggle')
        transcript = await page.locator('.craft-hud .voice-transcript-readable').inner_text()
        assert 'I am Opportunity' in transcript

        # Playback: captions follow the measured Arabic timing, not a placeholder.
        await page.wait_for_function('__audioElements.some(a=>a.src.includes("audio/opp.")&&!a.paused)', timeout=15000)
        await page.wait_for_timeout(2200)
        first = await page.locator('.craft-hud .voice-caption').inner_text()
        cues = await page.evaluate('MISSION_CAPTION_CUES.opp')
        now = await page.evaluate('__audioElements.find(a=>a.src.includes("audio/opp.")).currentTime')
        expected = next((c['text'] for c in cues if c['start'] <= now < c['end']), None)
        assert expected and expected in first, (now, expected, first)
        assert 'awaiting' not in first
        await page.wait_for_timeout(9000)
        later = await page.locator('.craft-hud .voice-caption').inner_text()
        assert later != first, 'caption advances with the narration'

        # Pause holds position; resume continues rather than restarting.
        await page.click('.craft-voice__btn')
        await page.wait_for_timeout(250)
        paused = await page.evaluate('({t:__audioElements.find(a=>a.src.includes("audio/opp.")).currentTime,p:__audioElements.find(a=>a.src.includes("audio/opp.")).paused})')
        assert paused['p']
        await page.wait_for_timeout(300)
        held = await page.evaluate('__audioElements.find(a=>a.src.includes("audio/opp.")).currentTime')
        assert abs(held - paused['t']) < .02
        await page.click('.craft-voice__btn')
        await page.wait_for_timeout(300)
        resumed = await page.evaluate('({t:__audioElements.find(a=>a.src.includes("audio/opp.")).currentTime,p:__audioElements.find(a=>a.src.includes("audio/opp.")).paused})')
        assert not resumed['p'] and resumed['t'] >= paused['t']

        # English mode shows the English story.
        await page.click('header button:has-text("EN")')
        await page.wait_for_timeout(300)
        assert 'I am Opportunity' in await page.locator('.craft-quote').inner_text()
        assert await page.locator('.craft-quote').get_attribute('dir') == 'ltr'
        await page.click('[aria-label="mute"]')
        assert await page.evaluate('__audioElements.find(a=>a.src.includes("audio/opp.")).muted')
        await page.click('header button:has-text("عربي")')
        await page.wait_for_timeout(200)

        # Moon: exactly one craft, Lunokhod 1.
        await page.click('header button:has-text("المجموعة الشمسية")')
        await page.wait_for_timeout(1600)
        moon = await land(page, 'لونوخود')
        assert len(moon) == 1, f'the Moon should list one craft, got {moon}'
        assert await page.locator('.craft-soon').count() == 0
        await page.click('.surface-root button[aria-label="لونوخود 1"]')
        await page.wait_for_selector('.craft-hud', timeout=8000)
        assert 'لونوخود 1' in await page.locator('.craft-quote').inner_text()

        await page.screenshot(path=str(OUT / 'roster_moon.png'))
        assert not errors, errors
        await browser.close()
    print('PASS: three Mars crafts with a locked InSight teaser, one lunar craft, new Arabic scripts, measured captions, pause/resume and mute.')


if __name__ == '__main__':
    asyncio.run(main())
