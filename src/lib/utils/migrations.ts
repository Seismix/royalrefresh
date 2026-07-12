import type { ExtensionSelectors, ExtensionSettings } from "~/types/types"
import { getDefaults, LEGACY_SELECTORS } from "~/lib/config/defaults"
import { devLog } from "./logger"

export function migrateV1toV2(oldSettings: any): ExtensionSettings {
    // Migration from v1 to v2: smoothScroll -> enableJump & scrollBehavior
    if ("smoothScroll" in oldSettings) {
        const { smoothScroll, ...rest } = oldSettings
        const migrated = {
            ...rest,
            enableJump: smoothScroll === true, // Preserve user's choice
            scrollBehavior: (smoothScroll
                ? "smooth"
                : "instant") as ScrollBehavior,
        }

        devLog.log("WXT Migration v1→v2: smoothScroll ->", {
            enableJump: migrated.enableJump,
            scrollBehavior: migrated.scrollBehavior,
        })

        return migrated as ExtensionSettings
    }
    return oldSettings as ExtensionSettings
}

const SELECTOR_KEYS: (keyof ExtensionSelectors)[] = [
    "prevChapterBtn",
    "chapterContent",
    "chapterTitle",
    "fictionTitle",
    "togglePlacement",
    "settingsPlacement",
    "blurb",
    "blurbLabels",
    "closeButtonSelector",
]

/**
 * Migration v2→v3: flat selectors -> per-UI `selectorOverrides`.
 *
 * Existing users are on the legacy UI, so any selector they customised (i.e.
 * differs from the legacy default) is preserved as a `legacy` override; untouched
 * selectors are dropped so future default changes flow through automatically.
 */
export function migrateV2toV3(oldSettings: any): ExtensionSettings {
    // Already migrated (defensive — WXT runs migrations once per version bump)
    if (oldSettings?.selectorOverrides) {
        return oldSettings as ExtensionSettings
    }

    const legacyOverrides: Partial<ExtensionSelectors> = {}
    for (const key of SELECTOR_KEYS) {
        const value = oldSettings?.[key]
        if (typeof value === "string" && value !== LEGACY_SELECTORS[key]) {
            legacyOverrides[key] = value
        }
    }

    // Preserve all non-selector fields (including unknown/future props), drop
    // the flat selector keys, and add the namespaced overrides.
    const migrated: any = { ...getDefaults(), ...oldSettings }
    for (const key of SELECTOR_KEYS) {
        delete migrated[key]
    }
    migrated.selectorOverrides = { legacy: legacyOverrides, redesign: {} }

    devLog.log("WXT Migration v2→v3: flat selectors -> selectorOverrides", {
        legacyOverrides,
    })

    return migrated as ExtensionSettings
}

/**
 * Migration v3→v4: add the `betaCookie` object (force-redesign toggle + editable
 * cookie name/value). Injects the built-in default so existing settings gain the
 * key; all other fields are preserved untouched.
 */
export function migrateV3toV4(oldSettings: any): ExtensionSettings {
    // Already migrated (defensive — WXT runs migrations once per version bump)
    if (oldSettings?.betaCookie) {
        return oldSettings as ExtensionSettings
    }

    const { betaCookie } = getDefaults()
    const migrated = { ...oldSettings, betaCookie: { ...betaCookie } }

    devLog.log("WXT Migration v3→v4: added betaCookie", { betaCookie })

    return migrated as ExtensionSettings
}
