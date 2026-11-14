"""Create the static hosting output without changing the CDN-based application."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent
output = root / "dist"
if output.exists():
    shutil.rmtree(output)
output.mkdir()
for name in ("index.html", "immersive_explorer.html", "original_step8.html", "manus-routes.json", "background_music.mp4"):
    shutil.copy2(root / name, output / name)
for name in ("audio", "images", "videos", "src", "public", "subtitles"):
    shutil.copytree(root / name, output / name)
print("Static app ready in", output)
