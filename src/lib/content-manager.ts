import type { ExtensionSettings } from "~/types/types"
import { HttpClient, ContentCache, ContentProcessor } from "./services"

/**
 * Content Manager Service - Orchestrates content fetching, caching, and processing
 * Returns result objects without side effects
 */
export class ContentManager {
    /**
     * Fetches and processes recap content
     * Uses caching to avoid re-fetching on settings changes
     * @param settings - Extension settings
     * @returns Processed recap content or error message
     */
    static async fetchRecap(
        settings: ExtensionSettings,
    ): Promise<{ content: string; type: "recap" } | { error: string }> {
        // 1. Find previous chapter URL from DOM
        const prevChapterUrlResult = this.findPreviousChapterUrl(settings)
        if ("error" in prevChapterUrlResult) {
            return prevChapterUrlResult
        }

        const prevChapterUrl = prevChapterUrlResult.data

        // 2. Check cache first
        const cachedHtml = ContentCache.getRecap(prevChapterUrl)
        if (cachedHtml) {
            // Use cached content
            const processResult = ContentProcessor.createRecap(cachedHtml, settings)
            if ("error" in processResult) {
                return processResult
            }
            return { content: processResult.content, type: "recap" }
        }

        // 3. Fetch from network
        const fetchResult = await HttpClient.fetchHtml(prevChapterUrl)
        if ("error" in fetchResult) {
            return { error: `Failed to fetch previous chapter: ${fetchResult.error}` }
        }

        // 4. Cache the raw HTML
        ContentCache.setRecap(prevChapterUrl, fetchResult.data)

        // 5. Process the content
        const processResult = ContentProcessor.createRecap(fetchResult.data, settings)
        if ("error" in processResult) {
            return processResult
        }

        return { content: processResult.content, type: "recap" }
    }

    /**
     * Fetches and processes blurb content
     * No caching needed since blurb doesn't change based on settings
     * @param settings - Extension settings
     * @returns Processed blurb content or error message
     */
    static async fetchBlurb(
        settings: ExtensionSettings,
    ): Promise<{ content: string; type: "blurb" } | { error: string }> {
        // 1. Find fiction overview URL from DOM
        const overviewUrlResult = this.findFictionOverviewUrl(settings)
        if ("error" in overviewUrlResult) {
            return overviewUrlResult
        }

        const overviewUrl = overviewUrlResult.data

        // 2. Fetch from network (no caching for blurb)
        const fetchResult = await HttpClient.fetchHtml(overviewUrl)
        if ("error" in fetchResult) {
            return { error: `Failed to fetch story overview: ${fetchResult.error}` }
        }

        // 3. Process the content
        const processResult = ContentProcessor.createBlurb(fetchResult.data, settings)
        if ("error" in processResult) {
            return processResult
        }

        return { content: processResult.content, type: "blurb" }
    }

    /**
     * Refreshes recap content using cached HTML with new settings
     * This allows word count changes without re-fetching
     * @param settings - Updated extension settings
     * @returns Refreshed recap content or error message
     */
    static refreshRecapFromCache(
        settings: ExtensionSettings,
    ): { content: string; type: "recap" } | { error: string } {
        // 1. Find previous chapter URL
        const prevChapterUrlResult = this.findPreviousChapterUrl(settings)
        if ("error" in prevChapterUrlResult) {
            return prevChapterUrlResult
        }

        const prevChapterUrl = prevChapterUrlResult.data

        // 2. Get cached HTML
        const cachedHtml = ContentCache.getRecap(prevChapterUrl)
        if (!cachedHtml) {
            return { error: "No cached content available. Please refresh to fetch new content." }
        }

        // 3. Process with new settings
        const processResult = ContentProcessor.createRecap(cachedHtml, settings)
        if ("error" in processResult) {
            return processResult
        }

        return { content: processResult.content, type: "recap" }
    }

    /**
     * Checks if recap content is available in cache
     * @param settings - Extension settings
     * @returns True if content is cached
     */
    static hasRecapInCache(settings: ExtensionSettings): boolean {
        const prevChapterUrlResult = this.findPreviousChapterUrl(settings)
        if ("error" in prevChapterUrlResult) {
            return false
        }

        return ContentCache.hasRecap(prevChapterUrlResult.data)
    }

    /**
     * Clears all cached content
     */
    static clearCache(): void {
        ContentCache.clearRecapCache()
    }

    /**
     * Finds the previous chapter URL from the current page DOM
     */
    private static findPreviousChapterUrl(
        settings: ExtensionSettings,
    ): { data: string } | { error: string } {
        const prevChapterBtn = document.querySelector(settings.prevChapterBtn)

        if (!(prevChapterBtn instanceof HTMLAnchorElement)) {
            return {
                error: "Could not find previous chapter button. Make sure you're on a chapter page with a previous chapter.",
            }
        }

        if (!prevChapterBtn.href) {
            return {
                error: "Previous chapter button found but has no link. This might be the first chapter.",
            }
        }

        return { data: prevChapterBtn.href }
    }

    /**
     * Finds the fiction overview URL from the current page DOM
     */
    private static findFictionOverviewUrl(
        settings: ExtensionSettings,
    ): { data: string } | { error: string } {
        const fictionTitleElement = document.querySelector(settings.fictionTitle)

        if (!fictionTitleElement) {
            return {
                error: "Could not find fiction title on current page.",
            }
        }

        if (!(fictionTitleElement.parentElement instanceof HTMLAnchorElement)) {
            return {
                error: "Fiction title found but is not linked to overview page.",
            }
        }

        if (!fictionTitleElement.parentElement.href) {
            return {
                error: "Fiction title link found but has no URL.",
            }
        }

        return { data: fictionTitleElement.parentElement.href }
    }
}
