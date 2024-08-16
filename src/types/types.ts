export type ExtensionSettings = {
    prevChapterBtn: string
    chapterContent: string
    chapterTitle: string
    fictionTitle: string
    wordCount: number
    togglePlacement: string
    settingsPlacement: string
    smoothScroll: boolean
    autoExpand: boolean
    blurb: string
    closeButtonSelector: string
}

export type ExtensionSettingsKeys = keyof ExtensionSettings
export type ExtensionSettingsPossibleTypes =
    ExtensionSettings[ExtensionSettingsKeys]

export type RecapContainerStrings = {
    fictionTitle: string
    lastChapterName: string
    lastChapterContent: string
}

export type DisplayMessageType = "success" | "restore"
