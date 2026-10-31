# Music generator

`compose.py` synthesizes every D.O.N.T. Ship music cue from scratch: no samples, no music model. Each instrument is a small numpy function (additive, FM, or band-limited pulse oscillators with ADSR envelopes). Cues are mixed on a stereo bus with FFT filters, an FFT convolution reverb, and echo, then encoded with ffmpeg. The script is deterministic because every cue uses a fixed random seed, so re-running it produces the same files.

Preview: [`mocks/music-preview.html`](../../mocks/music-preview.html). Serve the repo root with `python -m http.server 8080` and open <http://127.0.0.1:8080/mocks/music-preview.html>.

## Regenerate

```bash
python3 tools/music/compose.py                 # all cues -> assets/audio/*.ogg + *.mp3
python3 tools/music/compose.py coin-motif      # one or more cues by name
python3 tools/music/compose.py --list          # cue names
python3 tools/music/compose.py --levels        # also print per-group mix energy (dB re loudest group)
```

Requirements: Python 3.10+, numpy, and an ffmpeg build with `libvorbis` and `libmp3lame`. scipy and sox are not needed. A full render takes about 15 s.

Outputs:

- `assets/audio/<cue>.ogg`: Ogg Vorbis, quality 4 (about 110 to 130 kbps stereo). These are the masters, and the loops are sample-exact.
- `assets/audio/<cue>.mp3`: LAME VBR `-q:a 4`, a fallback for browsers without Vorbis. MP3 encoder padding adds a few ms of silence, so don't loop the MP3s gaplessly.
- `tmp/music/<cue>.wav`: 16-bit 44.1 kHz masters (`tmp/` is gitignored).

After encoding, the script decodes each OGG and prints its duration, sample count against the rendered count, peak (dBFS), RMS, file sizes, and, for loops, the seam jump (`|last − first|` compared with the 99th-percentile sample step) and the end-versus-start RMS.

## How the cues are built

| Cue | Key / tempo | Length | Instruments and harmony |
|-----|-------------|--------|--------------------------|
| `jingle-dock` | C major, 132 BPM, swing 0.64 | 8 bars, ~15.4 s | Vibes melody (`JINGLE_MELODY`), drawbar organ, walking upright, ride, brushes, feathered kick. Bars 1–7 use two chords per bar (`JINGLE_CHORDS_DOCK`: I–vi–ii–V, iii–VI–ii–V, IV–♯iv°, I/5–VI–ii–V). Bar 8 holds C6/9, and a full-band button lands on beat 4. |
| `jingle-executive` | Same melody, 112 BPM, swing 0.67 | ~19.5 s | Same root motion with bent qualities (`JINGLE_CHORDS_EXEC`), final chord C m(maj9). Each note gets random ±16 cent detune, the organ is doubled at −11/+13 cents, the vibes motor is slow and deep, and a theremin shadow plays an octave down. The whole mix then gets `tape_warp` (−28 cents base, 0.45 Hz wow, 4.7 Hz flutter, −110 cent droop at the end), a 6.5 kHz roll-off, and 2.6 s reverb. |
| `hub-ambience-loop` | F (lydian-ish), 60 BPM | 4 bars, 16.0 s loop | Open-voiced pad and flute-drawbar organ on Fmaj9 – Dm9 – B♭maj7♯11 – C9sus4. Theremin phrase with glides and vibrato ("I compute… you choose"). Wall-clock tick/tock. J.E.V. two-tone blip plus `printer_line` (needle rasp, head motor, carriage return, paper feed) in bars 2 and 4. Low facility hum tuned to a whole number of cycles per loop. |
| `coin-motif` | D major, 92 BPM | ~9.3 s | The nine-note phrase `COIN_MELODY` on warm brass plus vibes over `COIN_HOPE` (D – Gadd9 – Em7 – A7 – D). On beat 9 comes `coin_flip` (flick ting, air whoosh, landing clink, accelerating wobble, settle). As the wobble settles, a final `coin_ting` on D7 with a soft vibes D6 underneath rings into the 2 s reverb, and the cue fades out over its last 0.8 s. It ends on the landing. |
| `run-porch-loop` | F major, 120 BPM, light swing 0.54 | 8 bars, 16.0 s loop | Bossa upright (root plus fifth, with anticipations), bongos, 16th shaker, 3-2 son clave woodblock, bossa kick, vibes comping on beats 1 and 3-and, 25% pulse lead doubled by vibes (`PORCH_LEAD`), and a 12.5% pulse 16th-note arpeggio with dotted-eighth ping-pong echo. Progression in `PORCH_PROG`. |
| `run-space-loop` | D minor, 100 BPM | 8 bars, 19.2 s loop | Two passes of Dm9 – B♭maj7♯11 – Gm9 – A7sus4 / A7♭9. Octave-pulsing synth bass, pad, wandering-pan chip arpeggio with long echo, sonar pings, kick on 1 and 3, brushes on 2 and 4, hats. Vibes counter-line on the first pass, theremin melody on the second. |
| `sting-delivered` | C major | 3.0 s | Brass G–C–E–G pickup into a C major brass chord, vibes sparkle, upright and kick, ride. `register_ding` at 1.2 s: two bell strikes, drawer thunk, spring rattle, and coins. |
| `sting-forfeit` | — | 3.0 s | Two `klaxon` whoops (330 → 900 Hz exponential sweep, square-leaning saw, 55 Hz ring mod) with a lower harmony. Then a plunger-wah `brass` trombone B♭3–A3–A♭3–G3, where the last note has 40 cent vibrato, a wah wobble, and a −1.2 semitone droop. |

### Building blocks

- **Instruments:** `vibes` (modal partials 1 / 4 / 9.92 with motor tremolo), `organ` (drawbar harmonics with Leslie vibrato and AM), `pad` (two detuned band-limited saws), `upright`, `synth_bass`, `pulse` (band-limited Fourier pulse, any duty), `brass` (additive saw whose brightness follows the envelope, plus optional wah and bend), `glass` (2-op FM), `theremin` (legato glides, delayed vibrato), and percussion (`ride`, `brush_slap`, `kick`, `bongo`, `shaker`, `hat`, `woodblock`). Special effects: `printer_line`, `jev_blip`, `coin_flip`, `register_ding`, `klaxon`.
- **Timing:** `Clock(bpm, swing)` maps beats to seconds, and `swing` sets where the off-beat eighth falls (0.5 is straight, 0.67 is a hard triplet swing). Most parts add a few ms of human timing jitter.
- **Harmony helpers:** `Chord("Bbmaj7#11")` parses symbols, including slash chords. `voicing` gives rootless close voicings, `voicing_open` spreads voices for pads, and `walking_bass` plays the root and then a chord tone or a chromatic approach to the next root.
- **Mix:** `Mix.add(sig, t, gain, pan, rev, echo, group)` adds a signal with equal-power panning, a reverb send, and an echo send. `render()` applies echo, then convolution with a synthetic stereo IR (`make_ir`: noise with exponential decay, highs decaying faster).
- **Master:** a 28 Hz high-pass, a gentle `tanh` saturation (`drive`), and normalization to −1 dBFS. One-shots also get trimmed silence and short fades.
- **Seamless loops:** for loop cues, `Mix` folds everything past the loop length (note releases, echo taps) back onto the start. Echo uses circular shifts, and reverb and filters use circular FFT convolution at exactly the loop length. Continuous sources (such as the hub hum) use frequencies with a whole number of cycles per loop. The result has no fades at the loop point, and the last sample leads into the first.

### Tweaking

- **Melody or harmony:** edit the note lists (`JINGLE_MELODY`, `COIN_MELODY`, `PORCH_LEAD`, `SPACE_THEREMIN`) or chord lists. Notes are `(beat, length_in_beats, "C#5")`.
- **Tempo or feel:** change the `Clock(...)` in the piece function. Loop length follows from bars and BPM, so keep `bars × 4 × 60 / bpm` reasonable.
- **Balance:** each `mix.add(..., gain, ...)` call sets a level. Run with `--levels` to compare groups. Energy is not loudness, so bass reads high there.
- **More "executive":** in `piece_jingle`, raise the `note_cents` range, the organ detune pair, or the `cents(t)` wow and droop.
- **Space:** use `rt60` and `wet` in each `render()` call.

## In the game

`js/audio.js` loads these files with Web Audio (OGG first, MP3 fallback), loops the beds with `AudioBufferSourceNode.loop`, crossfades between beds, ducks music under the stingers, and detunes `jingle-dock` with `playbackRate` for the Sorting and Cold Storage acts. The cue map, mute key, and debug hook are in [`docs/DEVELOPMENT.md`](../../docs/DEVELOPMENT.md#audio). If you add a cue, also add it to `CUES` in `js/audio.js` (with its loop length for loops).
