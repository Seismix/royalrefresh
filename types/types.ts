export type ExtensionSettings = {
    [key: string]: string | number
    prevChapterBtn: string
    chapterContent: string
    chapterTitle: string
    fictionTitle: string
    wordCount: number
    buttonPlacement: string
}

export type RecapContainerStrings = {
    fictionTitle: string
    lastChapterName: string
    lastChapterContent: string
}

export type DisplayMessageType = "success" | "restore"
