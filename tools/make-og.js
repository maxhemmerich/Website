#!/usr/bin/env node
/*
 * tools/make-og.js — the committed generator for the share card.
 *
 *   node tools/make-og.js            # rebuild assets/og-base.jpg, then assets/og.png
 *   node tools/make-og.js --dry      # render both to a temp dir, leave assets/ alone
 *
 * One source, two derived artifacts, both 1200x630 and both produced from og.html:
 *
 *   1. assets/og-base.jpg — the card's own GROUND: the dark canvas and its bounded
 *      radial mint glow, rendered with the .copy layer hidden. JPEG, <=200KB (W-55).
 *   2. assets/og.png      — the FINISHED card: the same page with the name, the
 *      approved role line and the site URL painted over that ground (W-59).
 *
 * Nothing composites the JPEG back into the PNG: both are rendered from og.html by
 * headless Playwright Chromium at exactly 1200x630, because a JPEG round trip of a
 * dark glow is the one thing this card cannot afford. The base is the ground layer
 * exported on its own; the card is the whole page. Re-run this and both follow.
 *
 * Every colour, size and face comes from css/tokens.css through var() in og.html;
 * no value is hard-coded here or there. Playwright is resolved from NODE_PATH / the
 * global npm root — nothing is installed.
 *
 * Run it from anywhere:
 *   PLAYWRIGHT_BROWSERS_PATH="D:/ms-playwright" \
 *   NODE_PATH="C:/Users/maxhe/AppData/Roaming/npm/node_modules" \
 *   "/c/Program Files/nodejs/node.exe" tools/make-og.js
 *
 * After the render, tools/optimize-og.py (PIL) losslessly re-encodes og.png and, only
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
const BASE = path.join(REPO, 'assets', 'og-base.jpg');
const OUT = path.join(REPO, 'assets', 'og.png');
const W = 1200;
const H = 630;
const BASE_BUDGET = 200 * 1024;   // W-55
const BASE_QUALITY = 95;          // a dark glow bands easily; spend bytes on it

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

  const tmp = os.tmpdir();
  const baseTarget = dry ? path.join(tmp, 'og-base.dry.jpg') : BASE;
  const cardTarget = dry ? path.join(tmp, 'og.dry.png') : OUT;

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const fileUrl = 'file:///' + SRC.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.evaluate(() => (document.fonts && document.fonts.ready) || true);

  // 1. the ground layer — the card's own canvas and glow, with the copy hidden.
  const hidden = await page.evaluate(() => {
    const copy = document.querySelector('.copy');
    if (!copy) return false;
    copy.style.visibility = 'hidden';
    return true;
  });
  if (!hidden) throw new Error('og.html has no .copy layer to hide for the ground render');
  await page.screenshot({ path: baseTarget, type: 'jpeg', quality: BASE_QUALITY });

  // 2. the finished card — the same page, whole.
  await page.evaluate(() => {
    const copy = document.querySelector('.copy');
    if (copy) copy.style.visibility = '';
  });
  await page.screenshot({ path: cardTarget, type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
  await browser.close();

  const baseBytes = fs.statSync(baseTarget).size;
  console.log('rendered ' + path.relative(REPO, baseTarget) + ' from og.html (' + baseBytes + 'B '
    + W + 'x' + H + ' jpeg q' + BASE_QUALITY + ')');
  if (baseBytes > BASE_BUDGET) {
    console.error('ERROR assets/og-base.jpg is over the 200KB budget (' + baseBytes + 'B > ' + BASE_BUDGET + 'B)');
    process.exit(1);
  }

  let bytes = fs.statSync(cardTarget).size;
  console.log('rendered ' + path.relative(REPO, cardTarget) + ' from og.html (' + bytes + 'B)');

  const opt = path.join(REPO, 'tools', 'optimize-og.py');
  if (fs.existsSync(opt)) {
    const r = spawnSync('python', [opt, cardTarget], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout) process.stdout.write(r.stdout);
    else console.log('  (optimize step skipped: ' + ((r.stderr || '').trim().split('\n').pop() || 'python/PIL unavailable') + ')');
    bytes = fs.statSync(cardTarget).size;
  }
  console.log('assets/og.png = ' + bytes + 'B ' + W + 'x' + H);
})().catch((e) => { console.error('ERROR ' + e.message); process.exit(1); });
