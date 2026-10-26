#!/usr/bin/env node
// Checks a rendered MP4: resolution, frame rate, duration, codec, no audio.
//
//   node probe_output.mjs video.mp4 [--scene scene.json]
// With --scene, the expected duration and size come from the scene; otherwise 1080x1920 at 30 fps.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseArgs, readJson, fail } from './lib/common.mjs';

const args = parseArgs(process.argv.slice(2));
const file = args._[0];
if (!file) fail('Usage: node probe_output.mjs video.mp4 [--scene scene.json]');
if (!fs.existsSync(file)) fail(`File not found: ${file}`);

const scene = args.scene ? readJson(args.scene, 'scene') : null;
const expected = { width: 1080, height: 1920, fps: 30, ...(scene?.video ?? {}) };
// An excerpt (render.mjs --from/--to) is shorter than the scene: compare with the excerpt when told.
const expectedDuration = args.duration !== undefined ? Number(args.duration) : expected.duration;

const r = spawnSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file], { encoding: 'utf8' });
if (r.status !== 0) fail(`ffprobe could not read ${file}: ${r.stderr.trim()}`);
const info = JSON.parse(r.stdout);
const video = info.streams.find((s) => s.codec_type === 'video');
const audio = info.streams.filter((s) => s.codec_type === 'audio');
if (!video) fail(`${file} has no video stream.`);

const [num, den] = video.r_frame_rate.split('/').map(Number);
const fps = num / den;
const duration = Number(info.format.duration);
const frames = Number(video.nb_frames);
const sizeMB = Number(info.format.size) / 1e6;

const problems = [];
if (video.width !== expected.width || video.height !== expected.height) problems.push(`size is ${video.width}x${video.height}, expected ${expected.width}x${expected.height}`);
if (Math.abs(fps - expected.fps) > 0.01) problems.push(`frame rate is ${fps}, expected ${expected.fps}`);
if (expectedDuration !== undefined && Math.abs(duration - expectedDuration) > 1.5 / expected.fps) problems.push(`duration is ${duration.toFixed(3)} s, expected ${expectedDuration} s`);
if (video.codec_name !== 'h264') problems.push(`codec is ${video.codec_name}, expected h264`);
if (video.pix_fmt !== 'yuv420p') problems.push(`pixel format is ${video.pix_fmt}, expected yuv420p (needed by phones and social apps)`);
if (audio.length) problems.push(`it has ${audio.length} audio stream(s); the skill renders silent videos`);

console.log(`${file}: ${video.width}x${video.height}, ${fps} fps, ${duration.toFixed(3)} s, ${frames} frames, ${video.codec_name} ${video.pix_fmt}, ${sizeMB.toFixed(1)} MB`);
if (sizeMB > 30) console.log('  ! Over 30 MB: consider a higher --crf (22 to 24) before uploading.');
if (problems.length) {
  for (const p of problems) console.log(`✘ ${p}`);
  process.exit(1);
}
console.log('✔ Matches the expected format.');
