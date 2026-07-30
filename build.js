const fs = require('fs');
const path = require('path');

console.log("=== BUILDING MANGAFIRE EXTENSION v1.0.12 (CLEAN RAW JS FOR PAPERBACK 0.8) ===");

// Read raw source_code.js directly (No Browserify IIFE wrapping, so native Source class prototype works)
const cleanCode = fs.readFileSync('source_code.js', 'utf8');

const filesToUpdate = [
    'mangafire.js',
    'mangafire/source.js',
    'bundles/mangafire/source.js',
    'bundles/mangafire/1.0.12/source.js'
];

for (const f of filesToUpdate) {
    const dir = path.dirname(f);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(f, cleanCode);
}

const indexJs = `module.exports = {
  "name": "MangaFire.to (0.8)",
  "sources": [
    {
      "id": "mangafire",
      "name": "MangaFire",
      "file": "mangafire.js"
    }
  ]
};
`;
fs.writeFileSync('index.js', indexJs);

const versioning = {
    "buildTime": new Date().toISOString(),
    "sources": [
        {
            "id": "mangafire",
            "name": "MangaFire",
            "author": "nahamah",
            "desc": "HTML Scraper for MangaFire v1.0.12",
            "website": "https://mangafire.to",
            "contentRating": "MATURE",
            "version": "1.0.12",
            "icon": "icon.png",
            "tags": [],
            "websiteBaseURL": "https://mangafire.to",
            "intents": 21
        }
    ],
    "builtWith": {
        "toolchain": "0.8.0-alpha.47",
        "types": "0.8.0-alpha.47"
    }
};
fs.writeFileSync('versioning.json', JSON.stringify(versioning, null, 4));

console.log("Successfully built clean mangafire extension v1.0.12!");
