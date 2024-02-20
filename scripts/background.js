import DEFAULTS from "./defaults.js"

// Saves the default values to the browser storage after the extension has been installed
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        browser.storage.sync.set(DEFAULTS)
    }
})

// Fires when a browser action is clicked, which opens the extension options page
browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage()
})

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.request === "getDefaultSettings") {
        sendResponse(DEFAULTS)
    }
})
