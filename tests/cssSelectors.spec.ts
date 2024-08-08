import { test, expect } from "./utils/fixtures"
import DEFAULTS from "../scripts/defaults"
import { Page } from "@playwright/test"

/** Helper function to check if a selector exists and is visible */
async function checkSelector(page: Page, selector: string) {
    const element = page.locator(selector)
    await expect(element).toBeVisible()
}

test.describe("CSS Selector Defaults", () => {
    test.describe("Chapter Page", () => {
        let page: Page

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage()

            // Navigate to the chapter page and open the reader preferences modal
            await page.goto(
                "https://www.royalroad.com/fiction/63759/super-supportive/chapter/1097958/two-mistakes",
            )
            await page
                .getByRole("button", { name: " Reader Preferences" })
                .click()
        })

        test.afterAll(async () => {
            await page.close()
        })

        for (const [key, selector] of Object.entries(DEFAULTS)) {
            // Skip 'blurb' bceause it's not present on the chapter page
            if (typeof selector === "string" && key !== "blurb") {
                test(`${key} selector exists`, async () => {
                    await checkSelector(page, selector)
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
})
