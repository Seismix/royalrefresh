import DEFAULTS from "~/lib/defaults"
import { StorageService } from "~/lib/storage"
import { currentBrowser, BrowserType } from "~/lib/platform"

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
            // Platform-specific options page handling
            switch (currentBrowser) {
                case BrowserType.AndroidFirefox:
                    // Android Firefox has issues with openOptionsPage() so we open the options page in a new tab
                    // See https://bugzilla.mozilla.org/show_bug.cgi?id=1795449
                    const manifest = browser.runtime.getManifest()
                    const optionsPage = manifest.options_ui?.page
                    if (optionsPage) {
                        browser.tabs.create({
                            url: browser.runtime.getURL(optionsPage),
                        })
                    }
                    break
                case BrowserType.Firefox:
                    // Desktop Firefox - openOptionsPage() respects open_in_tab setting
                    browser.runtime.openOptionsPage()
                    break
                default:
                    // Chrome and other browsers - use popup
                    browser.action.openPopup()
                    break
            }
            return true // Indicate that the response will be sent asynchronously
        }
    })
})
