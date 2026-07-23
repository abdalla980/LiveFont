# Full Google Fonts Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let LiveFonty's popup search and apply any of Google's ~1900 font families, not just the 16 curated ones.

**Architecture:** A static `livefont/fonts.json` (array of family name strings, pulled from Google's real font metadata) is fetched once when the popup opens. A new search box filters that array client-side and renders matches as clickable list items. Both the existing Quick Picks dropdown and the new search results call the same, unmodified `applyFont()` function.

**Tech Stack:** Vanilla JS, Chrome Extension Manifest V3 (`chrome.scripting.executeScript`), no build step, no test framework currently in this repo.

## Global Constraints

- No manifest changes — `fonts.json` is fetched by the popup from within its own extension package, which needs no `host_permissions` or `web_accessible_resources`.
- No changes to `applyFont()`'s existing behavior (Google Fonts `<link>` injection + override `<style>` tag) — it must keep working identically for Quick Picks.
- Full catalog search results are flat and alphabetical — no categorization.
- Search results capped at 50 rendered rows.
- This repo has no test framework or build step. Verification is manual, in an actual loaded Chrome extension — steps are spelled out exactly in each task below.

---

### Task 1: Generate `livefont/fonts.json` from Google's font metadata

**Files:**
- Create: `livefont/fonts.json`

**Interfaces:**
- Produces: `livefont/fonts.json` — a JSON array of strings, e.g. `["ABeeZee", "Abel", ...]`, sorted alphabetically (case-insensitive), one entry per Google Fonts family. Consumed by Task 3's `fetch('fonts.json')`.

- [ ] **Step 1: Download Google's font metadata**

Run:
```bash
curl -s "https://fonts.google.com/metadata/fonts" -o "livefont/fonts-raw.json" -w "HTTP_STATUS:%{http_code} SIZE:%{size_download}\n"
```
Expected: `HTTP_STATUS:200` and a `SIZE` around 2-3 million (bytes).

- [ ] **Step 2: Transform into the flat sorted name array**

Run:
```bash
node -e "
const data = JSON.parse(require('fs').readFileSync('livefont/fonts-raw.json', 'utf8'));
const names = data.familyMetadataList.map(f => f.family).sort((a,b) => a.localeCompare(b));
require('fs').writeFileSync('livefont/fonts.json', JSON.stringify(names));
console.log('count:', names.length);
console.log('first:', names[0], 'last:', names[names.length - 1]);
"
```
Expected: `count:` around 1900+, with `first: ABeeZee` (or similar) and a `last` entry starting with `Z`.

- [ ] **Step 3: Verify the output is valid JSON and clean up the raw download**

Run:
```bash
node -e "const a = JSON.parse(require('fs').readFileSync('livefont/fonts.json','utf8')); if (!Array.isArray(a) || typeof a[0] !== 'string') throw new Error('bad shape'); console.log('OK', a.length);"
rm livefont/fonts-raw.json
```
Expected: `OK` followed by the same count as Step 2, and `fonts-raw.json` no longer present (only `fonts.json` remains).

- [ ] **Step 4: Commit**

```bash
git add livefont/fonts.json
git commit -m "Add full Google Fonts catalog data (fonts.json)"
```

---

### Task 2: Add search UI markup and styles to `popup.html`

**Files:**
- Modify: `livefont/popup.html`

**Interfaces:**
- Produces: DOM elements `#fontSearch` (text input) and `#fontResults` (`<ul>`), which Task 3's `popup.js` attaches behavior to.
- Consumes: existing `#fontSelect` element and its surrounding markup — left untouched.

- [ ] **Step 1: Add the CSS for the new search input and results list**

In `livefont/popup.html`, inside the existing `<style>` block, add this immediately after the existing `.status` rule (after the closing `}` on what is currently line 75):

```css
        input[type="text"] {
            width: 100%;
            padding: 8px 10px;
            border-radius: 6px;
            border: 1px solid #27272a;
            background-color: #18181b;
            color: #f4f4f5;
            font-size: 13px;
            outline: none;
            transition: border-color 0.15s ease;
        }
        input[type="text"]:focus {
            border-color: #52525b;
        }
        .search-section {
            margin-top: 12px;
        }
        .font-results {
            list-style: none;
            margin: 8px 0 0;
            padding: 0;
            max-height: 150px;
            overflow-y: auto;
            border-radius: 6px;
        }
        .font-results li {
            padding: 6px 10px;
            font-size: 12px;
            color: #f4f4f5;
            cursor: pointer;
            border-bottom: 1px solid #18181b;
        }
        .font-results li:hover {
            background-color: #18181b;
        }
        .font-results .hint,
        .font-results .empty {
            padding: 6px 10px;
            font-size: 11px;
            color: #71717a;
            cursor: default;
        }
```

- [ ] **Step 2: Add the search section markup**

In `livefont/popup.html`, replace this line:

```html
<div class="status">Live preview enabled</div>
```

with:

```html
<div class="search-section">
    <label for="fontSearch">Search All Fonts</label>
    <input type="text" id="fontSearch" placeholder="Type to search 1900+ fonts" autocomplete="off">
    <ul id="fontResults" class="font-results"></ul>
</div>

<div class="status">Live preview enabled</div>
```

- [ ] **Step 3: Verify the file is well-formed**

Run:
```bash
node -e "require('fs').readFileSync('livefont/popup.html', 'utf8'); console.log('read OK');"
```
Expected: `read OK` (this just confirms the file is present and readable; full rendering is checked in Task 4).

Then visually confirm by opening `livefont/popup.html` in a plain browser tab (not as an extension) — the dropdown, an empty text input labeled "Search All Fonts", and the "Live preview enabled" text should all be visible. The results list will be empty since `popup.js` hasn't been updated yet (Task 3).

- [ ] **Step 4: Commit**

```bash
git add livefont/popup.html
git commit -m "Add search input and results list markup to popup"
```

---

### Task 3: Wire up font search filtering and click-to-apply in `popup.js`

**Files:**
- Modify: `livefont/popup.js`

**Interfaces:**
- Consumes: `#fontSearch` and `#fontResults` from Task 2; `livefont/fonts.json` from Task 1 (array of strings).
- Consumes: existing `applyFont(selectedFont)` function (defined in this same file) — called unchanged, with a font-name string argument.
- Produces: `renderResults(query)` — filters the in-memory font list and repaints `#fontResults`. Not consumed elsewhere; local to this file.

- [ ] **Step 1: Add element references and catalog state**

In `livefont/popup.js`, replace this line:

```js
const fontSelect = document.getElementById('fontSelect');
```

with:

```js
const fontSelect = document.getElementById('fontSelect');
const fontSearch = document.getElementById('fontSearch');
const fontResults = document.getElementById('fontResults');

let allFonts = [];
```

- [ ] **Step 2: Add catalog loading, filtering, and rendering after the existing `change` listener**

At the end of `livefont/popup.js`, after the existing block:

```js
// Automatically trigger on dropdown selection change
fontSelect.addEventListener('change', (e) => {
    applyFont(e.target.value);
});
```

add:

```js
// Load the full Google Fonts catalog for search
fetch('fonts.json')
    .then((res) => res.json())
    .then((fonts) => {
        allFonts = fonts;
        renderResults('');
    })
    .catch(() => {
        fontResults.innerHTML = '<li class="empty">Couldn\'t load font list</li>';
    });

function renderResults(query) {
    fontResults.innerHTML = '';

    if (!query) {
        const hint = document.createElement('li');
        hint.className = 'hint';
        hint.textContent = 'Type to search 1900+ fonts';
        fontResults.appendChild(hint);
        return;
    }

    const matches = allFonts
        .filter((font) => font.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 50);

    if (matches.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty';
        empty.textContent = 'No fonts found';
        fontResults.appendChild(empty);
        return;
    }

    matches.forEach((font) => {
        const item = document.createElement('li');
        item.textContent = font;
        item.addEventListener('click', () => applyFont(font));
        fontResults.appendChild(item);
    });
}

fontSearch.addEventListener('input', (e) => {
    renderResults(e.target.value.trim());
});
```

- [ ] **Step 3: Verify the file parses as valid JavaScript**

Run:
```bash
node --check livefont/popup.js
```
Expected: no output, exit code 0 (Node's `--check` only parses, it doesn't run — this file uses browser globals like `document`/`fetch`/`chrome` that don't exist in plain Node, so it must not be executed, only parsed).

- [ ] **Step 4: Commit**

```bash
git add livefont/popup.js
git commit -m "Add live search filtering over full font catalog"
```

---

### Task 4: Manual verification in Chrome

**Files:** none (verification only, no code changes)

**Interfaces:** none — this task exercises the combined output of Tasks 1-3.

- [ ] **Step 1: Load the unpacked extension**

- Open Chrome and go to `chrome://extensions`.
- Enable "Developer mode" (top-right toggle) if not already on.
- Click "Load unpacked" and select the `livefont` folder (`C:\Users\abdul\Downloads\LiveFont\livefont`).
- Expected: "LiveFonty" (v1.0) appears in the extensions list with no errors shown.

- [ ] **Step 2: Regression-check Quick Picks**

- Open any normal webpage (e.g. `https://example.com`).
- Click the LiveFonty extension icon to open the popup.
- Select a font from the "Select Font Style" dropdown, e.g. "Playfair Display".
- Expected: the page's text visibly re-renders in that font within ~1 second.

- [ ] **Step 3: Verify search — typing filters live**

- In the same popup, click into the "Search All Fonts" input and type `mono`.
- Expected: the results list below updates to show only fonts containing "mono" (e.g. "JetBrains Mono", "Space Mono", "DM Mono", etc.), capped at 50 rows.

- [ ] **Step 4: Verify search — clicking a result applies the font**

- Click one of the filtered results, e.g. "Space Mono".
- Expected: the webpage's text switches to that font, the same way Quick Picks does.

- [ ] **Step 5: Verify empty and no-match states**

- Clear the search input entirely.
- Expected: the results list shows the single hint line "Type to search 1900+ fonts".
- Type a nonsense string, e.g. `zzzxxxqqq`.
- Expected: the results list shows "No fonts found".

- [ ] **Step 6: Verify a multi-word font name round-trips correctly**

- Search for `plus jakarta` and click "Plus Jakarta Sans".
- Expected: the page applies the font correctly (confirms the existing space-to-`+` URL encoding in `applyFont()` still works for catalog-sourced names, not just the old hardcoded list).

No commit for this task — it's verification only. If any step fails, fix the relevant file from Tasks 1-3 and re-run this task's steps before considering the plan complete.
