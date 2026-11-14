"""Shared test helper: the exhibit opens straight into the Solar System.

Older suites waited for the intro overlay before reaching the app. The film is
now an on-demand overlay, so tests either continue immediately or open it with
the header button when they specifically exercise the film.
"""

DISMISS = """() => {
  const v = document.querySelector('.intro-video');
  if (v) { v.muted = true; v.currentTime = Math.max(0, (v.duration || 28) - 1.4); }
}"""


async def open_app(page, url, timeout=30000):
    """Load the exhibit and make sure the interactive Solar System is reachable."""
    await page.goto(url, wait_until="commit")
    await page.wait_for_selector("#root canvas", state="attached", timeout=timeout)
    if await page.locator(".intro-overlay").count():
        await page.evaluate(DISMISS)
        await page.wait_for_selector(".intro-overlay", state="detached", timeout=timeout)
    return page


async def open_film(page):
    """Open the opening film from the header (it no longer blocks startup)."""
    await page.click("header button[aria-label='Play the opening film']")
    await page.wait_for_selector(".intro-overlay", timeout=30000)
    return page
