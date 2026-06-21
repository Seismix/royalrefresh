/**
 * This file extends the playwright test framework to launch a browser with the extension loaded.
 * It also provides a utility function to get the extension ID.
 * From: https://playwright.dev/docs/chrome-extensions
 */

import { test as base, chromium, type BrowserContext } from "@playwright/test"
import path from "path"

// WXT builds the Chrome MV3 bundle here (run `pnpm build` first).
const chromeExtensionPath = path.resolve(".output/chrome-mv3")

export const test = base.extend<{
    context: BrowserContext
    extensionId: string
}>({
    context: async ({}, use) => {
        // Loading an unpacked extension requires a real Chromium with the new
        // headless shell. `channel: "chromium"` ships that shell; set
        // PWHEADED=1 to debug with a visible window.
        const context = await chromium.launchPersistentContext("", {
            channel: "chromium",
            headless: !process.env.PWHEADED,
            args: [
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
