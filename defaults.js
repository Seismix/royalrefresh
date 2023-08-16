// @ts-check
/// <reference path="./types/firefox-browser-webext.d.ts" />
/**
 * @typedef {import("./types/types").ExtensionSettings} ExtensionSettings
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
    buttonPlacement: ".actions",
}

export default DEFAULTS
