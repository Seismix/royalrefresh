import DEFAULTS from "./defaults.js"

// Saves the default values to the browser storage after the extension has been installed
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        browser.storage.sync.set(DEFAULTS)
    }
})

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.request === "getDefaultSettings") {
        sendResponse(DEFAULTS)
    }
})

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openExtensionSettings") {
        const manifest = browser.runtime.getManifest()
        if (manifest.browser_action) {
            const popupURL = manifest.browser_action.default_popup

            // Open the extension settings URL in a new tab
            if (popupURL) {
                browser.tabs.create({ url: browser.runtime.getURL(popupURL) })
            }
        }
    }
})
