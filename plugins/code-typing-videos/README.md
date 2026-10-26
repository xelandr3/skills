# code-typing-videos

An agent skill that turns lyrics, a quote or any short text into a vertical video where the text is typed as code in extreme close-up. It is filmed like a macro camera on a dark editor, with the energy of a 2012 frag movie:
- a red block cursor and a shallow depth of field;
- an impact on every keystroke and camera jolts on the beat;
- flash and shake on the strongest words, and whip pans between lines.

> **Status: work in progress.** The skill's instructions, references and render scripts are here, but the WebGL engine, the timeline planner and the scene validator are not published yet, so the skill cannot produce a video for now.

```
// for you

i.wrote(yourName)
  .in(every.line(ofCode));
```

The output is an MP4 at 1080×1920 and 30 fps, without audio, ready for TikTok, Reels or Shorts. You add your music when editing; the camera can be timed to its BPM.

## How it works

- **The words.** The agent turns your text into short lines of code that still read as the original, and shows them to you before rendering.
- **The timeline.** A planner computes every keystroke, pause, jolt and impact from a beat grid.
- **The image.** A single WebGL page draws each frame as a pure function of time. It plays as a live preview in your browser.
- **The export.** Playwright drives headless Chromium frame by frame, and ffmpeg encodes the MP4.

No Remotion, no React, no build step, and nothing is downloaded at render time.

## Install

### Claude Code

```bash
claude plugin marketplace add xelandr3/skills
claude plugin install code-typing-videos@xelandre-skills
```

Then ask for it in plain words, for example "make a TikTok where these lyrics type themselves as code", or call `/code-typing-videos:code-typing-videos`.

### Other agents (Agent Skills format)

Copy `plugins/code-typing-videos/skills/code-typing-videos/` into your agent's skills folder.

### Requirements

- Node.js 22 or newer
- ffmpeg: `brew install ffmpeg` on macOS, `sudo apt install ffmpeg` on Debian or Ubuntu
- Playwright 1.61.1 and its headless Chromium. The skill installs them on first use, outside its own folder (`~/.cache/code-typing-videos/`):

  ```bash
  node plugins/code-typing-videos/skills/code-typing-videos/scripts/check_env.mjs --install
  ```

Rendering 12 seconds takes about a minute on an Apple Silicon Mac, and longer on machines where Chromium has no GPU.

## Photosensitivity warning

The videos contain white flashes on heavy hits. The engine allows at most 4 per video and never more than one per second, which stays below the common threshold of three flashes per second. Set `"flashes": false` in the script to remove them.

## Credits and license

- Code: MIT, see the [LICENSE](../../LICENSE) at the root of the repository.
- Font: JetBrains Mono, SIL Open Font License 1.1, see `skills/code-typing-videos/assets/fonts/OFL.txt`.
- The visual style is inspired by a viral "coding" video. Examples in this repository only use original or public-domain texts.

---

## En français

Ce skill transforme des paroles, une citation ou un court texte en vidéo verticale où le texte s'écrit sous forme de code, filmé en macro, dans l'énergie des frag movies Call of Duty de 2012 :
- un impact à chaque frappe ;
- des à-coups de caméra en rythme ;
- flash et secousse sur les mots forts ;
- des panoramiques filés entre les lignes.

L'agent te montre les lignes de code avant le rendu. Tu prévisualises la vidéo dans ton navigateur, puis le skill exporte un MP4 en 1080×1920 à 30 images par seconde, sans son. Installation et prérequis : voir plus haut.

Le skill est en cours de construction : le moteur de rendu, le planificateur et le validateur ne sont pas encore publiés, donc il ne produit pas encore de vidéo.
