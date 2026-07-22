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

/**
 * Per-layout presentation for the injected UI: the host classes that make each
 * button look native, plus the inline styles, icons and labels that differ
 * between RoyalRoad's layouts.
 *
 * All of this is *data* supplied by the active adapter, deliberately so — no
 * component may branch on a layout id. That is what keeps a layout removable by
 * deleting its adapter file.
 */
export type HostChrome = {
    toggleButton: { className: string }
    settingsButton: {
        className: string
        style?: string
        icon: string
        iconStyle?: string
        label: string
        /** When set, the button is wrapped in a div carrying this inline style. */
        wrapperStyle?: string
    }
    reportLink: {
        className: string
        /**
         * The redesign's Tailwind build is purged, so only colour utilities
         * RoyalRoad itself ships would survive injection — inline styles can't
         * be purged and win on specificity. Unset on layouts that have real
         * framework classes to lean on.
         */
        style?: string
    }
}

/** User overrides for a single layout's built-in adapter selectors. */
export type SelectorOverrides = Partial<ExtensionSelectors>

export type ExtensionSettings = {
    wordCount: number
    enableJump: boolean
    scrollBehavior: ScrollBehavior
    autoExpand: boolean
    /**
     * Optional user overrides keyed by adapter id. Empty by default; the active
     * adapter's built-in selectors are used when a key is absent.
     *
     * Deliberately keyed by `string` rather than by the `UiVersion` union:
     * stored settings outlive the adapter list, so a layout can be added or
     * dropped without a storage migration. Overrides for a layout that no longer
     * ships simply sit unread.
     */
    selectorOverrides: Record<string, SelectorOverrides>
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
