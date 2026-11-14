"""Render the film's typographic cards as transparent 1920x1080 PNGs.

Cinematic beats get a full-frame scrim so text reads over photography; UI beats
get a glass panel so the interface behind it stays bright and legible.
"""
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parent / "cards"
OUT.mkdir(parents=True, exist_ok=True)

FONT = (
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800'
    '&family=Inter:wght@400;500;600;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">'
)

BASE = """
html, body { margin:0; padding:0; width:1920px; height:1080px; background:transparent; }
body { font-family:'Inter', system-ui, sans-serif; -webkit-font-smoothing:antialiased; }
h1 { font-size:64px; line-height:1.08; font-weight:800; letter-spacing:-.02em; color:#f7fbff;
  margin:18px 0 12px; text-shadow:0 3px 30px rgba(0,0,0,.6); }
p { font-size:24px; line-height:1.42; font-weight:400; color:rgba(226,238,252,.82); margin:0;
  max-width:980px; text-shadow:0 2px 18px rgba(0,0,0,.55); }
.chip { display:inline-flex; align-items:center; font-family:'JetBrains Mono', monospace;
  font-size:14px; letter-spacing:.2em; text-transform:uppercase; color:#ffb347;
  padding:9px 15px 8px; border:1px solid rgba(255,179,71,.42); border-radius:999px;
  background:rgba(10,16,28,.6); }
.scrim { position:absolute; inset:0; background:
  linear-gradient(0deg, rgba(5,7,13,.97) 0%, rgba(5,7,13,.80) 22%, rgba(5,7,13,0) 54%),
  linear-gradient(90deg, rgba(5,7,13,.92) 0%, rgba(5,7,13,.45) 34%, rgba(5,7,13,0) 64%); }
.scrim-wrap { position:absolute; left:100px; bottom:96px; width:1320px; }
.panel-wrap { position:absolute; left:64px; bottom:56px; width:1180px; padding:30px 34px 32px;
  border-radius:24px; background:linear-gradient(178deg, #0a1020, #06090f);
  border:1px solid rgba(150,190,255,.16);
  box-shadow:0 28px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06); }
.panel-wrap h1 { font-size:56px; text-shadow:none; }
.panel-wrap p { text-shadow:none; }
"""

TITLE = """
.scrim { background:
  linear-gradient(0deg, rgba(5,7,13,.95) 0%, rgba(5,7,13,.5) 30%, rgba(5,7,13,0) 62%),
  linear-gradient(90deg, rgba(5,7,13,.9) 0%, rgba(5,7,13,.3) 45%, rgba(5,7,13,0) 70%); }
.wrap { position:absolute; left:104px; bottom:130px; width:1500px; }
.kicker { font-family:'JetBrains Mono', monospace; font-size:14px; letter-spacing:.26em;
  text-transform:uppercase; color:#ffb347; }
h1 { font-size:104px; letter-spacing:-.035em; margin:18px 0 8px; }
.ar-title { font-family:'Tajawal', sans-serif; direction:rtl; text-align:left;
  font-size:52px; font-weight:700; color:rgba(233,242,255,.94); margin:0 0 20px; }
.rule { width:110px; height:2px; background:linear-gradient(90deg,#ffb347,rgba(255,179,71,0));
  margin:0 0 18px; }
.sub { font-size:19px; letter-spacing:.12em; text-transform:uppercase; color:rgba(206,224,244,.76); }
"""

END = """
body { background:#05070d; }
.bg { position:absolute; inset:0; background:
  radial-gradient(60% 55% at 50% 44%, rgba(255,179,71,.16) 0%, rgba(5,7,13,0) 62%),
  radial-gradient(45% 40% at 18% 82%, rgba(96,120,255,.14) 0%, rgba(5,7,13,0) 60%),
  radial-gradient(45% 40% at 84% 20%, rgba(140,96,255,.14) 0%, rgba(5,7,13,0) 60%); }
.center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center;
  justify-content:center; gap:14px; text-align:center; }
h1 { font-size:78px; margin:0; letter-spacing:-.03em; text-shadow:none; }
.ar-title { font-family:'Tajawal', sans-serif; font-size:38px; font-weight:700;
  color:rgba(233,242,255,.9); margin:0; }
.line { width:120px; height:2px; background:linear-gradient(90deg,rgba(255,179,71,0),
  #ffb347,rgba(255,179,71,0)); margin:8px 0 6px; }
.url { font-family:'JetBrains Mono', monospace; font-size:17px; letter-spacing:.04em;
  color:rgba(198,220,244,.78); }
.badge { margin-top:6px; font-family:'JetBrains Mono', monospace; font-size:12px;
  letter-spacing:.24em; text-transform:uppercase; color:rgba(255,179,71,.9); }
"""

CAPTIONS = [
    ("02_problem", "scrim", "The problem", "Three machines. Twenty years of silence.",
     "Opportunity, Spirit and Lunokhod 1 finished their missions — and almost nobody heard how."),
    ("03_impact", "panel", "01 · Impact", "A free, bilingual exhibit for classrooms and museums.",
     "Arabic and English, no install, works offline — for students who never meet these missions in their own language."),
    ("04_creativity", "panel", "02 · Creativity", "Meet the craft: its mission, its diary, its voice.",
     "A cinematic console with every fact on screen, and an illustrated guide who talks you through the story."),
    ("05_validity", "panel", "03 · Validity", "A working prototype, not a mockup.",
     "Blueprint breakdown and a dust-and-power simulator, running live in the browser."),
    ("06_data", "panel", "03 · Validity", "Every claim on screen comes from the mission record.",
     "Real NASA imagery, measured narration timing, and captions that follow the audio frame by frame."),
    ("07_relevance", "panel", "04 · Relevance", "NASA's open image library, reused as the backbone.",
     "The exhibit exists because NASA published its pictures, its data and its mission histories for everyone."),
    ("08_story", "scrim", "05 · Storytelling", "Every mission deserves to be heard.",
     "A 28-second opening that dissolves straight into the live Solar System — the film becomes the interface."),
]

TITLE_HTML = """
<div class="scrim"></div>
<div class="wrap">
  <div class="kicker">NASA Space Apps 2026 · Beyond the Signal</div>
  <h1>Forgotten<br>Explorers</h1>
  <div class="ar-title">مستكشفون نسيهم الزمن</div>
  <div class="rule"></div>
  <div class="sub">A bilingual exhibit for the machines we stopped listening to</div>
</div>"""

END_HTML = """
<div class="bg"></div>
<div class="center">
  <h1>Forgotten Explorers</h1>
  <div class="ar-title">مستكشفون نسيهم الزمن</div>
  <div class="line"></div>
  <div class="url">github.com/Abdelrahman-Elghandour/forgotten-explorers</div>
  <div class="badge">NASA Space Apps 2026 · Beyond the Signal</div>
</div>"""


def caption_html(kind, chip, headline, sub):
    inner = (f'<div class="chip">{chip}</div><h1>{headline}</h1><p>{sub}</p>')
    if kind == "scrim":
        return f'<div class="scrim"></div><div class="scrim-wrap">{inner}</div>'
    return f'<div class="panel-wrap">{inner}</div>'


def page(extra, body):
    return f"""<!doctype html><html><head><meta charset="utf-8">{FONT}
<style>{BASE}{extra}</style></head><body>{body}</body></html>"""


PAGES = {
    "01_title": (TITLE, TITLE_HTML, False),
    "09_end": (END, END_HTML, True),
}
for name, kind, chip, head, sub in CAPTIONS:
    PAGES[name] = ("", caption_html(kind, chip, head, sub), False)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page_obj = await browser.new_page(viewport={"width": 1920, "height": 1080})
        for name, (extra, body, opaque) in PAGES.items():
            await page_obj.set_content(page(extra, body), wait_until="load")
            await page_obj.evaluate("() => document.fonts.ready")
            await page_obj.wait_for_timeout(250)
            path = OUT / f"{name}.png"
            await page_obj.screenshot(path=str(path), omit_background=not opaque)
            print("wrote", path.name, flush=True)
        await browser.close()


asyncio.run(main())
