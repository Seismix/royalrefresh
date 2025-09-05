import type { ExtensionSettings } from "~/types/types"

/**
 * DOM and URL utility functions for the extension
 */

/**
 * True if `chapter` is in the URL path, otherwise false.
 */
export function documentIsChapterURL(): boolean {
    return window.location.pathname.split("/").includes("chapter")
}

/**
 * True if the previous chapter button has a valid `href` attribute, otherwise false.
 */
export function documentHasPreviousChapterURL(
    extensionSettings: ExtensionSettings,
): boolean {
    const hasPrevChapterURL = document.querySelector(
        extensionSettings.prevChapterBtn,
    )

    return !!hasPrevChapterURL?.hasAttribute("href")
}
