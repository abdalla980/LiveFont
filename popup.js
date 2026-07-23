document.getElementById('applyBtn').addEventListener('click', async () => {
    const font = document.getElementById('fontSelect').value;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (selectedFont) => {
            // 1. Fetch font dynamically from Google Fonts API
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.replace(/ /g, '+')}:wght@400;700&display=swap`;
            document.head.appendChild(link);

            // 2. Override text styling on the page
            const style = document.createElement('style');
            style.innerHTML = `* { font-family: '${selectedFont}', sans-serif !important; }`;
            document.head.appendChild(style);
        },
        args: [font]
    });
});