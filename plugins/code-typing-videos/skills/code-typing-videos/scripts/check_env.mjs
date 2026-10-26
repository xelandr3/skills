#!/usr/bin/env node
// Checks what the skill needs and says how to fix whatever is missing.
//
//   node check_env.mjs            check only (exit code 1 if something is missing)
//   node check_env.mjs --install  also install the pinned Playwright and its Chromium
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { depsDir, playwrightEntry, PLAYWRIGHT_VERSION, browserArgs } from './lib/common.mjs';

const self = fileURLToPath(import.meta.url);

const install = process.argv.includes('--install');
let ok = true;
const good = (msg) => console.log(`✔ ${msg}`);
const bad = (msg, fix) => { ok = false; console.log(`✘ ${msg}`); if (fix) console.log(`  → ${fix}`); };

// Node 22+: the scripts use top-level await and recent stream APIs.
const major = Number(process.versions.node.split('.')[0]);
if (major >= 22) good(`Node ${process.versions.node}`);
else bad(`Node ${process.versions.node} is too old (22 or newer needed)`, 'install a current Node.js from https://nodejs.org or with nvm');

const ffmpegFix = process.platform === 'darwin' ? 'brew install ffmpeg'
  : process.platform === 'win32' ? 'winget install ffmpeg' : 'sudo apt install ffmpeg (or your distribution\'s package)';
for (const tool of ['ffmpeg', 'ffprobe']) {
  const r = spawnSync(tool, ['-version'], { encoding: 'utf8' });
  if (r.status === 0) good(r.stdout.split('\n')[0]);
  else bad(`${tool} not found`, ffmpegFix);
}

const dir = depsDir();
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
if (!fs.existsSync(playwrightEntry()) && install) {
  console.log(`… installing Playwright ${PLAYWRIGHT_VERSION} in ${dir}`);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(path.join(dir, 'package.json'))) {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ private: true, name: 'code-typing-videos-deps' }, null, 2));
  }
  const r = spawnSync(npm, ['install', `playwright@${PLAYWRIGHT_VERSION}`, '--no-audit', '--no-fund'], {
    cwd: dir, stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' },
  });
  if (r.status !== 0) bad('npm install failed', `run it by hand: cd "${dir}" && npm install playwright@${PLAYWRIGHT_VERSION}`);
}

if (!fs.existsSync(playwrightEntry())) {
  bad(`Playwright ${PLAYWRIGHT_VERSION} is not installed`, `node "${self}" --install`);
} else {
  const { chromium } = await import(pathToFileURL(playwrightEntry()).href);
  let renderer = await probeBrowser(chromium);
  if (renderer === null && install) {
    console.log('… installing the headless Chromium that goes with Playwright');
    spawnSync(process.execPath, [path.join(dir, 'node_modules', 'playwright', 'cli.js'), 'install', 'chromium-headless-shell'], { stdio: 'inherit' });
    renderer = await probeBrowser(chromium);
  }
  if (renderer === null) {
    bad('Headless Chromium for Playwright is missing', `node "${path.join(dir, 'node_modules', 'playwright', 'cli.js')}" install chromium-headless-shell (or run this script with --install)`);
  } else if (renderer === 'no-webgl2') {
    bad('Chromium starts but WebGL2 is unavailable', 'the engine needs WebGL2; check GPU drivers or run on another machine');
  } else {
    good(`Playwright ${PLAYWRIGHT_VERSION} + Chromium, WebGL2 on ${renderer}`);
    if (/swiftshader|llvmpipe|software/i.test(renderer)) {
      console.log('  ! No GPU acceleration: rendering works but is several times slower.');
    }
  }
}

console.log(ok ? '\nReady.' : '\nFix the items marked ✘, then run this check again.');
process.exit(ok ? 0 : 1);

// Returns the WebGL renderer string, 'no-webgl2', or null when the browser cannot start.
async function probeBrowser(chromium) {
  let browser;
  try {
    browser = await chromium.launch({ args: browserArgs() });
    const page = await browser.newPage();
    return await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return 'no-webgl2';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown GPU';
    });
  } catch (e) {
    if (!/Executable doesn't exist|browserType\.launch/i.test(e.message)) console.log(`  (${e.message.split('\n')[0]})`);
    return null;
  } finally {
    await browser?.close();
  }
}
