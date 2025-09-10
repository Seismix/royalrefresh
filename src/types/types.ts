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
}

export type ExtensionSettings = {
    wordCount: number
    smoothScroll: boolean
    autoExpand: boolean
} & ExtensionSelectors

export type ExtensionSettingsKeys = keyof ExtensionSettings
export type ExtensionSettingsPossibleTypes =
    ExtensionSettings[ExtensionSettingsKeys]

export type RecapContainerStrings = {
    fictionTitle: string
    lastChapterName: string
    lastChapterContent: string
}

export type DisplayMessageType = "success" | "restore" | "restoreSelectors"
