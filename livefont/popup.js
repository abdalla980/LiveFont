const fontSelect = document.getElementById('fontSelect');
const fontSearch = document.getElementById('fontSearch');
const fontResults = document.getElementById('fontResults');

let allFonts = [];

// Function to inject font stylesheet and custom CSS rule
function applyFont(selectedFont) {
    if (!selectedFont) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab || !activeTab.id) return;

        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: (font) => {
                const fontId = `livefonty-font-${font.replace(/\s+/g, '-').toLowerCase()}`;

                // 1. Fetch Google Font stylesheet if not already added
                if (!document.getElementById(fontId)) {
                    const link = document.createElement('link');
                    link.id = fontId;
                    link.rel = 'stylesheet';
                    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;600;700&display=swap`;
                    document.head.appendChild(link);
                }

                // 2. Inject override CSS
                let styleTag = document.getElementById('livefonty-custom-style');
                if (!styleTag) {
                    styleTag = document.createElement('style');
                    styleTag.id = 'livefonty-custom-style';
                    document.head.appendChild(styleTag);
                }

                styleTag.innerHTML = `
          * {
            font-family: '${font}', sans-serif !important;
          }
        `;
            },
            args: [selectedFont]
        });
    });
}

// Automatically trigger on dropdown selection change
fontSelect.addEventListener('change', (e) => {
    applyFont(e.target.value);
});

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