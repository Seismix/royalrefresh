import { ExtensionSelectors, ExtensionSettings } from "~/types/types"
import { devLog } from "../utils/logger"

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
    enableJump: false,
    scrollBehavior: "instant" as ScrollBehavior,
    autoExpand: false,
    ...DEFAULT_SELECTORS,
}

/**
 * Get defaults with prefers-reduced-motion detection for fresh installs only
 * For existing users, their settings are preserved completely
 */
export function getDefaults(existingSettings?: Partial<ExtensionSettings>) {
    // If existing settings provided, merge with base defaults (for existing users)
    if (existingSettings) {
        return {
            ...DEFAULTS,
            ...existingSettings,
        }
    }

    // Fresh install: detect reduced motion preference
    try {
        if (typeof window !== "undefined" && window.matchMedia) {
            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches
            devLog.log(
                "Fresh install: prefersReducedMotion",
                prefersReducedMotion,
            )

            if (!prefersReducedMotion) {
                // No reduced motion preference - safe to enable jump functionality
                return {
                    ...DEFAULTS,
                    enableJump: true,
                    scrollBehavior: "smooth" as ScrollBehavior,
                }
            }
        }
    } catch (error) {
        devLog.log("Could not detect reduced motion preference:", error)
    }

    // Default case (fresh install, no reduced motion or detection failed)
    return DEFAULTS
}

/**
 * Check if user has reduced motion preference but has enabled jump (override)
 */
export function hasReducedMotionOverride(): boolean {
    try {
        if (typeof window !== "undefined" && window.matchMedia) {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches
        }
    } catch (error) {
        // Ignore errors
    }
    return false
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
