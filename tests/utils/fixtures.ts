/**
 * This file extends the playwright test framework to launch a browser with the extension loaded.
 * It also provides a utility function to get the extension ID.
 * From: https://playwright.dev/docs/chrome-extensions
 */

import { test as base, chromium, type BrowserContext } from "@playwright/test"

//? Modify the path to the extension directory if needed
const chromeExtensionPath = "dist/chrome"

export const test = base.extend<{
    context: BrowserContext
    extensionId: string
}>({
    context: async ({}, use) => {
        const context = await chromium.launchPersistentContext("", {
            args: [
                `--headless=new`,
                `--disable-extensions-except=${chromeExtensionPath}`,
                `--load-extension=${chromeExtensionPath}`,
            ],
        })
        await use(context)
        await context.close()
    },
    extensionId: async ({ context }, use) => {
        // for manifest v3:
        let [background] = context.serviceWorkers()
        if (!background)
            background = await context.waitForEvent("serviceworker")

        const extensionId = background.url().split("/")[2]
        await use(extensionId)
    },
})
export const expect = test.expect
