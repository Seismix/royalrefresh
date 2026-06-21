import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock the HTTP layer. The services barrel (./) re-exports fetchHtml from
// ./http-client, and ContentManager imports it via the barrel — so mocking the
// underlying module replaces it everywhere.
vi.mock("./http-client", () => ({
    fetchHtml: vi.fn(),
}))

import { fetchHtml } from "./http-client"
import { ContentManager } from "./content-manager"
import { ContentCache } from "./content-cache"
import { getDefaults } from "~/lib/config/defaults"
import { prevChapterHtml } from "~/tests/fixtures"
import type { ExtensionSettings } from "~/types/types"

const mockedFetch = vi.mocked(fetchHtml)
const settings = getDefaults() as ExtensionSettings

// Seed the current page DOM so findPreviousChapterUrl + the fiction-title
// extraction inside ContentProcessor both succeed.
function seedChapterPage() {
    document.body.innerHTML = `
        <a href="https://www.royalroad.com/fiction/1/x">
            <h2 class="font-white">Test Story</h2>
        </a>
        <div class="actions">
            <a href="https://www.royalroad.com/fiction/1/x/chapter/1/start">
                <i class="fa fa-chevron-double-left"></i>
            </a>
        </div>`
}

describe("ContentManager.fetchRecap", () => {
    beforeEach(() => {
        ContentCache.clearRecapCache()
        mockedFetch.mockReset()
        seedChapterPage()
    })

    afterEach(() => {
        ContentCache.clearRecapCache()
    })

    it("cache miss -> fetches, caches, and processes", async () => {
        mockedFetch.mockResolvedValue({ data: prevChapterHtml })

        const result = await ContentManager.fetchRecap(settings)

        expect(mockedFetch).toHaveBeenCalledTimes(1)
        expect("content" in result).toBe(true)
        if ("error" in result) throw new Error(result.error)
        expect(result.type).toBe("recap")
        expect(result.content).toContain("RoyalRefresh of Test Story")

        // Raw HTML is now cached under the prev-chapter URL
        expect(
            ContentCache.hasRecap(
                "https://www.royalroad.com/fiction/1/x/chapter/1/start",
            ),
        ).toBe(true)
    })

    it("cache hit -> does NOT fetch again", async () => {
        ContentCache.setRecap(
            "https://www.royalroad.com/fiction/1/x/chapter/1/start",
            prevChapterHtml,
        )

        const result = await ContentManager.fetchRecap(settings)

        expect(mockedFetch).not.toHaveBeenCalled()
        if ("error" in result) throw new Error(result.error)
        expect(result.content).toContain("RoyalRefresh of Test Story")
    })

    it("propagates fetch errors", async () => {
        mockedFetch.mockResolvedValue({ error: "boom from network" })

        const result = await ContentManager.fetchRecap(settings)

        expect("error" in result).toBe(true)
        if ("content" in result) throw new Error("expected error")
        expect(result.error).toBe("boom from network")
    })

    it("errors early (no fetch) when there is no previous chapter button", async () => {
        document.body.innerHTML = `<a href="https://www.royalroad.com/fiction/1/x"><h2 class="font-white">Test Story</h2></a>`

        const result = await ContentManager.fetchRecap(settings)

        expect(mockedFetch).not.toHaveBeenCalled()
        expect("error" in result).toBe(true)
    })
})

describe("ContentManager.refreshRecapFromCache", () => {
    beforeEach(() => {
        ContentCache.clearRecapCache()
        mockedFetch.mockReset()
        seedChapterPage()
    })

    afterEach(() => {
        ContentCache.clearRecapCache()
    })

    it("reprocesses cached HTML with new settings, no fetch", () => {
        ContentCache.setRecap(
            "https://www.royalroad.com/fiction/1/x/chapter/1/start",
            prevChapterHtml,
        )

        const result = ContentManager.refreshRecapFromCache({
            ...settings,
            wordCount: 4,
        })

        expect(mockedFetch).not.toHaveBeenCalled()
        if ("error" in result) throw new Error(result.error)
        expect(result.type).toBe("recap")
        // wordCount=4 truncates the final paragraph with the "..." marker
        expect(result.content).toContain("...")
    })

    it("errors when there is no cached content", () => {
        const result = ContentManager.refreshRecapFromCache(settings)

        expect("error" in result).toBe(true)
        if ("content" in result) throw new Error("expected error")
        expect(result.error).toMatch(/no cached content/i)
    })
})
