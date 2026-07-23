# Full Google Fonts Catalog — Design

## Problem

LiveFonty's popup only offers 16 hardcoded fonts across 4 curated categories
(`livefont/popup.html`). The user wants access to the entire Google Fonts
catalog (~1500 families), not just the curated shortlist.

## Approach

**Data source:** Bundle a static `livefont/fonts.json` containing every
Google Fonts family name, pulled from Google's real, current font metadata
(not hand-written). Static and bundled means it works offline, needs no API
key, and loads instantly. It will go stale as Google adds new fonts over
time — acceptable for this project's scale; refreshing the file is a
manual, occasional task.

**UI:** Keep the existing categorized dropdown as a "Quick Picks" section,
unchanged. Add a "Search All Fonts" section below it: a text input plus a
scrollable results list.

- Typing filters the ~1500 names client-side, case-insensitive substring
  match, capped at 50 rendered rows (avoids painting 1500 DOM nodes at
  once).
- Empty query → hint text, "Type to search 1500+ fonts".
- No matches → "No fonts found."
- Clicking a result applies that font, same as picking one from Quick
  Picks.

**Logic:** The existing `applyFont(selectedFont)` function in `popup.js`
(injects a Google Fonts `<link>` + an override `<style>` via
`chrome.scripting.executeScript`) is reused unchanged. Both the Quick Picks
dropdown's `change` handler and the new search results' `click` handler
call it with a font name string — the function doesn't care which UI
element produced that string.

**Manifest:** No changes. `fonts.json` is fetched (`fetch('fonts.json')`)
from within the popup's own page, which is part of the extension package —
this doesn't need `host_permissions` or `web_accessible_resources` (those
apply to content-script/page access, not the extension's own popup
fetching its own bundled file).

## Data flow

```
popup opens
  → popup.js fetches fonts.json, caches array in memory
user types in search box
  → filter cached array (substring, case-insensitive) → render ≤50 <li> results
user clicks a Quick Pick option OR a search result
  → applyFont(name)
      → chrome.scripting.executeScript into the active tab
          → <link> tag for Google Fonts CSS (if not already present)
          → <style> tag forcing `font-family` on `*` (idempotent, reused if present)
```

## Error handling

- `fonts.json` fetch fails → search section shows an inline error message
  ("Couldn't load font list"); Quick Picks still work independently since
  they don't depend on the fetch.
- No matches for a search query → "No fonts found" message, no crash.

## Testing

No build step or test framework in this project. Verification is manual:
load the unpacked extension in Chrome, open the popup on a real webpage,
confirm:
- Quick Picks dropdown still applies fonts as before (regression check).
- Search box filters live as you type.
- Selecting a search result applies that font to the page.
- A multi-word font name (e.g. "Plus Jakarta Sans" style) round-trips
  correctly through the Google Fonts URL.
- Empty query and no-match states render their placeholder text instead of
  erroring.

## Out of scope

- No changes to how fonts are fetched/applied on the page (existing
  Google Fonts CDN `<link>` mechanism is untouched).
- No persistence of the last-selected font across popup opens (not part of
  the current extension either).
- No categorization/grouping of the full 1500-font search results — flat
  alphabetical filtering only.
