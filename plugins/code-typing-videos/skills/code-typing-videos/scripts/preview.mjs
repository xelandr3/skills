#!/usr/bin/env node
// Writes a self-contained preview page for a scene and opens it in the default browser.
//
//   node preview.mjs scene.json [--no-open]
// The page plays in real time: space pauses, left/right arrows step one frame, R restarts.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs, readJson, fail, engineHtmlWithScene } from './lib/common.mjs';

const args = parseArgs(process.argv.slice(2), { flags: ['no-open'] });
const sceneFile = args._[0];
if (!sceneFile) fail('Usage: node preview.mjs scene.json [--no-open]');

const scene = readJson(sceneFile, 'scene');
const out = path.join(path.dirname(path.resolve(sceneFile)), `${path.basename(sceneFile, '.json')}.preview.html`);
fs.writeFileSync(out, engineHtmlWithScene(scene));
console.log(`Preview written: ${out}`);

if (!args['no-open']) {
  const opener = process.platform === 'darwin' ? ['open', [out]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', out]] : ['xdg-open', [out]];
  const child = spawn(opener[0], opener[1], { stdio: 'ignore', detached: true });
  child.on('error', () => console.log('Could not open a browser automatically: open the file above by hand.'));
  child.unref();
}
