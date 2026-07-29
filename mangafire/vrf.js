const fs = require('fs');
const path = require('path');

// Always override navigator in Node environment to ensure appCodeName is present
delete globalThis.navigator;
globalThis.navigator = {
    appCodeName: 'Mozilla',
    appName: 'Netscape',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    platform: 'Win32',
    vendor: 'Google Inc.',
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
    cookieEnabled: true,
    hardwareConcurrency: 8,
    deviceMemory: 8,
    maxTouchPoints: 0
};

globalThis.window = globalThis;
globalThis.self = globalThis;

if (typeof globalThis.performance === 'undefined') {
    try {
        globalThis.performance = require('perf_hooks').performance;
    } catch(e) {}
}

if (typeof globalThis.crypto === 'undefined') {
    try {
        globalThis.crypto = require('crypto').webcrypto;
    } catch(e) {}
}

if (typeof globalThis.document === 'undefined') {
    const mockElem = {
        appendChild: () => mockElem,
        removeChild: () => mockElem,
        setAttribute: () => {},
        getAttribute: () => null,
        style: {},
        getContext: () => ({ fillText: () => {}, measureText: () => ({ width: 10 }) })
    };
    globalThis.document = {
        createElement: () => mockElem,
        getElementsByTagName: () => [mockElem],
        querySelector: () => mockElem,
        querySelectorAll: () => [],
        head: mockElem,
        body: mockElem,
        cookie: '',
        title: 'MangaFire',
        referrer: 'https://mangafire.to/'
    };
}

if (typeof globalThis.location === 'undefined') {
    globalThis.location = {
        href: 'https://mangafire.to/filter',
        origin: 'https://mangafire.to',
        protocol: 'https:',
        host: 'mangafire.to',
        hostname: 'mangafire.to',
        port: '',
        pathname: '/filter',
        search: '',
        hash: ''
    };
}

if (!globalThis.__config) {
    globalThis.__config = "XRiqHvYHPlx1ySdFkwsKlcW8THf45jHdInyp-IvPerjW16Ji2F43iB6VjIvpdYjGnCxdXnjvU5Xqem6XqnjVuTmE_vsn9i50rZRu0l6rxBuc1832D4NfjS9LfBtpPFw12w";
}
if (!globalThis.__build) {
    globalThis.__build = "8aa2af0dc56f9a6a14c239613372a274";
}

let requestInterceptor = null;

function initPolyfill() {
    if (requestInterceptor) return;

    const possiblePaths = [
        path.join(__dirname, 'polyfill.js'),
        path.join(__dirname, '../polyfill.js'),
        path.join(process.cwd(), 'polyfill.js'),
        path.join(process.cwd(), 'mangafire/polyfill.js')
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            try {
                let code = fs.readFileSync(p, 'utf8');
                code = code.replace(/export\s*\{[^}]*\};?/g, '');
                (0, eval)(code);
                break;
            } catch(e) {
                // Ignore non-fatal initialization errors
            }
        }
    }

    if (typeof globalThis.extendClient === 'function') {
        const fakeAxios = {
            defaults: { headers: { common: {} } },
            interceptors: {
                request: { use: (fn) => { requestInterceptor = fn; } },
                response: { use: () => {} }
            }
        };
        try {
            globalThis.extendClient(fakeAxios);
        } catch(e) {}
    }
}

initPolyfill();

function getVrfToken(url, params = {}) {
    initPolyfill();
    if (requestInterceptor) {
        try {
            const modified = requestInterceptor({ url, method: 'get', params });
            if (modified && modified.params && modified.params.vrf) {
                return modified.params.vrf;
            }
        } catch(e) {}
    }
    if (typeof globalThis.getProtectionToken === 'function') {
        try {
            return globalThis.getProtectionToken(url, params);
        } catch(e) {}
    }
    return '';
}

module.exports = {
    getVrfToken
};
