import DEFAULTS from "./defaults.js"

browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage()
})

/**
 * Saves the default values to the browser storage after the extension has been installed
 */
browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
        await browser.storage.sync.set(DEFAULTS)
    }
})
