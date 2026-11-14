#!/usr/bin/env python3
"""Compile the inline JSX app into app.js.

index.html keeps its readable JSX block as the canonical source, but browsers no
longer parse Babel at startup: they load the precompiled ./app.js instead. Run
this after editing the inline block (or just run build_static.py, which calls it).

    python3 tools/compile_app.py          # write app.js
    python3 tools/compile_app.py --check  # exit 1 if app.js is stale
"""
from __future__ import annotations

import hashlib
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
OUT = ROOT / "app.js"
BABEL = ROOT / "vendor" / "babel.min.js"
BLOCK = re.compile(r'<script type="text/babel"(?![^>]*\bsrc=)[^>]*>([\s\S]*?)</script>')


def source() -> str:
    match = BLOCK.search(INDEX.read_text(encoding="utf-8"))
    if not match:
        raise SystemExit("No inline JSX block found in index.html")
    return match.group(1)


def compile_jsx(code: str) -> str:
    script = (
        "const fs=require('fs');"
        f"const Babel=require({str(BABEL)!r});"
        "const code=fs.readFileSync(0,'utf8');"
        "const out=Babel.transform(code,{presets:['react'],sourceType:'script',compact:false,comments:true});"
        "process.stdout.write(out.code);"
    )
    done = subprocess.run(["node", "-e", script], input=code, text=True, capture_output=True)
    if done.returncode != 0:
        raise SystemExit(done.stderr.strip() or "Babel failed")
    return done.stdout


def build(code: str) -> str:
    digest = hashlib.sha256(code.encode("utf-8")).hexdigest()[:16]
    header = (
        "/* Precompiled from the inline JSX block in index.html — do not edit by hand.\n"
        f"   Regenerate with: python3 tools/compile_app.py   (source sha256:{digest}) */\n"
    )
    return header + compile_jsx(code)


def main() -> int:
    code = source()
    output = build(code)
    if "--check" in sys.argv:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != output:
            print("app.js is out of date; run python3 tools/compile_app.py")
            return 1
        print("app.js matches the inline source")
        return 0
    OUT.write_text(output, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(output) / 1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
