import DEFAULTS from "~/lib/config/defaults"
import { BrowserType, currentBrowser } from "~/lib/utils/platform"
import {
    getSettings,
    restoreSelectors,
    setSettings,
    watchSettings,
} from "~/lib/utils/storage-utils"
import { applyLayoutCookie, hasCookiesPermission } from "~/lib/adapters"
import type { ExtensionSettings } from "~/types/types"

export default defineBackground(() => {
    // Keep RoyalRoad's gating cookie in sync with the user's saved layout choice.
    // The redesign activates on its own from this cookie (no login needed), so the
    // cookie is a pure effect of the setting: we apply it on startup/install (to
    // survive browser restarts and cookie expiry) and whenever settings change.
    // The user picks the layout in Settings, which requests the optional `cookies`
    // permission; this no-ops without it.
    const syncBetaCookie = async (settings: ExtensionSettings) => {
        if (!(await hasCookiesPermission())) return
        await applyLayoutCookie(settings.betaCookie)
    }

    const syncFromStorage = async () => syncBetaCookie(await getSettings())

    syncFromStorage()
    browser.runtime.onStartup.addListener(syncFromStorage)
    watchSettings((settings) => {
        if (settings) syncBetaCookie(settings)
    })

    browser.runtime.onInstalled.addListener(async (details) => {
        if (details.reason === "install") {
            // Use defaults
            await setSettings({
                ...DEFAULTS,
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
            // Return basic defaults
            return Promise.resolve({
                ...DEFAULTS,
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
