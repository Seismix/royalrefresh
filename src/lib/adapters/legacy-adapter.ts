import type { ExtensionSelectors, HostChrome } from "~/types/types"
import { BaseAdapter } from "./base-adapter"
import type { MountSet } from "./types"

// ---------------------------------------------------------------------------
// Legacy-only constants (single source of truth).
//
// Everything specific to RoyalRoad's classic Bootstrap layout lives here, so
// the layout can be dropped by deleting this module and its line in
// `registry.ts`.
// ---------------------------------------------------------------------------

/** Selectors for the legacy (pre-redesign) RoyalRoad layout. */
export const LEGACY_SELECTORS: ExtensionSelectors = {
    prevChapterBtn: "a[href*='/chapter/']:has(> i.fa-chevron-double-left)",
    chapterContent: ".chapter-inner",
    chapterTitle: "h1.font-white",
    fictionTitle: "h2.font-white",
    togglePlacement: ".chapter > div > .actions",
    settingsPlacement: "#settings div.modal-footer",
    blurb: ".description .hidden-content",
    blurbLabels: ".portlet .text-center.font-red-sunglo",
    closeButtonSelector:
        "#settings > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > button:last-child",
    reportPlacement: "div.col-lg-3:nth-child(3)",
}

/** Look of the injected buttons on the legacy layout (Bootstrap classes). */
export const LEGACY_CHROME: HostChrome = {
    toggleButton: { className: "btn btn-primary btn-circle" },
    settingsButton: {
        className: "btn btn-primary btn-circle red",
        // Pushed to the far left of the modal footer, opposite RoyalRoad's own
        // controls — see layoutSettingsFooter below.
        style: "margin-right: auto; margin-left: 0px;",
        icon: "fa fa-cog",
        iconStyle: "margin-right: 0.2em;",
        label: "Open RoyalRefresh Settings",
    },
    // Neutral/secondary rather than a loud accent — the report link is a rarely
    // used utility action and shouldn't compete with the recap toggle.
    reportLink: { className: "btn btn-block btn-default margin-bottom-5" },
}

/** Adapter for the legacy (pre-redesign) RoyalRoad layout. */
export class LegacyAdapter extends BaseAdapter {
    readonly id = "legacy" as const
    readonly label = "Legacy (classic)"
    readonly defaultSelectors: ExtensionSelectors = LEGACY_SELECTORS
    readonly chrome: HostChrome = LEGACY_CHROME

    /**
     * The classic layout is what RoyalRoad serves unless something newer is
     * detected, so this adapter accepts any document — which means it must stay
     * LAST in the registry. If it is ever removed, another adapter has to take
     * over as the unconditional fallback.
     *
     * `_doc` is declared but unused on purpose: dropping it would narrow the
     * signature, and `detect(doc)` then stops typechecking as soon as this is
     * the only adapter left in the registry.
     */
    detect(_doc: Document): boolean {
        return true
    }

    prepareMounts(selectors: ExtensionSelectors): MountSet {
        const base = super.prepareMounts(selectors)
        return {
            ...base,
            cleanup: this.layoutSettingsFooter(base.settings.target),
        }
    }

    /**
     * Lay RoyalRoad's settings-modal footer out as a row so the injected button
     * sits inline with RoyalRoad's own controls rather than below them.
     *
     * Returns a cleanup restoring the footer's original inline styles, or
     * undefined when there was no footer to restyle.
     */
    private layoutSettingsFooter(footer: Element | null) {
        if (!(footer instanceof HTMLElement)) return undefined

        const previous = {
            display: footer.style.display,
            justifyContent: footer.style.justifyContent,
            alignItems: footer.style.alignItems,
        }

        footer.style.display = "flex"
        footer.style.justifyContent = "space-between"
        footer.style.alignItems = "center"

        return () => {
            footer.style.display = previous.display
            footer.style.justifyContent = previous.justifyContent
            footer.style.alignItems = previous.alignItems
        }
    }
}
