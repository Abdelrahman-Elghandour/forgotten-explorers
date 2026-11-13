"""Master the supplied intro voice without changing its words, tempo or cue positions."""
from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'audio' / 'intro-original.m4a'
WORK = ROOT / 'work' / 'voice-mastering'
WORK.mkdir(parents=True, exist_ok=True)
MASTER = ROOT / 'audio' / 'intro-studio.wav'
DURATION = 14.229333333333334

# Restrained restoration: avoid a hard gate, time stretch, voice replacement or large echo.
CHAIN = ','.join([
    'highpass=f=65:p=2',
    'afftdn=nr=4:nf=-65:tn=0',
    'equalizer=f=125:t=q:w=0.8:g=1.0',
    'equalizer=f=320:t=q:w=1.0:g=-2.0',
    'equalizer=f=2800:t=q:w=0.8:g=1.8',
    'deesser=i=0.16:m=0.35:f=0.5',
    'acompressor=threshold=0.075:ratio=1.8:attack=12:release=140:knee=2.828:makeup=1:detection=rms',
])


def run(args):
    return subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y', *args], check=True, capture_output=True, text=True)


analysis = run(['-i', str(SOURCE), '-af', CHAIN + ',loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-'])
(WORK / 'analysis.log').write_text(analysis.stderr)
blocks = re.findall(r'\{\s*"input_i"[\s\S]*?\}', analysis.stderr)
if not blocks:
    raise RuntimeError('Loudness measurement was not returned')
measured = json.loads(blocks[-1])
normalizer = ('loudnorm=I=-16:TP=-1.5:LRA=7:linear=true:'
              f'measured_I={measured["input_i"]}:measured_TP={measured["input_tp"]}:'
              f'measured_LRA={measured["input_lra"]}:measured_thresh={measured["input_thresh"]}:'
              f'offset={measured["target_offset"]}:print_format=json')
# Remove ONLY measured DSP latency (25 ms), not any original speech or pause.
# Preserve t=0 and pad only the container's trailing AAC edit-list gap.
finish = (CHAIN + ',' + normalizer + ',aresample=48000,atrim=start=0.025,asetpts=PTS-STARTPTS,'
          f'apad,atrim=duration={DURATION},asetpts=PTS-STARTPTS,'
          'afade=t=in:st=0:d=0.025,afade=t=out:st=14.129333:d=0.10')
render = run(['-i', str(SOURCE), '-af', finish, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', str(MASTER)])
(WORK / 'render.log').write_text(render.stderr)
run(['-i', str(MASTER), '-c:a', 'libmp3lame', '-b:a', '256k', '-ar', '48000', str(ROOT / 'audio' / 'intro.mp3')])
run(['-i', str(MASTER), '-c:a', 'libvorbis', '-q:a', '6', '-ar', '48000', str(ROOT / 'audio' / 'intro.ogg')])
verification = run(['-i', str(MASTER), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-'])
(WORK / 'verification.log').write_text(verification.stderr)
report = {
    'source': 'audio/intro-original.m4a',
    'master': 'audio/intro-studio.wav',
    'sample_rate': 48000,
    'channels': 2,
    'duration_seconds': DURATION,
    'filter_chain': CHAIN,
    'loudness_target_lufs': -16,
    'true_peak_ceiling_dbtp': -1.5,
    'pre_normalization': measured,
    'verified': json.loads(re.findall(r'\{\s*"input_i"[\s\S]*?\}', verification.stderr)[-1]),
    'timing': '25 ms measured DSP latency compensated. No original cuts, removed pauses, time-stretch or pitch/voice replacement. Original t=0 retained.',
}
(WORK / 'mastering-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
