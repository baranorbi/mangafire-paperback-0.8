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
    version: '1.0.2',
    name: 'MangaFire',
    icon: 'icon.png',
    author: 'nahamah',
    authorWebsite: 'https://github.com/baranorbi',
    description: 'MangaFire source for Paperback 0.8',
    contentRating: types_1.ContentRating.MATURE,
    websiteBaseURL: BASE_URL,
    sourceTags: [],
    intents: types_1.SourceIntents.MANGA_CHAPTERS | types_1.SourceIntents.HOMEPAGE_SECTIONS | types_1.SourceIntents.CLOUDFLARE_BYPASS_REQUIRED
};

class MangaFire extends types_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = App.createRequestManager({
            requestsPerSecond: 2,
            requestTimeout: 20000,
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

    parseMangaList($) {
        const mangas = [];
        const seenIds = new Set();

        $("div.unit, .manga-item, .card, .item, div.original.card-lg div.unit").each((_, element) => {
            const $el = $(element);
            const titleEl = $el.find("div.info > a, .detail .title a, a.title, h3 a, .name a").last();
            let title = titleEl.text().trim() || $el.find("a").attr("title") || $el.find("img").attr("alt") || "";
            const posterEl = $el.find("a.poster, a[href*='/manga/']").first();
            const href = posterEl.attr("href") || titleEl.attr("href") || "";

            const idMatch = href.match(/\/manga\/([^\/?#]+)/);
            const id = idMatch ? idMatch[1] : "";
            let image = $el.find("img").attr("src") || $el.find("img").attr("data-src") || "";

            if (id && !seenIds.has(id)) {
                if (!title) title = id.replace(/-/g, " ");
                seenIds.add(id);
                mangas.push(App.createPartialSourceManga({
                    mangaId: id,
                    title: title,
                    image: image,
                }));
            }
        });

        if (mangas.length === 0) {
            $("a[href*='/manga/']").each((_, element) => {
                const $a = $(element);
                const href = $a.attr("href") || "";
                const idMatch = href.match(/\/manga\/([^\/?#]+)/);
                const id = idMatch ? idMatch[1] : "";
                if (id && !seenIds.has(id)) {
                    const $container = $a.closest(".unit, .item, .card, div") || $a;
                    let title = $a.attr("title") || $container.find("a").text().trim() || $container.find("img").attr("alt") || id.replace(/-/g, " ");
                    let image = $container.find("img").attr("src") || $container.find("img").attr("data-src") || "";
                    if (title && id) {
                        seenIds.add(id);
                        mangas.push(App.createPartialSourceManga({
                            mangaId: id,
                            title: title,
                            image: image,
                        }));
                    }
                }
            });
        }

        return mangas;
    }

    async getHomePageSections(sectionCallback) {
        const sections = [
            App.createHomeSection({
                id: 'trending',
                title: 'Trending Manga',
                containsMoreItems: true,
                type: 'singleRowNormal'
            }),
            App.createHomeSection({
                id: 'recently_updated',
                title: 'Recently Updated',
                containsMoreItems: true,
                type: 'singleRowNormal'
            }),
            App.createHomeSection({
                id: 'new_releases',
                title: 'New Releases',
                containsMoreItems: true,
                type: 'singleRowNormal'
            })
        ];

        for (const section of sections) {
            sectionCallback(section);
        }

        const promises = sections.map(async (section) => {
            let url = `${BASE_URL}/filter?sort=trending`;
            if (section.id === 'recently_updated') url = `${BASE_URL}/filter?sort=recently_updated`;
            if (section.id === 'new_releases') url = `${BASE_URL}/filter?sort=release_date`;

            try {
                const request = App.createRequest({
                    url: url,
                    method: 'GET',
                    headers: DEFAULT_HEADERS
                });
                const response = await this.requestManager.schedule(request, 1);
                const $ = this.cheerio.load(response.data);
                section.items = this.parseMangaList($);
                sectionCallback(section);
            } catch (error) {
                console.log(`Failed to load section ${section.id}:`, error);
            }
        });

        await Promise.all(promises);
    }

    async getViewMoreItems(homepageSectionId, metadata) {
        const page = metadata?.page ?? 1;
        let sort = 'trending';
        if (homepageSectionId === 'recently_updated') sort = 'recently_updated';
        if (homepageSectionId === 'new_releases') sort = 'release_date';

        const url = `${BASE_URL}/filter?sort=${sort}&page=${page}`;
        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const mangas = this.parseMangaList($);

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    async getSearchResults(query, metadata) {
        const page = metadata?.page ?? 1;
        let title = "";
        if (typeof query === 'string') {
            title = query;
        } else if (query?.title) {
            title = query.title;
        } else if (query?.search) {
            title = query.search;
        }

        let url = `${BASE_URL}/filter?page=${page}`;
        if (title && title.trim() !== "") {
            url = `${BASE_URL}/filter?keyword=${encodeURIComponent(title.trim())}&page=${page}`;
        }

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const mangas = this.parseMangaList($);

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    async getMangaDetails(mangaId) {
        const cleanId = mangaId.replace(/^\/manga\//, '');
        const url = mangaId.startsWith("http") ? mangaId : `${BASE_URL}/manga/${cleanId}`;
        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const title = $('h1').first().text().trim()
            || $('meta[property="og:title"]').attr('content')?.replace(/ - MangaFire.*/i, '').trim()
            || '';
        const image = $('img.cover, .cover img, .poster img').attr('src')
            || $('meta[property="og:image"]').attr('content')
            || '';
        const description = $('.description, .summary, #synopsis, .info .modal-content').text().trim()
            || $('meta[property="og:description"]').attr('content')
            || '';

        return App.createSourceManga({
            id: mangaId,
            mangaInfo: App.createMangaInfo({
                titles: [title],
                image: image,
                description: description,
                status: 'ONGOING',
            }),
        });
    }

    async getChapters(mangaId) {
        const cleanId = mangaId.replace(/^\/manga\//, '');
        const url = mangaId.startsWith("http") ? mangaId : `${BASE_URL}/manga/${cleanId}`;
        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const chapters = [];
        const seenChapters = new Set();

        $("a[href*='/read/']").each((_, el) => {
            const href = $(el).attr("href") || "";
            const text = $(el).text().trim() || $(el).attr("title") || "";
            const numMatch = text.match(/chapter\s*(\d+\.?\d*)/i) || text.match(/(\d+\.?\d*)/);
            const chapNum = numMatch ? parseFloat(numMatch[1]) : 0;

            if (href && !seenChapters.has(href)) {
                seenChapters.add(href);
                chapters.push(App.createChapter({
                    id: href,
                    name: text,
                    chapNum: chapNum,
                    langCode: 'en',
                }));
            }
        });
        return chapters.reverse();
    }

    async getChapterDetails(mangaId, chapterId) {
        const url = chapterId.startsWith("http") ? chapterId : `${BASE_URL}${chapterId}`;
        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const pages = [];
        $("img.page-image, .chapter-page img, img[data-src], .reader-page img").each((_, el) => {
            let src = $(el).attr("src") || $(el).attr("data-src") || "";
            if (src && !src.startsWith("http")) src = BASE_URL + src;
            if (src && !pages.includes(src)) pages.push(src);
        });

        if (pages.length === 0) {
            $('script').each((_, el) => {
                const content = $(el).html() || "";
                const matches = content.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi);
                if (matches) {
                    matches.forEach(imgUrl => {
                        if (!pages.includes(imgUrl) && !imgUrl.includes("favicon") && !imgUrl.includes("logo")) {
                            pages.push(imgUrl);
                        }
                    });
                }
            });
        }

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
