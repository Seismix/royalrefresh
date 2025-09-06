/**
 * Content Cache Service - Manages caching of fetched HTML content
 * Provides separate caching strategies for different content types
 */
import { CACHE_TTL_MS } from "~/lib/config/defaults"

export class ContentCache {
    private static recapCache = new Map<
        string,
        { html: string; timestamp: number }
    >()

    private static readonly CACHE_TTL = CACHE_TTL_MS

    /**
     * Gets cached recap content by URL
     * @param url - The URL to look up in cache
     * @returns Cached HTML content or null if not found/expired
     */
    static getRecap(url: string): string | null {
        const cached = this.recapCache.get(url)
        if (!cached) {
            return null
        }

        // Check if cache has expired
        if (Date.now() - cached.timestamp > this.CACHE_TTL) {
            this.recapCache.delete(url)
            return null
        }

        return cached.html
    }

    /**
     * Stores recap content in cache
     * @param url - The URL key for the cached content
     * @param html - The HTML content to cache
     */
    static setRecap(url: string, html: string): void {
        this.recapCache.set(url, {
            html,
            timestamp: Date.now(),
        })
    }

    /**
     * Checks if recap content is cached for a URL
     * @param url - The URL to check
     * @returns True if content is cached and not expired
     */
    static hasRecap(url: string): boolean {
        return this.getRecap(url) !== null
    }

    /**
     * Clears all cached recap content
     */
    static clearRecapCache(): void {
        this.recapCache.clear()
    }


}
