export type ExtensionSelectors = {
    prevChapterBtn: string
    chapterContent: string
    chapterTitle: string
    fictionTitle: string
    togglePlacement: string
    settingsPlacement: string
    blurb: string
    blurbLabels: string
    closeButtonSelector: string
    reportPlacement: string
}

/** RoyalRoad UI variants the extension supports. */
export type UiVersion = "legacy" | "redesign"

/**
 * Host CSS classes applied to the injected buttons so they inherit RoyalRoad's
 * native button look. These differ per UI version (legacy Bootstrap vs redesign
 * Tailwind), so the active adapter supplies the right set.
 */
export type HostClasses = {
    toggleButton: string
    settingsButton: string
    reportLink: string
    /**
     * Inline style for the report link. The redesign's Tailwind build is purged,
     * so only colour utilities RoyalRoad itself ships would survive injection —
     * inline styles can't be purged and win on specificity. Unset on legacy,
     * which has real Bootstrap classes to lean on.
     */
    reportLinkStyle?: string
}

/** Per-version user overrides for the built-in adapter selectors. */
export type SelectorOverrides = Partial<ExtensionSelectors>

/**
 * Which RoyalRoad layout to force via the beta cookie:
 * - `redesign` — force the "Redesign (beta)" UI (cookie = `betaValue`).
 * - `classic`  — force the legacy UI (cookie = `classicValue`).
 */
export type BetaLayoutMode = "redesign" | "classic"

/**
 * Controls RoyalRoad's redesign via its gating cookie. `mode` is the user-facing
 * layout choice; `name`/`betaValue`/`classicValue` are editable so the setting
 * survives RoyalRoad renaming the cookie or changing its values.
 * Redesign-specific — see src/lib/adapters/beta-cookie.ts.
 */
export type BetaCookieSettings = {
    mode: BetaLayoutMode
    name: string
    betaValue: string
    classicValue: string
}

export type ExtensionSettings = {
    wordCount: number
    enableJump: boolean
    scrollBehavior: ScrollBehavior
    autoExpand: boolean
    /**
     * Optional user overrides keyed by UI version. Empty by default; the
     * active adapter's built-in selectors are used when a key is absent.
     */
    selectorOverrides: Record<UiVersion, SelectorOverrides>
    /** Force RoyalRoad's redesign via an (editable) cookie. */
    betaCookie: BetaCookieSettings
}

export type ExtensionSettingsKeys = keyof ExtensionSettings
export type ExtensionSettingsPossibleTypes =
    ExtensionSettings[ExtensionSettingsKeys]

export type RecapContainerStrings = {
    fictionTitle: string
    lastChapterName: string
    lastChapterContent: string
}

export type DisplayMessageType = "success" | "restore" | "restoreSelectors"

export type ContentType = "recap" | "blurb"
