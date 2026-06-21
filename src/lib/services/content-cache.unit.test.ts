import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ContentCache } from "./content-cache"
import { CACHE_TTL_MS } from "~/lib/config/defaults"

describe("ContentCache", () => {
    beforeEach(() => {
        ContentCache.clearRecapCache()
    })

    afterEach(() => {
        vi.useRealTimers()
        ContentCache.clearRecapCache()
    })

    it("round-trips set -> get for a URL", () => {
        const url = "https://www.royalroad.com/fiction/1/x/chapter/2/y"
        ContentCache.setRecap(url, "<p>hello</p>")

        expect(ContentCache.getRecap(url)).toBe("<p>hello</p>")
    })

    it("returns null for an unknown URL", () => {
        expect(ContentCache.getRecap("https://example.com/missing")).toBeNull()
    })

    it("hasRecap reflects presence", () => {
        const url = "https://www.royalroad.com/fiction/1/x/chapter/2/y"
        expect(ContentCache.hasRecap(url)).toBe(false)

        ContentCache.setRecap(url, "<p>cached</p>")
        expect(ContentCache.hasRecap(url)).toBe(true)
    })

    it("clearRecapCache empties the cache", () => {
        const url = "https://www.royalroad.com/fiction/1/x/chapter/2/y"
        ContentCache.setRecap(url, "<p>cached</p>")
        ContentCache.clearRecapCache()

        expect(ContentCache.getRecap(url)).toBeNull()
        expect(ContentCache.hasRecap(url)).toBe(false)
    })

    it("expires entries after the TTL (fake timers)", () => {
        vi.useFakeTimers()
        vi.setSystemTime(0)

        const url = "https://www.royalroad.com/fiction/1/x/chapter/2/y"
        ContentCache.setRecap(url, "<p>cached</p>")

        // Just before expiry -> still present
        vi.setSystemTime(CACHE_TTL_MS)
        expect(ContentCache.getRecap(url)).toBe("<p>cached</p>")

        // Past expiry -> gone (and lazily deleted)
        vi.setSystemTime(CACHE_TTL_MS + 1)
        expect(ContentCache.getRecap(url)).toBeNull()
        expect(ContentCache.hasRecap(url)).toBe(false)
    })
})
