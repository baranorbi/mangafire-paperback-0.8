const BASE_URL = "https://mangafire.to";

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': `${BASE_URL}/`
};

exports.mangafireInfo = {
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

    parseHtmlMangaList($) {
        const mangas = [];
        const seenIds = new Set();

        $("div.unit, .manga-item, .card, div.original.card-lg div.unit").each((_, element) => {
            const $el = $(element);
            const titleEl = $el.find("div.info > a, .detail .title a, a.title, h3 a, .info > div > a").last();
            let title = titleEl.text().trim() || $el.find("a").attr("title") || "";
            if (!title) {
                title = $el.find("a").text().trim();
            }
            
            const posterEl = $el.find("a.poster, a[href*='/manga/']").first();
            const href = posterEl.attr("href") || titleEl.attr("href") || "";

            const idMatch = href.match(/\/manga\/([^\/?#]+)/);
            const id = idMatch ? idMatch[1] : href.split("/").filter(Boolean).pop() || "";
            
            let image = $el.find("img").attr("src") || $el.find("img").attr("data-src") || "";

            if (title && id && !seenIds.has(id)) {
                seenIds.add(id);
                mangas.push(App.createPartialSourceManga({
                    mangaId: id,
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
            })
        ];

        for (const section of sections) {
            sectionCallback(section);
        }

        const promises = sections.map(async (section) => {
            try {
                const request = App.createRequest({
                    url: `${BASE_URL}/filter`,
                    method: 'GET',
                    headers: DEFAULT_HEADERS
                });
                const response = await this.requestManager.schedule(request, 1);
                
                if (response.data.includes("Just a moment...") || response.data.includes("cf-browser-verification")) {
                    throw new Error("Cloudflare challenge detected. Please bypass Cloudflare via WebView.");
                }

                const $ = this.cheerio.load(response.data);
                section.items = this.parseHtmlMangaList($);
                sectionCallback(section);
            } catch (error) {
                console.log(`Failed to load section ${section.id}:`, error);
                throw error;
            }
        });

        await Promise.all(promises);
    }

    async getViewMoreItems(homepageSectionId, metadata) {
        const page = metadata?.page ?? 1;
        let url = `${BASE_URL}/filter?page=${page}`;

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });

        const response = await this.requestManager.schedule(request, 1);
        if (response.data.includes("Just a moment...") || response.data.includes("cf-browser-verification")) {
            throw new Error("Cloudflare challenge detected. Please bypass Cloudflare via WebView.");
        }

        const $ = this.cheerio.load(response.data);
        const mangas = this.parseHtmlMangaList($);

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    async getSearchResults(query, metadata) {
        const page = metadata?.page ?? 1;
        const keyword = query.title || "";
        
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
        if (response.data.includes("Just a moment...") || response.data.includes("cf-browser-verification")) {
            throw new Error("Cloudflare challenge detected. Please bypass Cloudflare via WebView.");
        }

        const $ = this.cheerio.load(response.data);
        const mangas = this.parseHtmlMangaList($);

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    async getMangaDetails(mangaId) {
        const cleanId = mangaId.replace(/^\/manga\//, '');
        const url = `${BASE_URL}/manga/${cleanId}`;
        
        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
        
        const response = await this.requestManager.schedule(request, 1);
        if (response.data.includes("Just a moment...") || response.data.includes("cf-browser-verification")) {
            throw new Error("Cloudflare challenge detected. Please bypass Cloudflare via WebView.");
        }

        const $ = this.cheerio.load(response.data);

        const title = $('h1').first().text().trim()
            || $('meta[property="og:title"]').attr('content')?.replace(/ - MangaFire.*/i, '').trim()
            || 'Unknown Title';
            
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
                desc: description,
                status: 'ONGOING'
            })
        });
    }

    async getChapters(mangaId) {
        const cleanId = mangaId.replace(/^\/manga\//, '');
        const url = `${BASE_URL}/manga/${cleanId}`;
        
        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
        
        const response = await this.requestManager.schedule(request, 1);
        if (response.data.includes("Just a moment...") || response.data.includes("cf-browser-verification")) {
            throw new Error("Cloudflare challenge detected. Please bypass Cloudflare via WebView.");
        }

        const $ = this.cheerio.load(response.data);

        const chapters = [];
        const seenChapters = new Set();

        $("a[href*='/read/'], .list-chapter a").each((_, el) => {
            const $el = $(el);
            const href = $el.attr("href") || "";
            const text = $el.text().trim() || $el.attr("title") || "";
            
            const numMatch = text.match(/chapter\s*(\d+\.?\d*)/i) || text.match(/(\d+\.?\d*)/);
            const chapNum = numMatch ? parseFloat(numMatch[1]) : 0;
            
            let chapId = href;
            if (chapId.startsWith('/')) chapId = chapId.substring(1);
            if (chapId.startsWith('read/')) {
                if (href && !seenChapters.has(chapId)) {
                    seenChapters.add(chapId);
                    chapters.push(App.createChapter({
                        id: chapId,
                        name: text || `Chapter ${chapNum}`,
                        chapNum: chapNum,
                        langCode: 'en'
                    }));
                }
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
        if (response.data.includes("Just a moment...") || response.data.includes("cf-browser-verification")) {
            throw new Error("Cloudflare challenge detected. Please bypass Cloudflare via WebView.");
        }

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
}

exports.mangafire = MangaFire;
