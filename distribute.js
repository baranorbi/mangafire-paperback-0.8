const fs = require('fs');
const path = require('path');

const VERSION = "1.0.16";
const cleanCode = fs.readFileSync('MangaFire/index.js', 'utf8');

const filesToUpdate = [
    'mangafire.js',
    'MangaFire.js',
    
    'mangafire/source.js',
    'mangafire/index.js',
    `mangafire/${VERSION}/source.js`,
    `mangafire/${VERSION}/index.js`,
    `mangafire/v${VERSION}/source.js`,
    `mangafire/v${VERSION}/index.js`,
    
    'MangaFire/source.js',
    'MangaFire/index.js',
    `MangaFire/${VERSION}/source.js`,
    `MangaFire/${VERSION}/index.js`,
    `MangaFire/v${VERSION}/source.js`,
    `MangaFire/v${VERSION}/index.js`,
    
    'bundles/mangafire/source.js',
    'bundles/mangafire/index.js',
    `bundles/mangafire/${VERSION}/source.js`,
    `bundles/mangafire/${VERSION}/index.js`,
    `bundles/mangafire/v${VERSION}/source.js`,
    `bundles/mangafire/v${VERSION}/index.js`,
    
    'bundles/MangaFire/source.js',
    'bundles/MangaFire/index.js',
    `bundles/MangaFire/${VERSION}/source.js`,
    `bundles/MangaFire/${VERSION}/index.js`,
    `bundles/MangaFire/v${VERSION}/source.js`,
    `bundles/MangaFire/v${VERSION}/index.js`
];

for (const f of filesToUpdate) {
    const dir = path.dirname(f);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(f, cleanCode);
}

// Copy icon
const iconFiles = [
    'MangaFire/icon.png',
    'mangafire/icon.png',
    'bundles/MangaFire/icon.png',
    'bundles/mangafire/icon.png',
    `mangafire/${VERSION}/icon.png`,
    `MangaFire/${VERSION}/icon.png`,
    `bundles/MangaFire/${VERSION}/icon.png`,
    `bundles/mangafire/${VERSION}/icon.png`
];
const iconData = fs.readFileSync('src/MangaFire/icon.png');
for (const f of iconFiles) {
    const dir = path.dirname(f);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(f, iconData);
}

console.log('Distributed bundles across all possible Paperback legacy paths.');
