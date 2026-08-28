import { afterEach, describe, expect, it } from "vitest"
import { ADAPTERS, FALLBACK_ADAPTER, getActiveSelectors } from "./index"
// Concrete adapters are imported from their own modules, not the barrel: those
// files disappear together if a layout is ever dropped.
import { LegacyAdapter } from "./legacy-adapter"
import { RedesignAdapter, REDESIGN_SELECTORS } from "./redesign-adapter"
import { resolveAdapter } from "./resolve"
import { getDefaults } from "~/lib/config/defaults"
import type { ExtensionSettings } from "~/types/types"

afterEach(() => {
    document.body.innerHTML = ""
})

describe("adapter registry", () => {
    it("ends with an adapter that accepts any document", () => {
        // resolveAdapter() walks ADAPTERS in order and falls back to the last
        // entry, so that one has to match everything — otherwise a page no
        // adapter claims would silently get the wrong layout's selectors.
        document.body.innerHTML = "<div>nothing recognisable</div>"
        expect(FALLBACK_ADAPTER).toBe(ADAPTERS[ADAPTERS.length - 1])
        expect(FALLBACK_ADAPTER.detect(document)).toBe(true)
    })

    it("gives every adapter a distinct id", () => {
        // Ids key the stored selector overrides; a collision would silently
        // merge two layouts' customisations.
        const ids = ADAPTERS.map((adapter) => adapter.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

describe("detection", () => {
    it("resolves the legacy adapter on a plain document", () => {
        document.body.innerHTML = "<div class='chapter-inner'></div>"
        expect(resolveAdapter().id).toBe("legacy")
    })

    it("resolves the redesign adapter when #chapterHeroData is present", () => {
        document.body.innerHTML = "<div id='chapterHeroData'></div>"
        expect(resolveAdapter().id).toBe("redesign")
    })

    it("ignores the beta cookie and trusts the rendered page", () => {
        // A stale `beta-ui-v2=always` must not force the redesign adapter onto a
        // page RoyalRoad actually served as legacy — the sentinel is the truth.
        document.body.innerHTML = "<div class='chapter-inner'></div>"
        document.cookie = "beta-ui-v2=always"
        try {
            expect(resolveAdapter().id).toBe("legacy")
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

    /**
     * The hero as RoyalRoad renders it: the fiction title is an `<a>`-wrapped
     * heading, the chapter title is a bare heading, and the author name is a
     * SECOND `<a>`-wrapped heading. Levels are deliberately shuffled relative to
     * what the site ships today — the selectors match on role, not level, so
     * this markup must resolve the same way after a renumber.
     */
    const heroHtml = `
        <div id="chapterHeroData">
            <a href="https://www.royalroad.com/fiction/1/test-story">
                <h2>Test Story</h2>
            </a>
            <h1>Chapter 2: The Climb</h1>
            <a href="https://www.royalroad.com/profile/338123">
                <h4>Test Author</h4>
            </a>
        </div>`

    it("derives the overview URL from the hero title's anchor", () => {
        document.body.innerHTML = heroHtml
        const result = adapter.findFictionOverviewUrl(sel)
        if ("error" in result) throw new Error(result.error)
        expect(result.data).toContain("/fiction/1/test-story")
    })

    it("reads the fiction title from the hero, not the author name", () => {
        // The author heading sits in the same hero and was what an unscoped
        // heading selector picked up — silently titling the recap with the
        // author and pointing the blurb fetch at /profile/<id>.
        document.body.innerHTML = heroHtml
        const title = adapter.findFictionTitle(sel)
        if ("error" in title) throw new Error(title.error)
        expect(title.data).toBe("Test Story")
    })

    it("reads the chapter title from the hero's only unlinked heading", () => {
        document.body.innerHTML = heroHtml
        const name = adapter.findChapterName(document, sel)
        if ("error" in name) throw new Error(name.error)
        expect(name.data).toBe("Chapter 2: The Climb")
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

    it("lays the settings-modal footer out as a row, and restores it", () => {
        document.body.innerHTML = `
            <div id="settings">
                <div class="modal-footer" style="color: red;"></div>
            </div>`

        const footer = document.querySelector<HTMLElement>(".modal-footer")!
        const adapter = new LegacyAdapter()
        const mounts = adapter.prepareMounts(adapter.defaultSelectors)

        expect(mounts.settings.target).toBe(footer)
        expect(footer.style.display).toBe("flex")
        expect(footer.style.justifyContent).toBe("space-between")

        mounts.cleanup!()

        expect(footer.style.display).toBe("")
        expect(footer.style.justifyContent).toBe("")
        // Styles we never touched must survive untouched.
        expect(footer.style.color).toBe("red")
    })

    it("has nothing to undo when the settings modal is absent", () => {
        document.body.innerHTML = "<div class='chapter-inner'></div>"
        const adapter = new LegacyAdapter()
        expect(
            adapter.prepareMounts(adapter.defaultSelectors).cleanup,
        ).toBeUndefined()
    })
})
