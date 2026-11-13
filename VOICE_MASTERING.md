# Intro voice — studio master

The supplied Arabic performance has been cleaned and mastered, not replaced or regenerated. All spoken words, vocal identity, original pauses and speaking pace are retained. The intro video, English cue timestamps and every website layout remain unchanged.

The finishing chain removes low-frequency rumble below 65 Hz, applies restrained 4 dB FFT noise reduction, adds a little warmth at 125 Hz, reduces boxiness around 320 Hz and adds gentle presence at 2.8 kHz. Light de-essing controls sharp sibilants, and soft-knee RMS compression evens the delivery without an aggressive gate, time-stretch or large echo. Two-pass loudness normalization targets −16 LUFS with a −1.5 dBTP ceiling. Short edge fades avoid abrupt edges outside the spoken passage.

A 25 ms processing latency was measured and compensated. Waveform correlation across the five subtitle phrase windows leaves approximately 0.06–0.13 ms residual alignment difference. The 48 kHz, 24-bit stereo WAV master is exactly 14.229333 seconds; MP3/OGG exports retain encoder delay metadata and the same narration placement at the video's 11.833333-second Signal Lost blackout.

## Files

`audio/intro-studio.wav` is the lossless studio master. `audio/intro.mp3` (256 kbps) and `audio/intro.ogg` are the app-ready editions. `audio/intro-original.m4a` remains byte-for-byte unchanged, so the edit is reversible. The app's hosted references point to the new exports; its mute, caption, ducking, seek and cross-dissolve logic is untouched.

`tools/master_intro_voice.py` reproduces the master. `work/voice-mastering/mastering-report.json` records the filters and measured loudness; `tests/voice_mastering.py` checks loudness, headroom, original-source integrity and phrase alignment. These are technical checks, not a claim that the original recording has become an actual studio recording.
