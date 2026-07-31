import {
    Source,
    SourceManga,
    Chapter,
    ChapterDetails,
    HomeSection,
    SearchRequest,
    PagedResults,
    SourceInfo,
    MangaUpdates,
    TagSection
} from '@paperback/types';

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

export class MangaFire extends Source {
    requestManager = App.createRequestManager({
        requestsPerSecond: 3,
        requestTimeout: 30000,
    });

    override async getCloudflareBypassRequestAsync() {
        return App.createRequest({
            url: `${BASE_URL}/home`,
            method: 'GET',
            headers: DEFAULT_HEADERS
        });
    }

    override async supportsSearchOperators() { return false; }
    override async supportsTagExclusion() { return false; }

    _isCloudflare(data: any) {
        return typeof data === 'string' &&
            (data.includes("Just a moment") ||
             data.includes("cf-browser-verification") ||
             data.includes("challenge-running") ||
             data.includes("challenge-platform"));
    }

    async _request(url: string, headers?: any) {
        const req = App.createRequest({
            url: url,
            method: 'GET',
            headers: headers || DEFAULT_HEADERS
        });
        const resp = await this.requestManager.schedule(req, 1);
        if (!resp || !resp.data) return null;
        if (this._isCloudflare(resp.data)) return null;
        return resp.data as string;
    }

    _unwrapAjax(raw: any) {
        if (!raw) return null;
        if (typeof raw === 'string' && raw.trim().startsWith('{')) {
            try {
                const json = JSON.parse(raw);
                if (json.result && typeof json.result === 'string') return json.result;
                if (json.result && json.result.html) return json.result.html;
                if (json.html) return json.html;
                return json;
            } catch (e) {
                return raw;
            }
        }
        return raw;
    }

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const sections = [
            App.createHomeSection({ id: 'recently_updated', title: 'Recently Updated', type: 'singleRowNormal', containsMoreItems: true }),
            App.createHomeSection({ id: 'trending', title: 'Trending', type: 'singleRowNormal', containsMoreItems: true }),
            App.createHomeSection({ id: 'newest', title: 'Newest', type: 'singleRowNormal', containsMoreItems: true })
        ];

        for (const section of sections) {
            sectionCallback(section);
        }

        const sectionConfigs = [
            { section: sections[0], url: `${BASE_URL}/home`, selector: 'recently_updated' },
            { section: sections[1], url: `${BASE_URL}/home`, selector: 'trending' },
            { section: sections[2], url: `${BASE_URL}/home`, selector: 'newest' }
        ];

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
                    } catch (e) {}
                }
            }
        } catch (e) {}

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
                } catch (e) {}
            }
        }
    }

    _parseHomeSectionItems($: any, sectionType: string) {
        const items: any[] = [];
        const seenIds = new Set();
        const selectors = ['.original.card-lg .unit', '.swiper-slide .unit', '.side-bar .unit', '.manga-list .unit', '.item', 'a[href*="/manga/"]'];

        for (const sel of selectors) {
            $(sel).each((_: any, element: any) => {
                try {
                    const $el = $(element);
                    const manga = this._extractMangaFromElement($, $el);
                    if (manga && !seenIds.has(manga.mangaId)) {
                        seenIds.add(manga.mangaId);
                        items.push(manga);
                    }
                } catch (e) {}
            });
            if (items.length >= 10) break;
        }

        return items;
    }

    _extractMangaFromElement($: any, $el: any) {
        let href = $el.attr('href') || '';
        if (!href) {
            const $link = $el.find('a[href*="/manga/"]').first();
            href = $link.attr('href') || '';
        }
        if (!href) return null;

        const idMatch = href.match(/\/manga\/([^\/\?#]+)/);
        if (!idMatch) return null;
        const mangaId = idMatch[1];

        let title = $el.find('.info .name, .title, h3, h6, .manga-name').first().text().trim();
        if (!title) title = $el.find('img').attr('alt') || '';
        if (!title) title = $el.attr('title') || '';
        if (!title) title = mangaId.replace(/\.[a-z0-9]+$/, '').replace(/-/g, ' ');

        let image = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';

        return App.createPartialSourceManga({
            mangaId: mangaId,
            image: image,
            title: title
        });
    }

    _parseMangaList($: any) {
        const items: any[] = [];
        const seenIds = new Set();
        $('a[href*="/manga/"], .unit, .original').each((_: any, element: any) => {
            try {
                const $el = $(element);
                const manga = this._extractMangaFromElement($, $el);
                if (manga && !seenIds.has(manga.mangaId)) {
                    seenIds.add(manga.mangaId);
                    items.push(manga);
                }
            } catch (e) {}
        });
        return items;
    }

    override async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        const page = (metadata && metadata.page) ? metadata.page : 1;
        let sortParam = 'recently_updated';
        if (homepageSectionId === 'trending') sortParam = 'trending';
        if (homepageSectionId === 'newest') sortParam = 'newest';

        let mangas: any[] = [];
        try {
            const html = await this._request(`${BASE_URL}/filter?sort=${sortParam}&language[]=en&page=${page}`);
            if (html) {
                const $ = this.cheerio.load(html);
                mangas = this._parseMangaList($);
            }
        } catch (e) {}

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    override async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const page = (metadata && metadata.page) ? metadata.page : 1;
        const keyword = query.title || '';

        let mangas: any[] = [];
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
        } catch (e) {}

        return App.createPagedResults({
            results: mangas,
            metadata: mangas.length > 0 ? { page: page + 1 } : undefined
        });
    }

    override async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const cleanId = mangaId.replace(/^\/manga\//, '');
        const fallbackTitle = cleanId.replace(/\.[a-z0-9]+$/, '').replace(/-/g, ' ');

        try {
            const html = await this._request(`${BASE_URL}/manga/${cleanId}`);
            if (!html) return this._createFallbackManga(mangaId, fallbackTitle);

            const $ = this.cheerio.load(html);

            const title = $('h1, .manga-name, .title').first().text().trim() || fallbackTitle;
            const image = $('img.poster, .poster img, .cover img, .manga-poster img').first().attr('src') || '';
            const description = $('.description, .summary, .synopsis, .manga-description').first().text().trim() || '';

            let status = 'ONGOING';
            const statusText = $('body').text().toLowerCase();
            if (statusText.includes('completed') || statusText.includes('finished')) status = 'COMPLETED';

            const authors: string[] = [];
            $('a[href*="/author/"], a[href*="/creator/"]').each((_: any, el: any) => {
                const name = $(el).text().trim();
                if (name && !authors.includes(name)) authors.push(name);
            });

            const tags: any[] = [];
            $('a[href*="/genre/"], a[href*="/tag/"], .genres a, .tags a').each((_: any, el: any) => {
                const tagText = $(el).text().trim();
                if (tagText) tags.push(App.createTag({ id: tagText.toLowerCase().replace(/\s+/g, '-'), label: tagText }));
            });

            return App.createSourceManga({
                id: mangaId,
                mangaInfo: App.createMangaInfo({
                    titles: [title],
                    image: image,
                    desc: description,
                    status: status,
                    author: authors[0] || 'Unknown',
                    artist: authors[1] || authors[0] || 'Unknown',
                    tags: tags.length > 0 ? [App.createTagSection({ id: '0', label: 'genres', tags: tags })] : []
                })
            });
        } catch (e) {
            return this._createFallbackManga(mangaId, fallbackTitle);
        }
    }

    _createFallbackManga(mangaId: string, title: string) {
        return App.createSourceManga({
            id: mangaId,
            mangaInfo: App.createMangaInfo({
                titles: [title || mangaId],
                image: '',
                desc: '',
                status: 'ONGOING'
            })
        });
    }

    override async getChapters(mangaId: string): Promise<Chapter[]> {
        const cleanId = mangaId.replace(/^\/manga\//, '');
        const chapters: any[] = [];
        const seenChapters = new Set();

        try {
            const numericId = cleanId.match(/\.([a-z0-9]+)$/);
            const ajaxId = numericId ? numericId[1] : cleanId;

            const ajaxRaw = await this._request(`${BASE_URL}/ajax/manga/${ajaxId}/chapter/en`, AJAX_HEADERS);
            const ajaxHtml = this._unwrapAjax(ajaxRaw);
            if (ajaxHtml && typeof ajaxHtml === 'string') {
                const $ = this.cheerio.load(ajaxHtml);
                this._parseChapterList($, chapters, seenChapters, cleanId);
            }

            if (chapters.length > 0) return chapters.sort((a, b) => b.chapNum - a.chapNum);

            const html = await this._request(`${BASE_URL}/manga/${cleanId}`);
            if (html) {
                const $ = this.cheerio.load(html);
                this._parseChapterList($, chapters, seenChapters, cleanId);
            }
        } catch (e) {}

        return chapters.sort((a, b) => b.chapNum - a.chapNum);
    }

    _parseChapterList($: any, chapters: any[], seenChapters: Set<any>, mangaId: string) {
        $('a[href*="/read/"], a[href*="/chapter"]').each((_: any, el: any) => {
            try {
                const $el = $(el);
                const href = $el.attr('href') || '';
                if (!href) return;

                const text = $el.text().trim();
                const numMatch = text.match(/(?:chapter|ch\.?)\s*([\d.]+)/i) || href.match(/chapter[_-]?([\d.]+)/i) || text.match(/([\d.]+)/);
                const chapNum = numMatch ? parseFloat(numMatch[1]) : 0;

                let chapId = href;
                if (chapId.startsWith('/')) chapId = chapId.substring(1);

                if (chapId && !seenChapters.has(chapId)) {
                    seenChapters.add(chapId);
                    chapters.push(App.createChapter({
                        id: chapId,
                        name: text || `Chapter ${chapNum}`,
                        chapNum: chapNum,
                        langCode: 'en'
                    }));
                }
            } catch (e) {}
        });
    }

    override async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const cleanChapterId = chapterId.replace(/^\//, '');
        let pages: string[] = [];

        try {
            const ajaxRaw = await this._request(`${BASE_URL}/ajax/read/${cleanChapterId}/chapter/list`, AJAX_HEADERS);
            const unwrapped = this._unwrapAjax(ajaxRaw);
            if (unwrapped) {
                if (typeof unwrapped === 'object') {
                    const imgs = unwrapped.images || unwrapped.pages || unwrapped.result?.images || [];
                    if (Array.isArray(imgs)) {
                        imgs.forEach((img: any) => {
                            const url = Array.isArray(img) ? img[0] : (typeof img === 'string' ? img : (img.url || img.src || ''));
                            if (url && !pages.includes(url)) pages.push(url);
                        });
                    }
                } else if (typeof unwrapped === 'string') {
                    const $ = this.cheerio.load(unwrapped);
                    pages = this._parseChapterPages($);
                }
            }

            if (pages.length > 0) {
                return App.createChapterDetails({ id: chapterId, mangaId: mangaId, pages: pages });
            }

            const url = cleanChapterId.startsWith('http') ? cleanChapterId : `${BASE_URL}/${cleanChapterId}`;
            const html = await this._request(url);
            if (html) {
                const $ = this.cheerio.load(html);
                pages = this._parseChapterPages($);
            }
        } catch (e) {}

        return App.createChapterDetails({ id: chapterId, mangaId: mangaId, pages: pages });
    }

    _parseChapterPages($: any) {
        const pages: string[] = [];
        $('img.page-image, .chapter-page img, .reader-page img, #reader img, .reading-content img, img[data-src]').each((_: any, el: any) => {
            let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || '';
            if (src && !src.startsWith('http')) src = BASE_URL + (src.startsWith('/') ? '' : '/') + src;
            if (src && !pages.includes(src) && !src.includes('favicon') && !src.includes('logo') && !src.includes('avatar')) {
                pages.push(src);
            }
        });

        if (pages.length === 0) {
            $('script').each((_: any, el: any) => {
                const content = $(el).html() || '';
                const matches = content.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|avif)/gi);
                if (matches) {
                    matches.forEach((imgUrl: string) => {
                        if (!pages.includes(imgUrl) && !imgUrl.includes('favicon') && !imgUrl.includes('logo') && !imgUrl.includes('avatar')) {
                            pages.push(imgUrl);
                        }
                    });
                }
            });
        }
        return pages;
    }
}
