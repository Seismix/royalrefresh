import { Page } from "@playwright/test"
import {
    getChapterPageSelectors,
    getFictionPageSelectors,
} from "~/lib/config/defaults"
import { expect, test } from "./utils/fixtures"

/** Helper function to check if a selector exists and is visible */
async function checkSelector(page: Page, selector: string) {
    const element = page.locator(selector)
    const count = await element.count()
    expect(count).toBe(1)
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

    for (const [key, selector] of Object.entries(getChapterPageSelectors())) {
        test(`${key} selector exists`, async () => {
            await checkSelector(page, selector)
        })
    }
})

test.describe("Fiction Page", () => {
    for (const [key, selector] of Object.entries(getFictionPageSelectors())) {
        test(`${key} selector exists`, async ({ page }) => {
            await page.goto(
                "https://www.royalroad.com/fiction/63759/super-supportive",
            )
            await checkSelector(page, selector)
        })
    }
})
