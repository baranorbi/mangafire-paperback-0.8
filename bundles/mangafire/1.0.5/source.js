(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
    let trimmed = Number((/\d*/.exec(timeAgo) ?? [])[0]);
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
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': `${BASE_URL}/`
};

exports.mangafireInfo = {
    version: '1.0.5',
    name: 'MangaFire',
    icon: 'icon.png',
    author: 'nahamah',
    authorWebsite: 'https://github.com/baranorbi',
    description: 'MangaFire v1.0.5 (REST API) by nahamah',
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

    async getCloudflareBypassRequestAsync() {
        return App.createRequest({
            url: `${BASE_URL}/home`,
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
            let url = `${BASE_URL}/api/top-titles`;
            if (section.id === 'recently_updated') url = `${BASE_URL}/api/titles?page=1`;
            if (section.id === 'new_releases') url = `${BASE_URL}/api/titles?page=2`;

            try {
                const request = App.createRequest({
                    url: url,
                    method: 'GET',
                    headers: {
                        ...DEFAULT_HEADERS,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const response = await this.requestManager.schedule(request, 1);
                const json = this.parseJsonResponse(response.data);
                if (json && Array.isArray(json.items)) {
                    section.items = this.parseApiMangaList(json.items);
                }
                sectionCallback(section);
            } catch (error) {
                console.log(`Failed to load section ${section.id}:`, error);
            }
        });

        await Promise.all(promises);
    }

    async getViewMoreItems(homepageSectionId, metadata) {
        const page = metadata?.page ?? 1;
        let url = `${BASE_URL}/api/titles?page=${page}`;
        if (homepageSectionId === 'trending') url = `${BASE_URL}/api/top-titles`;
        if (homepageSectionId === 'new_releases') url = `${BASE_URL}/api/titles?page=${page + 1}`;

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: {
                ...DEFAULT_HEADERS,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
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
        const url = `${BASE_URL}/api/titles?keyword=${encodeURIComponent(keyword)}&page=${page}`;

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: {
                ...DEFAULT_HEADERS,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
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
        const cleanId = mangaId.replace(/^\/manga\//, '').replace(/^\/title\//, '');
        const url = `${BASE_URL}/api/titles/${cleanId}`;

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: {
                ...DEFAULT_HEADERS,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
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
        const cleanId = mangaId.replace(/^\/manga\//, '').replace(/^\/title\//, '');
        const API_HEADERS = {
            ...DEFAULT_HEADERS,
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        let langParam = '&language=en';
        let url = `${BASE_URL}/api/titles/${cleanId}/chapters?limit=100&page=1${langParam}`;
        let request = App.createRequest({
            url: url,
            method: 'GET',
            headers: API_HEADERS
        });

        let response = await this.requestManager.schedule(request, 1);
        let json = this.parseJsonResponse(response.data);
        let items = Array.isArray(json?.items) ? [...json.items] : [];

        if (items.length === 0) {
            langParam = '';
            url = `${BASE_URL}/api/titles/${cleanId}/chapters?limit=100&page=1`;
            request = App.createRequest({
                url: url,
                method: 'GET',
                headers: API_HEADERS
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
                const pageUrl = `${BASE_URL}/api/titles/${cleanId}/chapters?limit=100&page=${p}${langParam}`;
                const pageReq = App.createRequest({
                    url: pageUrl,
                    method: 'GET',
                    headers: API_HEADERS
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
                name: item.name || `Chapter ${chapNum}`,
                chapNum: chapNum,
                langCode: item.language || 'en',
            });
        });

        return chapters;
    }

    async getChapterDetails(mangaId, chapterId) {
        const url = `${BASE_URL}/api/chapters/${chapterId}`;

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: {
                ...DEFAULT_HEADERS,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
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

},{"@paperback/types":8}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Source_1 = require("./Source");
const SourceIntents_1 = require("./SourceIntents");
const BadgeColor_1 = require("./BadgeColor");
const HomeSectionType_1 = require("./HomeSectionType");
exports.Source = Source_1.Source;
exports.convertTime = Source_1.convertTime;
exports.urlEncodeObject = Source_1.urlEncodeObject;
exports.SourceIntents = SourceIntents_1.SourceIntents;
exports.ContentRating = SourceIntents_1.ContentRating;
exports.BadgeColor = BadgeColor_1.BadgeColor;
exports.HomeSectionType = HomeSectionType_1.HomeSectionType;

},{"./Source":5,"./SourceIntents":6,"./BadgeColor":1,"./HomeSectionType":3}]},{},[7])(7)
});
