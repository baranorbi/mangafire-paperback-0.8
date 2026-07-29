const fs = require('fs');
const vm = require('vm');

const polyfillCode = fs.readFileSync('mangafire/polyfill.js', 'utf8').replace(/export\s*\{[^}]*\};?/g, '');

const sandbox = {
    setTimeout: () => 0, clearTimeout: () => {},
    setInterval: () => 0, clearInterval: () => {},
    console: console,
    navigator: { appCodeName: 'Mozilla', userAgent: 'Mozilla/5.0' }
};

const context = vm.createContext(sandbox);

const code = `
var window = globalThis;
var self = globalThis;
var global = globalThis;
var __config = "XRiqHvYHPlx1ySdFkwsKlcW8THf45jHdInyp-IvPerjW16Ji2F43iB6VjIvpdYjGnCxdXnjvU5Xqem6XqnjVuTmE_vsn9i50rZRu0l6rxBuc1832D4NfjS9LfBtpPFw12w";
var __build = "8aa2af0dc56f9a6a14c239613372a274";

var mockElem = {
    appendChild: function() { return mockElem; }, removeChild: function() { return mockElem; }, insertBefore: function() { return mockElem; },
    setAttribute: function() {}, getAttribute: function() { return ''; }, removeAttribute: function() {},
    addEventListener: function() {}, removeEventListener: function() {},
    getBoundingClientRect: function() { return { top: 0, left: 0, width: 100, height: 100, right: 100, bottom: 100 }; },
    style: {}, getContext: function() { return { fillText: function() {}, measureText: function() { return { width: 10 }; }, getImageData: function() { return { data: [0,0,0,0] }; } }; },
    toDataURL: function() { return ''; }
};

var document = {
    createElement: function() { return mockElem; }, getElementsByTagName: function() { return [mockElem]; },
    querySelector: function() { return mockElem; }, querySelectorAll: function() { return []; },
    head: mockElem, body: mockElem, cookie: '', title: 'MangaFire', referrer: 'https://mangafire.to/'
};

var location = { href: 'https://mangafire.to/filter', origin: 'https://mangafire.to', protocol: 'https:', host: 'mangafire.to', hostname: 'mangafire.to', port: '', pathname: '/filter', search: '', hash: '' };

try { ${polyfillCode} } catch(e) {}

console.log("enc[0] code:", globalThis.enc[0].toString());
console.log("enc[2] code:", globalThis.enc[2].toString());
`;

vm.runInContext(code, context);
