/**
 * This script is a utility to generate Playwright code using the Playwright codegen feature.
 * Unlike the pnpm playwright codegen command, this script will launch a browser with the extension loaded.
 * Run it with `pnpm tsx path/to/codegen.ts`.
 */

import { chromium } from "@playwright/test"
import path from "path"

async function runCodegen() {
    const chromeExtensionPath = path.resolve(".output/chrome-mv3")

    // Launch browser with persistent context and load the extension
    const context = await chromium.launchPersistentContext("", {
        headless: false,
        args: [
            `--disable-extensions-except=${chromeExtensionPath}`,
            `--load-extension=${chromeExtensionPath}`,
        ],
    })

    // Create a new page
    const page = await context.newPage()

    // Use Playwright codegen to record actions on the page
    // You can specify the URL you want to start recording on
    await page.goto(
        "https://www.royalroad.com/fiction/63759/super-supportive/chapter/1097958/two-mistakes",
    )

    // Start codegen, which will allow you to interact with the browser and generate code
    await page.pause()

    // Close the context when done
    await context.close()
}

runCodegen()
