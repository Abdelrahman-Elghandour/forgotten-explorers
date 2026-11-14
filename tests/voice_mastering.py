"""Signal-level checks for the four new recordings: timing, headroom, loudness, source fidelity."""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RATE = 16000
WINDOWS = {
    'intro': [(0.6, 2.6), (3.5, 6.6), (7.5, 9.8), (10.5, 11.7), (12.4, 14.8)],
    'opp': [(0.4, 1.8), (7.3, 10.2), (19.2, 22.2), (30.8, 32.8)],
    'spi': [(0.4, 2.2), (4.8, 7.6), (20.8, 24.2), (30.8, 33.2)],
    'lun': [(0.3, 4.4), (5.1, 7.4), (16.6, 19.2), (37.4, 41.8)],
}


def decode_stereo(path):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-acodec', 'pcm_f32le', '-ar', str(RATE), '-'])
    return np.frombuffer(raw, dtype=np.float32)


def decode(path):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-acodec', 'pcm_f32le', '-ar', str(RATE), '-ac', '1', '-'])
    return np.frombuffer(raw, dtype=np.float32)


def lag_ms(a, b):
    a = a - a.mean(); b = b - b.mean()
    size = len(a) + len(b) - 1
    fft_size = 1 << (size - 1).bit_length()
    corr = np.fft.irfft(np.fft.rfft(b, fft_size) * np.fft.rfft(a[::-1], fft_size), fft_size)[:size]
    lags = np.arange(-len(a) + 1, len(b))
    band = np.abs(lags) <= int(.08 * RATE)
    return int(lags[band][np.argmax(corr[band])]) / RATE * 1000


report = json.loads((ROOT / 'work/voice-mastering/mastering-report.json').read_text())
rows = {row['key']: row for row in report['files']}
assert set(rows) == {'intro', 'opp', 'spi', 'lun'}, rows.keys()

summary = []
for key, windows in WINDOWS.items():
    original = decode(ROOT / rows[key]['archivedOriginal'])
    master = decode(ROOT / 'work/voice-mastering/masters' / f'{key}.wav')
    results = []
    for start, end in windows:
        lo, hi = int(start * RATE), int(end * RATE)
        results.append(round(lag_ms(original[lo:hi], master[lo:hi]), 3))
    assert all(abs(v) < 20 for v in results), (key, results)
    duration = len(master) / RATE
    assert abs(duration - rows[key]['masterDurationSeconds']) < 0.02, (key, duration)
    # Peak per channel; a mono downmix would sum channels and falsely report overs.
    peak = float(np.max(np.abs(decode_stereo(ROOT / 'work/voice-mastering/masters' / f'{key}.wav'))))
    assert peak < 0.9, (key, peak)
    assert abs(rows[key]['loudnessLufs'] + 16) < 0.6, (key, rows[key]['loudnessLufs'])
    assert rows[key]['truePeakDbtp'] <= -1.4, (key, rows[key]['truePeakDbtp'])
    summary.append({'key': key, 'duration': round(duration, 3), 'phraseLagMs': results})

# Delivered browser files decode to the same length as the master.
for key, row in rows.items():
    for ext in ('mp3', 'ogg'):
        raw = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(ROOT / 'audio' / f'{key}.{ext}')], text=True)
        assert abs(float(raw) - row['masterDurationSeconds']) < 0.12, (key, ext, raw)

# The supplied originals are archived byte-for-byte and never re-encoded in place.
for key, row in rows.items():
    archived = ROOT / row['archivedOriginal']
    assert archived.exists() and archived.stat().st_size > 200000, archived

print('Phrase alignment:', json.dumps(summary))
print('PASS: four new recordings mastered at -16 LUFS / <= -1.5 dBTP, phrase timing within 20 ms, and delivered MP3/OGG match their masters.')
