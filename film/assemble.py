"""Assemble the 30-second Forgotten Explorers submission film.

Each beat is cut from real footage, captioned with a transparent card, then the
beats are joined with short crossfades and a quiet instrumental bed is mixed in
below the level a voice-over will sit at.
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CARDS = ROOT / "cards"
SEG = ROOT / "seg"
RAW = ROOT / "raw"
SEG.mkdir(exist_ok=True)

INTRO = ROOT.parent / "videos" / "intro.mp4"
SOLAR = RAW / "page@dd92dacab0496e87e6dbe4f6947e19a0.webm"
MARS = RAW / "page@b0d2e4b029df39925c551a8aa78c0418.webm"
CONSOLE = RAW / "page@7a7320a63ec3360b3b5bb7c5ebe3595d.webm"
ENGLISH = ROOT / "english_console.png"
SCORE = ROOT / "score_v2.wav"

FPS = 30
W, H = 1920, 1080
XFADE = 0.25

# (name, source, start, duration, card, mode)
# mode: "film" plain cover, "solar" crops the app's own title band out,
# "surface" zooms in on the craft, "still" for images.
BEATS = [
    ("01", INTRO, 0.20, 4.60, "01_title", "film"),
    ("02", MARS, 8.60, 4.20, "02_problem", "film"),
    ("03", SOLAR, 5.40, 3.60, "03_impact", "film"),
    ("04", CONSOLE, 6.20, 3.60, "04_creativity", "film"),
    ("05", CONSOLE, 10.00, 2.20, "05_validity", "film"),
    ("06", CONSOLE, 12.40, 2.20, "06_data", "film"),
    ("07", ENGLISH, 0.0, 3.60, "07_relevance", "still"),
    ("08", INTRO, 20.40, 4.40, "08_story", "film"),
    ("09", CARDS / "09_end.png", 0.0, 3.60, None, "still"),
]


def run(args):
    subprocess.run(args, check=True)


def build_segment(name, source, start, dur, card, mode):
    out = SEG / f"{name}.mp4"
    inputs = ["-i", str(source)]
    if mode == "still":
        inputs = ["-loop", "1", "-t", f"{dur}", "-i", str(source)]
    else:
        inputs = ["-ss", f"{start}", "-t", f"{dur}", "-i", str(source)]

    if mode == "solar":
        # Keep the whole canvas but drop its own bottom title band.
        base = (
            f"[0:v]fps={FPS},crop=1920:858:0:0,scale={W}:{H},setsar=1[bg]"
        )
    elif mode == "ui":
        base = (
            f"[0:v]fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase,"
            f"crop=1680:945:(iw-1680)/2:(ih-945)/2,scale={W}:{H},setsar=1[bg]"
        )
    elif mode == "surface":
        # Push in on the craft band so the machines read at full size.
        base = (
            f"[0:v]fps={FPS},crop=1536:864:192:216,scale={W}:{H},setsar=1[bg]"
        )
    elif mode == "still":
        base = (
            f"[0:v]fps={FPS},scale={W}:{H},"
            f"zoompan=z='min(1.0+0.00035*on,1.07)':d=1:"
            f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},setsar=1[bg]"
        )
    else:
        base = (
            f"[0:v]fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase,"
            f"crop={W}:{H},setsar=1[bg]"
        )

    if card:
        inputs += ["-loop", "1", "-t", f"{dur}", "-i", str(CARDS / f"{card}.png")]
        fade_out = max(0.1, dur - 0.55)
        graph = (
            f"{base};"
            f"[1:v]format=rgba,fade=t=in:st=0.30:d=0.50:alpha=1,"
            f"fade=t=out:st={fade_out:.2f}:d=0.50:alpha=1[cd];"
            f"[bg][cd]overlay=0:0:format=auto,format=yuv420p[v]"
        )
        cmd = ["ffmpeg", "-v", "error", "-y", *inputs,
               "-filter_complex", graph, "-map", "[v]", "-t", f"{dur}", "-an",
               "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", str(FPS),
               "-pix_fmt", "yuv420p", str(out)]
    else:
        graph = f"{base};[bg]format=yuv420p[v]"
        cmd = ["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph,
               "-map", "[v]", "-t", f"{dur}", "-an", "-c:v", "libx264",
               "-preset", "medium", "-crf", "18", "-r", str(FPS),
               "-pix_fmt", "yuv420p", str(out)]
    run(cmd)
    print("segment", out.name, flush=True)
    return out, dur


def main():
    built = [build_segment(*beat) for beat in BEATS]

    # Join every beat with a short crossfade.
    args = ["ffmpeg", "-v", "error", "-y"]
    for path, _ in built:
        args += ["-i", str(path)]
    parts, last = [], "0:v"
    offset = 0.0
    for i in range(1, len(built)):
        offset += built[i - 1][1] - XFADE
        label = f"x{i}"
        parts.append(
            f"[{last}][{i}:v]xfade=transition=fade:duration={XFADE}:offset={offset:.3f}[{label}]"
        )
        last = label
    total = sum(d for _, d in built) - XFADE * (len(built) - 1)
    graph = ";".join(parts) + f";[{last}]format=yuv420p[v]"
    args += ["-filter_complex", graph, "-map", "[v]", "-t", f"{total:.3f}", "-an",
             "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-r", str(FPS),
             "-pix_fmt", "yuv420p", str(ROOT / "picture.mp4")]
    run(args)
    print(f"picture {total:.3f}s", flush=True)

    # Music: use the quiet first movement, fade in/out, and sit it well below a voice.
    run([
        "ffmpeg", "-v", "error", "-y", "-ss", "13", "-i", str(SCORE), "-t", f"{total:.3f}",
        "-af",
        f"afade=t=in:st=0:d=0.8,afade=t=out:st={total - 1.6:.2f}:d=1.6,"
        "loudnorm=I=-21:TP=-2:LRA=9,aresample=48000",
        "-ac", "2", "-c:a", "pcm_s16le", str(ROOT / "bed.wav"),
    ])
    print("bed ok", flush=True)

    run([
        "ffmpeg", "-v", "error", "-y", "-i", str(ROOT / "picture.mp4"),
        "-i", str(ROOT / "bed.wav"), "-map", "0:v", "-map", "1:a",
        "-vf", f"fade=t=in:st=0:d=0.40,fade=t=out:st={total - 0.45:.2f}:d=0.45",
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-shortest",
        "-movflags", "+faststart", str(ROOT.parent / "Forgotten_Explorers_30s.mp4"),
    ])
    run([
        "ffmpeg", "-v", "error", "-y", "-i", str(ROOT / "bed.wav"),
        "-c:a", "libmp3lame", "-b:a", "192k",
        str(ROOT.parent / "Forgotten_Explorers_music_bed.mp3"),
    ])
    print("muxed", flush=True)


main()
