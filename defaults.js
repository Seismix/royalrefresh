// @ts-check
/**
 * @typedef {import("./types.js").ExtensionSettings} ExtensionSettings
 */

/**
 * The object containing all default settings this extension uses
 * @type {ExtensionSettings}
 */
const DEFAULTS = {
    wordCount: 250,
    prevChapterBtn: "div.col-md-4:nth-child(1) > a:nth-child(1)",
    chapterContent: ".chapter-inner",
    chapterTitle: "h1.font-white",
    fictionTitle: "h2.font-white",
}

export default DEFAULTS
