/**
 * Chrome Web Store assets from the REAL LiveFonty landing page,
 * with the extension popup overlaid and a live Google Font applied.
 * Screenshots are captured at exact 1280×800 (no resize) so quality stays sharp.
 */
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import sharp from 'sharp';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'store-assets');
const shotDir = join(outDir, 'screenshots');
const mockDir = join(outDir, 'mock-pages');

mkdirSync(shotDir, { recursive: true });

const COLORS = {
  silver0: '#f7f8fa',
  silver1: '#eef0f4',
  silver2: '#dde1e8',
  ink: '#2a2f3a',
  inkSoft: '#5c6575',
  mustard: '#c4a035',
  lemon: '#e8c84a',
};

const YT_URL = 'https://www.youtube.com/watch?v=cFxZ6x6ZIHA';

const POPUP_CSS = `
* { box-sizing: border-box; }
.lf-popup {
  width: 260px;
  padding: 12px;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  border-radius: 10px;
  box-shadow: 0 18px 50px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06);
}
.lf-popup .header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #27272a;
}
.lf-popup .title { font-size: 13px; font-weight: 600; letter-spacing: -0.01em; color: #f4f4f5; }
.lf-popup .badge {
  font-size: 10px; color: #a1a1aa; background-color: #18181b;
  padding: 2px 6px; border-radius: 4px; border: 1px solid #27272a;
}
.lf-popup label {
  display: block; font-size: 11px; font-weight: 500; color: #a1a1aa; margin-bottom: 6px;
}
.lf-popup select, .lf-popup input[type="text"] {
  width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #27272a;
  background-color: #18181b; color: #f4f4f5; font-size: 13px; outline: none;
}
.lf-popup .search-section, .lf-popup .vibe-section, .lf-popup .top10-section { margin-bottom: 14px; }
.lf-popup .font-results {
  list-style: none; margin: 8px 0 0; padding: 0; max-height: 150px; overflow: hidden; border-radius: 6px;
  background: #0c0c0e; border: 1px solid #27272a;
}
.lf-popup .font-results li {
  padding: 6px 10px; font-size: 12px; color: #f4f4f5; border-bottom: 1px solid #18181b;
}
.lf-popup .font-results li.active, .lf-popup .font-results li.hover {
  background-color: #18181b;
}
.lf-popup .font-results .hint { padding: 6px 10px; font-size: 11px; color: #71717a; }
.lf-popup .vibe-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.lf-popup .vibe-btn {
  padding: 8px 6px; border-radius: 6px; border: 1px solid #27272a;
  background-color: #18181b; color: #f4f4f5; font-size: 11px; font-weight: 500;
  text-align: center; line-height: 1.3;
}
.lf-popup .vibe-btn.active {
  background-color: #27272a; border-color: #71717a;
}
.lf-popup .status {
  margin-top: 10px; font-size: 10px; color: #71717a; text-align: center;
}
.lf-popup .select-shell { position: relative; }
.lf-popup .fake-select {
  width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #52525b;
  background-color: #18181b; color: #f4f4f5; font-size: 13px;
  display: flex; justify-content: space-between; align-items: center;
}
.lf-popup .fake-select .chev { opacity: 0.6; font-size: 10px; }
.lf-popup .dropdown-menu {
  margin-top: 4px; border-radius: 6px; border: 1px solid #3f3f46;
  background: #18181b; overflow: hidden;
}
.lf-popup .dropdown-menu div {
  padding: 7px 10px; font-size: 12px; color: #d4d4d8; border-bottom: 1px solid #27272a;
}
.lf-popup .dropdown-menu div.selected {
  background: #27272a; color: #fff; font-weight: 600;
}
#lf-shot-overlay {
  position: fixed;
  top: 76px;
  right: 28px;
  z-index: 99999;
  pointer-events: none;
}
#lf-font-chip {
  position: fixed;
  left: 28px;
  bottom: 24px;
  z-index: 99999;
  background: rgba(9,9,11,0.92);
  color: #f4f4f5;
  border: 1px solid #27272a;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12px;
  font-family: Poppins, system-ui, sans-serif;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
#lf-font-chip strong { color: #e8c84a; font-weight: 600; }
`;

function popupSearch(activeFont) {
  return `
  <div class="lf-popup">
    <div class="header"><span class="title">LiveFonty</span><span class="badge">v1.0</span></div>
    <div class="search-section">
      <label>Search All Fonts</label>
      <input type="text" value="play" readonly>
      <ul class="font-results">
        <li class="active">Playfair Display</li>
        <li>Playwrite US Trad</li>
        <li>Playpen Sans</li>
        <li>Player Display</li>
      </ul>
    </div>
    <div class="vibe-section">
      <label>Brand Vibe</label>
      <div class="vibe-grid">
        <button class="vibe-btn">Modern &amp; Minimal</button>
        <button class="vibe-btn">Bold &amp; Edgy</button>
        <button class="vibe-btn">Elegant &amp; Luxury</button>
        <button class="vibe-btn">Playful &amp; Fun</button>
      </div>
    </div>
    <div class="top10-section">
      <label>Top 10</label>
      <div class="fake-select"><span>Choose a font...</span><span class="chev">▾</span></div>
    </div>
    <div class="status">Live preview enabled · ${activeFont}</div>
  </div>`;
}

function popupDropdown(selected) {
  const fonts = ['Open Sans', 'Roboto', 'Inter', 'Montserrat', 'Poppins', 'Lato', 'Raleway'];
  return `
  <div class="lf-popup">
    <div class="header"><span class="title">LiveFonty</span><span class="badge">v1.0</span></div>
    <div class="search-section">
      <label>Search All Fonts</label>
      <input type="text" placeholder="Type to search 1900+ fonts" readonly>
      <ul class="font-results"><li class="hint">Type to search 1900+ fonts</li></ul>
    </div>
    <div class="top10-section">
      <label>Top 10</label>
      <div class="select-shell">
        <div class="fake-select"><span>${selected}</span><span class="chev">▴</span></div>
        <div class="dropdown-menu">
          ${fonts.map((f) => `<div class="${f === selected ? 'selected' : ''}">${f}</div>`).join('')}
        </div>
      </div>
    </div>
    <div class="status">Live preview enabled</div>
  </div>`;
}

function popupVibe(selectedFont) {
  return `
  <div class="lf-popup">
    <div class="header"><span class="title">LiveFonty</span><span class="badge">v1.0</span></div>
    <div class="vibe-section">
      <label>Brand Vibe</label>
      <div class="vibe-grid">
        <button class="vibe-btn">Modern &amp; Minimal</button>
        <button class="vibe-btn">Bold &amp; Edgy</button>
        <button class="vibe-btn active">Elegant &amp; Luxury</button>
        <button class="vibe-btn">Playful &amp; Fun</button>
        <button class="vibe-btn">Corporate &amp; Trustworthy</button>
        <button class="vibe-btn">Creative &amp; Artistic</button>
      </div>
      <ul class="font-results">
        <li class="active">${selectedFont}</li>
        <li>Libre Baskerville</li>
        <li>EB Garamond</li>
        <li>Cormorant Infant</li>
      </ul>
    </div>
    <div class="status">Live preview enabled</div>
  </div>`;
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function iconSvg(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="ibg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.silver0}"/>
      <stop offset="100%" stop-color="${COLORS.silver2}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#ibg)"/>
  <rect x="${size * 0.12}" y="${size * 0.12}" width="${size * 0.76}" height="${size * 0.76}" rx="${size * 0.16}" fill="${COLORS.ink}"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Poppins, Arial, sans-serif" font-size="${size * 0.42}" font-weight="500" fill="${COLORS.lemon}">Aa</text>
</svg>`;
}

function promoSvg({ width, height, title, subtitle }) {
  const brandSize = Math.round(height * 0.16);
  const titleSize = Math.round(height * 0.09);
  const subSize = Math.round(height * 0.045);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.silver0}"/>
      <stop offset="45%" stop-color="${COLORS.silver1}"/>
      <stop offset="100%" stop-color="${COLORS.silver2}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${width * 0.88}" cy="${height * 0.18}" r="${height * 0.28}" fill="#ffffff" opacity="0.35"/>
  <circle cx="${width * 0.08}" cy="${height * 0.85}" r="${height * 0.22}" fill="${COLORS.mustard}" opacity="0.12"/>
  <rect x="${width * 0.06}" y="${height * 0.18}" width="${width * 0.55}" height="${height * 0.64}" rx="${height * 0.06}" fill="#ffffff" opacity="0.72" stroke="#ffffff" stroke-width="2"/>
  <text x="${width * 0.09}" y="${height * 0.38}" font-family="Poppins, Arial, sans-serif" font-size="${brandSize}" font-weight="500" fill="${COLORS.ink}">LiveFonty</text>
  <text x="${width * 0.09}" y="${height * 0.52}" font-family="Poppins, Arial, sans-serif" font-size="${titleSize}" font-weight="400" fill="${COLORS.ink}">${escapeXml(title)}</text>
  <text x="${width * 0.09}" y="${height * 0.64}" font-family="Poppins, Arial, sans-serif" font-size="${subSize}" font-weight="300" fill="${COLORS.inkSoft}">${escapeXml(subtitle)}</text>
  <rect x="${width * 0.09}" y="${height * 0.72}" width="${Math.min(width * 0.28, 220)}" height="${height * 0.1}" rx="${height * 0.05}" fill="${COLORS.ink}"/>
  <text x="${width * 0.09 + Math.min(width * 0.28, 220) / 2}" y="${height * 0.72 + height * 0.068}" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-size="${subSize}" font-weight="500" fill="#f5f6f8">Get for Chrome</text>
</svg>`;
}

async function svgToOpaquePng(svg, file, width, height) {
  const buf = await sharp(Buffer.from(svg))
    .resize(width, height, { fit: 'fill' })
    .flatten({ background: COLORS.silver1 })
    .png()
    .toBuffer();
  await sharp(buf).removeAlpha().png().toFile(file);
}

async function svgToJpeg(svg, file, width, height) {
  await sharp(Buffer.from(svg))
    .resize(width, height, { fit: 'fill' })
    .flatten({ background: COLORS.silver1 })
    .jpeg({ quality: 92 })
    .toFile(file);
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run(cmd, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: root, shell: true, stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} failed`))));
  });
}

async function startPreview() {
  const child = spawn('npx', ['astro', 'preview', '--host', '127.0.0.1', '--port', '4321'], {
    cwd: root,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:4321/');
      if (res.ok) return child;
    } catch {}
    await wait(300);
  }
  child.kill();
  throw new Error('Astro preview did not start');
}

/** Write PNG/JPEG at native capture size — never upscale/downscale. */
async function writeShot(buffer, outBase) {
  const meta = await sharp(buffer).metadata();
  if (meta.width !== 1280 || meta.height !== 800) {
    throw new Error(`Expected 1280x800 capture, got ${meta.width}x${meta.height}`);
  }
  const pngPath = join(shotDir, `${outBase}-1280x800.png`);
  const jpgPath = join(shotDir, `${outBase}-1280x800.jpg`);
  await sharp(buffer).removeAlpha().png({ compressionLevel: 9 }).toFile(pngPath);
  await sharp(buffer)
    .flatten({ background: COLORS.silver1 })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
    .toFile(jpgPath);
  console.log('Wrote', pngPath, `(${meta.width}x${meta.height}, no resize)`);
}

async function captureLandingScene(browser, baseUrl, scene) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });

  const url = scene.hash ? `${baseUrl}${scene.hash}` : baseUrl;
  await page.goto(url, { waitUntil: 'networkidle' });

  // Freeze animations so screenshots are clean
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
      .hero-anim, [data-animate], [data-animate-child] {
        opacity: 1 !important;
        transform: none !important;
        filter: none !important;
      }
    `,
  });

  if (scene.hash) {
    await page.evaluate((sel) => {
      const node = document.querySelector(sel);
      if (!node) return;
      const top = node.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo(0, Math.max(0, top));
    }, scene.hash);
  } else {
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  // Apply Google Font like the extension would
  const fontParam = encodeURIComponent(scene.font).replace(/%20/g, '+');
  await page.addStyleTag({
    url: `https://fonts.googleapis.com/css2?family=${fontParam}:wght@400;500;600;700&display=swap`,
  });
  await page.addStyleTag({
    content: `
      body, body p, body h1, body h2, body h3, body .lead, body .brand-hero,
      body .lab-sample, body .demo-sample, body .cta-primary, body .glass-card,
      body summary, body label, body input, body textarea, body a {
        font-family: '${scene.font}', Poppins, system-ui, sans-serif !important;
      }
    `,
  });

  await page.addStyleTag({ content: POPUP_CSS });
  await page.evaluate(
    ({ popupHtml, fontLabel }) => {
      document.querySelector('#lf-shot-overlay')?.remove();
      document.querySelector('#lf-font-chip')?.remove();
      const wrap = document.createElement('div');
      wrap.id = 'lf-shot-overlay';
      wrap.innerHTML = popupHtml;
      document.body.appendChild(wrap);
      const chip = document.createElement('div');
      chip.id = 'lf-font-chip';
      chip.innerHTML = `LiveFonty applied · <strong>${fontLabel}</strong>`;
      document.body.appendChild(chip);
    },
    { popupHtml: scene.popup, fontLabel: scene.font },
  );

  await wait(700);
  const buffer = await page.screenshot({ type: 'png', fullPage: false });
  await page.close();
  await writeShot(buffer, scene.out);
}

async function main() {
  // Drop fake mock sites
  rmSync(mockDir, { recursive: true, force: true });

  console.log('Building landing page…');
  await run('npm', ['run', 'build']);

  await svgToOpaquePng(iconSvg(128), join(outDir, 'icon-128.png'), 128, 128);

  const smallSvg = promoSvg({
    width: 440,
    height: 280,
    title: 'Preview fonts live',
    subtitle: '1,900+ Google Fonts on any page',
  });
  await svgToOpaquePng(smallSvg, join(outDir, 'promo-small-440x280.png'), 440, 280);
  await svgToJpeg(smallSvg, join(outDir, 'promo-small-440x280.jpg'), 440, 280);

  const largeSvg = promoSvg({
    width: 1400,
    height: 560,
    title: 'See your site in a different font before you commit.',
    subtitle: 'Chrome extension · free · no code changes',
  });
  await svgToOpaquePng(largeSvg, join(outDir, 'promo-large-1400x560.png'), 1400, 560);
  await svgToJpeg(largeSvg, join(outDir, 'promo-large-1400x560.jpg'), 1400, 560);

  const scenes = [
    {
      out: '01-hero',
      hash: '',
      font: 'Montserrat',
      popup: popupDropdown('Montserrat'),
    },
    {
      out: '02-features',
      hash: '#features',
      font: 'Playfair Display',
      popup: popupSearch('Playfair Display'),
    },
    {
      out: '03-how-it-works',
      hash: '#how-it-works',
      font: 'Cormorant Garamond',
      popup: popupVibe('Cormorant Garamond'),
    },
    {
      out: '04-faq',
      hash: '#faq',
      font: 'Inter',
      popup: popupDropdown('Inter'),
    },
    {
      out: '05-download',
      hash: '#support',
      font: 'Poppins',
      popup: popupSearch('Poppins'),
    },
  ];

  console.log('Starting preview…');
  const preview = await startPreview();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const scene of scenes) {
      await captureLandingScene(browser, 'http://127.0.0.1:4321/', scene);
    }
  } finally {
    await browser.close();
    preview.kill();
  }

  writeFileSync(join(outDir, 'YOUTUBE-URL.txt'), `${YT_URL}\n`);
  writeFileSync(
    join(outDir, 'README.md'),
    `# Chrome Web Store assets (LiveFonty)

Opaque JPEG / 24-bit PNG (no alpha). Screenshots are the **real landing page** at native **1280×800** (no resize) with the LiveFonty popup + a live-applied Google Font.

| Field | File |
| --- | --- |
| Händlersymbol 128×128 | \`icon-128.png\` |
| Screenshots 1280×800 | \`screenshots/01-hero\` … \`05-download\` |
| Kleine Werbekachel 440×280 | \`promo-small-440x280.png\` |
| Große Werbekachel 1400×560 | \`promo-large-1400x560.png\` |
| Globales Werbevideo | \`${YT_URL}\` |

Landing page embeds the same video. Regenerate: \`npm run store-assets\`
`,
  );

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
