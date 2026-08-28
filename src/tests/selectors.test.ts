import { expect, test, type Browser, type Page } from "@playwright/test"
import { ADAPTERS, type UiVersion } from "~/lib/adapters"
import {
    getChapterPageSelectors,
    getFictionPageSelectors,
} from "~/lib/config/defaults"

/** How long to wait for RoyalRoad to respond before treating it as unreachable. */
const NAV_TIMEOUT = 30_000

/**
 * Budget for the resolve-to-the-right-element probes below. Short on purpose:
 * the matching `… selector exists` test already reports absence, so when a
 * selector matches nothing these should fail fast rather than spend the full
 * 30s waiting for an element that is never coming.
 */
const PROBE_TIMEOUT = 5_000

/** The cookie RoyalRoad gates its redesign beta on. */
const BETA_COOKIE = "beta-ui-v2"

/**
 * How to make RoyalRoad serve each layout, and how to tell that it did.
 *
 * The extension itself never reads this cookie — `resolveAdapter()` judges the
 * rendered DOM, because a cookie only records what was once asked for. The
 * canary is the one place that has to ASK for a layout, since it must check
 * every layout's selectors on a machine that can only be served one at a time.
 *
 * `served` is asserted before any selector. It separates "RoyalRoad served the
 * other layout" (cookie renamed, beta withdrawn or promoted to default) from
 * "this layout's selectors drifted" — different problems with different fixes,
 * and without the split the first masquerades as the second across every test.
 *
 * Typed as a total `Record<UiVersion, ...>` on purpose: adding a layout to the
 * registry fails to compile until the canary knows how to reach it.
 */
const LAYOUTS: Record<UiVersion, { cookie: string; served: string }> = {
    redesign: { cookie: "always", served: "#chapterHeroData" },
    legacy: { cookie: "never", served: "body:not(:has(#chapterHeroData))" },
}

/**
 * Selectors RoyalRoad legitimately renders more than once. Everything else must
 * match EXACTLY one element: the extension takes the first match, so a selector
 * that suddenly matches several is how it silently starts reading the wrong one
 * (the redesign's `#chapterHeroData h4` began matching the author's name, not
 * the fiction's, and quietly pointed the blurb fetch at the author profile).
 *
 * The redesign renders its chapter nav bar both above and below the text, so
 * the previous-chapter button and the toggle's mount point are genuinely
 * duplicated — both copies point at the same chapter.
 */
const MAY_REPEAT = new Set(["prevChapterBtn", "togglePlacement"])

/** The fiction the canary reads. Long-running and complete, so its chapter and
 * overview pages are stable targets. */
const FICTION_URL = "https://www.royalroad.com/fiction/63759/super-supportive"
const CHAPTER_URL = `${FICTION_URL}/chapter/1097958/two-mistakes`

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

/** Collapse the whitespace RoyalRoad's templates leave in headings so heading
 * text can be compared against the flat `<title>`. */
function normalize(text: string | null) {
    return (text ?? "").replace(/\s+/g, " ").trim()
}

/**
 * Open `url` in a fresh context pinned to `version`'s layout.
 *
 * Returns the page, or the outage message when RoyalRoad could not be reached —
 * the caller skips on that rather than reporting a selector failure.
 */
async function openAs(
    browser: Browser,
    version: UiVersion,
    url: string,
): Promise<{ page: Page } | { unreachable: string }> {
    const context = await browser.newContext()
    await context.addCookies([
        {
            name: BETA_COOKIE,
            value: LAYOUTS[version].cookie,
            domain: ".royalroad.com",
            path: "/",
        },
    ])

    const page = await context.newPage()
    try {
        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: NAV_TIMEOUT,
        })
    } catch (error) {
        if (isSiteUnreachable(error)) {
            return { unreachable: unreachableMessage(url, error) }
        }
        throw error
    }

    return { page }
}

/** Assert a selector matches the page the way the extension relies on it to. */
async function checkSelector(page: Page, key: string, selector: string) {
    const count = await page.locator(selector).count()
    if (MAY_REPEAT.has(key)) {
        expect(count).toBeGreaterThan(0)
    } else {
        expect(count).toBe(1)
    }
}

for (const { id, label } of ADAPTERS) {
    const version: UiVersion = id

    test.describe(`${label} — chapter page`, () => {
        let page: Page
        // Set when the shared navigation in beforeAll hits an outage, so every
        // test in this block skips with the same message rather than erroring.
        let unreachable: string | null = null

        test.beforeAll(async ({ browser }) => {
            const opened = await openAs(browser, version, CHAPTER_URL)
            if ("unreachable" in opened) {
                unreachable = opened.unreachable
                return
            }
            page = opened.page
        })

        test.afterAll(async () => {
            await page?.context().close()
        })

        test.beforeEach(() => {
            test.skip(unreachable !== null, unreachable ?? "")
        })

        test("RoyalRoad served this layout", async () => {
            // Guards every test below: if RoyalRoad stopped honouring the beta
            // cookie, the selectors would all "fail" against the wrong page.
            await expect(
                page.locator(LAYOUTS[version].served),
                `RoyalRoad did not serve the ${label} layout for ${BETA_COOKIE}=${LAYOUTS[version].cookie}. The cookie may have been renamed, or this layout retired/promoted — that is a registry question, not a selector fix.`,
            ).toHaveCount(1)
        })

        for (const [key, selector] of Object.entries(
            getChapterPageSelectors(version),
        )) {
            test(`${key} selector exists`, async () => {
                test.skip(
                    selector === "",
                    `${key} is intentionally unconfigured on the ${label} layout.`,
                )
                await checkSelector(page, key, selector)
            })
        }

        // The two identity selectors are checked for what they RESOLVE TO, not
        // just that they resolve. Both broke silently once by matching a real,
        // wrong element, which a presence check cannot see.

        test("chapter title selector reads the chapter's own title", async () => {
            const selectors = getChapterPageSelectors(version)
            const heading = normalize(
                await page
                    .locator(selectors.chapterTitle)
                    .first()
                    .textContent({ timeout: PROBE_TIMEOUT }),
            )
            expect(heading).not.toBe("")
            // RoyalRoad's <title> leads with the chapter title on both layouts.
            expect(normalize(await page.title())).toContain(heading)
        })

        test("fiction title selector links to the fiction overview", async () => {
            const selectors = getChapterPageSelectors(version)
            const heading = page.locator(selectors.fictionTitle).first()

            expect(
                normalize(
                    await heading.textContent({ timeout: PROBE_TIMEOUT }),
                ),
            ).not.toBe("")

            // findFictionOverviewUrl() walks `closest("a")` from this element to
            // reach the overview page. When the selector drifts onto the author
            // heading that walk still succeeds — it just lands on /profile/<id>,
            // and the blurb silently becomes the author's bio.
            const href = await heading.evaluate(
                (el) => el.closest("a")?.getAttribute("href") ?? null,
                undefined,
                { timeout: PROBE_TIMEOUT },
            )
            expect(href).toContain("/fiction/")
        })
    })

    test.describe(`${label} — fiction page`, () => {
        let page: Page
        let unreachable: string | null = null

        test.beforeAll(async ({ browser }) => {
            const opened = await openAs(browser, version, FICTION_URL)
            if ("unreachable" in opened) {
                unreachable = opened.unreachable
                return
            }
            page = opened.page
        })

        test.afterAll(async () => {
            await page?.context().close()
        })

        test.beforeEach(() => {
            test.skip(unreachable !== null, unreachable ?? "")
        })

        for (const [key, selector] of Object.entries(
            getFictionPageSelectors(version),
        )) {
            test(`${key} selector exists`, async () => {
                test.skip(
                    selector === "",
                    `${key} is intentionally unconfigured on the ${label} layout.`,
                )
                await checkSelector(page, key, selector)
            })
        }
    })
}
