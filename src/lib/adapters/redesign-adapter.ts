import type { ExtensionSelectors, HostChrome } from "~/types/types"
import { BaseAdapter } from "./base-adapter"
import type { MountSet, MountTarget } from "./types"

// ---------------------------------------------------------------------------
// Redesign-only constants (single source of truth).
//
// Everything RoyalRoad-redesign-specific lives here — selectors, button look,
// detection and mount quirks — so the layout can be dropped by deleting this
// module and its line in `registry.ts`.
// ---------------------------------------------------------------------------

/**
 * Redesign-only element the layout is recognised by. RoyalRoad gates the beta
 * on its own `beta-ui-v2` cookie, but this sentinel is what was actually
 * rendered — a stale cookie could claim a layout the page isn't using.
 *
 * Only present on chapter pages (see `resolveAdapter`'s note).
 */
const REDESIGN_SENTINEL = "#chapterHeroData"

/** Selectors for the "Redesign (beta)" RoyalRoad layout (codename remaster). */
export const REDESIGN_SELECTORS: ExtensionSelectors = {
    // Two independent hooks, either of which suffices: RoyalRoad's own
    // `data-vt-direction` (view-transition plumbing on the nav buttons) and the
    // Font Awesome arrow. Losing one — an icon-library bump, a rewrite of the
    // transition code — leaves the other holding.
    //
    // Still scoped to chapter links so an unrelated left-arrow anchor
    // (breadcrumb, back-to-fiction) can't win on document order.
    prevChapterBtn:
        "a[href*='/chapter/']:is([data-vt-direction='prev'], :has(> i.fa-arrow-left))",
    chapterContent: ".chapter-inner",
    // Both hero headings are matched by ROLE, not by heading level. RoyalRoad
    // renumbered them once already (chapter h3 -> h1, fiction h4 -> h2) and the
    // level-pinned selectors broke silently; these survive the next renumber.
    //
    // The chapter title is the only hero heading that is not inside a link — the
    // fiction title and the author name both are.
    chapterTitle: "#chapterHeroData :is(h1,h2,h3,h4,h5,h6):not(a *)",
    // The fiction title is the heading inside the hero's link to the fiction.
    // Scoping to that anchor matters beyond the text: findFictionOverviewUrl()
    // walks `closest("a")` from this element to get the overview URL, and the
    // unscoped `h4` used to land on the AUTHOR heading — which silently pointed
    // the blurb fetch at /profile/<id> instead of the fiction.
    fictionTitle:
        "#chapterHeroData a[href*='/fiction/'] :is(h1,h2,h3,h4,h5,h6)",
    // Toggle mount: the inner grid holding prev/select/next. Identified by the
    // stable `#chapterSelect` it contains rather than by the Tailwind utility
    // alone, which also matches the duplicate nav bar below the chapter text.
    // This is the same element prepareMounts() resolves in code, so the override
    // hint and the actual behaviour now agree.
    togglePlacement: "[class*='grid-cols-2']:has(#chapterSelect)",
    settingsPlacement: "#dialog-content-reading-preferences",
    blurb: "#about-accordion [data-rr-show-more-content]",
    // Content-warning labels location not yet pinned on the redesign; optional.
    blurbLabels: "",
    // RoyalRoad's own dialog-dismissal contract, rather than "whichever button
    // happens to be a direct child of the dialog".
    closeButtonSelector:
        "#dialog-content-reading-preferences button[data-rr-dialog-close]",
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

/** Look of the injected buttons on the redesign (RoyalRoad's Tailwind utilities). */
export const REDESIGN_CHROME: HostChrome = {
    // Toggle sits beside Reading Preferences in its (now flex) box: full-width
    // stacked beneath it on mobile, content-width inline to its right on
    // desktop. `lg:` matches the nav bar's `lg:flex-row` breakpoint. See
    // prepareReadingPrefsCluster below.
    toggleButton: { className: REDESIGN_PRIMARY_BTN + " w-full lg:w-auto" },
    settingsButton: {
        className: REDESIGN_PRIMARY_BTN,
        icon: "fa-solid fa-gear",
        iconStyle: "margin-right: 0.4em;",
        // Shorter than the legacy label: the Reading Preferences dialog is
        // narrow and the surrounding context already says RoyalRefresh.
        label: "RoyalRefresh Settings",
        // Centred in a padded, separated footer so it reads as the last row of
        // the dialog rather than another preference.
        wrapperStyle:
            "display: flex; justify-content: center;" +
            " padding: 16px 24px 20px; margin-top: 8px;" +
            " border-top: 1px solid rgba(127, 127, 127, 0.25);",
    },
    reportLink: {
        // Deliberately NOT `whitespace-nowrap`: this column (`md:w-auto`) is
        // shrink-to-fit, so an unwrappable label wider than RoyalRoad's own
        // buttons widens the whole column. Verified live — with nowrap the column
        // went 184px → 208px, stretching Fiction Page (`w-full`) while Report
        // Chapter stayed at its own intrinsic width and so appeared to shrink.
        className: REDESIGN_BTN_BASE + " w-full",
        // RoyalRoad's own secondary theme tokens rather than `color: inherit` —
        // the action column inherits `color: black`, which was invisible against
        // the dark theme's near-black background. These vars are theme-scoped
        // (they resolve light-on-dark here and flip in light mode) and, being CSS
        // custom properties rather than utility classes, can't be dropped by
        // RoyalRoad's Tailwind purge.
        //
        // Colour + grid participation, no manual spacing. The link is a child of
        // RoyalRoad's action column, which already sets `gap`, so it picks up the
        // native buttons' rhythm automatically and follows any change to it.
        //
        // That column is a two-up `grid` on mobile and a `flex` column from `md`.
        // `grid-column: 1 / -1` makes the link span the full row on mobile
        // (rather than sitting half-width in one cell) and is simply ignored
        // under flex, so one declaration covers both. Preferred over RoyalRoad's
        // `col-span-2` utility: it can't be dropped by their Tailwind purge, and
        // it stays correct if the column count ever changes.
        //
        // `order` sorts the link behind every host button. RoyalRoad orders that
        // column with `order-*` utilities (Donate is `order-2 col-span-2`, Report
        // Chapter `order-1`), and DOM position alone gave the injected link the
        // default `order: 0` — so it landed between Fiction Page and Report
        // Chapter, breaking their shared mobile row and leaving two empty cells
        // (verified live on a fiction with a Donate button). Sorting last means
        // RoyalRoad's own buttons always pack exactly as they intend and the
        // injected full-width row goes underneath, whatever they add next.
        style:
            "background: var(--color-secondary, rgba(127, 127, 127, 0.15));" +
            " color: var(--color-on-secondary, inherit);" +
            " border: 1px solid rgba(127, 127, 127, 0.35);" +
            " grid-column: 1 / -1; order: 99;",
    },
}

/** Adapter for the "Redesign (beta)" RoyalRoad layout (codename remaster). */
export class RedesignAdapter extends BaseAdapter {
    readonly id = "redesign" as const
    readonly label = "Redesign (beta)"
    readonly defaultSelectors: ExtensionSelectors = REDESIGN_SELECTORS
    readonly chrome: HostChrome = REDESIGN_CHROME

    detect(doc: Document): boolean {
        return !!doc.querySelector(REDESIGN_SENTINEL)
    }

    override prepareMounts(selectors: ExtensionSelectors): MountSet {
        const base = super.prepareMounts(selectors)

        // The chapter nav bar is the `flex flex-col lg:flex-row` container holding
        // the select/prev/next grid AND the Reading Preferences cluster. The
        // stable `#chapterSelect` lives inside an inner `grid-cols-2` grid, so the
        // nav bar is that grid's parent. Fall back to the hero header.
        const navBar =
            document
                .querySelector("#chapterSelect")
                ?.closest("[class*='grid-cols-2']")?.parentElement ??
            document.querySelector(REDESIGN_SENTINEL)

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
