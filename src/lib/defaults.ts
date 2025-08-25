import { ExtensionSelectors, ExtensionSettings } from "~/types/types"

const DEFAULT_SELECTORS: ExtensionSelectors = {
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

export { DEFAULT_SELECTORS }
export default DEFAULTS
