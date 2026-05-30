import { Source } from "paperback-extensions-common";

const MANGAFIRE_URL = "https://mangafire.to";

export default class MangaFire extends Source {
    get id() { return "mangafire"; }
    get name() { return "MangaFire"; }
    get icon() { return "https://mangafire.to/favicon.ico"; }
    get version() { return "1.0.0"; }
    get author() { return "TuNombre"; }
    get website() { return MANGAFIRE_URL; }
    get language() { return "es"; }   // o "en" si prefieres

    async getMangaList(searchTerm = "", page = 1) {
        // Usa la API de búsqueda de MangaFire
        const url = `${MANGAFIRE_URL}/api/search?query=${encodeURIComponent(searchTerm)}&page=${page}`;
        const request = createRequestObject({ url, method: "GET" });
        const response = await this.requestManager.schedule(request, 1);
        const data = JSON.parse(response.data);

        return data.results.map(manga => {
            return createManga({
                id: manga.slug || manga.id,
                title: manga.title,
                image: manga.cover || manga.image,
                author: manga.author || "",
                description: manga.description || "",
                status: manga.status,
            });
        });
    }

    async getMangaDetails(mangaId) {
        const url = `${MANGAFIRE_URL}/api/manga/${mangaId}`;
        const request = createRequestObject({ url, method: "GET" });
        const response = await this.requestManager.schedule(request, 1);
        const data = JSON.parse(response.data);

        return createManga({
            id: mangaId,
            title: data.title,
            image: data.cover,
            author: data.author,
            description: data.description,
            genres: data.genres || [],
            status: data.status,
        });
    }

    async getChapterList(mangaId) {
        const url = `${MANGAFIRE_URL}/api/manga/${mangaId}/chapters`;
        const request = createRequestObject({ url, method: "GET" });
        const response = await this.requestManager.schedule(request, 1);
        const data = JSON.parse(response.data);

        return data.chapters.map(ch => {
            return createChapter({
                id: ch.id,
                name: `Capítulo ${ch.number}`,
                chapNum: parseFloat(ch.number),
                dateUpload: new Date(ch.date),
            });
        }).reverse();   // más nuevos primero
    }

    async getChapter(chapterId) {
        const url = `${MANGAFIRE_URL}/api/chapter/${chapterId}/pages`;
        const request = createRequestObject({ url, method: "GET" });
        const response = await this.requestManager.schedule(request, 1);
        const data = JSON.parse(response.data);

        return data.pages.map(page => page.url || page.image);
    }
}
