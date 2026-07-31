const fs = require('fs');
const path = require('path');

const VERSION = "1.0.15";
console.log(`=== BUILDING MANGAFIRE EXTENSION v${VERSION} FOR PAPERBACK 0.8 ===`);

const cleanCode = fs.readFileSync('source_code.js', 'utf8');

// ── Write the source code to all expected locations ──
const filesToUpdate = [
    'mangafire.js',
    'mangafire/source.js',
    'mangafire/index.js',
    `mangafire/${VERSION}/source.js`,
    `mangafire/v${VERSION}/source.js`,
    'bundles/mangafire/source.js',
    'bundles/mangafire/index.js',
    `bundles/mangafire/${VERSION}/source.js`,
    `bundles/mangafire/${VERSION}/index.js`,
    `bundles/mangafire/v${VERSION}/source.js`,
    `bundles/mangafire/v${VERSION}/index.js`
];

for (const f of filesToUpdate) {
    const dir = path.dirname(f);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(f, cleanCode);
}

// ── index.js — simple repo index ──
const indexJs = `module.exports = {
  "name": "MangaFire.to (0.8)",
  "sources": [
    {
      "id": "mangafire",
      "name": "MangaFire",
      "file": "mangafire.js",
      "version": "${VERSION}"
    }
  ]
};
`;
fs.writeFileSync('index.js', indexJs);

// ── index.json — repo metadata ──
const indexJson = {
    "name": "MangaFire.to (0.8)",
    "description": "MangaFire custom source for Paperback 0.8",
    "icon": "https://github.com/baranorbi.png",
    "website": "https://mangafire.to",
    "sources": [
        {
            "id": "mangafire",
            "name": "MangaFire",
            "file": "mangafire.js",
            "author": "nahamah",
            "version": VERSION
        }
    ]
};
fs.writeFileSync('index.json', JSON.stringify(indexJson, null, 4));

// ── versioning.json — Paperback 0.8 format ──
// The app uses this to discover and update sources.
// Key fields: buildTime, sources[], builtWith
const versioning = {
    "buildTime": new Date().toISOString(),
    "sources": [
        {
            "id": "mangafire",
            "name": "MangaFire",
            "author": "nahamah",
            "desc": "MangaFire.to Extension for Paperback 0.8",
            "website": "https://mangafire.to",
            "contentRating": "MATURE",
            "version": VERSION,
            "icon": "icon.png",
            "tags": [],
            "websiteBaseURL": "https://mangafire.to",
            "intents": 0x17
        }
    ],
    "builtWith": {
        "toolchain": "0.8.0-alpha.47",
        "types": "0.8.0-alpha.47"
    }
};
fs.writeFileSync('versioning.json', JSON.stringify(versioning, null, 4));

// Copy icon to bundle directories
const iconDirs = [
    'mangafire',
    'bundles/mangafire'
];
for (const dir of iconDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, 'icon.png');
    if (fs.existsSync('icon.png') && !fs.existsSync(dest)) {
        try { fs.copyFileSync('icon.png', dest); } catch (e) {}
    }
}

console.log(`Successfully built MangaFire extension v${VERSION}!`);
console.log(`Files updated: ${filesToUpdate.length}`);
