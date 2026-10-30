# Audio

Synthesized by [`tools/music/compose.py`](../../tools/music/README.md) and previewed at `mocks/music-preview.html`. The game plays them through `js/audio.js`; the cue map is in [`docs/DEVELOPMENT.md`](../../docs/DEVELOPMENT.md#audio).

| File | Use |
|------|-----|
| `jingle-dock` | Company jingle, clean (Dock floor) |
| `jingle-executive` | Same jingle, detuned and warbly (Executive floor) |
| `hub-ambience-loop` | Box 407-B door hall bed with J.E.V. printing odds (loop) |
| `coin-motif` | C.O.D. coin: SAVE HUMANITY → flip → END JOBS FOR PROFIT |
| `run-porch-loop` | Suburban porch run groove (loop) |
| `run-space-loop` | Deep-space docklet run groove (loop) |
| `sting-delivered` | Delivered fanfare and register ding |
| `sting-forfeit` | Forfeit klaxon and sad trombone |

Each cue ships as `.ogg` (Vorbis, the sample-exact loop master) and `.mp3` (fallback, not gapless).
