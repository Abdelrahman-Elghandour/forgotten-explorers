"""Master the supplied Arabic voice recordings without changing words, pace or cue timing.

Each file is cleaned, tone-shaped, compressed and loudness-normalized, then its measured
DSP latency is compensated so caption cues timed against the original recording stay valid.
"""
from pathlib import Path
import json
import re
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'work' / 'voice-mastering'
ORIGINALS = WORK / 'originals'
MASTERS = WORK / 'masters'
for folder in (WORK, ORIGINALS, MASTERS):
    folder.mkdir(parents=True, exist_ok=True)

SOURCES = {
    'intro': '/home/ubuntu/upload/Intro.m4a.mp4',
    'spi': '/home/ubuntu/upload/Spiritrover.m4a.mp4',
    'opp': '/home/ubuntu/upload/Opportunityrover.m4a.mp4',
    'lun': '/home/ubuntu/upload/Lonokhodrover.m4a.mp4',
}

CHAIN = ','.join([
    'highpass=f=65:p=2',
    'afftdn=nr=4:nf=-65:tn=0',
    'equalizer=f=125:t=q:w=0.8:g=1.0',
    'equalizer=f=320:t=q:w=1.0:g=-2.0',
    'equalizer=f=2800:t=q:w=0.8:g=1.8',
    'deesser=i=0.16:m=0.35:f=0.5',
    'acompressor=threshold=0.075:ratio=1.8:attack=12:release=140:knee=2.828:makeup=1:detection=rms',
])
RATE = 16000


def ff(args):
    return subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y', *args], check=True, capture_output=True, text=True)


def pcm(path, rate=RATE):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-ar', str(rate), '-ac', '1', '-'])
    return np.frombuffer(raw, dtype=np.float32)


def lag_ms(a, b, start=0.4, span=1.5):
    """Offset of b against a over a voiced window, in milliseconds."""
    lo, hi = int(start * RATE), int((start + span) * RATE)
    x, y = a[lo:hi], b[lo:hi]
    x = x - x.mean(); y = y - y.mean()
    size = len(x) + len(y) - 1
    n = 1 << (size - 1).bit_length()
    corr = np.fft.irfft(np.fft.rfft(y, n) * np.fft.rfft(x[::-1], n), n)[:size]
    lags = np.arange(-len(x) + 1, len(y))
    band = np.abs(lags) <= int(0.2 * RATE)
    return float(lags[band][np.argmax(corr[band])]) / RATE * 1000


def container_duration(path):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)], text=True)
    return float(out.strip())


def master(key, source):
    src = Path(source)
    local = ORIGINALS / f'{key}{src.suffix}'
    local.write_bytes(src.read_bytes())
    duration = container_duration(local)
    decoded = len(pcm(local)) / RATE  # AAC priming makes the container slightly longer
    master_wav = MASTERS / f'{key}.wav'

    # Pass 1: measure the loudness of the processed signal for linear normalization.
    analysis = ff(['-i', str(local), '-af', CHAIN + ',loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-'])
    measured = json.loads(re.findall(r'\{\s*"input_i"[\s\S]*?\}', analysis.stderr)[-1])
    norm = ('loudnorm=I=-16:TP=-1.5:LRA=7:linear=true:'
            f'measured_I={measured["input_i"]}:measured_TP={measured["input_tp"]}:'
            f'measured_LRA={measured["input_lra"]}:measured_thresh={measured["input_thresh"]}:'
            f'offset={measured["target_offset"]}')

    def render(trim):
        target = decoded - (trim or 0.0)
        tail = (f'atrim=start={trim},asetpts=PTS-STARTPTS,' if trim else '') + \
               f'apad,atrim=duration={target:.6f},asetpts=PTS-STARTPTS,' \
               f'afade=t=in:st=0:d=0.02,afade=t=out:st={max(0, target - 0.08):.6f}:d=0.08'
        ff(['-i', str(local), '-af', ','.join([CHAIN, norm, 'aresample=48000', tail]),
            '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', str(master_wav)])

    render(None)
    shift = lag_ms(pcm(local), pcm(master_wav))
    trim = max(0.0, round(shift / 1000, 5))
    if trim:
        render(trim)
    residual = lag_ms(pcm(local), pcm(master_wav))

    # Browser-compatible editions; MP3/OGG encode priming is preserved in metadata.
    ff(['-i', str(master_wav), '-c:a', 'libmp3lame', '-b:a', '256k', '-ar', '48000', str(ROOT / 'audio' / f'{key}.mp3')])
    ff(['-i', str(master_wav), '-c:a', 'libvorbis', '-q:a', '6', '-ar', '48000', str(ROOT / 'audio' / f'{key}.ogg')])

    mastered_duration = container_duration(master_wav)
    assert abs(mastered_duration - (decoded - trim)) < 0.1, (key, mastered_duration, decoded, trim)
    check = ff(['-i', str(master_wav), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-'])
    verified = json.loads(re.findall(r'\{\s*"input_i"[\s\S]*?\}', check.stderr)[-1])
    peak = float(np.max(np.abs(pcm(master_wav, 48000))))
    return {
        'key': key,
        'source': str(src),
        'archivedOriginal': str(local.relative_to(ROOT)),
        'durationSeconds': round(duration, 6),
        'decodedDurationSeconds': round(decoded, 6),
        'masterDurationSeconds': round(mastered_duration, 6),
        'measuredDspLatencyMs': round(shift, 3),
        'compensatedMs': round(trim * 1000, 3),
        'residualOffsetMs': round(residual, 3),
        'loudnessLufs': float(verified['input_i']),
        'truePeakDbtp': float(verified['input_tp']),
        'peakSample': round(peak, 4),
        'outputs': [f'audio/{key}.mp3', f'audio/{key}.ogg', str(master_wav.relative_to(ROOT))],
    }


if __name__ == '__main__':
    import sys
    wanted = [a for a in sys.argv[1:] if a in SOURCES] or list(SOURCES)
    report_path = WORK / 'mastering-report.json'
    existing = json.loads(report_path.read_text())['files'] if report_path.exists() else []
    fresh = {row['key']: row for row in existing}
    for key in wanted:
        fresh[key] = master(key, SOURCES[key])
    report = [fresh[key] for key in SOURCES if key in fresh]
    report_path.write_text(json.dumps({'chain': CHAIN, 'targetLufs': -16, 'truePeakDbtp': -1.5, 'files': report}, indent=2) + '\n')
    for row in report:
        assert abs(row['residualOffsetMs']) < 2, row
        assert row['truePeakDbtp'] <= -1.4, row
        assert abs(row['loudnessLufs'] + 16) < 0.6, row
        print(f"{row['key']}: {row['durationSeconds']}s, {row['loudnessLufs']} LUFS, TP {row['truePeakDbtp']} dBTP, offset {row['residualOffsetMs']} ms")
    print(f'All {len(report)} masters passed loudness, headroom and timing checks.')
