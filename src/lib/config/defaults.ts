import { ExtensionSelectors, ExtensionSettings } from "~/types/types"

export const DEFAULT_SELECTORS: ExtensionSelectors = {
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
}

const DEFAULTS: ExtensionSettings = {
    wordCount: 250,
    enableJump: true,
    scrollBehavior: "smooth",
    autoExpand: false,
    ...DEFAULT_SELECTORS,
}

/**
 * Get defaults with prefers-reduced-motion detection
 * Falls back to static DEFAULTS if window is not available
 */
export function getDefaults() {
    try {
        if (typeof window !== "undefined" && window.matchMedia) {
            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches
            return {
                ...DEFAULTS,
                enableJump: !prefersReducedMotion,
            }
        }
    } catch (error) {
        // Ignore errors in case matchMedia is not available
    }
    return DEFAULTS
}

/**
 * Get selectors that should be present on chapter pages
 */
export function getChapterPageSelectors() {
    return {
        prevChapterBtn: DEFAULT_SELECTORS.prevChapterBtn,
        chapterContent: DEFAULT_SELECTORS.chapterContent,
        chapterTitle: DEFAULT_SELECTORS.chapterTitle,
        fictionTitle: DEFAULT_SELECTORS.fictionTitle,
        togglePlacement: DEFAULT_SELECTORS.togglePlacement,
        settingsPlacement: DEFAULT_SELECTORS.settingsPlacement,
        closeButtonSelector: DEFAULT_SELECTORS.closeButtonSelector,
    }
}

/**
 * Get selectors that should be present on fiction/story pages
 */
export function getFictionPageSelectors() {
    return {
        blurb: DEFAULT_SELECTORS.blurb,
        blurbLabels: DEFAULT_SELECTORS.blurbLabels,
    }
}

export const CACHE_TTL_MS = 30 * 60 * 1000

export default DEFAULTS
