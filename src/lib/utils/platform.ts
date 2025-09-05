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
