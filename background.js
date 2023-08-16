import DEFAULTS from "./defaults.js"

/**
 * Saves the default values to the browser storage after the extension has been installed
 */
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        browser.storage.sync.set(DEFAULTS)
    }
})

browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage()
})
