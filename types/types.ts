export type ExtensionSettings = {
    [key: string]: string | number | boolean
    chapterContent: string
    chapterTitle: string
    fictionTitle: string
    wordCount: number
    buttonPlacement: string
    smoothScroll: boolean
    autoExpand: boolean
}

type ExtensionSettingsKeys = keyof ExtensionSettings
export type ExtensionSettingsPossibleTypes =
    ExtensionSettings[ExtensionSettingsKeys]

export type RecapContainerStrings = {
    fictionTitle: string
    lastChapterName: string
    lastChapterContent: string
}

export type DisplayMessageType = "success" | "restore"
