const BASE_URL = "https://mangafire.to";

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': `${BASE_URL}/`
};

const AJAX_HEADERS = {
    ...DEFAULT_HEADERS,
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': '*/*'
};

const mangafireInfo = {
    version: '1.0.13',
    name: 'MangaFire',
    icon: 'icon.png',
    author: 'nahamah',
    authorWebsite: 'https://github.com/baranorbi',
    description: 'Ported from Inkdex General Extensions for Paperback 0.8',
    contentRating: 'MATURE',
    websiteBaseURL: BASE_URL,
    sourceTags: [],
    intents: 1 | 2 | 4 | 16 // MANGA_CHAPTERS | MANGA_DETAILS | HOMEPAGE_SECTIONS | CLOUDFLARE_BYPASS_REQUIRED
};

class MangaFire extends Source {
    constructor(cheerio) {
        super(cheerio);
        try {
            this.requestManager = App.createRequestManager({
                requestsPerSecond: 4,
                requestTimeout: 30000,
            });
        } catch (e) {
            console.log("RequestManager init warning:", e);
        }
    }

    get id() { return "mangafire"; }
    get name() { return "MangaFire"; }
    get icon() { return "icon.png"; }
    get version() { return "1.0.13"; }
    get author() { return "nahamah"; }
    get website() { return BASE_URL; }
    get language() { return "en"; }

    async getCloudflareBypassRequestAsync() {
        return App.createRequest({
            url: `${BASE_URL}/browse`,
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

    isCloudflareChallenge(data) {
        return typeof data === 'string' && (data.includes("Just a moment...") || data.includes("cf-browser-verification") || data.includes("challenge-running"));
    }

    formatPosterUrl(item) {
        if (!item) return '';
        if (typeof item === 'string') return item.startsWith('http') ? item : `${BASE_URL}${item.startsWith('/') ? '' : '/'}${item}`;
        const poster = item.poster || item;
        const url = poster.large || poster.medium || poster.small || poster.url || '';
        if (url && !url.startsWith('http')) return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        return url;
    }

    parseApiTitleItem(item) {
        if (!item) return null;
        const id = item.hid || item.id || item.slug || '';
        const title = item.title || item.name || id.replace(/-/g, ' ');
        const image = this.formatPosterUrl(item);

        if (!id || !title) return null;

        return App.createPartialSourceManga({
            mangaId: id,
            id: id,
            title: title,
            image: image
        });
    }

    parseHtmlMangaList($) {
        const mangas = [];
        const seenIds = new Set();

        try {
            // New MangaFire SPA / Browse layout (a.title-rows__link, .title-row-card)
            $("a.title-rows__link, a[href*='/title/'], a[href*='/manga/'], div.unit, .manga-item, .card, .inner, .item").each((_, element) => {
                try {
                    const $el = $(element);
                    let href = $el.attr("href") || "";
                    if (!href) {
                        href = $el.find("a[href*='/title/'], a[href*='/manga/'], a.poster, a.title").first().attr("href") || "";
                    }

                    if (!href) return;

                    const idMatch = href.match(/\/(?:title|manga)\/([^\/?#]+)/);
                    const id = idMatch ? idMatch[1] : href.split("/").filter(Boolean).pop() || "";

                    const titleEl = $el.find(".title-row-card__title, div.info > a, .detail .title a, a.title, h3 a").last();
                    let title = titleEl.text().trim() || $el.find("img").attr("alt") || $el.attr("title") || "";
                    if (!title) {
                        title = id.replace(/-/g, ' ').replace(/^[a-z0-9]+ /, '');
                    }

                    const posterImg = $el.find(".title-row-card__poster img, img").first();
                    let image = posterImg.attr("src") || posterImg.attr("data-src") || posterImg.attr("data-lazy") || "";

                    if (title && id && !seenIds.has(id)) {
                        seenIds.add(id);
                        mangas.push(App.createPartialSourceManga({
                            mangaId: id,
                            id: id,
                            title: title,
                            image: image,
                        }));
                    }
                } catch (e) {
                    console.log("Error parsing manga item:", e);
                }
            });
        } catch (e) {
            console.log("Error in parseHtmlMangaList:", e);
        }
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

        if (typeof sectionCallback === 'function') {
            for (const section of sections) {
                try { sectionCallback(section); } catch (e) {}
            }
        }

        const promises = sections.map(async (section) => {
            try {
                let sortParam = 'recently_updated';
                if (section.id === 'trending') sortParam = 'trending';
                if (section.id === 'most_popular') sortParam = 'most_viewed';

                // Try API endpoint first
                let items = [];
                try {
                    const apiReq = App.createRequest({
                        url: `${BASE_URL}/api/titles?sort=${sortParam}&page=1`,
                        method: 'GET',
                        headers: API_HEADERS
                    });
                    const apiRes = await this.requestManager.schedule(apiReq, 1);
                    if (apiRes && apiRes.data && !this.isCloudflareChallenge(apiRes.data)) {
                        let json = apiRes.data;
                        if (typeof json === 'string' && json.startsWith('{')) {
                            json = JSON.parse(json);
                        }
                        const rawItems = json.items || json.result?.items || json.data || [];
                        if (Array.isArray(rawItems) && rawItems.length > 0) {
                            items = rawItems.map(item => this.parseApiTitleItem(item)).filter(Boolean);
                        }
                    }
                } catch (e) {
                    console.log("API home section error:", e);
                }

                // Fallback to HTML scraping if API yields 0 items
                if (items.length === 0) {
                    const request = App.createRequest({
                        url: `${BASE_URL}/browse?sort=${sortParam}`,
                        method: 'GET',
                        headers: DEFAULT_HEADERS
                    });
                    const response = await this.requestManager.schedule(request, 1);
                    if (response && response.data && !this.isCloudflareChallenge(response.data)) {
                        const $ = this.cheerio.load(response.data);
                        items = this.parseHtmlMangaList($);
                    }
                }

                section.items = items;
                if (typeof sectionCallback === 'function') {
                    try { sectionCallback(section); } catch (e) {}
                }
            } catch (error) {
                console.log(`Failed to load section ${section.id}:`, error);
            }
        });

        await Promise.all(promises);
        return sections;
    }

    async getViewMoreItems(homepageSectionId, metadata) {
        try {
            const page = metadata?.page ?? 1;
            let sortParam = 'recently_updated';
            if (homepageSectionId === 'trending') sortParam = 'trending';
            if (homepageSectionId === 'most_popular') sortParam = 'most_viewed';

            let mangas = [];
            try {
                const apiReq = App.createRequest({
                    url: `${BASE_URL}/api/titles?sort=${sortParam}&page=${page}`,
                    method: 'GET',
                    headers: API_HEADERS
                });
                const apiRes = await this.requestManager.schedule(apiReq, 1);
                if (apiRes && apiRes.data && !this.isCloudflareChallenge(apiRes.data)) {
                    let json = apiRes.data;
                    if (typeof json === 'string' && json.startsWith('{')) {
                        json = JSON.parse(json);
                    }
                    const rawItems = json.items || json.result?.items || json.data || [];
                    if (Array.isArray(rawItems) && rawItems.length > 0) {
                        mangas = rawItems.map(item => this.parseApiTitleItem(item)).filter(Boolean);
                    }
                }
            } catch (e) {}

            if (mangas.length === 0) {
                const url = `${BASE_URL}/browse?sort=${sortParam}&page=${page}`;
                const request = App.createRequest({
                    url: url,
                    method: 'GET',
                    headers: DEFAULT_HEADERS
                });
                const response = await this.requestManager.schedule(request, 1);
                if (response && response.data && !this.isCloudflareChallenge(response.data)) {
                    const $ = this.cheerio.load(response.data);
                    mangas = this.parseHtmlMangaList($);
                }
            }

            return App.createPagedResults({
                results: mangas,
                metadata: mangas.length > 0 ? { page: page + 1 } : undefined
            });
        } catch (e) {
            console.log("Error in getViewMoreItems:", e);
            return App.createPagedResults({ results: [], metadata: undefined });
        }
    }

    async getSearchResults(query, metadata) {
        try {
            const page = metadata?.page ?? 1;
            const keyword = (typeof query === 'string' ? query : query?.title) || "";

            let mangas = [];
            try {
                let apiUrl = `${BASE_URL}/api/titles?page=${page}`;
                if (keyword) apiUrl += `&keyword=${encodeURIComponent(keyword)}&sort=relevance:desc`;

                const apiReq = App.createRequest({
                    url: apiUrl,
                    method: 'GET',
                    headers: API_HEADERS
                });
                const apiRes = await this.requestManager.schedule(apiReq, 1);
                if (apiRes && apiRes.data && !this.isCloudflareChallenge(apiRes.data)) {
                    let json = apiRes.data;
                    if (typeof json === 'string' && json.startsWith('{')) {
                        json = JSON.parse(json);
                    }
                    const rawItems = json.items || json.result?.items || json.data || [];
                    if (Array.isArray(rawItems) && rawItems.length > 0) {
                        mangas = rawItems.map(item => this.parseApiTitleItem(item)).filter(Boolean);
                    }
                }
            } catch (e) {}

            if (mangas.length === 0) {
                let url = `${BASE_URL}/browse?page=${page}`;
                if (keyword) {
                    url += `&keyword=${encodeURIComponent(keyword)}&sort=relevance:desc`;
                }

                const request = App.createRequest({
                    url: url,
                    method: 'GET',
                    headers: DEFAULT_HEADERS
                });

                const response = await this.requestManager.schedule(request, 1);
                if (response && response.data && !this.isCloudflareChallenge(response.data)) {
                    const $ = this.cheerio.load(response.data);
                    mangas = this.parseHtmlMangaList($);
                }
            }

            return App.createPagedResults({
                results: mangas,
                metadata: mangas.length > 0 ? { page: page + 1 } : undefined
            });
        } catch (e) {
            console.log("Error in getSearchResults:", e);
            return App.createPagedResults({ results: [], metadata: undefined });
        }
    }

    async getMangaDetails(mangaId) {
        const cleanId = mangaId.replace(/^\/(?:title|manga)\//, '');
        const fallbackManga = App.createSourceManga({
            id: mangaId,
            mangaId: mangaId,
            mangaInfo: App.createMangaInfo({
                titles: [cleanId.replace(/-/g, ' ')],
                image: '',
                desc: 'MangaFire Details',
                description: 'MangaFire Details',
                status: 'ONGOING'
            })
        });

        try {
            // Try API endpoint first (/api/titles/[cleanId])
            try {
                const apiReq = App.createRequest({
                    url: `${BASE_URL}/api/titles/${cleanId}`,
                    method: 'GET',
                    headers: API_HEADERS
                });
                const apiRes = await this.requestManager.schedule(apiReq, 1);
                if (apiRes && apiRes.data && !this.isCloudflareChallenge(apiRes.data)) {
                    let json = apiRes.data;
                    if (typeof json === 'string' && json.startsWith('{')) {
                        json = JSON.parse(json);
                    }
                    const details = json.result || json.data || json;
                    if (details && (details.title || details.hid)) {
                        const title = details.title || cleanId.replace(/-/g, ' ');
                        const image = this.formatPosterUrl(details);
                        const description = details.synopsisHtml ? details.synopsisHtml.replace(/<[^>]+>/g, '').trim() : (details.description || '');
                        
                        let status = 'ONGOING';
                        const statusRaw = (details.status || '').toLowerCase();
                        if (statusRaw.includes('finish') || statusRaw.includes('complete')) status = 'COMPLETED';

                        const authors = (details.authors || []).map(a => a.title || a.name || a);
                        const artists = (details.artists || []).map(a => a.title || a.name || a);
                        const genreTags = (details.genres || []).map(g => App.createTag({ id: String(g.id || g.title), label: g.title || g.name || String(g) }));

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
                                artist: artists[0] || authors[0] || 'Unknown',
                                tags: genreTags.length > 0 ? [App.createTagSection({ id: '0', label: 'genres', tags: genreTags })] : []
                            })
                        });
                    }
                }
            } catch (e) {
                console.log("API getMangaDetails error:", e);
            }

            // HTML Fallback parsing
            const url = `${BASE_URL}/title/${cleanId}`;
            const request = App.createRequest({
                url: url,
                method: 'GET',
                headers: DEFAULT_HEADERS
            });
            const response = await this.requestManager.schedule(request, 1);
            if (!response || !response.data || this.isCloudflareChallenge(response.data)) {
                return fallbackManga;
            }

            const $ = this.cheerio.load(response.data);

            const title = $('h1.title-detail__title, h1').first().text().trim()
                || $('meta[property="og:title"]').attr('content')?.replace(/ - MangaFire.*/i, '').trim()
                || cleanId.replace(/-/g, ' ');
                
            const image = $('.title-detail__poster img, .title-detail__banner-img, img.cover, .cover img, .poster img').attr('src')
                || $('meta[property="og:image"]').attr('content')
                || '';
                
            const description = $('.title-detail__synopsis p, .title-detail__synopsis, .description, .summary, #synopsis').text().replace(/Read more$/, '').trim()
                || $('meta[property="og:description"]').attr('content')
                || '';

            let status = 'ONGOING';
            const statusText = $('.badge--status, body').text().toLowerCase();
            if (statusText.includes('finished') || statusText.includes('completed')) {
                status = 'COMPLETED';
            }

            const authors = [];
            $('.title-detail__credits a, .info a[href*="/author/"], .info span:contains("Author") + a').each((_, el) => {
                const authorText = $(el).text().trim();
                if (authorText && !authors.includes(authorText)) authors.push(authorText);
            });

            const tags = [];
            $('.title-detail__tags a, a.title-detail__tag, .info a[href*="/genre/"]').each((_, el) => {
                const tagText = $(el).text().trim();
                const tagId = $(el).attr('href')?.split('=').pop() || $(el).attr('href')?.split('/').pop() || tagText;
                if (tagText) {
                    tags.push(App.createTag({
                        id: tagId,
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
                    tags: tags.length > 0 ? [App.createTagSection({ id: '0', label: 'genres', tags: tags })] : []
                })
            });
        } catch (e) {
            console.log("Error in getMangaDetails:", e);
            return fallbackManga;
        }
    }

    parseChapterElements($, containerSelector = "body") {
        const chapters = [];
        const seenChapters = new Set();

        try {
            $(containerSelector).find("a.title-detail__row-link, .title-detail__row a, a[href*='/chapter/'], a[href*='/read/'], .list-chapter a").each((_, el) => {
                const $el = $(el);
                const href = $el.attr("href") || "";
                const text = $el.find('.title-detail__row-num').text().trim() || $el.text().trim() || $el.attr("title") || "";
                
                const numMatch = text.match(/chapter\s*(\d+\.?\d*)/i) || text.match(/\bch(?:apter)?\.?\s*(\d+\.?\d*)/i) || text.match(/(\d+\.?\d*)/);
                const chapNum = numMatch ? parseFloat(numMatch[1]) : 0;
                
                let chapId = href;
                if (chapId.startsWith('/')) chapId = chapId.substring(1);
                
                if (href && (href.includes('/chapter/') || href.includes('/read/')) && !seenChapters.has(chapId)) {
                    seenChapters.add(chapId);
                    chapters.push(App.createChapter({
                        id: chapId,
                        mangaId: chapId.split('/')[1] || '',
                        name: text || `Chapter ${chapNum}`,
                        chapNum: chapNum,
                        langCode: 'en'
                    }));
                }
            });
        } catch (e) {
            console.log("Error in parseChapterElements:", e);
        }
        return chapters;
    }

    async getChapters(mangaId) {
        try {
            const cleanId = mangaId.replace(/^\/(?:title|manga)\//, '');
            const chapters = [];
            const seenChapters = new Set();

            // 1. Try API endpoint (/api/titles/[cleanId]/chapters)
            try {
                const apiReq = App.createRequest({
                    url: `${BASE_URL}/api/titles/${cleanId}/chapters`,
                    method: 'GET',
                    headers: API_HEADERS
                });
                const apiRes = await this.requestManager.schedule(apiReq, 1);
                if (apiRes && apiRes.data && !this.isCloudflareChallenge(apiRes.data)) {
                    let json = apiRes.data;
                    if (typeof json === 'string' && json.startsWith('{')) {
                        json = JSON.parse(json);
                    }
                    const rawChapters = json.items || json.result?.items || json.data || json.chapters || [];
                    if (Array.isArray(rawChapters) && rawChapters.length > 0) {
                        for (const item of rawChapters) {
                            const cId = String(item.id || item.hid || item.slug || '');
                            const chapNum = typeof item.number === 'number' ? item.number : parseFloat(item.number || '0');
                            const name = item.name || `Chapter ${chapNum}`;
                            const path = `title/${cleanId}/chapter/${cId}`;

                            if (cId && !seenChapters.has(path)) {
                                seenChapters.add(path);
                                chapters.push(App.createChapter({
                                    id: path,
                                    mangaId: cleanId,
                                    name: name,
                                    chapNum: chapNum,
                                    langCode: 'en'
                                }));
                            }
                        }
                    }
                }
            } catch (e) {
                console.log("API getChapters error:", e);
            }

            if (chapters.length > 0) return chapters.reverse();

            // 2. HTML parsing
            const url = `${BASE_URL}/title/${cleanId}`;
            const request = App.createRequest({
                url: url,
                method: 'GET',
                headers: DEFAULT_HEADERS
            });
            const response = await this.requestManager.schedule(request, 1);
            if (!response || !response.data || this.isCloudflareChallenge(response.data)) {
                return [];
            }

            let $ = this.cheerio.load(response.data);
            let htmlChapters = this.parseChapterElements($);

            // 3. AJAX Fallback
            if (htmlChapters.length === 0) {
                try {
                    const ajaxReq = App.createRequest({
                        url: `${BASE_URL}/ajax/manga/${cleanId}/chapter/en`,
                        method: 'GET',
                        headers: AJAX_HEADERS
                    });
                    const ajaxRes = await this.requestManager.schedule(ajaxReq, 1);
                    let ajaxHtml = ajaxRes?.data;
                    if (typeof ajaxHtml === 'string' && ajaxHtml.startsWith('{')) {
                        try {
                            const json = JSON.parse(ajaxHtml);
                            if (json?.result?.html) ajaxHtml = json.result.html;
                            else if (json?.html) ajaxHtml = json.html;
                        } catch(e) {}
                    }
                    if (ajaxHtml && !this.isCloudflareChallenge(ajaxHtml)) {
                        $ = this.cheerio.load(ajaxHtml);
                        htmlChapters = this.parseChapterElements($);
                    }
                } catch(e) {
                    console.log("AJAX chapter fallback error:", e);
                }
            }
            
            return htmlChapters.reverse();
        } catch (e) {
            console.log("Error in getChapters:", e);
            return [];
        }
    }

    parseReaderPageImages($) {
        const pages = [];
        try {
            $("img.page-image, .chapter-page img, img[data-src], .reader-page img, #reader img, .swiper-slide img, div[data-url]").each((_, el) => {
                let src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-url") || $(el).attr("data-original") || "";
                if (src && !src.startsWith("http")) src = BASE_URL + (src.startsWith('/') ? '' : '/') + src;
                if (src && !pages.includes(src) && !src.includes("favicon") && !src.includes("logo")) pages.push(src);
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
        } catch (e) {
            console.log("Error in parseReaderPageImages:", e);
        }
        return pages;
    }

    async getChapterDetails(mangaId, chapterId) {
        const fallbackDetails = App.createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: []
        });

        try {
            const cleanChapterId = chapterId.replace(/^\//, '');
            const pages = [];

            // 1. Try API endpoint (/api/chapters/[id])
            const chapterNumId = cleanChapterId.split('/').pop();
            if (chapterNumId) {
                try {
                    const apiReq = App.createRequest({
                        url: `${BASE_URL}/api/chapters/${chapterNumId}`,
                        method: 'GET',
                        headers: API_HEADERS
                    });
                    const apiRes = await this.requestManager.schedule(apiReq, 1);
                    if (apiRes && apiRes.data && !this.isCloudflareChallenge(apiRes.data)) {
                        let json = apiRes.data;
                        if (typeof json === 'string' && json.startsWith('{')) {
                            json = JSON.parse(json);
                        }
                        const rawPages = json.pages || json.result?.pages || json.data?.pages || [];
                        if (Array.isArray(rawPages) && rawPages.length > 0) {
                            rawPages.forEach(p => {
                                const url = typeof p === 'string' ? p : (p.url || p.src || '');
                                if (url && !pages.includes(url)) pages.push(url);
                            });
                        }
                    }
                } catch (e) {
                    console.log("API getChapterDetails error:", e);
                }
            }

            if (pages.length > 0) {
                return App.createChapterDetails({
                    id: chapterId,
                    mangaId: mangaId,
                    pages: pages,
                });
            }

            // 2. HTML parsing
            let url = cleanChapterId.startsWith("http") ? cleanChapterId : `${BASE_URL}/${cleanChapterId}`;
            if (!url.includes(BASE_URL)) {
                url = `${BASE_URL}/${cleanChapterId}`;
            }
            
            const request = App.createRequest({
                url: url,
                method: 'GET',
                headers: DEFAULT_HEADERS
            });
            
            const response = await this.requestManager.schedule(request, 1);
            if (!response || !response.data || this.isCloudflareChallenge(response.data)) {
                return fallbackDetails;
            }

            let $ = this.cheerio.load(response.data);
            let htmlPages = this.parseReaderPageImages($);

            // 3. AJAX Fallback
            if (htmlPages.length === 0) {
                try {
                    const ajaxReq = App.createRequest({
                        url: `${BASE_URL}/ajax/read/${cleanChapterId}/list`,
                        method: 'GET',
                        headers: AJAX_HEADERS
                    });
                    const ajaxRes = await this.requestManager.schedule(ajaxReq, 1);
                    let ajaxData = ajaxRes?.data;
                    if (typeof ajaxData === 'string' && ajaxData.startsWith('{')) {
                        try {
                            const json = JSON.parse(ajaxData);
                            if (json?.result?.images) {
                                json.result.images.forEach(imgArr => {
                                    const imgUrl = Array.isArray(imgArr) ? imgArr[0] : imgArr;
                                    if (imgUrl && !htmlPages.includes(imgUrl)) htmlPages.push(imgUrl);
                                });
                            } else if (json?.result?.html) {
                                $ = this.cheerio.load(json.result.html);
                                htmlPages = this.parseReaderPageImages($);
                            }
                        } catch(e) {}
                    }
                } catch(e) {
                    console.log("AJAX reader fallback error:", e);
                }
            }

            return App.createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                pages: htmlPages,
            });
        } catch (e) {
            console.log("Error in getChapterDetails:", e);
            return fallbackDetails;
        }
    }

    getMangaShareUrl(mangaId) {
        const cleanId = mangaId.replace(/^\/(?:title|manga)\//, '');
        return `${BASE_URL}/title/${cleanId}`;
    }

    // Legacy method compatibility aliases for Paperback 0.8
    async getMangaList(searchTerm = "", page = 1) {
        try {
            const pagedResults = await this.getSearchResults(searchTerm, { page });
            return pagedResults?.results || [];
        } catch (e) {
            return [];
        }
    }

    async getMangaItems(searchTerm = "", page = 1) {
        return this.getMangaList(searchTerm, page);
    }

    async getChapterList(mangaId) {
        try {
            return await this.getChapters(mangaId);
        } catch (e) {
            return [];
        }
    }

    async getChapter(chapterId) {
        try {
            const details = await this.getChapterDetails("", chapterId);
            return details?.pages || [];
        } catch (e) {
            return [];
        }
    }
}

// Universal top-level exports for Paperback 0.8 iOS JavaScriptCore
var g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
if (typeof exports === 'undefined') {
    g.exports = g.exports || {};
}
var exp = typeof exports !== 'undefined' ? exports : g.exports;

exp.mangafireInfo = mangafireInfo;
exp.mangafire = MangaFire;
exp.MangaFire = MangaFire;

g.mangafireInfo = mangafireInfo;
g.mangafire = MangaFire;
g.MangaFire = MangaFire;
g.Sources = g.Sources || {};
g.Sources.mangafireInfo = mangafireInfo;
g.Sources.mangafire = MangaFire;
g.Sources.MangaFire = MangaFire;
