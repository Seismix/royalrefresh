import { ExtensionSelectors, ExtensionSettings } from "~/types/types"

export const DEFAULT_SELECTORS: ExtensionSelectors = {
    prevChapterBtn: "div.col-md-4:nth-child(1) > a:nth-child(1)",
    chapterContent: ".chapter-inner",
    chapterTitle: "h1.font-white",
    fictionTitle: "h2.font-white",
    togglePlacement: ".chapter > div > .actions",
    settingsPlacement:
        "#settings > div:nth-child(1) > div:nth-child(1) > div:nth-child(3)",
    blurb: ".description .hidden-content",
    closeButtonSelector:
        "#settings > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > button:last-child",
}

const DEFAULTS: ExtensionSettings = {
    wordCount: 250,
    smoothScroll: true,
    autoExpand: false,
    ...DEFAULT_SELECTORS,
}

export const CACHE_TTL_MS = 30 * 60 * 1000

export default DEFAULTS
