# LiveFonty Landing

Marketing site for **[LiveFonty](https://chromewebstore.google.com/detail/livefonty/ahdfmlobklcldcjfapjpnhdmdncdenhj)** — a Chrome extension that live-previews Google Fonts on any webpage.

**Live site:** [https://livefont.netlify.app](https://livefont.netlify.app)  
**Extension:** [Chrome Web Store](https://chromewebstore.google.com/detail/livefonty/ahdfmlobklcldcjfapjpnhdmdncdenhj)  
**Repo:** [github.com/abdalla980/LiveFonty](https://github.com/abdalla980/LiveFonty)

---

## What’s on the page

- Hero + product walkthrough (YouTube embed)
- Features, audience, how-it-works, FAQ
- Suggestion form (Netlify Forms)
- Support CTAs: leave a 5★ Chrome review, star on GitHub
- Privacy policy
- GA4 (`G-2CWGCYDX28`) behind a consent banner

---

## Stack

| Piece | Choice |
| --- | --- |
| Framework | [Astro](https://astro.build) 5 |
| Motion | [GSAP](https://gsap.com) + ScrollTrigger |
| Hosting | [Netlify](https://www.netlify.com) (`netlify.toml`) |
| Fonts | Poppins (Google Fonts) |
| Analytics | Google Analytics 4 + Consent Mode v2 |

---

## Quick start

```bash
npm install
npm run dev
```

Open the URL Astro prints (usually `http://localhost:4321`).

```bash
npm run build      # production build → dist/
npm run preview    # preview the build locally
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Static production build |
| `npm run preview` | Serve `dist/` locally |
| `npm run store-assets` | Regenerate Chrome Web Store images (icon, promos, 1280×800 screenshots) |

Store asset generator needs Chromium for Playwright once:

```bash
npx playwright install chromium
npm run store-assets
```

Outputs go to [`store-assets/`](./store-assets) — see [`store-assets/README.md`](./store-assets/README.md) for the upload map.

---

## Project structure

```text
src/
  layouts/Layout.astro    # shell, nav, footer, GA + consent
  pages/index.astro       # landing page
  pages/privacy.astro     # privacy policy
public/                   # favicon / static files
scripts/
  generate-store-assets.mjs
store-assets/             # CWS listing images + YouTube URL note
netlify.toml              # build + publish config
```

---

## Deploy

Pushes to `main` build on Netlify:

- **Build command:** `npm run build`
- **Publish directory:** `dist`

Set the Netlify site URL / custom domain in the Netlify dashboard if you change hosts.

---

## Analytics

- Measurement ID: `G-2CWGCYDX28` (website property — not the Chrome Web Store stream)
- Events: `download`, `review`, `github_star`, `generate_lead`
- Cookies load only after **Accept** on the consent banner

Extension usage / installs still come from the **Chrome Web Store Developer Dashboard**, not GA.

---

## Chrome Web Store assets

| Asset | Path |
| --- | --- |
| Icon 128×128 | `store-assets/icon-128.png` |
| Screenshots 1280×800 | `store-assets/screenshots/` |
| Small promo 440×280 | `store-assets/promo-small-440x280.png` |
| Large promo 1400×560 | `store-assets/promo-large-1400x560.png` |
| Promo video | `store-assets/YOUTUBE-URL.txt` |

---

## Contact

Questions or partnership: [abdullahizzldin1@gmail.com](mailto:abdullahizzldin1@gmail.com)

---

© 2026 LiveFonty
