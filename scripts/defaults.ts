import { ExtensionSettings } from "@royalrecap/types"

const DEFAULTS: ExtensionSettings = {
    wordCount: 250,
    prevChapterBtn: "div.col-md-4:nth-child(1) > a:nth-child(1)",
    chapterContent: ".chapter-inner",
    chapterTitle: "h1.font-white",
    fictionTitle: "h2.font-white",
    togglePlacement:
        "div.portlet:nth-child(2) > div:nth-child(1) > div:nth-child(2)",
    settingsPlacement:
        "#settings > div:nth-child(1) > div:nth-child(1) > div:nth-child(3)",
    smoothScroll: true,
    autoExpand: false,
    blurb: ".description",
    closeButtonSelector:
        "#settings > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > button:last-child",
}

export default DEFAULTS
