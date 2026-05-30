import { Source } from "paperback-extensions-common";

const BASE_URL = "https://mangafire.to";

export default class MangaFire extends Source {
    get id() { return "mangafire"; }
    get name() { return "MangaFire"; }
    get icon() { return "https://mangafire.to/favicon.ico"; }
    get version() { return "1.2.0"; }
    get author() { return "Personalizada por Grok"; }
    get website() { return BASE_URL; }
    get language() { return "es"; }

    // Filtros que quieres (All, Manga, Manhua, Manhwa, Trending)
    getFilterList() {
        return [
            {
                id: "type",
                type: "single",
                name: "Tipo",
                options: [
                    { id: "all", name: "All" },
                    { id: "manga", name: "Manga (Japón)" },
                    { id: "manhua", name: "Manhua (China)" },
                    { id: "manhwa", name: "Manhwa (Corea)" },
                    { id: "trending", name: "Trending" }
                ]
            }
        ];
    }

    async getMangaList(searchTerm = "", page = 1, filters = {}) {
        let url = `${BASE_URL}/home`;

        const request = createRequestObject({ url, method: "GET" });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const mangas = [];

        // Selector preciso del código fuente que me diste
        $("div.original.card-lg div.unit").each((_, element) => {
            const $el = $(element);

            const posterHref = $el.find("a.poster").attr("href") || "";
            const id = posterHref.split("/").pop() || "";

            const title = $el.find("div.info > a").last().text().trim();
            const image = $el.find("a.poster img").attr("src") || "";
            const type = $el.find("span.type").text().trim();

            if (title && id) {
                mangas.push(createManga({
                    id: id,
                    title: title,
                    image: image.startsWith("http") ? image : BASE_URL + image,
                }));
            }
        });

        return mangas;
    }

    async getMangaDetails(mangaId) {
        const url = `${BASE_URL}/manga/${mangaId}`;
        const request = createRequestObject({ url, method: "GET" });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const title = $("h1").first().text().trim();
        const image = $("div.poster img, img.cover, .main-cover img").attr("src") || "";
        const description = $(".description, .summary, .content p").text().trim();

        return createManga({
            id: mangaId,
            title: title || "Sin título",
            image: image.startsWith("http") ? image : BASE_URL + image,
            description: description,
        });
    }

    async getChapterList(mangaId) {
        const url = `${BASE_URL}/manga/${mangaId}`;
        const request = createRequestObject({ url, method: "GET" });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const chapters = [];

        $("a[href*='/read/'], .chapter-item a, li a[href*='/chapter-']").each((_, el) => {
            const href = $(el).attr("href") || "";
            const text = $(el).text().trim();

            const chapMatch = text.match(/Chap?\s*(\d+\.?\d*)/i);
            const chapNum = chapMatch ? parseFloat(chapMatch[1]) : 0;

            if (href && chapNum > 0) {
                chapters.push(createChapter({
                    id: href,
                    name: text || `Capítulo ${chapNum}`,
                    chapNum: chapNum,
                }));
            }
        });

        return chapters.reverse(); // más nuevos primero
    }

    async getChapter(chapterId) {
        const url = chapterId.startsWith("http") ? chapterId : `${BASE_URL}${chapterId}`;
        const request = createRequestObject({ url, method: "GET" });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const pages = [];

        $("img.page-image, .chapter-page img, img[data-src], img[src*='static.mfcdn']").each((_, el) => {
            let src = $(el).attr("src") || $(el).attr("data-src") || "";
            if (src && src.startsWith("/")) src = BASE_URL + src;
            if (src) pages.push(src);
        });

        return pages;
    }
}
