import type { ExtensionSettings } from "~/types/types"
import { devLog } from "./logger"

/**
 * Migrations deliberately do NOT import from `config/defaults`.
 *
 * A migration describes a fixed historical transform: "settings shaped like vN
 * become settings shaped like vN+1". Reading today's defaults would let a future
 * edit retroactively change how old data migrates — and did: because the live
 * defaults already contained `betaCookie`, `migrateV2toV3` produced it too, so
 * `migrateV3toV4`'s guard short-circuited and the v4 migration never ran on its
 * real path. The frozen snapshots below pin each step to its own schema instead.
 */

/** Legacy selector defaults as they stood at schema v2. */
const V2_LEGACY_SELECTORS = {
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
} as const

/** The flat selector keys that existed on the v2 settings object. */
const V2_SELECTOR_KEYS = Object.keys(
    V2_LEGACY_SELECTORS,
) as (keyof typeof V2_LEGACY_SELECTORS)[]

/** Non-selector settings defaults as they stood at schema v3 — note there is no
 * `betaCookie` here; that arrives in v4. */
const V3_DEFAULTS = {
    wordCount: 250,
    enableJump: true,
    scrollBehavior: "smooth" as ScrollBehavior,
    autoExpand: false,
} as const

/** The `betaCookie` defaults as introduced by schema v4. */
const V4_BETA_COOKIE = {
    mode: "classic",
    name: "beta-ui-v2",
    betaValue: "always",
    classicValue: "never",
} as const

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

    const legacyOverrides: Record<string, string> = {}
    for (const key of V2_SELECTOR_KEYS) {
        const value = oldSettings?.[key]
        if (typeof value === "string" && value !== V2_LEGACY_SELECTORS[key]) {
            legacyOverrides[key] = value
        }
    }

    // Preserve all non-selector fields (including unknown/future props), drop
    // the flat selector keys, and add the namespaced overrides.
    const migrated: any = { ...V3_DEFAULTS, ...oldSettings }
    for (const key of V2_SELECTOR_KEYS) {
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

    const betaCookie = { ...V4_BETA_COOKIE }
    const migrated = { ...oldSettings, betaCookie }

    devLog.log("WXT Migration v3→v4: added betaCookie", { betaCookie })

    return migrated as ExtensionSettings
}

/**
 * Migration v4→v5: drop `betaCookie`.
 *
 * The extension no longer forces a RoyalRoad layout — it detects whichever one
 * was served and adapts — so the cookie settings, and the `cookies` permission
 * they needed, are gone. v4 is left in place above rather than deleted: settings
 * still stored at v2 or v3 have to pass through it to reach this step.
 */
export function migrateV4toV5(oldSettings: any): ExtensionSettings {
    if (!oldSettings || !("betaCookie" in oldSettings)) {
        return oldSettings as ExtensionSettings
    }

    const { betaCookie, ...migrated } = oldSettings

    devLog.log("WXT Migration v4→v5: removed betaCookie", { betaCookie })

    return migrated as ExtensionSettings
}
