// Shared helpers for the skill's scripts: paths, the pinned Playwright, argument parsing.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ENGINE_HTML = path.join(SKILL_DIR, 'assets', 'engine', 'index.html');

// Playwright only drives the browser build it was released with, so the version is pinned:
// 1.61.1 goes with chromium-headless-shell build 1228.
export const PLAYWRIGHT_VERSION = '1.61.1';

// Dependencies live outside the skill folder, which may be read-only and is replaced on update.
export function depsDir() {
  if (process.env.CLAUDE_PLUGIN_DATA) return path.join(process.env.CLAUDE_PLUGIN_DATA, 'deps');
  return path.join(os.homedir(), '.cache', 'code-typing-videos');
}

export function playwrightEntry() {
  return path.join(depsDir(), 'node_modules', 'playwright', 'index.mjs');
}

export async function loadPlaywright() {
  const entry = playwrightEntry();
  if (!fs.existsSync(entry)) {
    fail(`Playwright is not installed in ${depsDir()}.\n  Run: node ${path.join(SKILL_DIR, 'scripts', 'check_env.mjs')} --install`);
  }
  return import(pathToFileURL(entry).href);
}

// On macOS, ANGLE over Metal gives headless Chromium the GPU; elsewhere it falls back to
// SwiftShader (CPU), which works but renders several times slower.
export function browserArgs() {
  return process.platform === 'darwin' ? ['--use-angle=metal'] : [];
}

export function readJson(file, what = 'file') {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    fail(`Cannot read the ${what} ${file}.`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    fail(`The ${what} ${file} is not valid JSON: ${e.message}`);
  }
}

// Minimal parser: positional arguments, `--flag`, `--key value`.
// A flag listed in `optionalValue` takes the next token only if it doesn't start with "--".
export function parseArgs(argv, { flags = [], optionalValue = [] } = {}) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (flags.includes(key)) out[key] = true;
    else if (optionalValue.includes(key)) {
      if (next !== undefined && !next.startsWith('--')) { out[key] = next; i++; } else out[key] = true;
    } else if (next !== undefined) { out[key] = next; i++; }
    else fail(`Option --${key} needs a value.`);
  }
  return out;
}

export function fail(message) {
  console.error(`✘ ${message}`);
  process.exit(1);
}

// Engine page with the scene injected before the engine script runs.
export function engineHtmlWithScene(scene) {
  if (!fs.existsSync(ENGINE_HTML)) fail(`Engine not found: ${ENGINE_HTML}`);
  const html = fs.readFileSync(ENGINE_HTML, 'utf8');
  const inject = `<script>window.SCENE = ${JSON.stringify(scene).replace(/</g, '\\u003c')};</script>`;
  const at = html.indexOf('<script');
  if (at < 0) fail('The engine page has no <script> tag.');
  return html.slice(0, at) + inject + '\n' + html.slice(at);
}
