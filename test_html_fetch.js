const https = require('https');

function fetchPage(url) {
    return new Promise((resolve) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        }).on('error', err => resolve({ error: err.message }));
    });
}

async function test() {
    console.log("=== FETCHING HOMEPAGE HTML ===");
    let h1 = await fetchPage('https://mangafire.to/home');
    console.log("Status:", h1.status, "HTML Length:", h1.data.length);
    console.log("Preview:", h1.data.substring(0, 300));

    console.log("=== FETCHING FILTER/SEARCH HTML ===");
    let h2 = await fetchPage('https://mangafire.to/filter?keyword=naruto');
    console.log("Status:", h2.status, "HTML Length:", h2.data.length);
    console.log("Preview:", h2.data.substring(0, 300));

    console.log("=== FETCHING MANGA DETAILS HTML ===");
    let h3 = await fetchPage('https://mangafire.to/manga/naruto.92kk8');
    console.log("Status:", h3.status, "HTML Length:", h3.data.length);
    console.log("Preview:", h3.data.substring(0, 300));
}

test();
