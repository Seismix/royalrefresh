import { ExtensionSelectors, ExtensionSettings } from "~/types/types"

export const DEFAULT_SELECTORS: ExtensionSelectors = {
    prevChapterBtn: "a[href*='/chapter/']:has(> i.fa-chevron-double-left)",
    chapterContent: ".chapter-inner",
    chapterTitle: "h1.font-white",
    fictionTitle: "h2.font-white",
    togglePlacement: ".chapter > div > .actions",
    settingsPlacement: "#settings div.modal-footer",
    blurb: ".description .hidden-content",
    blurbLabels: ".portlet .text-center.font-red-sunglo",
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
