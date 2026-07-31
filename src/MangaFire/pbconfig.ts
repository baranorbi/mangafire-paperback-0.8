import { ContentRating, SourceInfo, SourceIntents } from '@paperback/types';

export default {
    name: 'MangaFire',
    description: 'MangaFire.to extension for Paperback 0.8',
    version: '1.0.16',
    icon: 'icon.png',
    language: 'en',
    contentRating: ContentRating.MATURE,
    badges: [],
    intents: SourceIntents.MANGA_CHAPTERS | SourceIntents.HOMEPAGE_SECTIONS | SourceIntents.CLOUDFLARE_BYPASS_REQUIRED,
    author: 'nahamah',
    websiteBaseURL: 'https://mangafire.to'
} as SourceInfo;
