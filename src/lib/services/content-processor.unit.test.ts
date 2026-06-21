import { beforeEach, describe, expect, it } from "vitest"
import { ContentProcessor } from "./content-processor"
import { getDefaults } from "~/lib/config/defaults"
import { prevChapterHtml, fictionOverviewHtml } from "~/tests/fixtures"
import type { ExtensionSettings } from "~/types/types"

// createRecap / createBlurb read the FICTION TITLE from the current document
// (the page the reader is on) and the rest from the parsed HTML argument. So we
// seed document.body with the fiction title for the happy paths.
const settings = (overrides: Partial<ExtensionSettings> = {}) =>
    getDefaults(overrides) as ExtensionSettings

function seedFictionTitle(title = "Test Story") {
    document.body.innerHTML = `<a href="https://www.royalroad.com/fiction/1/x"><h2 class="font-white">${title}</h2></a>`
}

describe("ContentProcessor.createRecap", () => {
    beforeEach(() => {
        seedFictionTitle()
    })

    it("builds the recap heading, chapter name and word-count line", () => {
        const result = ContentProcessor.createRecap(prevChapterHtml, settings())
        expect("content" in result).toBe(true)
        if ("error" in result) throw new Error(result.error)

        expect(result.content).toContain("RoyalRefresh of Test Story")
        expect(result.content).toContain(
            "Previous chapter: Chapter 1: The Start",
        )
        expect(result.content).toContain("Showing last ~250 words:")
    })

    it("strips <script> tags via the sanitizer", () => {
        const result = ContentProcessor.createRecap(prevChapterHtml, settings())
        if ("error" in result) throw new Error(result.error)

        expect(result.content).not.toContain("<script")
        expect(result.content).not.toContain("__danger")
    })

    it("limits to the last N words from the END of the chapter", () => {
        // The fixture's last paragraph is exactly 10 words. With wordCount=10
        // we should get ONLY that paragraph (the chapter's ending), and none of
        // the earlier paragraphs.
        const result = ContentProcessor.createRecap(
            prevChapterHtml,
            settings({ wordCount: 10 }),
        )
        if ("error" in result) throw new Error(result.error)

        expect(result.content).toContain("Uniform victor whiskey")
        expect(result.content).not.toContain("Alpha bravo charlie")
        expect(result.content).not.toContain("Kilo lima mike")
    })

    it("inserts the '...' truncation marker when a paragraph is partially included", () => {
        // wordCount=4 -> last paragraph (10 words) gets truncated to its last 4,
        // prefixed with the "..." marker.
        const result = ContentProcessor.createRecap(
            prevChapterHtml,
            settings({ wordCount: 4 }),
        )
        if ("error" in result) throw new Error(result.error)

        expect(result.content).toContain("...")
        expect(result.content).toContain("one two three four")
        expect(result.content).not.toContain("Uniform victor")
    })

    it("returns {error} when the fiction title selector is missing", () => {
        document.body.innerHTML = "<div>no title here</div>"
        const result = ContentProcessor.createRecap(prevChapterHtml, settings())

        expect("error" in result).toBe(true)
        if ("content" in result) throw new Error("expected error")
        expect(result.error).toMatch(/story title/i)
    })

    it("returns {error} when the previous chapter title selector is missing", () => {
        const result = ContentProcessor.createRecap(
            "<html><body><div class='chapter-inner'><p>x</p></div></body></html>",
            settings(),
        )

        expect("error" in result).toBe(true)
        if ("content" in result) throw new Error("expected error")
        expect(result.error).toMatch(/previous chapter's title/i)
    })

    it("returns {error} when the chapter content selector is missing", () => {
        const result = ContentProcessor.createRecap(
            "<html><body><h1 class='font-white'>Chapter 1</h1></body></html>",
            settings(),
        )

        expect("error" in result).toBe(true)
        if ("content" in result) throw new Error("expected error")
        expect(result.error).toMatch(/previous chapter's content/i)
    })
})

describe("ContentProcessor.createBlurb", () => {
    beforeEach(() => {
        seedFictionTitle()
    })

    it("extracts the blurb body and labels, with a Blurb heading", () => {
        const result = ContentProcessor.createBlurb(
            fictionOverviewHtml,
            settings(),
        )
        if ("error" in result) throw new Error(result.error)

        expect(result.content).toContain("Blurb: Test Story")
        expect(result.content).toContain("A hero rises from humble beginnings")
        expect(result.content).toContain("Will they prevail?")
        // Labels are included
        expect(result.content).toContain("Fantasy")
    })

    it("strips <script> from the blurb via the sanitizer", () => {
        const result = ContentProcessor.createBlurb(
            fictionOverviewHtml,
            settings(),
        )
        if ("error" in result) throw new Error(result.error)

        expect(result.content).not.toContain("<script")
        expect(result.content).not.toContain("__danger")
    })

    it("returns {error} when the blurb selector is missing", () => {
        const result = ContentProcessor.createBlurb(
            "<html><body><div>nothing</div></body></html>",
            settings(),
        )

        expect("error" in result).toBe(true)
        if ("content" in result) throw new Error("expected error")
        expect(result.error).toMatch(/story blurb/i)
    })

    it("returns {error} when the blurb is present but empty", () => {
        const result = ContentProcessor.createBlurb(
            "<html><body><div class='description'><div class='hidden-content'>   </div></div></body></html>",
            settings(),
        )

        expect("error" in result).toBe(true)
        if ("content" in result) throw new Error("expected error")
        expect(result.error).toMatch(/empty/i)
    })

    it("returns {error} when the fiction title is missing", () => {
        document.body.innerHTML = "<div>no title</div>"
        const result = ContentProcessor.createBlurb(
            fictionOverviewHtml,
            settings(),
        )

        expect("error" in result).toBe(true)
        if ("content" in result) throw new Error("expected error")
        expect(result.error).toMatch(/story title/i)
    })
})
