export enum BrowserType {
    Chrome = "chrome",
    Firefox = "firefox",
    AndroidFirefox = "android-firefox",
}

const isAndroid =
    navigator.userAgent.includes("Mobile") ||
    navigator.userAgent.includes("Android")

export const currentBrowser: BrowserType =
    typeof browser !== "undefined" && navigator.userAgent.includes("Firefox")
        ? isAndroid
            ? BrowserType.AndroidFirefox
            : BrowserType.Firefox
        : BrowserType.Chrome

/**
 * Check if the user prefers reduced motion
 * @returns true if prefers-reduced-motion is set to reduce, false otherwise
 */
export function prefersReducedMotion(): boolean {
    try {
        if (typeof window !== "undefined" && window.matchMedia) {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches
        }
    } catch (error) {
        // Ignore errors
    }
    return false
}
