# Style reference

## Contents
- The idea
- Image: background, type, colours, glow, grading
- Cursor and highlight
- Camera and focus
- Typing rhythm
- Impacts: the three levels
- Transitions and final shot
- Guardrails

Each value says where it comes from:
- **measured**: read from the viral video that inspired the style;
- **chosen**: picked while building the engine because the result looked right;
- **frag**: set for the 2012 frag-movie energy.

Change a value only for a reason that beats the one given here.

## The idea

A macro camera films a screen on which someone types code. You never see the editor itself, only the text, the darkness around it and a camera that moves. The energy of 2012 Call of Duty frag movies sits on top of that base: every keystroke hits, the strong words land with a flash and a shake, and the cuts are whip pans. The viewer must still read the text, so legibility always wins over effects.

## Image

| Element | Value | Source |
|---|---|---|
| Background | `#050308`, almost black with a hint of violet, no editor interface | measured |
| Font | JetBrains Mono SemiBold for code, Light for line numbers | chosen (rounded monospace close to the original) |
| Functions and methods | `#A0B4E0` pale blue | measured |
| Other identifiers | `#ECE7EA` warm white | measured |
| Punctuation | `#8A90A8` blue-grey | measured |
| Comment | `#7F89A3` | measured |
| Line numbers | `#6E6C74`, two characters left of the code | measured |
| Glow | a tight glow of 0.05 character at strength 0.55, plus a wide glow of 0.22 at 0.10 | chosen: a screen filmed by a camera bleeds a little light, and even the sharp zone is never vector-crisp |
| Grading | deep blacks, more contrast, slightly teal shadows, the red of the cursor popping | frag |
| Vignette, grain | vignette 0.5 (a bit stronger in frag grading); light, coarse grain | chosen: grain that changes on every pixel bloated the first export to 48 MB, and social platforms recompress it into block noise |

## Cursor and highlight

- **Cursor**: a solid red block `#F41C30`, one line high and 0.92 character wide, with the same glow as the text (measured colour; size chosen). It stays lit while typing and for 0.3 s after the last key, then blinks with a 0.5 s period, 0.25 s on and 0.25 s off (measured). It is forced on during the last 0.5 s so that the video ends, or loops, on a lit cursor.
- **Occurrence highlight**: a square navy rectangle `#2F3A60` behind every occurrence of one word, appearing when the second occurrence is typed (measured). Use it when a word repeats in the text, like `line` in "line by line".

## Camera and focus

- The camera films the text plane at an angle, in perspective: characters on one side are 1.2 to 1.5 times larger than on the other (measured). Horizontal field of view 32° (chosen).
- Roll varies from shot to shot between about −8° and +8°, often alternating direction. An ordinary jolt changes roll by 8° at most, since larger swings made v1 feel chaotic.
- The line being typed sits slightly below the middle of the frame, at about 57 % of the height (measured: 55 to 60 %).
- **Legibility rule**: the word being typed stays whole in the frame, with at least 8 to 10 sharp characters before the cursor, and the cursor between 65 % and 75 % of the frame width. The first engine framed 4 to 6 characters, and nothing could be read.
- **Depth of field**: a sharp zone around the cursor, wide enough for the legibility rule, with blur rising quickly with distance. Neighbouring lines are already clearly blurred, and the comment on line 1 is never sharp (measured look; curve chosen).
- **Handheld drift**: slow, small (±0.6 % position, ±0.3° roll), never shaky (chosen).

## Typing rhythm

- About 12 characters per second, with a human irregularity of ±38 % between keys and slightly longer gaps after `.`, `(` and `;` (measured rate; irregularity chosen).
- **Build-up before a punch word**: the cursor stops for 0.6 to 0.7 s and blinks while the camera pushes in slowly in slight slow motion (measured pause; slow motion is frag). Then the word goes out in one burst, about twice as fast as normal typing (measured).
- **Stutter word**: typed letter by letter, each letter a medium impact, slower than normal typing (frag).

## Impacts: the three levels

All shakes come from seeded noise, so `renderFrame(t)` stays a pure function of time.

1. **Keystroke impact**, on every key:
   - the camera pushes in by 1.5 to 3 % and comes back within 0.1 to 0.15 s;
   - a 2 to 6 px positional shake dies out quickly;
   - the typed character pops from 1.25 to 1.0 scale in about 80 ms, with a short flare of light;
   - the cursor brightens for an instant;
   - `.`, `(` and `;` hit slightly harder.

2. **Beat jolt**, on every beat of the grid and on every line break:
   - the camera snaps to a new framing in 2 to 3 frames, with directional motion blur;
   - it overshoots by about 6 to 10 % and settles like a spring;
   - this was measured on the original video, which jolted every 0.5 s (120 BPM), each jolt blurring for 3 to 5 frames; the frag version is drier.

3. **Heavy hit**, on the `;` that closes a punch word:
   - an additive white flash of one or two frames, at 60 to 80 %;
   - a strong shake that dies out over about 0.3 s, ±20 to 30 px and ±2° of rotation;
   - a zoom punch of about +12 % that comes back;
   - a chromatic split of 6 to 12 px that fades;
   - a glow boost;
   - a horizontal anamorphic flare starting from the red cursor.

## Transitions and final shot

- **Whip pan**: 3 frames, with rotation during the move, a radial zoom blur through the frame and a small flash on arrival. Whip pans happen between two blocks and before the final shot. They are always on the beat grid.
- **Final shot**: a last heavy hit, then a fast, nervous pull-back (not a slow track) to a slightly angled shot where every line is readable, at least 28 px per character. It holds for about one second, with the cursor lit.

## Guardrails

- The text is sharp and stable for at least 60 % of each shot. Shakes die out fast.
- At most 4 white flashes per video and never more than one per second, well below the photosensitivity threshold of three per second. `"flashes": false` in the script turns them all off.
- Format: 1080×1920, 30 fps, H.264 yuv420p, no audio, about 20 to 25 MB for 12 s (CRF 20 to 22).
