export enum BrowserType {
    Chrome = "chrome",
    Firefox = "firefox",
}

export const currentBrowser: BrowserType =
    typeof browser !== "undefined" && navigator.userAgent.includes("Firefox")
        ? BrowserType.Firefox
        : BrowserType.Chrome
