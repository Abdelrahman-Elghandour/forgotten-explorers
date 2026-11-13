"""Signal-level checks: spoken phrase alignment, clipping, duration and source preservation."""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parents[1]

def decode(name):
    raw = subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/name),'-f','f32le','-acodec','pcm_f32le','-ar','16000','-ac','1','-'])
    return np.frombuffer(raw,dtype=np.float32)

original = decode('audio/intro-original.m4a')
master = decode('audio/intro-studio.wav')
windows = [(0.54,2.62),(3.16,6.22),(6.72,9.02),(9.48,10.78),(11.18,13.56)]
results=[]
for start,end in windows:
    lo,hi=int(start*16000),int(end*16000)
    a,b=original[lo:hi],master[lo:hi]
    a=a-a.mean();b=b-b.mean()
    size = len(a) + len(b) - 1
    fft_size = 1 << (size - 1).bit_length()
    correlations = np.fft.irfft(np.fft.rfft(b, fft_size) * np.fft.rfft(a[::-1], fft_size), fft_size)[:size]
    lags = np.arange(-len(a) + 1, len(b))
    band=np.abs(lags)<=int(.08*16000)
    lag=int(lags[band][np.argmax(correlations[band])])
    results.append({'phrase':len(results)+1,'lag_ms':round(lag/16,3)})
assert len(master)/16000 > 14.22 and len(master)/16000 < 14.24
assert np.max(np.abs(master)) < 0.95, 'No clipping/headroom overload'
assert all(abs(r['lag_ms'])<20 for r in results), results
report=json.loads((ROOT/'work/voice-mastering/mastering-report.json').read_text())
assert abs(float(report['verified']['input_i'])+16)<.5
assert float(report['verified']['input_tp'])<=-1.5
before=subprocess.check_output(['git','show','HEAD:audio/intro-original.m4a'])
assert before==(ROOT/'audio/intro-original.m4a').read_bytes(), 'Original upload must be preserved'
print('Phrase alignment:',json.dumps(results))
print('Peak amplitude:',float(np.max(np.abs(master))))
print('PASS: original voice source unchanged; five phrases aligned within 20ms, 14.229s master, -16 LUFS, no clipping.')
