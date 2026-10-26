# Turning a text into code

The video only works if a viewer reads the original sentence while the code is being typed. The code is a costume for the words, not a translation, so every rule below serves one aim: the code read aloud must sound like the text.

## Rules

1. **Keep the words and their order.**
   - Verbs and prepositions become methods (`.wrote(`, `.in(`).
   - Subjects and objects become identifiers or arguments.
   - Don't drop a word that carries meaning, and don't add words that aren't in the text, apart from the code's punctuation.

2. **Glue elisions and contractions in camelCase.** Keep the spoken form: « J'tape » → `jtape`, « l'éditeur » → `lÉditeur`, « r'froidit » → `rfroidit`, "don't" → `dont`, "I'm" → `im`. A capital letter marks where the second word starts, so the eye splits it back.

3. **Keep accents.** JavaScript accepts `mesRêves`, `lÉditeur` or `àLaLigne`, and the bundled font has all Latin accents. Emoji and scripts other than Latin are not in the font: avoid them.

4. **At most 30 characters per line, indentation included.** The frame is vertical, and the final shot must show every line at a size a phone can read. Break a long chain before a `.method(`, with a two-space indent:
   ```
   jouvre(lÉditeur)
     .jtape(mesRêves)
     .àLaLigne();
   ```
   The indent is not typed: the editor puts the cursor there after each line break.

5. **One block per sentence or line of lyrics, with a blank line between blocks.** Each block ends with `;`. The camera does a whip pan between blocks.

6. **Put the strongest word at the end of its block**, just before the closing `);`. That word is the block's `punch`: the cursor pauses before it, the camera pushes in, then the word is typed in one burst and the final `;` lands as a heavy hit (flash, shake, zoom, split colours). Choose at most one punch per block. The video allows at most 4 flashes, so with more than 4 blocks, some blocks get no punch.

7. **Optionally mark one word per block as `stutter`**: it is typed letter by letter with a medium impact on each letter. Use it on a word the text wants to stretch, such as « doucement » or "slowly". At most one stutter in a short video, or the effect wears off.

8. **Start with a comment line** of two or three words that names the piece, for example `// late night`. It sits at the top, always out of focus, as a hint of context.

9. **Keep it short.** About 12 characters are typed per second. Past about 120 characters of code, the video runs beyond 15 s and loses its punch: suggest trimming the text rather than speeding up the typing.

## Examples

### English sentence

Text: "I wrote your name in every line of code"

```
// for you

i.wrote(yourName)
  .in(every.line(ofCode));
```

Punch: `ofCode`. The sentence reads straight through, and the strongest image ("code") lands on the heavy hit.

### French lyrics with elisions

Text: « J'ouvre l'éditeur, j'tape mes rêves à la ligne / Le café r'froidit, l'écran reste allumé »

```
// nuit blanche

jouvre(lÉditeur)
  .jtape(mesRêves)
  .àLaLigne();

leCafé.rfroidit();
lÉcran.reste(allumé);
```

Punches: `àLaLigne` and `allumé`. Elisions are glued (`jouvre`, `jtape`, `rfroidit`), accents are kept, and the second sentence becomes two short statements instead of one long chain.

### Public-domain quote

Text: "All the world's a stage, and all the men and women merely players" (Shakespeare)

```
// as you like it

allTheWorlds.a(stage);

allTheMen.andWomen
  .merely(players);
```

Punches: `stage` and `players`. Each half of the quote becomes a block, so each half gets its own whip pan and heavy hit.

### What not to do

```
iWroteYourNameInEveryLineOfCode();
```

The line is too long for the vertical frame and gives the camera nothing to follow: no methods, no rhythm, no word to land on.

```
code.lines.forEach(l => l.write(name));
```

It reads as code, not as the sentence. The words changed and their order is lost.
