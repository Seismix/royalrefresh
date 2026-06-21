/**
 * Layer 3 — Extension E2E with MOCKED RoyalRoad pages (zero network).
 *
 * Loads the real built extension (.output/chrome-mv3) and uses context.route to
 * fulfil every royalroad.com request from hand-built HTML so the content script
 * injects + fetches against deterministic markup.
 *
 * Requires `pnpm build` first (the e2e CI job runs it). If the extension fails
 * to load (headless-extension support is environment-sensitive), these tests
 * fail loudly rather than silently passing.
 */
import { expect, test } from "./utils/fixtures"

const ORIGIN = "https://www.royalroad.com"
const CHAPTER_URL = `${ORIGIN}/fiction/1/test-story/chapter/2/the-climb`
const PREV_CHAPTER_URL = `${ORIGIN}/fiction/1/test-story/chapter/1/the-start`
const OVERVIEW_URL = `${ORIGIN}/fiction/1/test-story`

// Structural fixtures — must satisfy the injection selectors in defaults.ts:
//   togglePlacement: ".chapter > div > .actions"
//   chapterContent:  ".chapter-inner"
//   fictionTitle:    "h2.font-white" (wrapped in an <a> for the overview link)
//   chapterTitle:    "h1.font-white"
//   prevChapterBtn:  "a[href*='/chapter/']:has(> i.fa-chevron-double-left)"
function chapterPage({ withPrev }: { withPrev: boolean }) {
    const prevButton = withPrev
        ? `<a href="${PREV_CHAPTER_URL}"><i class="fa fa-chevron-double-left"></i> Previous</a>`
        : ""
    return `<!doctype html><html><head><title>Chapter</title></head><body>
        <div class="chapter">
            <a href="${OVERVIEW_URL}"><h2 class="font-white">Test Story</h2></a>
            <h1 class="font-white">Chapter 2: The Climb</h1>
            <div>
                <div class="actions">${prevButton}</div>
            </div>
            <div class="chapter-inner">
                <p>Current chapter paragraph one.</p>
                <p>Current chapter paragraph two.</p>
            </div>
        </div>
    </body></html>`
}

const prevChapterPage = `<!doctype html><html><head><title>Prev</title></head><body>
    <div class="chapter">
        <h1 class="font-white">Chapter 1: The Start</h1>
        <div class="chapter-inner">
            <p>Alpha bravo charlie delta echo foxtrot golf hotel india juliet.</p>
            <p>Kilo lima mike november oscar papa quebec romeo sierra tango.</p>
            <p>Uniform victor whiskey xray yankee zulu one two three four.</p>
        </div>
    </div>
</body></html>`

const overviewPage = `<!doctype html><html><head><title>Overview</title></head><body>
    <div class="portlet">
        <div class="text-center font-red-sunglo">Ongoing · Fantasy</div>
    </div>
    <div class="description">
        <div class="hidden-content"><p>A hero rises to face great peril.</p></div>
    </div>
</body></html>`

test.describe("Extension E2E (mocked RoyalRoad)", () => {
    test("injects recap button on a chapter page, click renders the recap", async ({
        context,
    }) => {
        const page = await context.newPage()
        await page.route(`${ORIGIN}/**`, async (route) => {
            const url = route.request().url()
            if (url.startsWith(PREV_CHAPTER_URL)) {
                return route.fulfill({
                    contentType: "text/html",
                    body: prevChapterPage,
                })
            }
            return route.fulfill({
                contentType: "text/html",
                body: chapterPage({ withPrev: true }),
            })
        })

        await page.goto(CHAPTER_URL)

        const recapButton = page.locator("#recapButton")
        await expect(recapButton).toBeVisible()
        await expect(recapButton).toContainText("Recap")

        await recapButton.click()

        const container = page.locator("#recapContainer")
        await expect(container).toContainText("RoyalRefresh of Test Story")
        await expect(container).toContainText(
            "Previous chapter: Chapter 1: The Start",
        )
        await expect(container).toContainText("Showing last ~")
    })

    test("offers the blurb path when there is no previous chapter", async ({
        context,
    }) => {
        const page = await context.newPage()
        await page.route(`${ORIGIN}/**`, async (route) => {
            const url = route.request().url()
            if (url.startsWith(OVERVIEW_URL) && !url.includes("/chapter/")) {
                return route.fulfill({
                    contentType: "text/html",
                    body: overviewPage,
                })
            }
            return route.fulfill({
                contentType: "text/html",
                body: chapterPage({ withPrev: false }),
            })
        })

        await page.goto(CHAPTER_URL)

        const blurbButton = page.locator("#blurbButton")
        await expect(blurbButton).toBeVisible()
        await expect(blurbButton).toContainText("Blurb")

        await blurbButton.click()

        const container = page.locator("#recapContainer")
        await expect(container).toContainText("Blurb: Test Story")
        await expect(container).toContainText(
            "A hero rises to face great peril",
        )
    })

    test("shows an error state when the prev-chapter fetch fails", async ({
        context,
    }) => {
        const page = await context.newPage()
        await page.route(`${ORIGIN}/**`, async (route) => {
            const url = route.request().url()
            if (url.startsWith(PREV_CHAPTER_URL)) {
                return route.fulfill({ status: 500, body: "boom" })
            }
            return route.fulfill({
                contentType: "text/html",
                body: chapterPage({ withPrev: true }),
            })
        })

        await page.goto(CHAPTER_URL)

        await page.locator("#recapButton").click()

        const container = page.locator("#recapContainer")
        await expect(container.locator(".text-danger")).toBeVisible()
    })
})
