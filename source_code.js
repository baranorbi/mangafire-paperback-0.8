const BASE_URL = "https://mangafire.to";

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': `${BASE_URL}/`
};

const mangafireInfo = {
    version: '1.0.12',
    name: 'MangaFire',
    icon: 'icon.png',
    author: 'nahamah',
    authorWebsite: 'https://github.com/baranorbi',
    description: 'HTML Scraper for MangaFire v1.0.12',
    contentRating: 'MATURE',
    websiteBaseURL: BASE_URL,
    sourceTags: [],
    intents: 1 | 4 | 16 // MANGA_CHAPTERS | HOMEPAGE_SECTIONS | CLOUDFLARE_BYPASS_REQUIRED
};
exports.mangafireInfo = mangafireInfo;

class MangaFire extends Source {
    constructor(cheerio) {
        super(cheerio);
        this.requestManager = App.createRequestManager({
            requestsPerSecond: 3,
            requestTimeout: 30000,
        });
    }

    get id() { return "mangafire"; }
    get name() { return "MangaFire"; }
    get icon() { return "icon.png"; }
    get version() { return "1.0.12"; }
    get author() { return "nahamah"; }
    get website() { return BASE_URL; }
    get language() { return "en"; }

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

    checkCloudflareResponse(data) {
        if (typeof data === 'string' && (data.includes("Just a moment...") || data.includes("cf-browser-verification") || data.includes("challenge-running"))) {
            throw new Error("Cloudflare challenge detected. Please bypass Cloudflare via WebView in Paperback settings.");
        }
    }

    parseHtmlMangaList($) {
        const mangas = [];
        const seenIds = new Set();

        $("div.unit, .manga-item, .card, div.original.card-lg div.unit, .inner").each((_, element) => {
            const $el = $(element);
            const titleEl = $el.find("div.info > a, .detail .title a, a.title, h3 a, .info > div > a, a[href*='/manga/']").last();
            let title = titleEl.text().trim() || $el.find("a").attr("title") || "";
            if (!title) {
                title = $el.find("a").text().trim();
            }
            
            const posterEl = $el.find("a.poster, a[href*='/manga/'], a[href*='/title/']").first();
            const href = posterEl.attr("href") || titleEl.attr("href") || "";

            if (!href) return;

            const idMatch = href.match(/\/(?:manga|title)\/([^\/?#]+)/);
            const id = idMatch ? idMatch[1] : href.split("/").filter(Boolean).pop() || "";
            
            let image = $el.find("img").attr("src") || $el.find("img").attr("data-src") || "";

            if (title && id && !seenIds.has(id)) {
                seenIds.add(id);
                mangas.push(App.createPartialSourceManga({
                    mangaId: id,
                    id: id,
                    title: title,
                    image: image,
                }));
            }
        });
        return mangas;
    }

    async getHomePageSections(sectionCallback) {
        const sections = [
            App.createHomeSection({
                id: 'recently_updated',
                title: 'Recently Updated',
                items: [],
                containsMoreItems: true,
                type: 'singleRowNormal'
            }),
            App.createHomeSection({
                id: 'trending',
                title: 'Trending',
                items: [],
                containsMoreItems: true,
                type: 'singleRowNormal'
            }),
            App.createHomeSection({
                id: 'most_popular',
                title: 'Most Popular',
                items: [],
                containsMoreItems: true,
                type: 'singleRowNormal'
            })
        ];

        for (const section of sections) {
            if (typeof sectionCallback === 'function') sectionCallback(section);
        }

        const promises = sections.map(async (section) => {
            try {
                let sortParam = 'recently_updated';
                if (section.id === 'trending') sortParam = 'trending';
                if (section.id === 'most_popular') sortParam = 'most_viewed';

                const request = App.createRequest({
                    url: `${BASE_URL}/filter?sort=${sortParam}`,
                    method: 'GET',
                    headers: DEFAULT_HEADERS
                });
                const response = await this.requestManager.schedule(request, 1);
                this.checkCloudflareResponse(response.data);

                const $ = this.cheerio.load(response.data);
                section.items = this.parseHtmlMangaList($);
                if (typeof sectionCallback === 'function') sectionCallback(section);
            } catch (error) {
                console.log(`Failed to load section ${section.id}:`, error);
            }
        });

        await Promise.all(promises);
    }

    async getViewMoreItems(homepageSectionId, metadata) {
        const page = metadata?.page ?? 1;
        let sortParam = 'recently_updated';
        if (homepageSectionId === 'trending') sortParam = 'trending';
        if (homepageSectionId === 'most_popular') sortParam = 'most_viewed';

        const url = `${BASE_URL}/filter?sort=${sortParam}&page=${page}`;

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });

        const response = await this.requestManager.schedule(request, 1);
        this.checkCloudflareResponse(response.data);

        const $ = this.cheerio.load(response.data);
        const mangas = this.parseHtmlMangaList($);

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    async getSearchResults(query, metadata) {
        const page = metadata?.page ?? 1;
        const keyword = (typeof query === 'string' ? query : query?.title) || "";
        
        let url = `${BASE_URL}/filter?page=${page}`;
        if (keyword) {
            url += `&keyword=${encodeURIComponent(keyword)}`;
        }

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });

        const response = await this.requestManager.schedule(request, 1);
        this.checkCloudflareResponse(response.data);

        const $ = this.cheerio.load(response.data);
        const mangas = this.parseHtmlMangaList($);

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    async getMangaDetails(mangaId) {
        const cleanId = mangaId.replace(/^\/(?:manga|title)\//, '');
        const url = `${BASE_URL}/manga/${cleanId}`;
        
        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
        
        const response = await this.requestManager.schedule(request, 1);
        this.checkCloudflareResponse(response.data);

        const $ = this.cheerio.load(response.data);

        const title = $('h1').first().text().trim()
            || $('meta[property="og:title"]').attr('content')?.replace(/ - MangaFire.*/i, '').trim()
            || cleanId;
            
        const image = $('img.cover, .cover img, .poster img').attr('src')
            || $('meta[property="og:image"]').attr('content')
            || '';
            
        const description = $('.description, .summary, #synopsis, .info .modal-content').text().trim()
            || $('meta[property="og:description"]').attr('content')
            || '';

        let status = 'ONGOING';
        const pageText = $('body').text().toLowerCase();
        if (pageText.includes('completed') || pageText.includes('finished')) {
            status = 'COMPLETED';
        }

        const authors = [];
        $('.info a[href*="/author/"], .info span:contains("Author") + a').each((_, el) => {
            const authorText = $(el).text().trim();
            if (authorText && !authors.includes(authorText)) authors.push(authorText);
        });

        const tags = [];
        $('.info a[href*="/genre/"]').each((_, el) => {
            const tagText = $(el).text().trim();
            const tagId = $(el).attr('href')?.split('/').pop() || tagText;
            if (tagText) {
                tags.push(App.createTag({
                    id: tagId,
                    label: tagText
                }));
            }
        });

        return App.createSourceManga({
            id: mangaId,
            mangaInfo: App.createMangaInfo({
                titles: [title],
                image: image,
                desc: description,
                description: description,
                status: status,
                author: authors[0] || 'Unknown',
                artist: authors[1] || authors[0] || 'Unknown',
                tags: tags.length > 0 ? [App.createTagSection({ id: '0', label: 'genres', tags: tags })] : []
            })
        });
    }

    async getChapters(mangaId) {
        const cleanId = mangaId.replace(/^\/(?:manga|title)\//, '');
        const url = `${BASE_URL}/manga/${cleanId}`;
        
        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
        
        const response = await this.requestManager.schedule(request, 1);
        this.checkCloudflareResponse(response.data);

        const $ = this.cheerio.load(response.data);

        const chapters = [];
        const seenChapters = new Set();

        $("a[href*='/read/'], .list-chapter a, ul.chapters a").each((_, el) => {
            const $el = $(el);
            const href = $el.attr("href") || "";
            const text = $el.text().trim() || $el.attr("title") || "";
            
            const numMatch = text.match(/chapter\s*(\d+\.?\d*)/i) || text.match(/(\d+\.?\d*)/);
            const chapNum = numMatch ? parseFloat(numMatch[1]) : 0;
            
            let chapId = href;
            if (chapId.startsWith('/')) chapId = chapId.substring(1);
            
            if (href && !seenChapters.has(chapId)) {
                seenChapters.add(chapId);
                chapters.push(App.createChapter({
                    id: chapId,
                    name: text || `Chapter ${chapNum}`,
                    chapNum: chapNum,
                    langCode: 'en'
                }));
            }
        });
        
        return chapters.reverse();
    }

    async getChapterDetails(mangaId, chapterId) {
        let url = chapterId.startsWith("http") ? chapterId : `${BASE_URL}/${chapterId}`;
        if (!url.includes(BASE_URL)) {
            url = `${BASE_URL}/${chapterId}`;
        }
        
        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
        
        const response = await this.requestManager.schedule(request, 1);
        this.checkCloudflareResponse(response.data);

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
                        if (!pages.includes(imgUrl) && !imgUrl.includes("favicon") && !imgUrl.includes("logo") && !imgUrl.includes("avatar")) {
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

    // Legacy method compatibility aliases
    async getMangaList(searchTerm = "", page = 1) {
        const pagedResults = await this.getSearchResults(searchTerm, { page });
        return pagedResults?.results || [];
    }

    async getMangaItems(searchTerm = "", page = 1) {
        return this.getMangaList(searchTerm, page);
    }

    async getChapterList(mangaId) {
        return this.getChapters(mangaId);
    }

    async getChapter(chapterId) {
        const details = await this.getChapterDetails("", chapterId);
        return details?.pages || [];
    }
}

// Static delegate methods so calls to MangaFire.method() or instance.method() both work
function getInstance() {
    if (!MangaFire._instance) {
        MangaFire._instance = new MangaFire(typeof cheerio !== 'undefined' ? cheerio : null);
    }
    return MangaFire._instance;
}

MangaFire.getCloudflareBypassRequestAsync = function() { return getInstance().getCloudflareBypassRequestAsync(); };
MangaFire.getHomePageSections = function(cb) { return getInstance().getHomePageSections(cb); };
MangaFire.getViewMoreItems = function(id, meta) { return getInstance().getViewMoreItems(id, meta); };
MangaFire.getSearchResults = function(q, meta) { return getInstance().getSearchResults(q, meta); };
MangaFire.getMangaDetails = function(id) { return getInstance().getMangaDetails(id); };
MangaFire.getChapters = function(id) { return getInstance().getChapters(id); };
MangaFire.getChapterDetails = function(mId, cId) { return getInstance().getChapterDetails(mId, cId); };
MangaFire.getMangaList = function(st, p) { return getInstance().getMangaList(st, p); };
MangaFire.getMangaItems = function(st, p) { return getInstance().getMangaItems(st, p); };
MangaFire.getChapterList = function(id) { return getInstance().getChapterList(id); };
MangaFire.getChapter = function(cId) { return getInstance().getChapter(cId); };

exports.mangafire = MangaFire;
exports.MangaFire = MangaFire;

// Expose exports globally across JavaScriptCore / Browserify contexts
if (typeof globalThis !== 'undefined') {
    globalThis.mangafireInfo = mangafireInfo;
    globalThis.mangafire = MangaFire;
    globalThis.MangaFire = MangaFire;
    globalThis.Sources = {
        mangafireInfo: mangafireInfo,
        mangafire: MangaFire,
        MangaFire: MangaFire
    };
}
if (typeof window !== 'undefined') {
    window.mangafireInfo = mangafireInfo;
    window.mangafire = MangaFire;
    window.MangaFire = MangaFire;
    window.Sources = globalThis.Sources;
}
if (typeof self !== 'undefined') {
    self.mangafireInfo = mangafireInfo;
    self.mangafire = MangaFire;
    self.MangaFire = MangaFire;
    self.Sources = globalThis.Sources;
}
