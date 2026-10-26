#!/usr/bin/env node
// Renders a scene with the bundled engine in headless Chromium, frame by frame.
//
//   node render.mjs scene.json --mp4 video.mp4 [--from 2 --to 4] [--crf 21]
//   node render.mjs scene.json --stills [0.5,3.2,7] --out stills/
//
// --mp4     H.264 yuv420p, silent, at the scene's size and frame rate. --from/--to render an excerpt.
// --stills  PNGs at the given times, or at the scene's key moments (meta.keyMoments) when no list
//           is given, plus a contact sheet sheet.png to look at in one go.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseArgs, readJson, fail, loadPlaywright, browserArgs, engineHtmlWithScene } from './lib/common.mjs';

const args = parseArgs(process.argv.slice(2), { optionalValue: ['stills'] });
const sceneFile = args._[0];
if (!sceneFile || (!args.mp4 && !args.stills)) {
  fail('Usage: node render.mjs scene.json --mp4 video.mp4 [--from s --to s] [--crf n]\n       node render.mjs scene.json --stills [t1,t2,...] --out dir');
}
const scene = readJson(sceneFile, 'scene');

// The engine reads window.SCENE at startup; a temporary page carries it so that the engine file
// itself never changes. "?export" asks the engine for its full-quality motion blur.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'code-typing-videos-'));
const pageFile = path.join(tmp, 'render.html');
fs.writeFileSync(pageFile, engineHtmlWithScene(scene));

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ args: browserArgs() });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[engine]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('[engine]', m.text()); });
await page.goto(pathToFileURL(pageFile).href + '?export');
await page.evaluate(() => window.ready);

const video = await page.evaluate(() => (window.ENGINE?.video ?? globalThis.CONFIG?.video));
if (!video) fail('The engine did not expose its video settings (window.ENGINE.video).');
const { width, height, fps, duration } = video;
const totalFrames = Math.round(duration * fps);

try {
  if (args.stills) await renderStills();
  if (args.mp4) await renderMp4();
} finally {
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}

async function renderStills() {
  const outDir = path.resolve(args.out ?? path.join(path.dirname(sceneFile), 'stills'));
  fs.mkdirSync(outDir, { recursive: true });
  let moments;
  if (typeof args.stills === 'string') {
    moments = args.stills.split(',').map((s) => ({ t: Number(s), label: `${s}s` }));
  } else if (Array.isArray(scene.meta?.keyMoments) && scene.meta.keyMoments.length) {
    moments = scene.meta.keyMoments;
  } else {
    moments = [];
    for (let t = 0; t < duration; t += 0.5) moments.push({ t, label: `${t.toFixed(1)}s` });
  }
  for (const m of moments) {
    if (!(m.t >= 0 && m.t < duration)) fail(`Still time ${m.t} is outside the video (0 to ${duration} s).`);
  }
  const files = [];
  for (const [i, m] of moments.entries()) {
    // Draw and read back in the same task, before the canvas is presented and cleared.
    const dataUrl = await page.evaluate((t) => { window.renderFrame(t); return document.querySelector('canvas').toDataURL('image/png'); }, m.t);
    const file = path.join(outDir, `${String(i + 1).padStart(2, '0')}-${m.t.toFixed(2)}s.png`);
    fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
    files.push(file);
    console.log(`  ${path.basename(file)}  ${m.label ?? ''}`);
  }
  // Contact sheet: thumbnails in rows of 6, each labelled with its file name.
  const list = path.join(outDir, 'sheet-inputs.txt');
  fs.writeFileSync(list, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'\nduration 1`).join('\n') + '\n');
  const cols = Math.min(6, files.length);
  const rows = Math.ceil(files.length / cols);
  const sheet = path.join(outDir, 'sheet.png');
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
    '-vf', `scale=270:-1,tile=${cols}x${rows}:padding=4:color=0x202020`, '-frames:v', '1', sheet], { encoding: 'utf8' });
  fs.rmSync(list, { force: true });
  if (r.status !== 0) console.error(`Contact sheet failed: ${r.stderr.trim()}`);
  else console.log(`Contact sheet: ${sheet}`);
}

async function renderMp4() {
  const out = path.resolve(args.mp4);
  const from = args.from !== undefined ? Number(args.from) : 0;
  const to = args.to !== undefined ? Number(args.to) : duration;
  if (!(from >= 0 && to <= duration && to > from)) fail(`--from/--to must satisfy 0 <= from < to <= ${duration}.`);
  const first = Math.round(from * fps);
  const last = Math.min(totalFrames, Math.round(to * fps));
  // CRF 21 keeps the grain and the motion trails while staying around 20 to 25 MB for 12 s.
  const crf = String(args.crf ?? 21);

  const ffmpeg = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-framerate', String(fps), '-i', '-',
    // WebGL reads pixels bottom-up, hence the vertical flip.
    '-vf', 'vflip,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', '-an', out,
  ], { stdio: ['pipe', 'inherit', 'pipe'] });
  // ffmpeg 7 warns "Truncating packet" while probing raw input from a pipe; it is harmless.
  ffmpeg.stderr.on('data', (d) => {
    const s = d.toString().split('\n').filter((l) => l && !l.includes('Truncating packet')).join('\n');
    if (s) console.error(s);
  });
  const done = new Promise((resolve, reject) => ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg failed (code ${code})`)))));

  console.log(`${last - first} frames ${width}x${height} at ${fps} fps → ${out}`);
  const started = Date.now();
  for (let i = first; i < last; i++) {
    const b64 = await page.evaluate(async ({ t, width, height }) => {
      window.renderFrame(t);
      const gl = document.querySelector('canvas').getContext('webgl2');
      const px = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const url = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(new Blob([px])); });
      return url.slice(url.indexOf(',') + 1);
    }, { t: i / fps, width, height });
    if (!ffmpeg.stdin.write(Buffer.from(b64, 'base64'))) await new Promise((r) => ffmpeg.stdin.once('drain', r));
    if ((i - first) % 30 === 29 || i === last - 1) {
      process.stdout.write(`\r  ${i - first + 1}/${last - first} frames (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    }
  }
  ffmpeg.stdin.end();
  await done;
  console.log(`\nDone: ${out}`);
}
