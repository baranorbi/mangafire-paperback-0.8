const fs = require('fs');
const path = require('path');

console.log("=== BUILDING MANGAFIRE EXTENSION v1.0.12 (HTML SCRAPING / CLOUDFLARE BYPASS) ===");

const sourceJsCode = fs.readFileSync('source_code.js', 'utf8');

const filesToUpdate = [
    'mangafire/source.js',
    'mangafire/mangafire.js',
    'mangafire/includes.js',
    'bundles/mangafire/source.js',
    'bundles/mangafire/mangafire.js',
    'bundles/mangafire/includes.js'
];

for (const f of filesToUpdate) {
    if (fs.existsSync(f)) {
        fs.writeFileSync(f, sourceJsCode);
    }
}

const versions = ['1.0.1', '1.0.2', '1.0.3', '1.0.4', '1.0.5', '1.0.6', '1.0.7', '1.0.8', '1.0.9', '1.0.10', '1.0.11', '1.0.12'];
for (const v of versions) {
    const dir = path.join('bundles/mangafire', v);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'source.js'), sourceJsCode);
    fs.writeFileSync(path.join(dir, 'mangafire.js'), sourceJsCode);
    fs.writeFileSync(path.join(dir, 'includes.js'), sourceJsCode);
}

const versioning = {
    "sources": [
        {
            "id": "mangafire",
            "name": "MangaFire",
            "author": "nahamah",
            "desc": "HTML Scraper for MangaFire v1.0.12",
            "website": "https://mangafire.to",
            "version": "1.0.12",
            "icon": "icon.png",
            "tags": []
        }
    ]
};
fs.writeFileSync('versioning.json', JSON.stringify(versioning, null, 4));

console.log("Successfully built mangafire extension v1.0.12!");
