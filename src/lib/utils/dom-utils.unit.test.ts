import { describe, expect, it } from "vitest"
import { isChapterUrl } from "./dom-utils"
import { LegacyAdapter, LEGACY_SELECTORS } from "~/lib/adapters/legacy-adapter"

const adapter = new LegacyAdapter()
const sel = LEGACY_SELECTORS

describe("isChapterUrl", () => {
    it("is true when 'chapter' is a path segment", () => {
        expect(
            isChapterUrl(
                "https://www.royalroad.com/fiction/1/x/chapter/2/the-start",
            ),
        ).toBe(true)
    })

    it("is false for a fiction overview URL", () => {
        expect(isChapterUrl("https://www.royalroad.com/fiction/1/x")).toBe(
            false,
        )
    })

    it("is false (not thrown) for an invalid URL", () => {
        expect(isChapterUrl("not a url")).toBe(false)
    })
})

describe("LegacyAdapter.findPreviousChapterUrl", () => {
    it("returns the href when the prev-chapter button is a valid anchor", () => {
        document.body.innerHTML = `
            <div class="actions">
                <a href="https://www.royalroad.com/fiction/1/x/chapter/1/start">
                    <i class="fa fa-chevron-double-left"></i>
                </a>
            </div>`

        const result = adapter.findPreviousChapterUrl(sel)
        expect("data" in result).toBe(true)
        if ("error" in result) throw new Error(result.error)
        expect(result.data).toBe(
            "https://www.royalroad.com/fiction/1/x/chapter/1/start",
        )
    })

    it("errors when the matched element is not an anchor", () => {
        // No matching anchor at all -> querySelector returns null
        document.body.innerHTML = `<div class="actions"><span>no link</span></div>`

        const result = adapter.findPreviousChapterUrl(sel)
        expect("error" in result).toBe(true)
        if ("data" in result) throw new Error("expected error")
        expect(result.error).toMatch(/previous chapter button/i)
    })

    it("errors when the anchor has no href (first chapter)", () => {
        // The default selector requires a[href*='/chapter/'], so to exercise the
        // "no href" branch we use a custom selector that matches an hrefless <a>.
        document.body.innerHTML = `<a id="prev"><i class="fa fa-chevron-double-left"></i></a>`

        const result = adapter.findPreviousChapterUrl({
            ...sel,
            prevChapterBtn: "#prev",
        })
        expect("error" in result).toBe(true)
        if ("data" in result) throw new Error("expected error")
        expect(result.error).toMatch(/first chapter|no link/i)
    })
})

describe("LegacyAdapter.findFictionOverviewUrl", () => {
    it("returns the wrapping anchor href on success", () => {
        document.body.innerHTML = `
            <div class="fic-header">
                <a href="https://www.royalroad.com/fiction/1/test-story">
                    <h2 class="font-white">Test Story</h2>
                </a>
            </div>`

        const result = adapter.findFictionOverviewUrl(sel)
        expect("data" in result).toBe(true)
        if ("error" in result) throw new Error(result.error)
        expect(result.data).toBe(
            "https://www.royalroad.com/fiction/1/test-story",
        )
    })

    it("errors when the fiction title element is missing", () => {
        document.body.innerHTML = `<div>nothing</div>`

        const result = adapter.findFictionOverviewUrl(sel)
        expect("error" in result).toBe(true)
        if ("data" in result) throw new Error("expected error")
        expect(result.error).toMatch(/story title/i)
    })

    it("errors when the title has no anchor ancestor", () => {
        // The default selector is scoped to the header's fiction link, so it can
        // no longer match a heading that has no anchor above it — this branch is
        // now only reachable through a user's custom override, which is how it
        // is exercised here.
        document.body.innerHTML = `<div class="fic-header"><h2 class="font-white">Test Story</h2></div>`

        const result = adapter.findFictionOverviewUrl({
            ...sel,
            fictionTitle: ".fic-header h2",
        })
        expect("error" in result).toBe(true)
        if ("data" in result) throw new Error("expected error")
        expect(result.error).toMatch(/overview page/i)
    })

    it("ignores a header heading that is not inside the fiction link", () => {
        // RoyalRoad puts the author's name in the same header. An unscoped
        // heading selector picks it up, and `closest("a")` then resolves the
        // overview URL to the author's profile — the failure mode that hit the
        // redesign. Scoping to the fiction link rules it out by construction.
        document.body.innerHTML = `
            <div class="fic-header">
                <a href="https://www.royalroad.com/profile/1"><h2>Test Author</h2></a>
                <a href="https://www.royalroad.com/fiction/1/test-story">
                    <h2 class="font-white">Test Story</h2>
                </a>
            </div>`

        const title = adapter.findFictionTitle(sel)
        if ("error" in title) throw new Error(title.error)
        expect(title.data).toBe("Test Story")

        const result = adapter.findFictionOverviewUrl(sel)
        if ("error" in result) throw new Error(result.error)
        expect(result.data).toContain("/fiction/1/test-story")
    })
})
