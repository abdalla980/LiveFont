/**
 * Generates Chrome Web Store screenshots showing LiveFonty popup in action
 * (dropdown / search / vibes) with a different font applied to the page.
 * Also regenerates icon + promo tiles. Opaque 1280x800 PNG/JPEG, no alpha.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'store-assets');
const shotDir = join(outDir, 'screenshots');
const mockDir = join(outDir, 'mock-pages');

mkdirSync(shotDir, { recursive: true });
mkdirSync(mockDir, { recursive: true });

const COLORS = {
  silver0: '#f7f8fa',
  silver1: '#eef0f4',
  silver2: '#dde1e8',
  ink: '#2a2f3a',
  inkSoft: '#5c6575',
  mustard: '#c4a035',
  lemon: '#e8c84a',
};

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
`;

function browserChrome(inner) {
  return `
  <div class="chrome">
    <div class="chrome-bar">
      <div class="traffic"><span></span><span></span><span></span></div>
      <div class="omnibox">https://example-shop.com</div>
      <div class="ext-slot" title="LiveFonty">
        <div class="ext-icon">Aa</div>
      </div>
    </div>
    <div class="chrome-body">
      ${inner}
    </div>
  </div>`;
}

function siteMarkup(fontFamily, fontLabel) {
  return `
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily).replace(/%20/g, '+')}:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    .site * { font-family: '${fontFamily}', sans-serif !important; }
  </style>
  <div class="site">
    <header class="site-nav">
      <strong>Northline Co.</strong>
      <nav><span>Shop</span><span>About</span><span>Contact</span></nav>
    </header>
    <main>
      <p class="eyebrow">New season</p>
      <h1>Design that feels personal.</h1>
      <p class="body">Preview any Google Font on the live page — this headline is running <em>${fontLabel}</em> right now.</p>
      <button class="site-cta">Shop the collection</button>
      <div class="cards">
        <article><h3>Editorial</h3><p>Quiet layouts with strong type hierarchy.</p></article>
        <article><h3>Product</h3><p>Clean UI copy that stays readable at every size.</p></article>
        <article><h3>Brand</h3><p>Test voice before you commit to a font family.</p></article>
      </div>
    </main>
  </div>`;
}

function pageShell({ title, fontFamily, fontLabel, popupHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    ${POPUP_CSS}
    html, body { margin: 0; padding: 0; width: 1280px; height: 800px; overflow: hidden; background: #c8ccd4; }
    body {
      font-family: Poppins, system-ui, sans-serif;
      background:
        radial-gradient(ellipse 80% 50% at 100% -10%, rgba(255,255,255,0.7), transparent 55%),
        linear-gradient(165deg, #f7f8fa 0%, #eef0f4 45%, #dde1e8 100%);
    }
    .frame {
      width: 1280px; height: 800px; position: relative;
      padding: 28px 32px 24px;
      box-sizing: border-box;
    }
    .chrome {
      height: 100%;
      border-radius: 14px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 24px 60px rgba(42,47,58,0.18);
      display: flex; flex-direction: column;
      border: 1px solid rgba(255,255,255,0.9);
    }
    .chrome-bar {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; background: #f3f4f6; border-bottom: 1px solid #e5e7eb;
    }
    .traffic { display: flex; gap: 6px; }
    .traffic span { width: 10px; height: 10px; border-radius: 50%; background: #d1d5db; }
    .traffic span:nth-child(1) { background: #f87171; }
    .traffic span:nth-child(2) { background: #fbbf24; }
    .traffic span:nth-child(3) { background: #34d399; }
    .omnibox {
      flex: 1; background: #fff; border: 1px solid #e5e7eb; border-radius: 999px;
      padding: 6px 14px; font-size: 12px; color: #6b7280;
    }
    .ext-slot {
      width: 28px; height: 28px; border-radius: 8px; background: #2a2f3a;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 2px #e8c84a;
    }
    .ext-icon { color: #e8c84a; font-size: 11px; font-weight: 700; font-family: Georgia, serif; }
    .chrome-body { position: relative; flex: 1; overflow: hidden; background: #fafafa; }
    .site { padding: 36px 48px; color: #18181b; }
    .site-nav {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 40px; font-size: 14px;
    }
    .site-nav nav { display: flex; gap: 22px; color: #52525b; }
    .eyebrow {
      text-transform: uppercase; letter-spacing: 0.14em; font-size: 11px;
      color: #71717a; margin: 0 0 10px;
    }
    .site h1 {
      font-size: 52px; line-height: 1.08; letter-spacing: -0.03em;
      margin: 0 0 16px; max-width: 640px; font-weight: 700;
    }
    .site .body {
      font-size: 18px; line-height: 1.55; color: #3f3f46;
      max-width: 520px; margin: 0 0 24px;
    }
    .site-cta {
      border: none; background: #18181b; color: #fff; padding: 12px 20px;
      border-radius: 999px; font-size: 14px; cursor: default;
    }
    .cards {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
      margin-top: 48px;
    }
    .cards article {
      background: #fff; border: 1px solid #e4e4e7; border-radius: 14px; padding: 18px;
    }
    .cards h3 { margin: 0 0 8px; font-size: 18px; }
    .cards p { margin: 0; font-size: 14px; color: #52525b; line-height: 1.5; }
    .popup-wrap {
      position: absolute; top: 12px; right: 18px; z-index: 20;
    }
    .font-chip {
      position: absolute; left: 48px; bottom: 28px; z-index: 5;
      background: rgba(9,9,11,0.92); color: #f4f4f5; border: 1px solid #27272a;
      border-radius: 999px; padding: 8px 14px; font-size: 12px;
      font-family: Poppins, system-ui, sans-serif;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .font-chip strong { color: #e8c84a; font-weight: 600; }
  </style>
</head>
<body>
  <div class="frame">
    ${browserChrome(`
      ${siteMarkup(fontFamily, fontLabel)}
      <div class="font-chip">LiveFonty applied · <strong>${fontLabel}</strong></div>
      <div class="popup-wrap">${popupHtml}</div>
    `)}
  </div>
</body>
</html>`;
}

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
        <li>Cormorant Garamond</li>
        <li>Libre Baskerville</li>
        <li>EB Garamond</li>
      </ul>
    </div>
    <div class="status">Live preview enabled</div>
  </div>`;
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  <rect x="${width * 0.06}" y="${height * 0.18}" width="${width * 0.55}" height="${height * 0.64}" rx="${height * 0.06}" fill="#ffffff" fill-opacity="0.78" stroke="#ffffff" stroke-width="2"/>
  <text x="${width * 0.09}" y="${height * 0.38}" font-family="Poppins, Arial, sans-serif" font-size="${brandSize}" font-weight="500" fill="${COLORS.ink}">LiveFonty</text>
  <text x="${width * 0.09}" y="${height * 0.52}" font-family="Poppins, Arial, sans-serif" font-size="${titleSize}" font-weight="400" fill="${COLORS.ink}">${escapeXml(title)}</text>
  <text x="${width * 0.09}" y="${height * 0.64}" font-family="Poppins, Arial, sans-serif" font-size="${subSize}" font-weight="300" fill="${COLORS.inkSoft}">${escapeXml(subtitle)}</text>
  <rect x="${width * 0.09}" y="${height * 0.72}" width="${Math.min(width * 0.28, 220)}" height="${height * 0.1}" rx="${height * 0.05}" fill="${COLORS.ink}"/>
  <text x="${width * 0.09 + Math.min(width * 0.28, 220) / 2}" y="${height * 0.72 + height * 0.068}" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-size="${subSize}" font-weight="500" fill="#f5f6f8">Get for Chrome</text>
</svg>`;
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
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="${size * 0.42}" font-weight="500" fill="${COLORS.lemon}">Aa</text>
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

async function captureScene(browser, htmlPath, outBase) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const buffer = await page.screenshot({ type: 'png', fullPage: false });
  await page.close();

  const pngPath = join(shotDir, `${outBase}-1280x800.png`);
  const jpgPath = join(shotDir, `${outBase}-1280x800.jpg`);
  await sharp(buffer).resize(1280, 800, { fit: 'fill' }).removeAlpha().png().toFile(pngPath);
  await sharp(buffer)
    .resize(1280, 800, { fit: 'fill' })
    .flatten({ background: COLORS.silver1 })
    .jpeg({ quality: 92 })
    .toFile(jpgPath);
  console.log('Wrote', pngPath);
}

async function main() {
  const scenes = [
    {
      file: '01-dropdown.html',
      out: '01-hero',
      font: 'Montserrat',
      label: 'Montserrat',
      popup: popupDropdown('Montserrat'),
      title: 'Top 10 dropdown open',
    },
    {
      file: '02-search.html',
      out: '02-features',
      font: 'Playfair Display',
      label: 'Playfair Display',
      popup: popupSearch('Playfair Display'),
      title: 'Search results',
    },
    {
      file: '03-vibe.html',
      out: '03-how-it-works',
      font: 'Cormorant Garamond',
      label: 'Cormorant Garamond',
      popup: popupVibe('Cormorant Garamond'),
      title: 'Brand vibe picker',
    },
    {
      file: '04-inter.html',
      out: '04-faq',
      font: 'Inter',
      label: 'Inter',
      popup: popupDropdown('Inter'),
      title: 'Inter applied',
    },
    {
      file: '05-poppins.html',
      out: '05-download',
      font: 'Poppins',
      label: 'Poppins',
      popup: popupSearch('Poppins'),
      title: 'Poppins applied',
    },
  ];

  for (const scene of scenes) {
    const html = pageShell({
      title: scene.title,
      fontFamily: scene.font,
      fontLabel: scene.label,
      popupHtml: scene.popup,
    });
    writeFileSync(join(mockDir, scene.file), html);
  }

  // Icon + promos
  await svgToOpaquePng(iconSvg(128), join(outDir, 'icon-128.png'), 128, 128);
  await svgToOpaquePng(iconSvg(128), join(outDir, 'store-icon-128.png'), 128, 128);

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

  const browser = await chromium.launch({ headless: true });
  try {
    for (const scene of scenes) {
      await captureScene(browser, join(mockDir, scene.file), scene.out);
    }
  } finally {
    await browser.close();
  }

  writeFileSync(
    join(outDir, 'README.md'),
    `# Chrome Web Store assets (LiveFonty)

Opaque JPEG / 24-bit PNG (no alpha). Screenshots show the real popup UI over a demo page with a live-applied Google Font.

| Field | File |
| --- | --- |
| Händlersymbol 128×128 | \`icon-128.png\` |
| Screenshots 1280×800 | \`screenshots/01-hero\` … \`05-download\` (\`.png\` / \`.jpg\`) |
| Kleine Werbekachel 440×280 | \`promo-small-440x280.png\` |
| Große Werbekachel 1400×560 | \`promo-large-1400x560.png\` |
| Globales Werbevideo | Upload \`../public/videos/Preview.mp4\` to YouTube → \`YOUTUBE-URL.txt\` |

Regenerate: \`npm run store-assets\`
`,
  );

  console.log('Done. Extension-style screenshots in store-assets/screenshots/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
