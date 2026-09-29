#!/usr/bin/env node
/*
 * tools/make-og.js — the committed generator for assets/og.png.
 *
 *   node tools/make-og.js            # rebuild the card
 *   node tools/make-og.js --dry      # render to a temp file, leave assets/og.png alone
 *
 * It renders the committed source page og.html at exactly 1200x630 with headless
 * Playwright Chromium and writes assets/og.png (the share card referenced by the
 * index's og:image). og.html composites the name and the approved role line in the
 * rave-display stack over assets/og-base.jpg.
 *
 * Run it from anywhere:
 *   PLAYWRIGHT_BROWSERS_PATH="D:/ms-playwright" \
 *   NODE_PATH="C:/Users/maxhe/AppData/Roaming/npm/node_modules" \
 *   "/c/Program Files/nodejs/node.exe" tools/make-og.js
 *
 * Playwright is resolved from NODE_PATH / the global npm root; nothing is installed.
 * After the render, tools/optimize-og.py (PIL) losslessly re-encodes the PNG and, only
 * if it is still over the 240KB budget, palette-quantises it. A missing python or PIL
 * is a warning, never a failure — the render itself is the deliverable.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const SRC = path.join(REPO, 'og.html');
const OUT = path.join(REPO, 'assets', 'og.png');
const W = 1200;
const H = 630;

function loadPlaywright() {
  const tries = [];
  if (process.env.NODE_PATH) {
    for (const p of process.env.NODE_PATH.split(path.delimiter).filter(Boolean)) tries.push(p);
  }
  tries.push(path.join(process.env.APPDATA || '', 'npm', 'node_modules'));
  tries.push(path.join(REPO, 'node_modules'));
  for (const dir of tries) {
    try {
      return require(require.resolve('playwright', { paths: [dir] }));
    } catch { /* next */ }
  }
  try { return require('playwright'); } catch (e) {
    throw new Error('playwright not found; set NODE_PATH to the global npm node_modules (' + e.message + ')');
  }
}

(async () => {
  const dry = process.argv.includes('--dry');
  if (!fs.existsSync(SRC)) throw new Error('missing source page: ' + SRC);
  const base = fs.readFileSync(path.join(REPO, 'assets', 'og-base.jpg'));
  if (!base.length) throw new Error('missing background: assets/og-base.jpg');

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const fileUrl = 'file:///' + SRC.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.evaluate(() => (document.fonts && document.fonts.ready) || true);

  const target = dry ? path.join(os.tmpdir(), 'og.dry.png') : OUT;
  await page.screenshot({ path: target, type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
  await browser.close();

  let bytes = fs.statSync(target).size;
  console.log('rendered ' + path.relative(REPO, target) + ' from og.html (' + bytes + 'B)');

  const opt = path.join(REPO, 'tools', 'optimize-og.py');
  if (fs.existsSync(opt)) {
    const r = spawnSync('python', [opt, target], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout) process.stdout.write(r.stdout);
    else console.log('  (optimize step skipped: ' + ((r.stderr || '').trim().split('\n').pop() || 'python/PIL unavailable') + ')');
    bytes = fs.statSync(target).size;
  }
  console.log('assets/og.png = ' + bytes + 'B ' + W + 'x' + H);
})().catch((e) => { console.error('ERROR ' + e.message); process.exit(1); });
