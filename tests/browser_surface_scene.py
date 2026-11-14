"""Verify the redesigned planet surface: layers, grounded craft, hover, drag and reduced motion."""
import asyncio
import json
import runpy
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
H = runpy.run_path(str(ROOT / "tests/browser_craft.py"))
ARCS, land = H["ARCS"], H["land"]
CAP = ROOT / "tests" / "captures"
CAP.mkdir(exist_ok=True)


async def surface_state(page):
    return await page.evaluate("""() => {
        const root = document.querySelector('.surface-root');
        const scene = root.querySelector('.surface-scene');
        const ground = root.querySelector('.surface-ground');
        const gr = ground.getBoundingClientRect();
        const craft = [...root.querySelectorAll('.surface-craft')].map(b => {
            const r = b.getBoundingClientRect();
            const tag = b.querySelector('.surface-tag');
            return {
                label: b.getAttribute('aria-label'),
                art: !!b.querySelector('svg.s-art'),
                x: r.left + r.width / 2,
                feet: r.bottom,
                groundOffset: (gr.bottom - r.bottom) / gr.height * 100,
                planted: (() => {
                    const path = ground.querySelector('path');
                    const m = path.getScreenCTM().inverse();
                    const at = (dy) => {
                        const pt = new DOMPoint(r.left + r.width / 2, r.bottom + dy).matrixTransform(m);
                        return path.isPointInFill(pt);
                    };
                    return { justBelow: at(3), wellAbove: at(-46) };
                })(),
                tag: tag ? getComputedStyle(tag).transform : null,
            };
        });
        return {
            layers: root.querySelectorAll('.surface-layer').length,
            sky: !!root.querySelector('.surface-sky'),
            motes: root.querySelectorAll('.surface-motes i').length,
            grain: !!root.querySelector('.surface-grain'),
            craft,
            transform: getComputedStyle(scene).transform,
        };
    }""")


async def main():
    out = {}
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1600, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.add_init_script(ARCS)
        await page.goto((ROOT / "index.html").as_uri(), wait_until="load")
        await page.wait_for_selector("#root canvas", state="attached", timeout=30000)
        
        await page.wait_for_timeout(1900)
        await page.wait_for_timeout(2200)
        await land(page, "أوبورتيونيتي")
        await page.wait_for_timeout(900)

        mars = await surface_state(page)
        assert mars["sky"] and mars["grain"], mars
        assert mars["layers"] >= 3, f"expected layered terrain, got {mars['layers']}"
        assert mars["motes"] >= 20, f"Mars needs drifting dust: {mars['motes']}"
        assert len(mars["craft"]) == 3, mars["craft"]
        assert all(c["art"] for c in mars["craft"]), "every Mars craft needs its own illustration"
        # Each craft must stand on the terrain line, not float above it.
        for c in mars["craft"]:
            assert c["planted"]["justBelow"] and not c["planted"]["wellAbove"], f"{c['label']} is not planted on the ground: {c}"
        assert len({round(c["x"]) for c in mars["craft"]}) == 3, "craft must not stack"

        # Idle animations and hover response.
        idle = await page.evaluate("""() => {
            const g = document.querySelector('.surface-craft .s-idle-glint');
            const b = document.querySelector('.surface-craft .s-idle-beacon');
            return { glint: g && getComputedStyle(g).animationName, beacon: b && getComputedStyle(b).animationName };
        }""")
        assert idle["glint"] and idle["glint"] != "none", idle
        assert idle["beacon"] and idle["beacon"] != "none", idle

        first = page.locator(".surface-craft").first
        before = await page.evaluate("""() => {
            const b = document.querySelector('.surface-craft');
            return { tag: getComputedStyle(b.querySelector('.surface-tag')).transform,
                     glow: getComputedStyle(b.querySelector('.s-glow')).opacity,
                     sonar: getComputedStyle(b.querySelector('.s-sonar')).opacity };
        }""")
        await first.hover()
        await page.wait_for_timeout(650)
        after = await page.evaluate("""() => {
            const b = document.querySelector('.surface-craft');
            return { tag: getComputedStyle(b.querySelector('.surface-tag')).transform,
                     glow: Number(getComputedStyle(b.querySelector('.s-glow')).opacity),
                     sonar: Number(getComputedStyle(b.querySelector('.s-sonar')).opacity) };
        }""")
        assert after["tag"] != before["tag"], "hover must lift the name tag"
        assert after["glow"] > 0.4 and after["sonar"] > 0.4, after

        # Opening a story from the new sprite still works.
        await page.click('.surface-root button[aria-label="أوبورتيونيتي"]')
        await page.wait_for_selector(".craft-hud", timeout=8000)
        out["mars"] = {"layers": mars["layers"], "craft": [c["label"] for c in mars["craft"]], "hover": after}
        await page.screenshot(path=str(CAP / "surface_scene_mars.png"))
        # Drag still pans every layer, with no error.
        box = await page.locator(".surface-root").bounding_box()
        start = await page.evaluate("getComputedStyle(document.querySelector('.surface-scene')).transform")
        await page.mouse.move(box["x"] + box["width"] * 0.6, box["y"] + box["height"] * 0.4)
        await page.mouse.down()
        await page.mouse.move(box["x"] + box["width"] * 0.3, box["y"] + box["height"] * 0.4, steps=12)
        await page.mouse.up()
        await page.wait_for_timeout(900)
        moved = await surface_state(page)
        def scale_of(value):
            parts = value[value.index("(") + 1:-1].split(",")
            return float(parts[0])
        # The focus scale may still be easing when the drag starts; panning must
        # not change the zoom, so compare the scale itself within a hair.
        assert abs(scale_of(moved["transform"]) - scale_of(start)) < 0.01, "focus scale is unchanged by panning"
        pans = await page.evaluate("""() => [...document.querySelectorAll('.surface-layer')].map(l => l.style.transform)""")
        assert len(set(pans)) > 1, "parallax layers must shift by different amounts"
        assert not errors, errors

        await page.click('header button:has-text("المجموعة الشمسية")')
        await page.wait_for_timeout(1400)

        await land(page, "لونوخود")
        await page.wait_for_timeout(900)
        moon = await surface_state(page)
        assert len(moon["craft"]) == 1 and moon["craft"][0]["art"], moon["craft"]
        assert moon["craft"][0]["planted"]["justBelow"] and not moon["craft"][0]["planted"]["wellAbove"], moon["craft"]
        await page.screenshot(path=str(CAP / "surface_scene_moon.png"))
        out["moon"] = {"craft": moon["craft"][0]["label"], "motes": moon["motes"]}

        # Mobile: craft stay separated and reachable.
        mobile = await browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        mobile.on("pageerror", lambda e: errors.append(str(e)))
        await mobile.add_init_script(ARCS)
        await mobile.goto((ROOT / "index.html").as_uri(), wait_until="load")
        await mobile.wait_for_selector("#root canvas", state="attached", timeout=30000)
        
        await mobile.wait_for_timeout(1900)
        await mobile.wait_for_timeout(2200)
        await land(mobile, "أوبورتيونيتي")
        await mobile.wait_for_timeout(800)
        m = await surface_state(mobile)
        assert len(m["craft"]) == 3
        centres = sorted(c["x"] for c in m["craft"])
        assert centres[1] - centres[0] > 40 and centres[2] - centres[1] > 40, centres
        await mobile.screenshot(path=str(CAP / "surface_scene_mobile.png"))
        out["mobile"] = centres

        # Reduced motion stops the ambient animation.
        rm = await browser.new_page(viewport={"width": 1280, "height": 800}, reduced_motion="reduce")
        await rm.add_init_script(ARCS)
        await rm.goto((ROOT / "index.html").as_uri(), wait_until="load")
        await rm.wait_for_selector("#root canvas", state="attached", timeout=30000)
        
        await rm.wait_for_timeout(1900)
        await rm.wait_for_timeout(2000)
        await land(rm, "أوبورتيونيتي")
        still = await rm.evaluate("""() => {
            const g = document.querySelector('.surface-craft .s-idle-glint');
            const m = document.querySelector('.surface-motes i');
            return { glint: g && getComputedStyle(g).animationName, mote: m && getComputedStyle(m).animationName };
        }""")
        assert still["glint"] == "none" and still["mote"] == "none", still
        out["reducedMotion"] = still
        assert not errors, errors
        await browser.close()
    print(json.dumps(out, ensure_ascii=False, indent=1))
    print("PASS: layered textured terrain, three distinct planted Mars craft, Lunokhod on the Moon, idle + hover states, parallax drag, mobile spacing and reduced motion.")


if __name__ == "__main__":
    asyncio.run(main())
