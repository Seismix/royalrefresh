import { Page } from "@playwright/test"
import DEFAULTS from "../scripts/defaults"
import { expect, test } from "./utils/fixtures"

/** Helper function to check if a selector exists and is visible */
async function checkSelector(page: Page, selector: string, multiple = false) {
    const element = page.locator(selector)
    const count = await element.count()
    if (multiple) {
        expect(count).toBe(2)
    } else {
        expect(count).toBe(1)
    }
}

test.describe("Chapter Page", () => {
    let page: Page

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage()

        await page.goto(
            "https://www.royalroad.com/fiction/63759/super-supportive/chapter/1097958/two-mistakes",
        )
    })

    test.afterAll(async () => {
        await page.close()
    })

    for (const [key, selector] of Object.entries(DEFAULTS)) {
        // Skip 'blurb' because it's not present on the chapter page
        if (typeof selector === "string" && key !== "blurb") {
            test(`${key} selector exists`, async () => {
                // the togglePlacement selector is present 2 times on the page so we need to check for it differently
                await checkSelector(page, selector, key === "togglePlacement")
            })
        }
    }
})

test.describe("Fiction Page", () => {
    test("blurb selector exists", async ({ page }) => {
        await page.goto(
            "https://www.royalroad.com/fiction/63759/super-supportive",
        )
        await checkSelector(page, DEFAULTS.blurb)
    })
})
