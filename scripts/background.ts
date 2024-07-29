import browser from "webextension-polyfill"
import DEFAULTS from "./defaults.js"

// Saves the default values to the browser storage after the extension has been installed
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        browser.storage.sync.set(DEFAULTS)
    }
})

browser.runtime.onMessage.addListener((message, sender) => {
    if (message.request === "getDefaultSettings") {
        console.log("getDefaultSettings")
        return Promise.resolve(DEFAULTS)
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
