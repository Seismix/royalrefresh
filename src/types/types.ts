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
