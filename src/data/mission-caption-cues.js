/* Add measured audio-relative cues for each real Arabic mission recording here.
 * Seven supplied audio/<id>.mp3 files are the same 10-second placeholder (STT:
 * no speech); the other five mission recordings are absent. Consequently there
 * are no verified mission phrase times to publish. The exact English transcripts
 * remain readable, and the UI labels the live fallback as untimed.
 *
 * Example shape (replace with REAL, measured timings, not these example numbers):
 * window.MISSION_CAPTION_CUES.opp = [
 *   {start: measuredStartSeconds, end: measuredEndSeconds, text: 'English phrase'}
 * ];
 * This module is loaded before the application. Adding actual cues needs no UI edits.
 */
window.MISSION_CAPTION_CUES = {};
