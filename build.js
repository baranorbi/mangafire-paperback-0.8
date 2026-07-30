const fs = require('fs');
const path = require('path');

const VERSION = "1.0.13";
console.log(`=== BUILDING MANGAFIRE EXTENSION v${VERSION} FOR PAPERBACK 0.8 ===`);

const cleanCode = fs.readFileSync('source_code.js', 'utf8');

const filesToUpdate = [
    'mangafire.js',
    'mangafire/source.js',
    'bundles/mangafire/source.js',
    `bundles/mangafire/${VERSION}/source.js`
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
      "file": "mangafire.js",
      "version": "${VERSION}"
    }
  ]
};
`;
fs.writeFileSync('index.js', indexJs);

const indexJson = {
  "name": "MangaFire.to (0.8)",
  "sources": [
    {
      "id": "mangafire",
      "name": "MangaFire",
      "file": "mangafire.js",
      "version": VERSION,
      "icon": "icon.png"
    }
  ]
};
fs.writeFileSync('index.json', JSON.stringify(indexJson, null, 4));

const versioning = {
    "buildTime": new Date().toISOString(),
    "sources": [
        {
            "id": "mangafire",
            "name": "MangaFire",
            "author": "nahamah",
            "desc": "Ported from Inkdex General Extensions for Paperback 0.8",
            "website": "https://mangafire.to",
            "contentRating": "MATURE",
            "version": VERSION,
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

console.log(`Successfully built clean mangafire extension v${VERSION}!`);
