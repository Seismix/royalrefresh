import { Page } from "@playwright/test"
import {
    getChapterPageSelectors,
    getFictionPageSelectors,
} from "~/lib/config/defaults"
import { expect, test } from "./utils/fixtures"

/** How long to wait for RoyalRoad to respond before treating it as unreachable. */
const NAV_TIMEOUT = 30_000

/**
 * Network-level failures (DNS, refused connection, navigation timeout) mean
 * RoyalRoad is down or unreachable — NOT that our selectors drifted. We detect
 * those and skip with a clear "re-run once the site is up" message, so a flaky
 * third-party outage never masquerades as a selector regression (a real
 * selector change still fails loudly).
 */
function isSiteUnreachable(error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return (
        message.includes("net::ERR") || // Chromium network errors
        message.includes("NS_ERROR") || // Firefox network errors
        message.includes("Timeout") // navigation timed out
    )
}

/** Message shown on the skipped tests when RoyalRoad can't be reached. */
function unreachableMessage(url: string, error: unknown) {
    const detail = error instanceof Error ? error.message : String(error)
    return `RoyalRoad appears to be down or unreachable, so the live selector canary could not run. This is NOT a selector failure — re-run this canary once the site is back up.\n  URL:   ${url}\n  Cause: ${detail}`
}

/**
 * Navigates, skipping the test instead of failing if the site is unreachable.
 * Re-throws anything that isn't a network/outage error.
 */
async function gotoOrSkip(page: Page, url: string) {
    try {
        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: NAV_TIMEOUT,
        })
    } catch (error) {
        if (isSiteUnreachable(error)) {
            test.skip(true, unreachableMessage(url, error))
        }
        throw error
    }
}

/** Helper function to check if a selector exists and is visible */
async function checkSelector(page: Page, selector: string) {
    const element = page.locator(selector)
    const count = await element.count()
    expect(count).toBe(1)
}

test.describe("Chapter Page", () => {
    const url =
        "https://www.royalroad.com/fiction/63759/super-supportive/chapter/1097958/two-mistakes"

    let page: Page
    // Set when the shared navigation in beforeAll hits an outage, so every test
    // in this block skips with the same message rather than erroring.
    let unreachable: string | null = null

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage()

        try {
            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: NAV_TIMEOUT,
            })
        } catch (error) {
            if (isSiteUnreachable(error)) {
                unreachable = unreachableMessage(url, error)
            } else {
                throw error
            }
        }
    })

    test.afterAll(async () => {
        await page?.close()
    })

    test.beforeEach(() => {
        test.skip(unreachable !== null, unreachable ?? "")
    })

    for (const [key, selector] of Object.entries(getChapterPageSelectors())) {
        test(`${key} selector exists`, async () => {
            await checkSelector(page, selector)
        })
    }
})

test.describe("Fiction Page", () => {
    const url = "https://www.royalroad.com/fiction/63759/super-supportive"

    for (const [key, selector] of Object.entries(getFictionPageSelectors())) {
        test(`${key} selector exists`, async ({ page }) => {
            await gotoOrSkip(page, url)
            await checkSelector(page, selector)
        })
    }
})
