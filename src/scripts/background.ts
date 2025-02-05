import browser from "webextension-polyfill"
import DEFAULTS from "../helpers/defaults"
import { BrowserType, currentBrowser } from "../helpers/platform"
import StorageService from "../helpers/storageService"

// Saves the default values to the browser storage after the extension has been installed
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        StorageService.restoreDefaults()
    }
    if (details.reason === "update") {
        StorageService.updateSettings()
    }
    // Only Firefox supports the "temporary" property
    if (details.temporary) {
        browser.tabs.reload()
    }
})

browser.runtime.onMessage.addListener((message) => {
    if (
        typeof message === "object" &&
        message !== null &&
        "request" in message
    ) {
        const request = (message as { request: string }).request
        if (request === "getDefaultSettings") {
            return Promise.resolve(DEFAULTS)
        }
    }
})

browser.runtime.onMessage.addListener((message) => {
    if (
        typeof message === "object" &&
        message !== null &&
        "action" in message &&
        (message as { action: string }).action === "openExtensionSettings"
    ) {
        if (currentBrowser === BrowserType.Firefox) {
            const manifest = browser.runtime.getManifest()
            if (manifest.options_ui) {
                // Open the extension settings URL in a new tab
                browser.tabs.create({
                    url: browser.runtime.getURL(manifest.options_ui.page),
                })
            }
        } else {
            browser.action.openPopup()
        }
        return true // Indicate that the response will be sent asynchronously
    }
})
