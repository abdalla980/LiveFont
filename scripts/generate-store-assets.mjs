/**
 * Generates Chrome Web Store assets matching the LiveFonty silver/Poppins landing design.
 * Outputs opaque JPEG/PNG (no alpha) into store-assets/.
 */
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import sharp from 'sharp';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'store-assets');
const shotDir = join(outDir, 'screenshots');

mkdirSync(shotDir, { recursive: true });

const COLORS = {
  silver0: '#f7f8fa',
  silver1: '#eef0f4',
  silver2: '#dde1e8',
  ink: '#2a2f3a',
  inkSoft: '#5c6575',
  mustard: '#c4a035',
  lemon: '#e8c84a',
  white: '#ffffff',
};

function promoSvg({ width, height, title, subtitle, mark = true }) {
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
    <linearGradient id="sheen" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#eef0f4" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#sheen)" opacity="0.5"/>
  <circle cx="${width * 0.88}" cy="${height * 0.18}" r="${height * 0.28}" fill="#ffffff" opacity="0.35"/>
  <circle cx="${width * 0.08}" cy="${height * 0.85}" r="${height * 0.22}" fill="${COLORS.mustard}" opacity="0.12"/>
  ${mark ? `<rect x="${width * 0.06}" y="${height * 0.18}" width="${width * 0.55}" height="${height * 0.64}" rx="${height * 0.06}" fill="url(#card)" stroke="#ffffff" stroke-width="2"/>` : ''}
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
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Poppins, Arial, sans-serif" font-size="${size * 0.42}" font-weight="500" fill="${COLORS.lemon}">Aa</text>
</svg>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function svgToOpaquePng(svg, file, width, height) {
  const buf = await sharp(Buffer.from(svg))
    .resize(width, height, { fit: 'fill' })
    .flatten({ background: COLORS.silver1 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  // Ensure no alpha channel (24-bit)
  await sharp(buf)
    .removeAlpha()
    .png()
    .toFile(file);
}

async function svgToJpeg(svg, file, width, height) {
  await sharp(Buffer.from(svg))
    .resize(width, height, { fit: 'fill' })
    .flatten({ background: COLORS.silver1 })
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(file);
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function startPreview() {
  const child = spawn('npx', ['astro', 'preview', '--host', '127.0.0.1', '--port', '4321'], {
    cwd: root,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ready = false;
  const onData = (buf) => {
    const t = buf.toString();
    if (t.includes('localhost') || t.includes('4321')) ready = true;
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  for (let i = 0; i < 40 && !ready; i++) await wait(250);
  // Always try hitting the port
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:4321/');
      if (res.ok) return child;
    } catch {}
    await wait(300);
  }
  throw new Error('Astro preview did not start');
}

async function captureScreenshots(baseUrl) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: `
      .js-enabled .hero-anim, [data-animate], [data-animate-child] {
        opacity: 1 !important;
        transform: none !important;
        filter: none !important;
      }
    `,
  });
  await wait(800);

  const shots = [
    { name: '01-hero', scroll: 0 },
    { name: '02-features', selector: '#features' },
    { name: '03-how-it-works', selector: '#how-it-works' },
    { name: '04-faq', selector: '#faq' },
    { name: '05-download', selector: '#download' },
  ];

  for (const shot of shots) {
    if (shot.selector) {
      const el = await page.$(shot.selector);
      if (el) {
        await el.scrollIntoViewIfNeeded();
        await wait(400);
        // Center section vertically roughly
        await page.evaluate((sel) => {
          const node = document.querySelector(sel);
          if (!node) return;
          const top = node.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo(0, Math.max(0, top));
        }, shot.selector);
        await wait(350);
      }
    } else {
      await page.evaluate((y) => window.scrollTo(0, y), shot.scroll);
      await wait(350);
    }

    const pngPath = join(shotDir, `${shot.name}-1280x800.png`);
    const jpgPath = join(shotDir, `${shot.name}-1280x800.jpg`);
    const buffer = await page.screenshot({ type: 'png', fullPage: false });
    await sharp(buffer)
      .resize(1280, 800, { fit: 'cover', position: 'top' })
      .removeAlpha()
      .png()
      .toFile(pngPath);
    await sharp(buffer)
      .resize(1280, 800, { fit: 'cover', position: 'top' })
      .flatten({ background: COLORS.silver1 })
      .jpeg({ quality: 92 })
      .toFile(jpgPath);
    console.log('Wrote', pngPath);
  }

  await browser.close();
}

async function main() {
  console.log('Building site…');
  await new Promise((resolve, reject) => {
    const b = spawn('npm', ['run', 'build'], { cwd: root, shell: true, stdio: 'inherit' });
    b.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('build failed'))));
  });

  // Icon 128x128
  const iconPath = join(outDir, 'icon-128.png');
  await svgToOpaquePng(iconSvg(128), iconPath, 128, 128);
  console.log('Wrote', iconPath);

  // Also refresh public favicon-style store icon copy
  await svgToOpaquePng(iconSvg(128), join(outDir, 'store-icon-128.png'), 128, 128);

  // Small promo 440x280
  const smallSvg = promoSvg({
    width: 440,
    height: 280,
    title: 'Preview fonts live',
    subtitle: '1,900+ Google Fonts on any page',
  });
  await svgToOpaquePng(smallSvg, join(outDir, 'promo-small-440x280.png'), 440, 280);
  await svgToJpeg(smallSvg, join(outDir, 'promo-small-440x280.jpg'), 440, 280);

  // Large promo 1400x560
  const largeSvg = promoSvg({
    width: 1400,
    height: 560,
    title: 'See your site in a different font before you commit.',
    subtitle: 'Chrome extension · free · no code changes',
  });
  await svgToOpaquePng(largeSvg, join(outDir, 'promo-large-1400x560.png'), 1400, 560);
  await svgToJpeg(largeSvg, join(outDir, 'promo-large-1400x560.jpg'), 1400, 560);

  console.log('Starting preview for screenshots…');
  const preview = await startPreview();
  try {
    await captureScreenshots('http://127.0.0.1:4321/');
  } finally {
    preview.kill();
  }

  writeFileSync(
    join(outDir, 'YOUTUBE-URL.txt'),
    `Upload public/videos/Preview.mp4 to YouTube (unlisted or public), then paste the URL below for Chrome Web Store → Globales Werbevideo:

https://www.youtube.com/watch?v=YOUR_VIDEO_ID

Landing page embeds the same file at /videos/Preview.mp4
`,
  );

  writeFileSync(
    join(outDir, 'README.md'),
    `# Chrome Web Store assets (LiveFonty)

All images are opaque JPEG or 24-bit PNG (no alpha), matching the silver Poppins landing design.

## Upload map (German Chrome Web Store console)

| Field | File |
| --- | --- |
| Händlersymbol 128×128 | \`icon-128.png\` / \`store-icon-128.png\` |
| Screenshot 1–5 (1280×800) | \`screenshots/*-1280x800.png\` (or \`.jpg\`) |
| Kleine Werbekachel 440×280 | \`promo-small-440x280.png\` |
| Große Werbekachel 1400×560 | \`promo-large-1400x560.png\` |
| Globales Werbevideo | Upload \`../public/videos/Preview.mp4\` to YouTube → put URL in \`YOUTUBE-URL.txt\` |

Regenerate: \`node scripts/generate-store-assets.mjs\`
`,
  );

  console.log('Done. Assets in store-assets/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
