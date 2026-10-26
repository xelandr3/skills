---
name: code-typing-videos
description: Turns lyrics, a quote or any short text into a vertical 1080x1920 video where the text is typed as code in extreme close-up, like a macro camera on a dark editor (red block cursor, shallow depth of field, camera jolts on the beat, an impact on every keystroke, heavy hits with flash and shake, whip pans, 2012 Call of Duty frag-movie energy), and exports it to MP4 with a bundled WebGL engine, Playwright and ffmpeg, without Remotion. Use it whenever someone wants a TikTok, Reels or Shorts video of code being typed, wants to turn lyrics or a sentence into animated code, asks for a « vidéo de code qui s'écrit », des « paroles en code » or an « edit dynamique façon frag movie », or wants to remake this viral coding-video style, even if they never mention a skill or a video engine.
license: MIT
compatibility: Needs Node.js 22+, ffmpeg and a Chromium driven by Playwright (scripts/check_env.mjs --install sets up Playwright and Chromium). Tested with Claude Code on macOS.
argument-hint: "[text or lyrics]"
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/*) Bash(ffmpeg *) Bash(ffprobe *)
---

# Code typing videos

This skill turns a short text into a vertical video (1080×1920, 30 fps, no audio) where the text is typed as code on a dark editor, filmed like a macro camera:
- a red block cursor and a very shallow depth of field;
- camera jolts on every beat and an impact on every keystroke;
- heavy hits with flash and shake on the strongest words;
- whip pans between blocks.

A bundled WebGL engine (`assets/engine/index.html`) draws every frame as a pure function of time. The same page plays as a live preview in a browser and is exported frame by frame to MP4.

All paths below are relative to this skill's folder (`${CLAUDE_SKILL_DIR}` in Claude Code). Write the user's files (script, scene, previews, videos) in their working directory, never inside the skill folder, which may be read-only.

## Workflow

Copy this checklist and tick it off as you go:

```
- [ ] 1. Check the environment
- [ ] 2. Gather the text and the tempo
- [ ] 3. Write the code lines and get them approved
- [ ] 4. Plan and validate the scene
- [ ] 5. Preview and check key frames
- [ ] 6. Render the MP4
- [ ] 7. Check the file and deliver
```

### 1. Check the environment

```bash
node scripts/check_env.mjs
```

It checks Node 22+, ffmpeg and ffprobe, and the pinned Playwright with its Chromium, which live in a cache outside the skill. When something is missing, it prints the exact command to fix it:
- `node scripts/check_env.mjs --install` installs Playwright and its browser;
- ffmpeg is the user's to install (`brew install ffmpeg`, `sudo apt install ffmpeg`). Give them the command and wait until it is there.

### 2. Gather the text and the tempo

- **The text**: usually one to three short sentences, such as lyrics or a quote. Past about 120 characters of code the video runs beyond 15 s; suggest trimming.
- **The tempo** in BPM, if the user has a track in mind. Without one, use 120. Camera jolts and impacts land on its beats, so the video can be cut on the music later.

Nothing else is needed: the format, the look and the effects are fixed.

### 3. Write the code lines and get them approved

Read `references/transposition.md` and turn the text into code. The rules that matter most:
- keep the words and their order, so the code still reads as the original;
- at most 30 characters per line, because the frame is vertical;
- one block per sentence, with a blank line between blocks;
- the strongest word at the end of its block, where it gets the heavy hit.

Show the lines to the user and wait for their go-ahead. This is the creative heart of the video, and everything after it is mechanical. If the user already said to go ahead without checking with them, show the lines and carry on.

### 4. Plan and validate the scene

Write a script file in the format of `references/scene-format.md` (part 1), for example `code-video/script.json`, then run:

```bash
node scripts/plan_timeline.mjs code-video/script.json -o code-video/scene.json
node scripts/validate_scene.mjs code-video/scene.json
```

The planner computes every keystroke, pause, jolt, heavy hit and whip pan from the beat grid. The validator checks line length, legibility margins, the number of flashes and the alignment with the grid. When it reports an error, fix the script (or, for fine timing, the scene) and run both commands again.

### 5. Preview and check key frames

```bash
node scripts/preview.mjs code-video/scene.json
node scripts/render.mjs code-video/scene.json --stills --out code-video/stills
```

- `preview.mjs` writes `scene.preview.html` next to the scene and opens it. In the page, space pauses, ← and → step one frame, and R restarts.
- `--stills` renders the key moments (each burst of typing, each heavy hit, the final shot) and a contact sheet `stills/sheet.png`. Look at the sheet.

Check that:
- the word being typed is fully visible and sharp;
- impacts never hide the text for more than a few frames;
- the final shot is readable on a phone.

If not, adjust and go back to step 4. While the user is iterating on the look, the live preview is enough: don't render the full MP4 for every change.

### 6. Render the MP4

```bash
node scripts/render.mjs code-video/scene.json --mp4 code-video/video.mp4
```

It takes about a minute for 12 s of video on a recent Mac, and several times longer on a machine without a usable GPU. `--from 2 --to 4` renders an excerpt.

### 7. Check the file and deliver

```bash
node scripts/probe_output.mjs code-video/video.mp4 --scene code-video/scene.json
```

Then give the user:
- the path of the MP4;
- the code lines;
- the BPM used, and how to change it (edit `bpm` in the script, then run steps 4 to 6 again).

If the video contains flashes, say so.

## What you can change and what stays fixed

- **Free**: the transposition, which words are strong, the comment line, the BPM, small timing adjustments in the scene.
- **Fixed**: the engine, the render commands, 1080×1920 at 30 fps, and the guardrails below.

## Guardrails

- **Legibility comes before effects.** The word being typed stays whole and sharp with 8 to 10 characters of context before it, and the text is stable for at least 60 % of each shot.
- **Flashes.** There are at most 4 white flashes per video, never more than one per second, to stay well below the photosensitivity threshold. Set `"flashes": false` in the script when the user wants a calmer or safer version.
- **Changing the look.** Read `references/style.md` before changing any engine setting: it gives the reason behind every value.
