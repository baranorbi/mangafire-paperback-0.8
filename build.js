const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("=== BUILDING MANGAFIRE EXTENSION v1.0.12 (HTML SCRAPING / CLOUDFLARE BYPASS) ===");

const tempBundlePath = path.join(__dirname, 'temp_bundle.js');
try {
    execSync(`npx browserify source_code.js -s Sources -o "${tempBundlePath}"`, { stdio: 'inherit' });
} catch (e) {
    console.error("Browserify bundling failed, falling back to raw source_code.js", e);
}

const bundledCode = fs.existsSync(tempBundlePath) 
    ? fs.readFileSync(tempBundlePath, 'utf8') 
    : fs.readFileSync('source_code.js', 'utf8');

if (fs.existsSync(tempBundlePath)) {
    fs.unlinkSync(tempBundlePath);
}

const filesToUpdate = [
    'mangafire/source.js',
    'bundles/mangafire/source.js',
    'bundles/mangafire/1.0.12/source.js'
];

for (const f of filesToUpdate) {
    const dir = path.dirname(f);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(f, bundledCode);
}

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

console.log("Successfully built mangafire extension v1.0.12!");
