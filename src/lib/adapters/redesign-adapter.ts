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
    // Scoped to chapter links so an unrelated left-arrow anchor (breadcrumb,
    // back-to-fiction) can't win on document order — mirrors the legacy selector.
    prevChapterBtn: "a[href*='/chapter/']:has(> i.fa-arrow-left)",
    chapterContent: ".chapter-inner",
    chapterTitle: "#chapterHeroData h3",
    fictionTitle: "#chapterHeroData h4",
    // Toggle mount: the chapter nav bar holding prev/select/next. prepareMounts()
    // resolves this robustly in code; this string is the override hint.
    togglePlacement: ".chapter [class*='grid-cols-2']",
    settingsPlacement: "#dialog-content-reading-preferences",
    blurb: "#about-accordion [data-rr-show-more-content]",
    // Content-warning labels location not yet pinned on the redesign; optional.
    blurbLabels: "",
    closeButtonSelector: "#dialog-content-reading-preferences > button",
    // RoyalRoad's own "report this chapter" link — our report link is inserted
    // directly after it so both reporting actions sit together.
    reportPlacement: "a[href^='/report/chapter/']",
}

/** Structural (non-colour) utility classes shared by RoyalRoad's redesign
 * buttons. Split out from the primary variant so a neutral variant can reuse the
 * layout without inheriting the accent colours. */
const REDESIGN_BTN_BASE =
    "inline-flex items-center justify-center cursor-pointer" +
    " rounded-theme font-medium tracking-wide text-center no-underline" +
    " hover:brightness-110 hover:shadow-md" +
    " disabled:opacity-55 disabled:cursor-not-allowed px-4 py-2 text-md gap-1"

/** RoyalRoad's redesign primary-button utility classes (matches its Prev/Next
 * buttons) so injected buttons look native on the beta UI. */
const REDESIGN_PRIMARY_BTN =
    REDESIGN_BTN_BASE + " whitespace-nowrap bg-primary text-on-primary"

/** Host button classes for the redesign, applied to the injected buttons. */
export const REDESIGN_HOST_CLASSES: HostClasses = {
    // Toggle sits beside Reading Preferences in its (now flex) box: full-width
    // stacked beneath it on mobile, content-width inline to its right on
    // desktop. `lg:` matches the nav bar's `lg:flex-row` breakpoint. See
    // prepareReadingPrefsCluster below.
    toggleButton: REDESIGN_PRIMARY_BTN + " w-full lg:w-auto",
    settingsButton: REDESIGN_PRIMARY_BTN,
    // Deliberately NOT `whitespace-nowrap`: this column (`md:w-auto`) is
    // shrink-to-fit, so an unwrappable label wider than RoyalRoad's own buttons
    // widens the whole column. Verified live — with nowrap the column went
    // 184px → 208px, stretching Fiction Page (`w-full`) while Report Chapter
    // stayed at its own intrinsic width and so appeared to shrink.
    reportLink: REDESIGN_BTN_BASE + " w-full",
    // RoyalRoad's own secondary theme tokens rather than `color: inherit` — the
    // action column inherits `color: black`, which was invisible against the dark
    // theme's near-black background. These vars are theme-scoped (they resolve
    // light-on-dark here and flip in light mode) and, being CSS custom properties
    // rather than utility classes, can't be dropped by RoyalRoad's Tailwind purge.
    // Colour + grid participation, no manual spacing. The link is a child of
    // RoyalRoad's action column, which already sets `gap`, so it picks up the
    // native buttons' rhythm automatically and follows any change to it.
    //
    // That column is a two-up `grid` on mobile and a `flex` column from `md`.
    // `grid-column: 1 / -1` makes the link span the full row on mobile (rather
    // than sitting half-width in one cell) and is simply ignored under flex, so
    // one declaration covers both. Preferred over RoyalRoad's `col-span-2`
    // utility: it can't be dropped by their Tailwind purge, and it stays correct
    // if the column count ever changes.
    reportLinkStyle:
        "background: var(--color-secondary, rgba(127, 127, 127, 0.15));" +
        " color: var(--color-on-secondary, inherit);" +
        " border: 1px solid rgba(127, 127, 127, 0.35);" +
        " grid-column: 1 / -1;",
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

    prepareMounts(selectors: ExtensionSelectors): MountSet {
        const base = super.prepareMounts(selectors)

        // The chapter nav bar is the `flex flex-col lg:flex-row` container holding
        // the select/prev/next grid AND the Reading Preferences cluster. The
        // stable `#chapterSelect` lives inside an inner `grid-cols-2` grid, so the
        // nav bar is that grid's parent. Fall back to the hero header.
        const navBar =
            document
                .querySelector("#chapterSelect")
                ?.closest("[class*='grid-cols-2']")?.parentElement ??
            document.querySelector("#chapterHeroData")

        const toggle = this.resolveToggle(navBar)

        return {
            toggle: toggle?.target ?? base.toggle,
            // Settings button goes at the end of the Reading Preferences dialog.
            settings: { target: base.settings.target, position: "append" },
            recap: base.recap,
            // Sits directly after RoyalRoad's own report link rather than inside it.
            report: { target: base.report.target, position: "after" },
            cleanup: toggle?.cleanup,
        }
    }

    /**
     * Place the toggle beside the Reading Preferences button: right of it on
     * desktop, directly beneath it on mobile. Prefers appending into the button's
     * own box (prepared as a responsive flex row/column); if that structure isn't
     * found, falls back to a standalone row below the whole nav bar.
     *
     * Returns the mount target plus, when the cluster was restyled, a cleanup
     * that undoes those host-page mutations.
     */
    private resolveToggle(
        navBar: Element | null,
    ): { target: MountTarget; cleanup?: () => void } | null {
        if (!navBar) return null

        const prepared = this.prepareReadingPrefsCluster(navBar)
        if (prepared) {
            return {
                target: { target: prepared.box, position: "append" },
                cleanup: prepared.cleanup,
            }
        }

        // Fallback: a full-width row below the nav bar (no overlap, but not
        // grouped with Reading Preferences).
        return { target: { target: navBar, position: "after" } }
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
     * letting the caller fall back to a simpler placement. Otherwise returns the
     * box to append into plus a `cleanup` that restores every mutation — the
     * content script registers it with `ctx.onInvalidated` so disabling or
     * updating the extension doesn't leave RoyalRoad's nav bar restyled.
     */
    private prepareReadingPrefsCluster(
        navBar: Element,
    ): { box: Element; cleanup: () => void } | null {
        const wrapper = navBar.querySelector(".rr-dialog")
        const button = wrapper?.querySelector("button")
        const box = button?.parentElement
        if (!(wrapper instanceof HTMLElement) || !button || !box) return null

        // Snapshot the inline styles we're about to overwrite so cleanup can put
        // back exactly what was there (usually "", i.e. no inline style at all).
        const navBarEl = navBar instanceof HTMLElement ? navBar : null
        const prevFlexWrap = navBarEl?.style.flexWrap ?? ""
        const prevPosition = wrapper.style.position
        const prevDisplay = box.style.display
        const prevGap = box.style.gap

        // Only remove classes on cleanup that weren't already present, so we
        // never strip a class RoyalRoad itself put there.
        const boxClasses = [
            "flex-col",
            "lg:flex-row",
            "lg:items-center",
        ].filter((cls) => !box.classList.contains(cls))
        const buttonClasses = ["lg:w-auto"].filter(
            (cls) => !button.classList.contains(cls),
        )

        if (navBarEl) navBarEl.style.flexWrap = "wrap"
        wrapper.style.position = "static"
        box.style.display = "flex"
        box.style.gap = "8px"
        box.classList.add(...boxClasses)
        button.classList.add(...buttonClasses)

        const cleanup = () => {
            if (navBarEl) navBarEl.style.flexWrap = prevFlexWrap
            wrapper.style.position = prevPosition
            box.style.display = prevDisplay
            box.style.gap = prevGap
            box.classList.remove(...boxClasses)
            button.classList.remove(...buttonClasses)
        }

        return { box, cleanup }
    }
}
