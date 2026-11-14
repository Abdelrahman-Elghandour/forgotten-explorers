# Voice masters — intro and three spacecraft stories

The four supplied Arabic performances have been cleaned and mastered, not replaced or regenerated. Every spoken word, the vocal identity, the original pauses and the speaking pace are retained, and each caption cue still lands on the syllable it was measured against.

The finishing chain removes rumble below 65 Hz, applies restrained 4 dB FFT noise reduction, adds a little warmth at 125 Hz, reduces boxiness around 320 Hz and lifts presence at 2.8 kHz. Light de-essing controls sharp sibilants, and soft-knee RMS compression evens the delivery without gating, time-stretching or added echo. Two-pass loudness normalization targets −16 LUFS with a −1.5 dBTP ceiling and short edge fades.

| Track | Source length | Master | Loudness | True peak | Residual alignment |
| --- | --- | --- | --- | --- | --- |
| Intro | 15.68 s | 15.55 s | −15.8 LUFS | −1.5 dBTP | 0.0–0.06 ms |
| Opportunity | 42.73 s | 42.66 s | −16.0 LUFS | −2.8 dBTP | 0.0 ms |
| Spirit | 39.91 s | 39.82 s | −16.1 LUFS | −1.5 dBTP | 0.0–0.06 ms |
| Lunokhod 1 | 42.99 s | 42.86 s | −16.1 LUFS | −2.0 dBTP | 0.0 ms |

The filter chain introduces a small processing delay; `tools/master_voice.py` measures it by waveform correlation, re-renders with that amount trimmed from the head, and then verifies the residual. Because the delay is compensated rather than left in, cue times measured on the original files remain valid for the delivered audio.

## Files

`work/voice-mastering/originals/` keeps byte-for-byte copies of the four uploads. `work/voice-mastering/masters/*.wav` holds the 48 kHz, 16-bit stereo masters. The app loads `audio/intro.mp3`, `audio/opp.mp3`, `audio/spi.mp3` and `audio/lun.mp3` (256 kbps) with OGG companions, and the intro also has hosted `/manus-storage/` editions for the film layer.

`work/voice-mastering/mastering-report.json` records every filter, measured loudness and offset; `tests/voice_mastering.py` re-checks loudness, per-channel headroom, delivered-file lengths and phrase alignment. These are technical checks, not a claim that the recordings have become studio sessions.
