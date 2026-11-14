# Forgotten Explorers — sound always enabled

User requests main website audio always on, never muted, and removal of mute buttons. This is a targeted update to the existing website, not a redesign. Browser/site/OS autoplay or sound restrictions cannot be bypassed; keep media unmuted and, if audible autoplay is rejected, show a one-time Play prompt and resume from the first genuine user click/key, rather than silently autoplaying a muted video.

- [x] Remove the website-wide and intro Mute/Unmute toggles. Keep the master audio preference permanently enabled; do not read or persist a muted preference or expose a hidden toggle.
- [x] Start the intro unmuted; attempt audible autoplay. On policy rejection remain unmuted and offer Play, with first click/key recovery that also unlocks Web Audio and narration. Keep captions, language, transcript, source fallback, no Skip control, and the same1.2-second Solar System dissolve intact.
- [x] Keep background music active on the Solar System, Mars/Moon surfaces, selected spacecraft and feature dialogs after playback is allowed. Preserve smooth looping and narration ducking; retain story play/pause/replay rather than forcing an intentionally paused narration to restart.
- [x] Remove slideshow-video mute/volume buttons while retaining video play/pause, seeking, replay and fullscreen functionality. Video elements remain unmuted. Keep NASA image slideshow and controls, rover guide, all recordings, datasets, navigation, features and layout otherwise unchanged.
- [x] Recover allowed ambient/Web Audio playback after returning to the tab or a later interaction without adding duplicate tracks or replaying paused stories. Preserve local-file compatibility and save the verified update to the connected GitHub repository.
