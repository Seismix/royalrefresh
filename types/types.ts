export type ExtensionSettings = {
    [key: string]: string | number | boolean
    prevChapterBtn: string
    chapterContent: string
    chapterTitle: string
    fictionTitle: string
    wordCount: number
    buttonPlacement: string
    smoothScroll: boolean
    autoExpand: boolean
    blurb: string
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
