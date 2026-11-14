"""Focused 2D-guide lifecycle check using the actual HTMLAudioElement recordings."""
import asyncio
import runpy
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
helpers = runpy.run_path(str(ROOT / "tests/browser_craft.py"))


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        page = await browser.new_page(viewport={"width": 1500, "height": 900})
        await page.add_init_script(helpers["ARCS"])
        # Observe real audio objects without replacing their media behavior or mocking playback.
        await page.add_init_script("""(() => {
            const RealAudio = window.Audio;
            window.__guideAudio = [];
            window.Audio = function (...args) {
                const audio = new RealAudio(...args);
                window.__guideAudio.push(audio);
                return audio;
            };
            window.Audio.prototype = RealAudio.prototype;
        })();""")
        await page.goto((ROOT / "index.html").as_uri(), wait_until="load")
        await page.wait_for_selector("#root canvas", state="attached", timeout=30000)
        
        await page.wait_for_timeout(1900)
        await page.wait_for_timeout(2200)
        await helpers["land"](page, "أوبورتيونيتي")
        await page.click('.surface-root button[aria-label="أوبورتيونيتي"]')
        await page.wait_for_function("document.querySelector('.mission-guide')?.dataset.mode === 'speaking'", timeout=10000)
        await page.wait_for_timeout(500)

        assert await page.locator('header button[aria-label="mute"]').count() == 0
        await page.evaluate("window.__guideBeforeResume = window.__guideAudio.at(-1)")
        await page.click(".mission-guide__play")
        await page.wait_for_function("document.querySelector('.mission-guide').dataset.mode === 'paused'")
        await page.evaluate("window.dispatchEvent(new Event('focus'))")
        await page.wait_for_timeout(150)
        assert await page.evaluate("__guideBeforeResume.paused"), "Auto background recovery must not restart a paused story"
        await page.click(".mission-guide__play")
        await page.wait_for_function("document.querySelector('.mission-guide').dataset.mode === 'speaking'")
        same_audio = await page.evaluate("""() => {
            const a = window.__guideAudio.at(-1);
            return a === window.__guideBeforeResume && !a.muted && !a.paused;
        }""")
        assert same_audio, "Resume must preserve the existing recording and its clock"

        # Seek inside a measured silent cue gap, allowing the actual playback clock to run.
        await page.evaluate("""() => {
            const a = window.__guideAudio.at(-1);
            const cues = window.MISSION_CAPTION_CUES.opp;
            let gap;
            for(let i=0;i<cues.length-1;i++) if(cues[i+1].start-cues[i].end > .3) { gap=[cues[i].end,cues[i+1].start]; break; }
            if(!gap) throw new Error('Expected an actual silent cue gap');
            a.playbackRate = .25;
            a.currentTime = gap[0]+.04;
            a.dispatchEvent(new Event('timeupdate'));
        }""")
        await page.wait_for_function("document.querySelector('.craft-caption').dataset.present === '0'")
        await page.wait_for_timeout(400)
        opacity = await page.evaluate("Number(getComputedStyle(document.querySelector('.craft-caption')).opacity)")
        assert opacity < .03, f"The old subtitle must not linger across a silent cue gap: {opacity}"

        await page.evaluate("""() => {
            const a = window.__guideAudio.at(-1);
            a.playbackRate = 1;
            a.currentTime = a.duration-.04;
            a.dispatchEvent(new Event('timeupdate'));
        }""")
        await page.wait_for_function("document.querySelector('.mission-guide').dataset.mode === 'ended'", timeout=5000)
        await page.wait_for_timeout(450)
        assert await page.evaluate("document.querySelector('.craft-caption').dataset.present") == "0"
        await page.click(".mission-guide__play")
        await page.wait_for_function("document.querySelector('.mission-guide').dataset.mode === 'speaking'")
        active = await page.evaluate("window.__guideAudio.filter(a => a.dataset.narration === 'mission' && !a.paused && !a.ended).length")
        assert active == 1, f"Only the current recording may play, not duplicate guide audio: {active}"
        await browser.close()
    print("PASS: always-enabled audio and pause/resume without restart; actual cue gaps hide captions; completion clears captions; guide replay starts one recording.")


if __name__ == "__main__":
    asyncio.run(main())
