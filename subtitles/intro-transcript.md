# Intro narration transcript

## Full transcript

**AR:** ما تقلقش، إحنا مش ناسينك. شفنا بعيونك عوالم عمرنا ما كنا نحلم نوصلها، وسبت أثر الزمن عمره ما هيمحيه. يمكن دورك خلص في الفضاء، بس إحنا هنا عشان نرجع حكايتك للنور.

**EN:** Don't worry, we haven't forgotten you. Through your eyes, we saw worlds we never dreamed we'd reach, and you left a mark that time will never erase. Maybe your time in space is over, but we're here to bring your story back into the light.

## Phrase-by-phrase cues

The audio-relative timings below are copied from the CLI's returned word timestamps at each phrase boundary. The video-relative timings add the exact offset `11.833333333333334` seconds.

| Audio-relative start | Audio-relative end | Video-relative start | Video-relative end | Arabic | English |
|---:|---:|---:|---:|---|---|
| 00:00.54 | 00:02.62 | 00:12.373 | 00:14.453 | ما تقلقش، إحنا مش ناسينك. | Don't worry, we haven't forgotten you. |
| 00:03.16 | 00:06.22 | 00:14.993 | 00:18.053 | شفنا بعيونك عوالم عمرنا ما كنا نحلم نوصلها، | Through your eyes, we saw worlds we never dreamed we'd reach. |
| 00:06.72 | 00:09.02 | 00:18.553 | 00:20.853 | وسبت أثر الزمن عمره ما هيمحيه. | And you left a mark that time will never erase. |
| 00:09.48 | 00:10.78 | 00:21.313 | 00:22.613 | يمكن دورك خلص في الفضاء، | Maybe your time in space is over, |
| 00:11.18 | 00:13.56 | 00:23.013 | 00:25.393 | بس إحنا هنا عشان نرجع حكايتك للنور. | but we're here to bring your story back into the light. |

## Timing and transcription notes

- Source: `/home/ubuntu/upload/First10thOfRamadan12.m4a.mp4`, AAC audio, 14.229333 seconds by `ffprobe`.
- Transcription route: installed `manus-speech-to-text` with `--granularity word`; language returned was `ara` and the structured result contained 38 word timestamps.
- The raw structured result is retained at `/home/ubuntu/explorers/work/intro-transcription-structured.json`.
- The model rendered the final phrase's definite article as the split form `للـ نور`. This was normalized to the standard written form `للنور`; no spoken-word meaning was changed.
- No other words were silently rewritten. `دورك` is rendered as “your time” in English to preserve its sense without over-specifying “mission.”
- The structured transcription JSON reports 14.1653125 seconds, while the media container reports 14.229333 seconds. The requested media duration is used in `intro-transcript.js`; caption cue endpoints use only the returned word timings and therefore end at audio-relative 13.56 seconds.
