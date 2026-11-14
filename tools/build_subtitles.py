"""Regenerate the subtitle sidecars from the app's own cue data.

Run after changing src/data/intro-transcript.js or src/data/mission-caption-cues.js so the
downloadable .vtt/.srt files can never drift from the captions shown in the app.
"""
from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OFFSET = 11.833333333333334


def load(script, global_name):
    source = (ROOT / script).read_text()
    out = subprocess.run(['node', '-e', f'const vm=require("vm");const c={{window:{{}}}};vm.runInNewContext({json.dumps(source)},c);console.log(JSON.stringify(c.window.{global_name}))'],
                         capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def stamp(seconds, comma=False):
    ms = int(round(seconds * 1000))
    h, rem = divmod(ms, 3600000)
    m, rem = divmod(rem, 60000)
    s, ms = divmod(rem, 1000)
    sep = ',' if comma else '.'
    return f'{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}'


def write_pair(name, cues):
    vtt = ['WEBVTT', '']
    srt = []
    for i, cue in enumerate(cues, 1):
        vtt += [f'{stamp(cue["start"])} --> {stamp(cue["end"])}', cue['text'], '']
        srt += [str(i), f'{stamp(cue["start"], True)} --> {stamp(cue["end"], True)}', cue['text'], '']
    (ROOT / 'subtitles' / f'{name}.en.vtt').write_text('\n'.join(vtt), encoding='utf-8')
    (ROOT / 'subtitles' / f'{name}.en.srt').write_text('\n'.join(srt), encoding='utf-8')


if __name__ == '__main__':
    intro = load('src/data/intro-transcript.js', 'INTRO_NARRATION')
    write_pair('intro', [{'start': c['start'] + OFFSET, 'end': c['end'] + OFFSET, 'text': c['text']} for c in intro['cues']])

    md = ['# Intro narration — bilingual transcript', '',
          'Timings are video-relative: the narration begins at the first fully black frame after',
          'Signal Lost (11.833 s). Cue windows come from word-level timestamps of the supplied recording.', '',
          '## Arabic (as recorded)', '', intro['arabic'], '',
          '## English', '', intro['text'], '',
          '| Video start | Video end | English subtitle | Arabic phrase |', '| --- | --- | --- | --- |']
    for c in intro['cues']:
        md.append(f'| {c["start"] + OFFSET:.2f} | {c["end"] + OFFSET:.2f} | {c["text"]} | {c["ar"]} |')
    md += ['', 'Audio length: 15.55 s, ending at video time 27.39 s inside the zoom-out.', '']
    (ROOT / 'subtitles' / 'intro-transcript.md').write_text('\n'.join(md), encoding='utf-8')

    cues = load('src/data/mission-caption-cues.js', 'MISSION_CAPTION_CUES')
    lines = ['# Spacecraft narration — English transcripts', '',
             'Generated from `src/data/voice-transcripts.js` and the measured cues in',
             '`src/data/mission-caption-cues.js`. Timings are relative to each recording.', '']
    for key in ('opp', 'spi', 'lun'):
        write_pair(key, cues[key])
        lines += [f'## {key}', '', '| Start | End | Caption |', '| --- | --- | --- |']
        lines += [f'| {c["start"]:.2f} | {c["end"]:.2f} | {c["text"]} |' for c in cues[key]]
        lines.append('')
    (ROOT / 'subtitles' / 'spacecraft-transcripts.en.md').write_text('\n'.join(lines), encoding='utf-8')
    print('subtitle sidecars regenerated')
