#!/usr/bin/env node
/**
 * tools/make-pdf.mjs — regenerate `resume.pdf` at the repo root.
 *
 * The PDF is not drawn by hand and not authored as a separate document: it is the
 * site printing itself. This script drives Playwright's Chromium to
 *
 *   1. open the checkout's own `index.html` (served copy when a local server is
 *      up, otherwise the file opened directly),
 *   2. emulate the PRINT media type, so `css/print.css` — linked last by
 *      `index.html` and therefore winning over the screen zones — is what applies,
 *   3. write the result with `page.pdf(...)`.
 *
 * Run it from the repo root (or anywhere — the paths are resolved from this file):
 *
 *     node tools/make-pdf.mjs
 *
 * Output: `resume.pdf`, overwritten in place. Nothing else in the checkout is
 * written, so re-running is idempotent.
 *
 * Env:
 *     RESUME_PDF_URL            force a target origin (a served copy of the site)
 *     PLAYWRIGHT_BROWSERS_PATH  browser download directory, when not the default
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Resolved through CommonJS, not ESM: this checkout has no package.json, so the
// playwright that is available globally (NODE_PATH / the global npm root) is the
// one to use. ESM imports ignore NODE_PATH; a CommonJS require honours it.
const require = createRequire(import.meta.url);

function loadPlaywright() {
  const globalRoot = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'npm', 'node_modules')
    : null;
  const attempts = [
    () => require('playwright'),
    globalRoot ? () => require(path.join(globalRoot, 'playwright')) : null,
  ].filter(Boolean);

  const problems = [];
  for (const attempt of attempts) {
    try {
      return attempt();
    } catch (err) {
      problems.push(String((err && err.message) || err).split('\n')[0]);
    }
  }
  throw new Error('playwright could not be loaded: ' + problems.join(' | '));
}

// tools/.. is the site root: index.html links css/tokens.css, css/site.css and
// css/print.css — print.css last, so under print media it wins over the screen
// zones in site.css. The four-voice stylesheets (style/rave/modern/manuscript)
// are retired and deleted; nothing here depends on them.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const ENTRY = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'resume.pdf');

// A served copy is preferred (root-relative URLs and headers behave as in the
// browser); a plain file:// pass of index.html is the fallback so the generator
// still works with no server running.
const CANDIDATES = [
  process.env.RESUME_PDF_URL,
  'http://127.0.0.1:4173/',
  'http://localhost:4173/',
].filter(Boolean);

const PAGE_OPTS = {
  format: 'Letter',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
};

async function isUp(url) {
  if (typeof fetch !== 'function') return false;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 2500);
  try {
    const res = await fetch(url, { signal: ac.signal, redirect: 'follow' });
    return !!res && res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function pickTarget() {
  for (const url of CANDIDATES) {
    if (await isUp(url)) return { url, via: 'dev server' };
  }
  return { url: pathToFileURL(ENTRY).href, via: 'file:// checkout' };
}

const pagesIn = (file) => {
  const buf = fs.readFileSync(file);
  const m = buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g);
  return m ? m.length : 0;
};

async function main() {
  if (!fs.existsSync(ENTRY)) {
    console.error('[make-pdf] cannot find ' + ENTRY);
    process.exitCode = 1;
    return;
  }

  const { url, via } = await pickTarget();
  console.log('[make-pdf] rendering ' + url + ' (' + via + ') in print media');

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();

    // Print media, not screen media: this is the whole point of the pass.
    await page.emulateMedia({ media: 'print' });
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() =>
      document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true,
    );
    await page.waitForLoadState('networkidle').catch(() => {});

    await page.pdf({ path: OUT, ...PAGE_OPTS });
  } finally {
    await browser.close();
  }

  const pages = pagesIn(OUT);
  const bytes = fs.statSync(OUT).size;
  console.log(
    '[make-pdf] wrote ' + path.relative(ROOT, OUT) + ' — ' + pages + ' page(s), ' + bytes + ' bytes',
  );
  if (pages < 1 || pages > 2) {
    console.warn(
      '[make-pdf] WARNING: ' + pages + ' pages. The brief (W-77) wants 1-2; the print rules in css/print.css are what decides this.',
    );
  }
}

await main();
