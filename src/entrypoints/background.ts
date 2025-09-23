import DEFAULTS from "~/lib/config/defaults"
import { BrowserType, currentBrowser } from "~/lib/utils/platform"
import { restoreSelectors, setSettings } from "~/lib/utils/storage-utils"

export default defineBackground(() => {
    browser.runtime.onInstalled.addListener(async (details) => {
        if (details.reason === "install") {
            // Use conservative defaults - first-time detection happens on UI side
            await setSettings({
                ...DEFAULTS,
                hasDetectedReducedMotion: false, // Flag to trigger first-time detection
            })
        }

        if (details.reason === "update") {
            // WXT handles storage migrations automatically via settingsStore versioning
            await restoreSelectors()
        }

        // Only Firefox supports the "temporary" property
        if (details.temporary) {
            browser.tabs.reload()
        }
    })

    browser.runtime.onMessage.addListener((message) => {
        if (typeof message !== "object" || message === null) return

        if ("request" in message && message.request === "getDefaultSettings") {
            // Return basic defaults - first-time detection happens on UI side
            return Promise.resolve({
                ...DEFAULTS,
                hasDetectedReducedMotion: false, // Flag to trigger first-time detection
            })
        }

        if ("action" in message && message.action === "openExtensionSettings") {
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
