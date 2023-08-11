/**
 * ! This needs to be edited if the options change to get full intellisense together
 * ! with the DEFAULTS object in `defaults.js`
 * @typedef {Object} DefaultValues
 * @property {string} prevChapterBtn - The selector for the previous chapter button.
 * @property {string} chapterContent - The selector for the chapter content.
 * @property {string} chapterTitle - The selector for the chapter title.
 * @property {string} fictionTitle - The selector for the fiction title.
 * @property {number} wordCount - The selector for the fiction title.
 */

/**
 * The object containing all default settings this extension uses
 * @type {DefaultValues}
 */
const DEFAULTS = {
    wordCount: 250,
    prevChapterBtn: "div.col-md-4:nth-child(1) > a:nth-child(1)",
    chapterContent: ".chapter-inner",
    chapterTitle: "h1.font-white",
    fictionTitle: "h2.font-white",
}

export default DEFAULTS
