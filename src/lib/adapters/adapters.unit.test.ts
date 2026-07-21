import { afterEach, describe, expect, it } from "vitest"
import {
    getActiveSelectors,
    isRedesign,
    LegacyAdapter,
    RedesignAdapter,
    REDESIGN_SELECTORS,
    resolveAdapter,
} from "./index"
import { getDefaults } from "~/lib/config/defaults"
import type { ExtensionSettings } from "~/types/types"

afterEach(() => {
    document.body.innerHTML = ""
})

describe("detection", () => {
    it("resolves the legacy adapter on a plain document", () => {
        document.body.innerHTML = "<div class='chapter-inner'></div>"
        expect(isRedesign()).toBe(false)
        expect(resolveAdapter().id).toBe("legacy")
    })

    it("resolves the redesign adapter when #chapterHeroData is present", () => {
        document.body.innerHTML = "<div id='chapterHeroData'></div>"
        expect(isRedesign()).toBe(true)
        expect(resolveAdapter().id).toBe("redesign")
    })

    it("falls back to the beta cookie on the live page", () => {
        document.cookie = "beta-ui-v2=always"
        try {
            expect(isRedesign()).toBe(true)
            expect(resolveAdapter().id).toBe("redesign")
        } finally {
            document.cookie =
                "beta-ui-v2=; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        }
    })
})

describe("getActiveSelectors", () => {
    const baseSettings = (
        overrides: ExtensionSettings["selectorOverrides"],
    ): ExtensionSettings => ({ ...getDefaults(), selectorOverrides: overrides })

    it("returns built-in defaults when there are no overrides", () => {
        const adapter = new RedesignAdapter()
        const sel = getActiveSelectors(
            adapter,
            baseSettings({ legacy: {}, redesign: {} }),
        )
        expect(sel.chapterTitle).toBe(REDESIGN_SELECTORS.chapterTitle)
    })

    it("applies a per-version override", () => {
        const adapter = new RedesignAdapter()
        const sel = getActiveSelectors(
            adapter,
            baseSettings({
                legacy: {},
                redesign: { chapterTitle: "h1.custom" },
            }),
        )
        expect(sel.chapterTitle).toBe("h1.custom")
    })

    it("ignores empty/whitespace overrides (falls back to default)", () => {
        const adapter = new RedesignAdapter()
        const sel = getActiveSelectors(
            adapter,
            baseSettings({ legacy: {}, redesign: { chapterTitle: "   " } }),
        )
        expect(sel.chapterTitle).toBe(REDESIGN_SELECTORS.chapterTitle)
    })
})

describe("RedesignAdapter DOM accessors", () => {
    const adapter = new RedesignAdapter()
    const sel = REDESIGN_SELECTORS

    it("finds the previous chapter via the arrow-left icon", () => {
        document.body.innerHTML = `
            <a href="https://www.royalroad.com/fiction/1/x/chapter/1/start">
                <i class="fas fa-arrow-left"></i> Previous
            </a>`
        const result = adapter.findPreviousChapterUrl(sel)
        if ("error" in result) throw new Error(result.error)
        expect(result.data).toContain("/chapter/1/start")
    })

    it("ignores a non-chapter arrow-left link that precedes the real one", () => {
        // A back-to-fiction/breadcrumb link would otherwise win on document
        // order and send the recap fetch to the wrong page.
        document.body.innerHTML = `
            <a href="https://www.royalroad.com/fiction/1/x">
                <i class="fas fa-arrow-left"></i> Back to fiction
            </a>
            <a href="https://www.royalroad.com/fiction/1/x/chapter/1/start">
                <i class="fas fa-arrow-left"></i> Previous
            </a>`
        const result = adapter.findPreviousChapterUrl(sel)
        if ("error" in result) throw new Error(result.error)
        expect(result.data).toContain("/chapter/1/start")
    })

    it("derives the overview URL from the hero title's anchor", () => {
        document.body.innerHTML = `
            <div id="chapterHeroData">
                <a href="https://www.royalroad.com/fiction/1/test-story">
                    <h4>Test Story</h4>
                </a>
            </div>`
        const result = adapter.findFictionOverviewUrl(sel)
        if ("error" in result) throw new Error(result.error)
        expect(result.data).toContain("/fiction/1/test-story")
    })
})

describe("RedesignAdapter.prepareMounts", () => {
    it("resolves the nav bar, settings dialog and recap container", () => {
        // The stable #chapterSelect sits inside an inner grid; the nav bar is
        // that grid's parent, which also holds RoyalRoad's Reading Preferences
        // cluster (`.rr-dialog` > box > button).
        document.body.innerHTML = `
            <div class="chapter flex flex-col items-center">
                <div class="nav-bar flex flex-col lg:flex-row">
                    <div class="grid-cols-2"><select id="chapterSelect"></select></div>
                    <div class="rr-dialog xl:absolute right-0 w-full">
                        <div class="rp-box inline-block w-full">
                            <button class="w-full">Reading Preferences</button>
                        </div>
                    </div>
                </div>
                <div class="chapter-inner"></div>
            </div>
            <div id="dialog-content-reading-preferences"></div>
            <a href="/report/chapter/123">Report this chapter</a>`

        const mounts = new RedesignAdapter().prepareMounts(REDESIGN_SELECTORS)

        // Toggle appends into the Reading Preferences button's box so it lands
        // beside the button — inline on desktop, stacked below on mobile.
        expect(mounts.toggle.target).toBe(document.querySelector(".rp-box"))
        expect(mounts.toggle.position).toBe("append")

        // The cluster is prepared: the nav bar wraps (so the cluster drops to its
        // own line instead of clipping at narrow widths), the wrapper's absolute
        // pin is neutralized, the box becomes flex, and the RR button shrinks to
        // content on desktop.
        const navBar = document.querySelector<HTMLElement>(".nav-bar")!
        const wrapper = document.querySelector<HTMLElement>(".rr-dialog")!
        const box = document.querySelector<HTMLElement>(".rp-box")!
        const rpButton = box.querySelector("button")!
        expect(navBar.style.flexWrap).toBe("wrap")
        expect(wrapper.style.position).toBe("static")
        expect(box.style.display).toBe("flex")
        expect(box.classList.contains("lg:flex-row")).toBe(true)
        expect(rpButton.classList.contains("lg:w-auto")).toBe(true)

        expect(mounts.settings.target).toBe(
            document.querySelector("#dialog-content-reading-preferences"),
        )
        expect(mounts.recap.target).toBe(
            document.querySelector(".chapter-inner"),
        )
        expect(mounts.recap.position).toBe("prepend")

        // Report link lands directly after RoyalRoad's own report link.
        expect(mounts.report.target).toBe(
            document.querySelector("a[href^='/report/chapter/']"),
        )
        expect(mounts.report.position).toBe("after")
    })

    it("cleanup() restores every host-page mutation", () => {
        document.body.innerHTML = `
            <div class="chapter flex flex-col items-center">
                <div class="nav-bar flex flex-col lg:flex-row">
                    <div class="grid-cols-2"><select id="chapterSelect"></select></div>
                    <div class="rr-dialog xl:absolute right-0 w-full">
                        <div class="rp-box inline-block w-full">
                            <button class="w-full">Reading Preferences</button>
                        </div>
                    </div>
                </div>
                <div class="chapter-inner"></div>
            </div>`

        const navBar = document.querySelector<HTMLElement>(".nav-bar")!
        const wrapper = document.querySelector<HTMLElement>(".rr-dialog")!
        const box = document.querySelector<HTMLElement>(".rp-box")!
        const rpButton = box.querySelector("button")!

        const before = {
            navBar: navBar.getAttribute("style"),
            wrapper: wrapper.getAttribute("style"),
            box: box.getAttribute("style"),
            boxClass: box.className,
            buttonClass: rpButton.className,
        }

        const mounts = new RedesignAdapter().prepareMounts(REDESIGN_SELECTORS)
        expect(mounts.cleanup).toBeTypeOf("function")

        mounts.cleanup!()

        expect(navBar.style.flexWrap).toBe("")
        expect(wrapper.style.position).toBe("")
        expect(box.style.display).toBe("")
        expect(box.className).toBe(before.boxClass)
        expect(rpButton.className).toBe(before.buttonClass)
        // Styles we never touched must survive untouched too.
        expect(navBar.getAttribute("style") || "").toBe(before.navBar || "")
    })

    it("leaves classes RoyalRoad already set in place on cleanup", () => {
        // `flex-col` is on the box from the start — cleanup must not strip it.
        document.body.innerHTML = `
            <div class="chapter">
                <div class="nav-bar flex">
                    <div class="grid-cols-2"><select id="chapterSelect"></select></div>
                    <div class="rr-dialog">
                        <div class="rp-box flex-col"><button>Reading Preferences</button></div>
                    </div>
                </div>
            </div>`

        const box = document.querySelector<HTMLElement>(".rp-box")!
        const mounts = new RedesignAdapter().prepareMounts(REDESIGN_SELECTORS)
        mounts.cleanup!()

        expect(box.classList.contains("flex-col")).toBe(true)
        expect(box.classList.contains("lg:flex-row")).toBe(false)
    })

    it("falls back to a row below the nav bar when the prefs cluster is absent", () => {
        document.body.innerHTML = `
            <div class="chapter flex flex-col items-center">
                <div class="nav-bar flex flex-col lg:flex-row">
                    <div class="grid-cols-2"><select id="chapterSelect"></select></div>
                </div>
                <div class="chapter-inner"></div>
            </div>`

        const mounts = new RedesignAdapter().prepareMounts(REDESIGN_SELECTORS)

        expect(mounts.toggle.target).toBe(document.querySelector(".nav-bar"))
        expect(mounts.toggle.position).toBe("after")
        // Nothing was restyled, so there's nothing to undo.
        expect(mounts.cleanup).toBeUndefined()
    })
})

describe("LegacyAdapter", () => {
    it("uses the legacy default selectors", () => {
        const adapter = new LegacyAdapter()
        expect(adapter.id).toBe("legacy")
        expect(adapter.defaultSelectors.chapterTitle).toBe("h1.font-white")
    })
})
