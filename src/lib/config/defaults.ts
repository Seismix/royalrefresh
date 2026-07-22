import {
    ExtensionSelectors,
    ExtensionSettings,
    HostClasses,
    UiVersion,
} from "~/types/types"
import { prefersReducedMotion } from "../utils/platform"
// Redesign-only values live with the redesign adapter (single source of truth,
// easy to remove — see src/lib/adapters/REDESIGN.md). Imported here only to
// assemble the by-version maps below.
import {
    REDESIGN_HOST_CLASSES,
    REDESIGN_SELECTORS,
} from "~/lib/adapters/redesign-adapter"

/** Host button classes for the legacy (pre-redesign) RoyalRoad layout. */
const LEGACY_HOST_CLASSES: HostClasses = {
    toggleButton: "btn btn-primary btn-circle",
    settingsButton: "btn btn-primary btn-circle red",
    // Neutral/secondary rather than a loud accent — the report link is a rarely
    // used utility action and shouldn't compete with the recap toggle.
    reportLink: "btn btn-block btn-default margin-bottom-5",
}

/** Host button classes per UI version, applied to the injected buttons. */
export const HOST_CLASSES_BY_VERSION: Record<UiVersion, HostClasses> = {
    legacy: LEGACY_HOST_CLASSES,
    redesign: REDESIGN_HOST_CLASSES,
}

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

/** Built-in default selectors per UI version. */
export const DEFAULT_SELECTORS_BY_VERSION: Record<
    UiVersion,
    ExtensionSelectors
> = {
    legacy: LEGACY_SELECTORS,
    redesign: REDESIGN_SELECTORS,
}

const DEFAULTS: ExtensionSettings = {
    wordCount: 250,
    enableJump: true,
    scrollBehavior: "smooth" as ScrollBehavior,
    autoExpand: false,
    selectorOverrides: { legacy: {}, redesign: {} },
}

/**
 * Get defaults
 * For existing users, their settings are preserved completely
 */
export function getDefaults(existingSettings?: Partial<ExtensionSettings>) {
    // If existing settings provided, merge with base defaults (for existing users)
    if (existingSettings) {
        return {
            ...DEFAULTS,
            ...existingSettings,
            selectorOverrides: {
                ...DEFAULTS.selectorOverrides,
                ...existingSettings.selectorOverrides,
            },
        }
    }

    return {
        ...DEFAULTS,
        selectorOverrides: { legacy: {}, redesign: {} },
    }
}

/**
 * Check if user has reduced motion preference but has enabled jump (override)
 */
export function hasReducedMotionOverride(): boolean {
    return prefersReducedMotion()
}

/**
 * Get selectors that should be present on chapter pages for a given UI version
 */
export function getChapterPageSelectors(version: UiVersion = "legacy") {
    const s = DEFAULT_SELECTORS_BY_VERSION[version]
    return {
        prevChapterBtn: s.prevChapterBtn,
        chapterContent: s.chapterContent,
        chapterTitle: s.chapterTitle,
        fictionTitle: s.fictionTitle,
        togglePlacement: s.togglePlacement,
        settingsPlacement: s.settingsPlacement,
        closeButtonSelector: s.closeButtonSelector,
        reportPlacement: s.reportPlacement,
    }
}

/**
 * Get selectors that should be present on fiction/story pages for a UI version
 */
export function getFictionPageSelectors(version: UiVersion = "legacy") {
    const s = DEFAULT_SELECTORS_BY_VERSION[version]
    return {
        blurb: s.blurb,
        blurbLabels: s.blurbLabels,
    }
}

export const CACHE_TTL_MS = 30 * 60 * 1000

export default DEFAULTS
