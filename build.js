const fs = require('fs');
const path = require('path');

console.log("=== BUILDING MANGAFIRE EXTENSION v1.0.10 ===");

// Load polyfill code
const polyfillCodeRaw = fs.readFileSync('mangafire/polyfill.js', 'utf8');
const polyfillCodeClean = polyfillCodeRaw.replace(/export\s*\{[^}]*\};?/g, '');

const sourceJsCode = `(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeColor = void 0;
var BadgeColor;
(function (BadgeColor) {
    BadgeColor["BLUE"] = "default";
    BadgeColor["GREEN"] = "success";
    BadgeColor["GREY"] = "info";
    BadgeColor["YELLOW"] = "warning";
    BadgeColor["RED"] = "danger";
})(BadgeColor = exports.BadgeColor || (exports.BadgeColor = {}));

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSectionType = void 0;
var HomeSectionType;
(function (HomeSectionType) {
    HomeSectionType["singleRowNormal"] = "singleRowNormal";
    HomeSectionType["singleRowLarge"] = "singleRowLarge";
    HomeSectionType["doubleRow"] = "doubleRow";
    HomeSectionType["featured"] = "featured";
})(HomeSectionType = exports.HomeSectionType || (exports.HomeSectionType = {}));

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlEncodeObject = exports.convertTime = exports.Source = void 0;
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    searchRequest(query, metadata) {
        return this.getSearchResults(query, metadata);
    }
    async getTags() {
        return this.getSearchTags?.();
    }
}
exports.Source = Source;
function convertTime(timeAgo) {
    let time;
    let trimmed = Number((/\\d*/.exec(timeAgo) ?? [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('minutes')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('hours')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('days')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('year') || timeAgo.includes('years')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        time = new Date(Date.now());
    }
    return time;
}
exports.convertTime = convertTime;
function urlEncodeObject(obj) {
    let ret = {};
    for (const entry of Object.entries(obj)) {
        ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
    }
    return ret;
}
exports.urlEncodeObject = urlEncodeObject;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRating = exports.SourceIntents = void 0;
var SourceIntents;
(function (SourceIntents) {
    SourceIntents[SourceIntents["MANGA_CHAPTERS"] = 1] = "MANGA_CHAPTERS";
    SourceIntents[SourceIntents["MANGA_TRACKING"] = 2] = "MANGA_TRACKING";
    SourceIntents[SourceIntents["HOMEPAGE_SECTIONS"] = 4] = "HOMEPAGE_SECTIONS";
    SourceIntents[SourceIntents["COLLECTION_MANAGEMENT"] = 8] = "COLLECTION_MANAGEMENT";
    SourceIntents[SourceIntents["CLOUDFLARE_BYPASS_REQUIRED"] = 16] = "CLOUDFLARE_BYPASS_REQUIRED";
    SourceIntents[SourceIntents["SETTINGS_UI"] = 32] = "SETTINGS_UI";
})(SourceIntents = exports.SourceIntents || (exports.SourceIntents = {}));
var ContentRating;
(function (ContentRating) {
    ContentRating["EVERYONE"] = "EVERYONE";
    ContentRating["MATURE"] = "MATURE";
    ContentRating["ADULT"] = "ADULT";
})(ContentRating = exports.ContentRating || (exports.ContentRating = {}));

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mangafire = exports.mangafireInfo = void 0;
const types_1 = require("@paperback/types");

const BASE_URL = "https://mangafire.to";

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': \`\${BASE_URL}/\`
};

// --- SAFE EMBEDDED VRF GENERATOR v1.0.10 ---
(function() {
    var setTimeout = function() { return 0; };
    var clearTimeout = function() {};
    var setInterval = function() { return 0; };
    var clearInterval = function() {};

    var window = globalThis;
    var self = globalThis;
    var global = globalThis;

    if (typeof globalThis.atob === 'undefined') {
        var b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        globalThis.atob = function(input) {
            var str = String(input).replace(/=+$/, '');
            var output = '';
            if (str.length % 4 === 1) throw new Error("'atob' failed");
            for (var bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
                buffer = b64chars.indexOf(buffer);
            }
            return output;
        };
    }

    if (typeof globalThis.btoa === 'undefined') {
        var b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        globalThis.btoa = function(input) {
            var str = String(input);
            var output = '';
            for (var block, charCode, idx = 0, map = b64chars; str.charAt(idx += 3/4); output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
                charCode = str.charCodeAt(idx);
                if (charCode > 255) throw new Error("'btoa' failed");
                block = block << 8 | charCode;
            }
            return output;
        };
    }

    if (typeof globalThis.TextEncoder === 'undefined') {
        globalThis.TextEncoder = function() {};
        globalThis.TextEncoder.prototype.encode = function(str) {
            var buf = new Uint8Array(str.length);
            for (var i = 0; i < str.length; i++) {
                buf[i] = str.charCodeAt(i) & 0xff;
            }
            return buf;
        };
    }

    if (typeof globalThis.TextDecoder === 'undefined') {
        globalThis.TextDecoder = function() {};
        globalThis.TextDecoder.prototype.decode = function(arr) {
            return String.fromCharCode.apply(null, arr);
        };
    }

    var mockElem = {
        appendChild: function() { return mockElem; },
        removeChild: function() { return mockElem; },
        insertBefore: function() { return mockElem; },
        setAttribute: function() {},
        getAttribute: function() { return ''; },
        removeAttribute: function() {},
        addEventListener: function() {},
        removeEventListener: function() {},
        getBoundingClientRect: function() { return { top: 0, left: 0, width: 100, height: 100, right: 100, bottom: 100 }; },
        style: {},
        getContext: function() { return { fillText: function() {}, measureText: function() { return { width: 10 }; }, getImageData: function() { return { data: [0,0,0,0] }; } }; },
        toDataURL: function() { return ''; },
        click: function() {},
        focus: function() {},
        blur: function() {}
    };

    var document = {
        createElement: function() { return mockElem; },
        getElementsByTagName: function() { return [mockElem]; },
        querySelector: function() { return mockElem; },
        querySelectorAll: function() { return []; },
        head: mockElem,
        body: mockElem,
        cookie: '',
        title: 'MangaFire',
        referrer: 'https://mangafire.to/'
    };

    var location = {
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

    var navigator = {
        appCodeName: 'Mozilla',
        appName: 'Netscape',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        platform: 'Win32',
        vendor: 'Google Inc.',
        language: 'en-US'
    };

    var __config = "XRiqHvYHPlx1ySdFkwsKlcW8THf45jHdInyp-IvPerjW16Ji2F43iB6VjIvpdYjGnCxdXnjvU5Xqem6XqnjVuTmE_vsn9i50rZRu0l6rxBuc1832D4NfjS9LfBtpPFw12w";
    var __build = "8aa2af0dc56f9a6a14c239613372a274";

    if (typeof globalThis.extendClient !== 'function') {
        try {
            ${polyfillCodeClean}
        } catch(e) {}
    }

    var requestInterceptor = null;
    if (typeof globalThis.extendClient === 'function') {
        var fakeAxios = {
            defaults: { headers: { common: {} } },
            interceptors: {
                request: { use: function(fn) { requestInterceptor = fn; } },
                response: { use: function() {} }
            }
        };
        try {
            globalThis.extendClient(fakeAxios);
        } catch(e) {}
    }

    globalThis._getMangaFireVrf = function(urlPath, params) {
        params = params || {};
        if (requestInterceptor) {
            try {
                var modified = requestInterceptor({ url: urlPath, method: 'get', params: params });
                if (modified && modified.params && modified.params.vrf) {
                    return modified.params.vrf;
                }
            } catch(e) {}
        }
        if (typeof globalThis.getProtectionToken === 'function') {
            try {
                return globalThis.getProtectionToken(urlPath, params);
            } catch(e) {}
        }
        return '';
    };
})();

exports.mangafireInfo = {
    version: '1.0.10',
    name: 'MangaFire',
    icon: 'icon.png',
    author: 'nahamah',
    authorWebsite: 'https://github.com/baranorbi',
    description: 'MangaFire v1.0.10 (VRF API) by nahamah',
    contentRating: types_1.ContentRating.MATURE,
    websiteBaseURL: BASE_URL,
    sourceTags: [],
    intents: types_1.SourceIntents.MANGA_CHAPTERS | types_1.SourceIntents.HOMEPAGE_SECTIONS | types_1.SourceIntents.CLOUDFLARE_BYPASS_REQUIRED
};

class MangaFire extends types_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = App.createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 30000,
        });
    }

    getVrfUrl(path, params) {
        params = params || {};
        var vrf = '';
        if (typeof globalThis._getMangaFireVrf === 'function') {
            try {
                vrf = globalThis._getMangaFireVrf(path, params);
            } catch(e) {}
        }
        var queryParts = [];
        for (var key in params) {
            if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
                queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
            }
        }
        if (vrf) {
            queryParts.push('vrf=' + encodeURIComponent(vrf));
        }
        var queryString = queryParts.join('&');
        var apiPath = path.indexOf('/api') === 0 ? path : ('/api' + path);
        return BASE_URL + apiPath + (queryString ? ('?' + queryString) : '');
    }

    async getCloudflareBypassRequestAsync() {
        return App.createRequest({
            url: \`\${BASE_URL}/home\`,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
    }

    async supportsSearchOperators() {
        return false;
    }

    async supportsTagExclusion() {
        return false;
    }

    parseJsonResponse(data) {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (error) {
                return null;
            }
        }
        return data || null;
    }

    parseApiMangaList(items) {
        if (!Array.isArray(items)) return [];
        return items.map(item => {
            const id = item.hid || String(item.id || "");
            const title = item.title || id;
            const image = item.poster?.large || item.poster?.medium || item.poster?.small || "";
            return App.createPartialSourceManga({
                mangaId: id,
                title: title,
                image: image,
                subtitle: item.type ? item.type.toUpperCase() : undefined
            });
        }).filter(m => m.mangaId && m.title);
    }

    async getHomePageSections(sectionCallback) {
        const sections = [
            App.createHomeSection({
                id: 'trending',
                title: 'Trending Manga',
                items: [],
                containsMoreItems: true,
                type: 'singleRowNormal'
            }),
            App.createHomeSection({
                id: 'recently_updated',
                title: 'Recently Updated',
                items: [],
                containsMoreItems: true,
                type: 'singleRowNormal'
            }),
            App.createHomeSection({
                id: 'new_releases',
                title: 'New Releases',
                items: [],
                containsMoreItems: true,
                type: 'singleRowNormal'
            })
        ];

        for (const section of sections) {
            sectionCallback(section);
        }

        const promises = sections.map(async (section) => {
            let url = this.getVrfUrl('/top-titles');
            if (section.id === 'recently_updated') url = this.getVrfUrl('/titles', { page: 1 });
            if (section.id === 'new_releases') url = this.getVrfUrl('/titles', { page: 2 });

            try {
                const request = App.createRequest({
                    url: url,
                    method: 'GET',
                    headers: DEFAULT_HEADERS
                });
                const response = await this.requestManager.schedule(request, 1);
                const json = this.parseJsonResponse(response.data);
                if (json && Array.isArray(json.items)) {
                    section.items = this.parseApiMangaList(json.items);
                }
                sectionCallback(section);
            } catch (error) {
                console.log(\`Failed to load section \${section.id}:\`, error);
            }
        });

        await Promise.all(promises);
    }

    async getViewMoreItems(homepageSectionId, metadata) {
        const page = metadata?.page ?? 1;
        let url = this.getVrfUrl('/titles', { page: page });
        if (homepageSectionId === 'trending') url = this.getVrfUrl('/top-titles');
        if (homepageSectionId === 'new_releases') url = this.getVrfUrl('/titles', { page: page + 1 });

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });

        const response = await this.requestManager.schedule(request, 1);
        const json = this.parseJsonResponse(response.data);
        const mangas = json && Array.isArray(json.items) ? this.parseApiMangaList(json.items) : [];

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    async getSearchResults(query, metadata) {
        const page = metadata?.page ?? 1;
        const keyword = query.title || "";
        const params = { page: page };
        if (keyword) params.keyword = keyword;

        const url = this.getVrfUrl('/titles', params);

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });

        const response = await this.requestManager.schedule(request, 1);
        const json = this.parseJsonResponse(response.data);
        const mangas = json && Array.isArray(json.items) ? this.parseApiMangaList(json.items) : [];

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    async getMangaDetails(mangaId) {
        const cleanId = mangaId.replace(/^\\/manga\\//, '').replace(/^\\/title\\//, '');
        const url = this.getVrfUrl('/titles/' + cleanId);

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });

        const response = await this.requestManager.schedule(request, 1);
        const json = this.parseJsonResponse(response.data);
        const data = json?.data || {};

        let status = 'ONGOING';
        const rawStatus = (data.status || '').toLowerCase();
        if (rawStatus.includes('finished') || rawStatus.includes('completed')) status = 'COMPLETED';

        return App.createSourceManga({
            id: mangaId,
            mangaInfo: App.createMangaInfo({
                titles: [data.title || cleanId],
                image: data.poster?.large || data.poster?.medium || data.poster?.small || "",
                status: status,
                author: data.authors?.[0]?.title || "Unknown",
                artist: data.artists?.[0]?.title || "Unknown",
                desc: (data.synopsisHtml || "").replace(/<[^>]*>/g, '').trim(),
            })
        });
    }

    async getChapters(mangaId) {
        const cleanId = mangaId.replace(/^\\/manga\\//, '').replace(/^\\/title\\//, '');

        let langParam = 'en';
        let page1Params = { limit: 100, page: 1, language: langParam };
        let url = this.getVrfUrl('/titles/' + cleanId + '/chapters', page1Params);
        let request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });

        let response = await this.requestManager.schedule(request, 1);
        let json = this.parseJsonResponse(response.data);
        let items = Array.isArray(json?.items) ? [...json.items] : [];

        if (items.length === 0) {
            langParam = '';
            page1Params = { limit: 100, page: 1 };
            url = this.getVrfUrl('/titles/' + cleanId + '/chapters', page1Params);
            request = App.createRequest({
                url: url,
                method: 'GET',
                headers: DEFAULT_HEADERS
            });
            response = await this.requestManager.schedule(request, 1);
            json = this.parseJsonResponse(response.data);
            items = Array.isArray(json?.items) ? [...json.items] : [];
        }

        const lastPage = json?.meta?.lastPage || 1;
        if (lastPage > 1) {
            const maxPage = Math.min(lastPage, 25);
            const pagePromises = [];
            for (let p = 2; p <= maxPage; p++) {
                const pParams = { limit: 100, page: p };
                if (langParam) pParams.language = langParam;
                const pageUrl = this.getVrfUrl('/titles/' + cleanId + '/chapters', pParams);
                const pageReq = App.createRequest({
                    url: pageUrl,
                    method: 'GET',
                    headers: DEFAULT_HEADERS
                });
                pagePromises.push(
                    this.requestManager.schedule(pageReq, 1)
                        .then(res => {
                            const pageJson = this.parseJsonResponse(res.data);
                            return Array.isArray(pageJson?.items) ? pageJson.items : [];
                        })
                        .catch(() => [])
                );
            }
            const restPages = await Promise.all(pagePromises);
            for (const pageItems of restPages) {
                items.push(...pageItems);
            }
        }

        const chapters = items.map(item => {
            const chapNum = Number(item.number) || 0;
            return App.createChapter({
                id: String(item.id),
                name: item.name || \`Chapter \${chapNum}\`,
                chapNum: chapNum,
                langCode: item.language || 'en',
            });
        });

        return chapters;
    }

    async getChapterDetails(mangaId, chapterId) {
        const url = this.getVrfUrl('/chapters/' + chapterId);

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });

        const response = await this.requestManager.schedule(request, 1);
        const json = this.parseJsonResponse(response.data);
        const pages = Array.isArray(json?.data?.pages)
            ? json.data.pages.map(p => p.url).filter(Boolean)
            : [];

        return App.createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pages,
        });
    }
}
exports.mangafire = MangaFire;

},{}]},{},[7])(7)
});`;

// Write to all source file locations in root and bundles
const filesToUpdate = [
    'mangafire/source.js',
    'mangafire/mangafire.js',
    'mangafire/includes.js',
    'bundles/mangafire/source.js',
    'bundles/mangafire/mangafire.js',
    'bundles/mangafire/includes.js'
];

for (const f of filesToUpdate) {
    fs.writeFileSync(f, sourceJsCode);
}

// Create version specific directories
const versions = ['1.0.1', '1.0.2', '1.0.3', '1.0.4', '1.0.5', '1.0.6', '1.0.7', '1.0.8', '1.0.9', '1.0.10'];
for (const v of versions) {
    const dir = path.join('bundles/mangafire', v);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'source.js'), sourceJsCode);
    fs.writeFileSync(path.join(dir, 'mangafire.js'), sourceJsCode);
    fs.writeFileSync(path.join(dir, 'includes.js'), sourceJsCode);
}

console.log("Successfully built mangafire extension v1.0.10 across ALL bundle entry points!");
