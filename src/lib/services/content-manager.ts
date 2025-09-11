import type { ExtensionSettings } from "~/types/types"
import { fetchHtml } from "./"
import { ContentCache, ContentProcessor } from "./"
import {
    findPreviousChapterUrl,
    findFictionOverviewUrl,
} from "~/lib/utils/dom-utils"

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
    static async fetchRecap(settings: ExtensionSettings) {
        // 1. Find previous chapter URL from DOM
        const prevChapterUrlResult = findPreviousChapterUrl(settings)
        if ("error" in prevChapterUrlResult) {
            return prevChapterUrlResult
        }

        const prevChapterUrl = prevChapterUrlResult.data

        // 2. Check cache first
        const cachedHtml = ContentCache.getRecap(prevChapterUrl)
        if (cachedHtml) {
            // Use cached content
            const processResult = ContentProcessor.createRecap(
                cachedHtml,
                settings,
            )
            if ("error" in processResult) {
                return processResult
            }
            return { content: processResult.content, type: "recap" }
        }

        // 3. Fetch from network
        const fetchResult = await fetchHtml(prevChapterUrl)
        if ("error" in fetchResult) {
            return {
                error: `Failed to fetch previous chapter: ${fetchResult.error}`,
            }
        }

        // 4. Cache the raw HTML
        ContentCache.setRecap(prevChapterUrl, fetchResult.data)

        // 5. Process the content
        const processResult = ContentProcessor.createRecap(
            fetchResult.data,
            settings,
        )
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
    static async fetchBlurb(settings: ExtensionSettings) {
        // 1. Find fiction overview URL from DOM
        const overviewUrlResult = findFictionOverviewUrl(settings)
        if ("error" in overviewUrlResult) {
            return overviewUrlResult
        }

        const overviewUrl = overviewUrlResult.data

        // 2. Fetch from network (no caching for blurb)
        const fetchResult = await fetchHtml(overviewUrl)
        if ("error" in fetchResult) {
            return {
                error: `Failed to fetch story overview: ${fetchResult.error}`,
            }
        }

        // 3. Process the content
        const processResult = ContentProcessor.createBlurb(
            fetchResult.data,
            settings,
        )
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
        const prevChapterUrlResult = findPreviousChapterUrl(settings)
        if ("error" in prevChapterUrlResult) {
            return prevChapterUrlResult
        }

        const prevChapterUrl = prevChapterUrlResult.data

        // 2. Get cached HTML
        const cachedHtml = ContentCache.getRecap(prevChapterUrl)
        if (!cachedHtml) {
            return {
                error: "No cached content available. Please refresh to fetch new content.",
            }
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
    static hasRecapInCache(settings: ExtensionSettings) {
        const prevChapterUrlResult = findPreviousChapterUrl(settings)
        if ("error" in prevChapterUrlResult) {
            return false
        }

        return ContentCache.hasRecap(prevChapterUrlResult.data)
    }

    /**
     * Clears all cached content
     */
    static clearCache() {
        ContentCache.clearRecapCache()
    }
}
