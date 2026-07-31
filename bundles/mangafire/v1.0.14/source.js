const BASE_URL = "https://mangafire.to";

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': `${BASE_URL}/`
};

const AJAX_HEADERS = {
    ...DEFAULT_HEADERS,
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': '*/*'
};

// ──────────────────────────────────────────────
// Source Info — Paperback 0.8 expects an export
// named <SourceName>Info with this shape.
// ──────────────────────────────────────────────
const MangaFireInfo = {
    version: '1.0.14',
    name: 'MangaFire',
    icon: 'icon.png',
    author: 'nahamah',
    authorWebsite: 'https://github.com/baranorbi',
    description: 'MangaFire.to extension for Paperback 0.8',
    contentRating: 'MATURE',
    websiteBaseURL: BASE_URL,
    sourceTags: [],
    intents: 0x17 // MANGA_CHAPTERS(1) | MANGA_DETAILS(2) | HOMEPAGE_SECTIONS(4) | CLOUDFLARE_BYPASS_REQUIRED(16)
};

// ──────────────────────────────────────────────
// MangaFire Source Class
// ──────────────────────────────────────────────
class MangaFire {
    constructor(cheerio) {
        this.cheerio = cheerio;
        this.requestManager = typeof App !== 'undefined'
            ? App.createRequestManager({
                requestsPerSecond: 3,
                requestTimeout: 30000,
            })
            : null;
    }

    // ── Cloudflare ────────────────────────────
    async getCloudflareBypassRequestAsync() {
        return App.createRequest({
            url: `${BASE_URL}/home`,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
    }

    async supportsSearchOperators() { return false; }
    async supportsTagExclusion() { return false; }

    _isCloudflare(data) {
        return typeof data === 'string' &&
            (data.includes("Just a moment") ||
             data.includes("cf-browser-verification") ||
             data.includes("challenge-running") ||
             data.includes("challenge-platform"));
    }

    // ── Helper: schedule a request safely ─────
    async _request(url, headers) {
        const req = App.createRequest({
            url: url,
            method: 'GET',
            headers: headers || DEFAULT_HEADERS
        });
        const resp = await this.requestManager.schedule(req, 1);
        if (!resp || !resp.data) return null;
        if (this._isCloudflare(resp.data)) return null;
        return resp.data;
    }

    // ── Helper: parse AJAX JSON wrapper ───────
    // MangaFire AJAX endpoints return either JSON
    // like { "result": "<html>..." } or raw HTML.
    _unwrapAjax(raw) {
        if (!raw) return null;
        if (typeof raw === 'string' && raw.trim().startsWith('{')) {
            try {
                const json = JSON.parse(raw);
                // Common shapes: { result: "<html>" } or { result: { html: "..." } }
                if (json.result && typeof json.result === 'string') return json.result;
                if (json.result && json.result.html) return json.result.html;
                if (json.html) return json.html;
                return json;
            } catch (e) {
                // Not valid JSON — treat as HTML
                return raw;
            }
        }
        return raw;
    }

    // ──────────────────────────────────────────
    //  HOME PAGE SECTIONS
    //  Paperback 0.8 signature:
    //    getHomePageSections(sectionCallback): Promise<void>
    // ──────────────────────────────────────────
    async getHomePageSections(sectionCallback) {
        const sections = [
            App.createHomeSection({
                id: 'recently_updated',
                title: 'Recently Updated',
                type: 'singleRowNormal',
                containsMoreItems: true
            }),
            App.createHomeSection({
                id: 'trending',
                title: 'Trending',
                type: 'singleRowNormal',
                containsMoreItems: true
            }),
            App.createHomeSection({
                id: 'newest',
                title: 'Newest',
                type: 'singleRowNormal',
                containsMoreItems: true
            })
        ];

        // Send empty sections first so the UI renders placeholders
        for (const section of sections) {
            sectionCallback(section);
        }

        // Populate each section
        const sectionConfigs = [
            { section: sections[0], url: `${BASE_URL}/home`, selector: 'recently_updated' },
            { section: sections[1], url: `${BASE_URL}/home`, selector: 'trending' },
            { section: sections[2], url: `${BASE_URL}/home`, selector: 'newest' }
        ];

        // Fetch the home page once and reuse
        try {
            const html = await this._request(`${BASE_URL}/home`);
            if (html) {
                const $ = this.cheerio.load(html);
                for (const config of sectionConfigs) {
                    try {
                        const items = this._parseHomeSectionItems($, config.selector);
                        if (items.length > 0) {
                            config.section.items = items;
                            sectionCallback(config.section);
                        }
                    } catch (e) {
                        // Section parsing failed, skip
                    }
                }
            }
        } catch (e) {
            // Home page fetch failed
        }

        // If home page didn't work, try browse pages individually
        for (const config of sectionConfigs) {
            if (!config.section.items || config.section.items.length === 0) {
                try {
                    let sortParam = 'recently_updated';
                    if (config.selector === 'trending') sortParam = 'trending';
                    if (config.selector === 'newest') sortParam = 'newest';

                    const html = await this._request(`${BASE_URL}/filter?sort=${sortParam}&language[]=en&page=1`);
                    if (html) {
                        const $ = this.cheerio.load(html);
                        const items = this._parseMangaList($);
                        if (items.length > 0) {
                            config.section.items = items;
                            sectionCallback(config.section);
                        }
                    }
                } catch (e) {
                    // Fallback also failed
                }
            }
        }
    }

    // ── Parse home page section items ─────────
    _parseHomeSectionItems($, sectionType) {
        const items = [];
        const seenIds = new Set();

        // MangaFire home page has sections with different class patterns
        // Try common selectors for manga items
        const selectors = [
            '.original.card-lg .unit',    // Large cards
            '.swiper-slide .unit',         // Swiper slides
            '.side-bar .unit',             // Sidebar
            '.manga-list .unit',           // Manga lists
            '.item',                       // Generic items
            'a[href*="/manga/"]',          // Any manga link
        ];

        for (const sel of selectors) {
            $(sel).each((_, element) => {
                try {
                    const $el = $(element);
                    const manga = this._extractMangaFromElement($, $el);
                    if (manga && !seenIds.has(manga.mangaId)) {
                        seenIds.add(manga.mangaId);
                        items.push(manga);
                    }
                } catch (e) {
                    // Skip bad elements
                }
            });
            if (items.length >= 10) break; // Enough for a section
        }

        return items;
    }

    // ── Extract manga data from a DOM element ─
    _extractMangaFromElement($, $el) {
        // Find the link
        let href = $el.attr('href') || '';
        if (!href) {
            const $link = $el.find('a[href*="/manga/"]').first();
            href = $link.attr('href') || '';
        }
        if (!href) return null;

        // Extract ID from href like /manga/one-piece.yz2k0
        const idMatch = href.match(/\/manga\/([^\/\?#]+)/);
        if (!idMatch) return null;
        const mangaId = idMatch[1];

        // Title
        let title = $el.find('.info .name, .title, h3, h6, .manga-name').first().text().trim();
        if (!title) title = $el.find('img').attr('alt') || '';
        if (!title) title = $el.attr('title') || '';
        if (!title) title = mangaId.replace(/\.[a-z0-9]+$/, '').replace(/-/g, ' ');

        // Image
        let image = $el.find('img').first().attr('src')
            || $el.find('img').first().attr('data-src')
            || '';

        return App.createPartialSourceManga({
            mangaId: mangaId,
            image: image,
            title: title
        });
    }

    // ── Parse a browse/filter page manga list ─
    _parseMangaList($) {
        const items = [];
        const seenIds = new Set();

        // MangaFire browse/filter pages use .unit or .original cards
        $('a[href*="/manga/"], .unit, .original').each((_, element) => {
            try {
                const $el = $(element);
                const manga = this._extractMangaFromElement($, $el);
                if (manga && !seenIds.has(manga.mangaId)) {
                    seenIds.add(manga.mangaId);
                    items.push(manga);
                }
            } catch (e) {
                // Skip
            }
        });

        return items;
    }

    // ──────────────────────────────────────────
    //  VIEW MORE ITEMS
    // ──────────────────────────────────────────
    async getViewMoreItems(homepageSectionId, metadata) {
        const page = (metadata && metadata.page) ? metadata.page : 1;

        let sortParam = 'recently_updated';
        if (homepageSectionId === 'trending') sortParam = 'trending';
        if (homepageSectionId === 'newest') sortParam = 'newest';

        let mangas = [];
        try {
            const html = await this._request(`${BASE_URL}/filter?sort=${sortParam}&language[]=en&page=${page}`);
            if (html) {
                const $ = this.cheerio.load(html);
                mangas = this._parseMangaList($);
            }
        } catch (e) {
            // Request failed
        }

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    // ──────────────────────────────────────────
    //  SEARCH
    //  Paperback 0.8: getSearchResults(query: SearchRequest, metadata): Promise<PagedResults>
    //  SearchRequest has .title (string) and .includedTags, .excludedTags, etc.
    // ──────────────────────────────────────────
    async getSearchResults(query, metadata) {
        const page = (metadata && metadata.page) ? metadata.page : 1;
        const keyword = (typeof query === 'string') ? query : (query && query.title ? query.title : '');

        let mangas = [];
        try {
            let url = `${BASE_URL}/filter?language[]=en&page=${page}`;
            if (keyword) {
                url += `&keyword=${encodeURIComponent(keyword)}`;
            }

            const html = await this._request(url);
            if (html) {
                const $ = this.cheerio.load(html);
                mangas = this._parseMangaList($);
            }
        } catch (e) {
            // Search failed
        }

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    // ──────────────────────────────────────────
    //  MANGA DETAILS
    // ──────────────────────────────────────────
    async getMangaDetails(mangaId) {
        const cleanId = mangaId.replace(/^\/manga\//, '');
        const fallbackTitle = cleanId.replace(/\.[a-z0-9]+$/, '').replace(/-/g, ' ');

        try {
            const url = `${BASE_URL}/manga/${cleanId}`;
            const html = await this._request(url);

            if (!html) {
                return this._createFallbackManga(mangaId, fallbackTitle);
            }

            const $ = this.cheerio.load(html);

            // Title
            const title = $('h1, .manga-name, .title').first().text().trim()
                || $('meta[property="og:title"]').attr('content')?.replace(/ - MangaFire.*/i, '').trim()
                || fallbackTitle;

            // Image
            const image = $('img.poster, .poster img, .cover img, .manga-poster img').first().attr('src')
                || $('meta[property="og:image"]').attr('content')
                || '';

            // Description
            const description = $('.description, .summary, .synopsis, .manga-description').first().text().trim()
                || $('meta[property="og:description"]').attr('content')
                || '';

            // Status
            let status = 'ONGOING';
            const statusText = $('body').text().toLowerCase();
            if (statusText.includes('completed') || statusText.includes('finished')) {
                status = 'COMPLETED';
            } else if (statusText.includes('hiatus')) {
                status = 'ONGOING';
            }

            // Authors
            const authors = [];
            $('a[href*="/author/"], a[href*="/creator/"]').each((_, el) => {
                const name = $(el).text().trim();
                if (name && !authors.includes(name)) authors.push(name);
            });

            // Genres / Tags
            const tags = [];
            $('a[href*="/genre/"], a[href*="/tag/"], .genres a, .tags a').each((_, el) => {
                const tagText = $(el).text().trim();
                if (tagText) {
                    tags.push(App.createTag({
                        id: tagText.toLowerCase().replace(/\s+/g, '-'),
                        label: tagText
                    }));
                }
            });

            return App.createSourceManga({
                id: mangaId,
                mangaId: mangaId,
                mangaInfo: App.createMangaInfo({
                    titles: [title],
                    image: image,
                    desc: description,
                    description: description,
                    status: status,
                    author: authors[0] || 'Unknown',
                    artist: authors[1] || authors[0] || 'Unknown',
                    tags: tags.length > 0
                        ? [App.createTagSection({ id: '0', label: 'genres', tags: tags })]
                        : []
                })
            });
        } catch (e) {
            return this._createFallbackManga(mangaId, fallbackTitle);
        }
    }

    _createFallbackManga(mangaId, title) {
        return App.createSourceManga({
            id: mangaId,
            mangaId: mangaId,
            mangaInfo: App.createMangaInfo({
                titles: [title || mangaId],
                image: '',
                desc: '',
                description: '',
                status: 'ONGOING'
            })
        });
    }

    // ──────────────────────────────────────────
    //  CHAPTERS
    // ──────────────────────────────────────────
    async getChapters(mangaId) {
        const cleanId = mangaId.replace(/^\/manga\//, '');
        const chapters = [];
        const seenChapters = new Set();

        try {
            // 1. Try the AJAX chapter endpoint
            //    MangaFire uses: /ajax/manga/{id}/chapter/en
            //    The {id} here is the numeric part or slug
            const numericId = cleanId.match(/\.([a-z0-9]+)$/);
            const ajaxId = numericId ? numericId[1] : cleanId;

            try {
                const ajaxRaw = await this._request(
                    `${BASE_URL}/ajax/manga/${ajaxId}/chapter/en`,
                    AJAX_HEADERS
                );
                const ajaxHtml = this._unwrapAjax(ajaxRaw);
                if (ajaxHtml && typeof ajaxHtml === 'string') {
                    const $ = this.cheerio.load(ajaxHtml);
                    this._parseChapterList($, chapters, seenChapters, cleanId);
                }
            } catch (e) {
                // AJAX endpoint failed
            }

            if (chapters.length > 0) {
                return chapters.sort((a, b) => b.chapNum - a.chapNum);
            }

            // 2. Fallback: scrape the manga page
            const html = await this._request(`${BASE_URL}/manga/${cleanId}`);
            if (html) {
                const $ = this.cheerio.load(html);
                this._parseChapterList($, chapters, seenChapters, cleanId);
            }
        } catch (e) {
            // Chapter fetch failed entirely
        }

        return chapters.sort((a, b) => b.chapNum - a.chapNum);
    }

    _parseChapterList($, chapters, seenChapters, mangaId) {
        // MangaFire chapter links look like: /read/{slug}.{id}/en/chapter-{num}
        $('a[href*="/read/"], a[href*="/chapter"]').each((_, el) => {
            try {
                const $el = $(el);
                const href = $el.attr('href') || '';
                if (!href) return;

                // Extract chapter number from text or href
                const text = $el.text().trim();
                const numMatch = text.match(/(?:chapter|ch\.?)\s*([\d.]+)/i)
                    || href.match(/chapter[_-]?([\d.]+)/i)
                    || text.match(/([\d.]+)/);
                const chapNum = numMatch ? parseFloat(numMatch[1]) : 0;

                // Build a chapter ID from the href
                let chapId = href;
                if (chapId.startsWith('/')) chapId = chapId.substring(1);

                if (chapId && !seenChapters.has(chapId)) {
                    seenChapters.add(chapId);
                    chapters.push(App.createChapter({
                        id: chapId,
                        mangaId: mangaId,
                        name: text || `Chapter ${chapNum}`,
                        chapNum: chapNum,
                        langCode: 'en'
                    }));
                }
            } catch (e) {
                // Skip bad element
            }
        });
    }

    // ──────────────────────────────────────────
    //  CHAPTER DETAILS (PAGES)
    // ──────────────────────────────────────────
    async getChapterDetails(mangaId, chapterId) {
        const cleanChapterId = chapterId.replace(/^\//, '');
        let pages = [];

        try {
            // 1. Try AJAX read endpoint
            //    MangaFire uses: /ajax/read/{manga-slug}.{id}/en/chapter-{num}
            try {
                const ajaxRaw = await this._request(
                    `${BASE_URL}/ajax/read/${cleanChapterId}/chapter/list`,
                    AJAX_HEADERS
                );
                const unwrapped = this._unwrapAjax(ajaxRaw);
                if (unwrapped) {
                    // Could be JSON with images array or HTML with img tags
                    if (typeof unwrapped === 'object') {
                        // JSON response — might have images array
                        const imgs = unwrapped.images || unwrapped.pages || unwrapped.result?.images || [];
                        if (Array.isArray(imgs)) {
                            imgs.forEach(img => {
                                const url = Array.isArray(img) ? img[0] : (typeof img === 'string' ? img : (img.url || img.src || ''));
                                if (url && !pages.includes(url)) pages.push(url);
                            });
                        }
                    } else if (typeof unwrapped === 'string') {
                        const $ = this.cheerio.load(unwrapped);
                        pages = this._parseChapterPages($);
                    }
                }
            } catch (e) {
                // AJAX failed
            }

            if (pages.length > 0) {
                return App.createChapterDetails({
                    id: chapterId,
                    mangaId: mangaId,
                    pages: pages
                });
            }

            // 2. Direct page scrape
            const url = cleanChapterId.startsWith('http')
                ? cleanChapterId
                : `${BASE_URL}/${cleanChapterId}`;

            const html = await this._request(url);
            if (html) {
                const $ = this.cheerio.load(html);
                pages = this._parseChapterPages($);
            }
        } catch (e) {
            // Chapter details failed
        }

        return App.createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pages
        });
    }

    _parseChapterPages($) {
        const pages = [];

        // Method 1: Look for reader page images
        $('img.page-image, .chapter-page img, .reader-page img, #reader img, .reading-content img, img[data-src]').each((_, el) => {
            let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || '';
            if (src && !src.startsWith('http')) src = BASE_URL + (src.startsWith('/') ? '' : '/') + src;
            if (src && !pages.includes(src) && !src.includes('favicon') && !src.includes('logo') && !src.includes('avatar')) {
                pages.push(src);
            }
        });

        // Method 2: Extract from inline scripts (MangaFire often embeds page URLs in JS)
        if (pages.length === 0) {
            $('script').each((_, el) => {
                const content = $(el).html() || '';
                // Look for image URLs in script content
                const matches = content.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|avif)/gi);
                if (matches) {
                    matches.forEach(imgUrl => {
                        if (!pages.includes(imgUrl) && !imgUrl.includes('favicon') && !imgUrl.includes('logo') && !imgUrl.includes('avatar')) {
                            pages.push(imgUrl);
                        }
                    });
                }
            });
        }

        // Method 3: Look for div elements with data-url attributes
        if (pages.length === 0) {
            $('div[data-url], div[data-src]').each((_, el) => {
                let src = $(el).attr('data-url') || $(el).attr('data-src') || '';
                if (src && !src.startsWith('http')) src = BASE_URL + (src.startsWith('/') ? '' : '/') + src;
                if (src && !pages.includes(src)) pages.push(src);
            });
        }

        return pages;
    }

    // ──────────────────────────────────────────
    //  SHARE URL
    // ──────────────────────────────────────────
    getMangaShareUrl(mangaId) {
        const cleanId = mangaId.replace(/^\/manga\//, '');
        return `${BASE_URL}/manga/${cleanId}`;
    }
}

// ──────────────────────────────────────────────
//  EXPORTS — Paperback 0.8 format
//  The app loads this file and looks for:
//    exports.MangaFireInfo  — the source metadata
//    exports.MangaFire      — the source class constructor
// ──────────────────────────────────────────────
if (typeof exports === 'undefined') {
    if (typeof globalThis !== 'undefined') globalThis.exports = {};
    else if (typeof global !== 'undefined') global.exports = {};
    else if (typeof window !== 'undefined') window.exports = {};
    else this.exports = {};
}

exports.MangaFireInfo = MangaFireInfo;
exports.MangaFire = MangaFire;

// Also export the lowercase version since the ID is mangafire
exports.mangafireInfo = MangaFireInfo;
exports.mangafire = MangaFire;
