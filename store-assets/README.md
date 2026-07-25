# Chrome Web Store assets — LiveFonty

Generated from the current silver / Poppins landing design.  
All images are **opaque** (no alpha): 24-bit PNG or JPEG.

## Upload map (Chrome Web Store)

| Field (DE) | Spec | File |
| --- | --- | --- |
| **Händlersymbol** | 128×128 | [`icon-128.png`](./icon-128.png) |
| **Screenshot 1** | 1280×800 | [`screenshots/01-hero-1280x800.png`](./screenshots/01-hero-1280x800.jpg) |
| **Screenshot 2** | 1280×800 | [`screenshots/02-features-1280x800.png`](./screenshots/02-features-1280x800.jpg) |
| **Screenshot 3** | 1280×800 | [`screenshots/03-how-it-works-1280x800.png`](./screenshots/03-how-it-works-1280x800.jpg) |
| **Screenshot 4** | 1280×800 | [`screenshots/04-faq-1280x800.png`](./screenshots/04-faq-1280x800.jpg) |
| **Screenshot 5** | 1280×800 | [`screenshots/05-download-1280x800.png`](./screenshots/05-download-1280x800.jpg) |
| **Kleine Werbekachel** | 440×280 | [`promo-small-440x280.png`](./promo-small-440x280.png) |
| **Große Werbekachel** | 1400×560 | [`promo-large-1400x560.png`](./promo-large-1400x560.png) |
| **Globales Werbevideo** | YouTube URL | See [`YOUTUBE-URL.txt`](./YOUTUBE-URL.txt) |

JPEG copies of screenshots and promos sit next to the PNGs (same basename).

## Promo video source

Landing page file (after you restore it): `../public/videos/Preview.mp4`  
Upload that file to YouTube (public or unlisted), then paste the watch URL into the store listing and into `YOUTUBE-URL.txt`.

## Regenerate

```bash
npm run store-assets
```
