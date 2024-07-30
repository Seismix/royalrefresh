import browser from "webextension-polyfill"
import DEFAULTS from "./defaults.js"

// Saves the default values to the browser storage after the extension has been installed
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        browser.storage.sync.set(DEFAULTS)
    }
    // Only Firefox supports the "temporary" property
    if (details.temporary) {
        browser.tabs.reload()
    }
})

browser.runtime.onMessage.addListener((message) => {
    if (message.request === "getDefaultSettings") {
        return Promise.resolve(DEFAULTS)
    }
})

browser.runtime.onMessage.addListener((message) => {
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
