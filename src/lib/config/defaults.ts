import type { ExtensionSettings } from "~/types/types"
import { prefersReducedMotion } from "../utils/platform"
// Per-layout values (selectors, button look) live with their adapter, and the
// registry is the only module that names the shipped layouts. Nothing here
// mentions one, so adding or dropping a layout doesn't touch this file.
import {
    DEFAULT_SELECTORS_BY_VERSION,
    emptyOverrides,
    FALLBACK_ADAPTER,
    type UiVersion,
} from "~/lib/adapters/registry"

const DEFAULTS: ExtensionSettings = {
    wordCount: 250,
    enableJump: true,
    scrollBehavior: "smooth" as ScrollBehavior,
    autoExpand: false,
    selectorOverrides: emptyOverrides(),
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
        selectorOverrides: emptyOverrides(),
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
export function getChapterPageSelectors(
    version: UiVersion = FALLBACK_ADAPTER.id,
) {
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
export function getFictionPageSelectors(
    version: UiVersion = FALLBACK_ADAPTER.id,
) {
    const s = DEFAULT_SELECTORS_BY_VERSION[version]
    return {
        blurb: s.blurb,
        blurbLabels: s.blurbLabels,
    }
}

export const CACHE_TTL_MS = 30 * 60 * 1000

export default DEFAULTS
