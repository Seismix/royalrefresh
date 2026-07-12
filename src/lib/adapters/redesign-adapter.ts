import type { ExtensionSelectors, HostClasses } from "~/types/types"
import { BaseAdapter } from "./base-adapter"
import type { MountSet, MountTarget } from "./types"

// ---------------------------------------------------------------------------
// Redesign-only constants (single source of truth).
//
// Everything RoyalRoad-redesign-specific lives here so the feature can be
// removed by deleting this module and following src/lib/adapters/REDESIGN.md.
// `defaults.ts` imports these to build its by-version maps — it does not define
// any redesign values itself.
// ---------------------------------------------------------------------------

/** Selectors for the "Redesign (beta)" RoyalRoad layout (codename remaster). */
export const REDESIGN_SELECTORS: ExtensionSelectors = {
    prevChapterBtn: "a:has(> i.fa-arrow-left)",
    chapterContent: ".chapter-inner",
    chapterTitle: "#chapterHeroData h3",
    fictionTitle: "#chapterHeroData h4",
    // Toggle mount: the chapter nav bar holding prev/select/next. resolveMounts()
    // resolves this robustly in code; this string is the override hint.
    togglePlacement: ".chapter [class*='grid-cols-2']",
    settingsPlacement: "#dialog-content-reading-preferences",
    blurb: "#about-accordion [data-rr-show-more-content]",
    // Content-warning labels location not yet pinned on the redesign; optional.
    blurbLabels: "",
    closeButtonSelector: "#dialog-content-reading-preferences > button",
}

/** RoyalRoad's redesign primary-button utility classes (matches its Prev/Next
 * buttons) so injected buttons look native on the beta UI. */
const REDESIGN_PRIMARY_BTN =
    "inline-flex items-center justify-center cursor-pointer whitespace-nowrap" +
    " rounded-theme font-medium tracking-wide text-center no-underline" +
    " bg-primary text-on-primary hover:brightness-110 hover:shadow-md" +
    " disabled:opacity-55 disabled:cursor-not-allowed px-4 py-2 text-md gap-1"

/** Host button classes for the redesign, applied to the injected buttons. */
export const REDESIGN_HOST_CLASSES: HostClasses = {
    // Toggle sits beside Reading Preferences in its (now flex) box: full-width
    // stacked beneath it on mobile, content-width inline to its right on
    // desktop. `lg:` matches the nav bar's `lg:flex-row` breakpoint. See
    // prepareReadingPrefsCluster below.
    toggleButton: REDESIGN_PRIMARY_BTN + " w-full lg:w-auto",
    settingsButton: REDESIGN_PRIMARY_BTN,
}

/**
 * The cookie RoyalRoad uses to gate its redesign, plus the values that force
 * each layout. Verified live: `always` → redesign, `never` → classic (this is
 * what RoyalRoad's own "Revert To Legacy UI" link sets); removing the cookie
 * lets RoyalRoad decide. All user-editable (RoyalRoad may change them) — these
 * are the built-in defaults. See beta-cookie.ts.
 */
export const DEFAULT_BETA_COOKIE = {
    name: "beta-ui-v2",
    betaValue: "always",
    classicValue: "never",
} as const

/** Adapter for the "Redesign (beta)" RoyalRoad layout (codename remaster). */
export class RedesignAdapter extends BaseAdapter {
    readonly id = "redesign" as const
    readonly defaultSelectors: ExtensionSelectors = REDESIGN_SELECTORS
    readonly hostClasses: HostClasses = REDESIGN_HOST_CLASSES

    resolveMounts(selectors: ExtensionSelectors): MountSet {
        const base = super.resolveMounts(selectors)

        // The chapter nav bar is the `flex flex-col lg:flex-row` container holding
        // the select/prev/next grid AND the Reading Preferences cluster. The
        // stable `#chapterSelect` lives inside an inner `grid-cols-2` grid, so the
        // nav bar is that grid's parent. Fall back to the hero header.
        const navBar =
            document
                .querySelector("#chapterSelect")
                ?.closest("[class*='grid-cols-2']")?.parentElement ??
            document.querySelector("#chapterHeroData")

        return {
            toggle: this.resolveToggle(navBar) ?? base.toggle,
            // Settings button goes at the end of the Reading Preferences dialog.
            settings: { target: base.settings.target, position: "append" },
            recap: base.recap,
        }
    }

    /**
     * Place the toggle beside the Reading Preferences button: right of it on
     * desktop, directly beneath it on mobile. Prefers appending into the button's
     * own box (prepared as a responsive flex row/column); if that structure isn't
     * found, falls back to a standalone row below the whole nav bar.
     */
    private resolveToggle(navBar: Element | null): MountTarget | null {
        if (!navBar) return null

        const box = this.prepareReadingPrefsCluster(navBar)
        if (box) return { target: box, position: "append" }

        // Fallback: a full-width row below the nav bar (no overlap, but not
        // grouped with Reading Preferences).
        return { target: navBar, position: "after" }
    }

    /**
     * Prepare RoyalRoad's Reading Preferences cluster so the toggle can sit next
     * to that button, and return the box to append into (the button's parent).
     *
     * Four host tweaks make the pairing work at every width:
     *  - Let the nav bar wrap (`flex-wrap: wrap`) so the Reading Preferences
     *    cluster drops to its own centered line when it can't fit beside the
     *    prev/next controls, instead of overflowing and being clipped by the
     *    (narrow, viewport-independent) reading column — the iPad-width bug.
     *  - Neutralize the wrapper's `xl:absolute right-0` pin (`position: static`)
     *    so the whole nav is a single flowing row on wide screens instead of the
     *    button being lifted out of flow and overlapping the centered nav. The
     *    Reading Preferences dialog still opens correctly without the pin.
     *  - Turn the button's box into a responsive flex container (`flex-col`
     *    stacked on mobile, `lg:flex-row` inline on desktop).
     *  - Let the RoyalRoad button shrink to content width on desktop
     *    (`lg:w-auto`) — it already renders content-width there — so there's room
     *    for the toggle beside it.
     *
     * Returns null if the expected structure is absent (RoyalRoad changed it),
     * letting the caller fall back to a simpler placement.
     */
    private prepareReadingPrefsCluster(navBar: Element): Element | null {
        const wrapper = navBar.querySelector(".rr-dialog")
        const button = wrapper?.querySelector("button")
        const box = button?.parentElement
        if (!(wrapper instanceof HTMLElement) || !button || !box) return null

        if (navBar instanceof HTMLElement) navBar.style.flexWrap = "wrap"
        wrapper.style.position = "static"
        box.style.display = "flex"
        box.style.gap = "8px"
        box.classList.add("flex-col", "lg:flex-row", "lg:items-center")
        button.classList.add("lg:w-auto")

        return box
    }
}
