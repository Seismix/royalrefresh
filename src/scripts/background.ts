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

// Listen for AI-summarize requests from the content script
browser.runtime.onMessage.addListener(async (message) => {
    if (message.action === "aiSummarize" && typeof message.text === "string") {
        try {
            console.debug("AI summarization request received")
            // Initialize the model (downloads on first run)
            await browser.trial.ml.createEngine({
                modelHub: "huggingface",
                taskName: "summarization",
                modelId: "Xenova/long-t5-tglobal-base-16384-book-summary"
            })
            console.debug("AI summarization model initialized")

            console.debug("Starting AI summarization...")
            // Run the summarization model
            const results = await browser.trial.ml.runEngine({
                args: [message.text],
            })
            console.debug("AI summarization model run completed")

            // Pull out the first result’s summary_text field
            const summary = Array.isArray(results) && results.length > 0
                ? (results[0] as any).summary_text
                : undefined

            console.debug("runEngine raw output:", results)

            return Promise.resolve({ success: true, summary })
        } catch (error: any) {
            console.error("AI summarization failed:", error)
            return Promise.resolve({ success: false, error: error.message })
        }
    }
})
