import { describe, expect, it } from "vitest"
import {
    isChapterUrl,
    findPreviousChapterUrl,
    findFictionOverviewUrl,
} from "./dom-utils"
import { getDefaults } from "~/lib/config/defaults"
import type { ExtensionSettings } from "~/types/types"

const settings = getDefaults() as ExtensionSettings

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

describe("findPreviousChapterUrl", () => {
    it("returns the href when the prev-chapter button is a valid anchor", () => {
        document.body.innerHTML = `
            <div class="actions">
                <a href="https://www.royalroad.com/fiction/1/x/chapter/1/start">
                    <i class="fa fa-chevron-double-left"></i>
                </a>
            </div>`

        const result = findPreviousChapterUrl(settings)
        expect("data" in result).toBe(true)
        if ("error" in result) throw new Error(result.error)
        expect(result.data).toBe(
            "https://www.royalroad.com/fiction/1/x/chapter/1/start",
        )
    })

    it("errors when the matched element is not an anchor", () => {
        // No matching anchor at all -> querySelector returns null
        document.body.innerHTML = `<div class="actions"><span>no link</span></div>`

        const result = findPreviousChapterUrl(settings)
        expect("error" in result).toBe(true)
        if ("data" in result) throw new Error("expected error")
        expect(result.error).toMatch(/previous chapter button/i)
    })

    it("errors when the anchor has no href (first chapter)", () => {
        // The default selector requires a[href*='/chapter/'], so to exercise the
        // "no href" branch we use a custom selector that matches an hrefless <a>.
        document.body.innerHTML = `<a id="prev"><i class="fa fa-chevron-double-left"></i></a>`

        const result = findPreviousChapterUrl({
            ...settings,
            prevChapterBtn: "#prev",
        })
        expect("error" in result).toBe(true)
        if ("data" in result) throw new Error("expected error")
        expect(result.error).toMatch(/first chapter|no link/i)
    })
})

describe("findFictionOverviewUrl", () => {
    it("returns the parent anchor href on success", () => {
        document.body.innerHTML = `
            <a href="https://www.royalroad.com/fiction/1/test-story">
                <h2 class="font-white">Test Story</h2>
            </a>`

        const result = findFictionOverviewUrl(settings)
        expect("data" in result).toBe(true)
        if ("error" in result) throw new Error(result.error)
        expect(result.data).toBe(
            "https://www.royalroad.com/fiction/1/test-story",
        )
    })

    it("errors when the fiction title element is missing", () => {
        document.body.innerHTML = `<div>nothing</div>`

        const result = findFictionOverviewUrl(settings)
        expect("error" in result).toBe(true)
        if ("data" in result) throw new Error("expected error")
        expect(result.error).toMatch(/story title/i)
    })

    it("errors when the title's parent is not an anchor", () => {
        document.body.innerHTML = `<div><h2 class="font-white">Test Story</h2></div>`

        const result = findFictionOverviewUrl(settings)
        expect("error" in result).toBe(true)
        if ("data" in result) throw new Error("expected error")
        expect(result.error).toMatch(/overview page/i)
    })
})
