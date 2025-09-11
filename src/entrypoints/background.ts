import DEFAULTS, { getDefaults } from "~/lib/config/defaults"
import {
    setSettings,
    restoreSelectors,
    getSettings,
    updateSettings,
} from "~/lib/utils/storage-utils"
import { currentBrowser, BrowserType } from "~/lib/utils/platform"

export default defineBackground(() => {
    // Saves the default values to the browser storage after the extension has been installed
    browser.runtime.onInstalled.addListener(async (details) => {
        if (details.reason === "install") {
            await setSettings(getDefaults())
        }

        if (details.reason === "update") {
            const settings = await getSettings()

            // Migration: smoothScroll -> enableJump & scrollBehavior
            if ("smoothScroll" in settings) {
                const migrated = {
                    ...settings,
                    enableJump: (settings as any).smoothScroll === true,
                    scrollBehavior: (settings as any).smoothScroll
                        ? ("smooth" as const)
                        : ("auto" as const),
                } as any
                delete migrated.smoothScroll
                await updateSettings(migrated)
            }

            // Preserve user settings but update selectors to handle website changes
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
            return Promise.resolve(getDefaults())
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
