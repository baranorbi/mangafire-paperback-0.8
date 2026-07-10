const BASE_URL = "https://mangafire.to";

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': `${BASE_URL}/`
};

class MangaFire extends Source {
    constructor(cheerio) {
        super(cheerio);
    }

    get id() { return "mangafire"; }
    get name() { return "MangaFire"; }
    get icon() { return "https://github.com/baranorbi.png"; }
    get version() { return "1.0.1"; }
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

    async getMangaList(searchTerm = "", page = 1) {
        let url = `${BASE_URL}/filter?page=${page}`;
        if (searchTerm && searchTerm.trim() !== "") {
            url = `${BASE_URL}/filter?keyword=${encodeURIComponent(searchTerm.trim())}&page=${page}`;
        }

        const request = App.createRequest({
            url: url,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const mangas = [];
        const seenIds = new Set();

        $("div.unit, .manga-item, .card, div.original.card-lg div.unit").each((_, element) => {
            const $el = $(element);
            const titleEl = $el.find("div.info > a, .detail .title a, a.title, h3 a").last();
            const title = titleEl.text().trim() || $el.find("a").attr("title") || "";
            const posterEl = $el.find("a.poster, a[href*='/manga/']").first();
            const href = posterEl.attr("href") || titleEl.attr("href") || "";

            const idMatch = href.match(/\/manga\/([^\/?#]+)/);
            const id = idMatch ? idMatch[1] : href.split("/").filter(Boolean).pop() || "";
            let image = $el.find("img").attr("src") || $el.find("img").attr("data-src") || "";

            if (title && id && !seenIds.has(id)) {
                seenIds.add(id);
                mangas.push(App.createPartialSourceManga({
                    id: id,
                    title: title,
                    image: image,
                }));
            }
        });
        return mangas;
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
            }),
        });
    }

    async getChapterList(mangaId) {
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
                }));
            }
        });
        return chapters.reverse();
    }

    async getChapter(chapterId) {
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

        return pages;
    }
}
