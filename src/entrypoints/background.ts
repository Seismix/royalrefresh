import DEFAULTS from "~/lib/defaults"
import { StorageService } from "~/lib/storage"

export default defineBackground(() => {
    // Saves the default values to the browser storage after the extension has been installed
    browser.runtime.onInstalled.addListener(async (details) => {
        if (details.reason === "install") {
            await StorageService.setSettings(DEFAULTS)
        }
        if (details.reason === "update") {
            await StorageService.updateSettings()
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
            browser.runtime.openOptionsPage()
            return true // Indicate that the response will be sent asynchronously
        }
    })
})
