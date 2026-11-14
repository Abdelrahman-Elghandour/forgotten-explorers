"""Create the static hosting output: compile the app, then copy what it needs."""
import subprocess
import sys
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent
output = root / "dist"

# The page loads ./app.js, so refresh it from the inline JSX before copying.
if subprocess.run([sys.executable, str(root / "tools" / "compile_app.py")]).returncode != 0:
    raise SystemExit("app.js compile failed")

if output.exists():
    shutil.rmtree(output)
output.mkdir()
for name in ("index.html", "app.js", "immersive_explorer.html", "original_step8.html", "manus-routes.json", "background_music.mp4"):
    shutil.copy2(root / name, output / name)
for name in ("audio", "images", "videos", "src", "public", "subtitles", "vendor"):
    shutil.copytree(root / name, output / name)
# Babel is a build-time tool only; the browser runs the precompiled app.js.
(output / "vendor" / "babel.min.js").unlink(missing_ok=True)
print("Static app ready in", output)
