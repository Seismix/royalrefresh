import {
    devices,
    expect,
    test,
    type Browser,
    type Page,
} from "@playwright/test"
import { ADAPTERS, type UiVersion } from "~/lib/adapters"
import {
    getChapterPageSelectors,
    getFictionPageSelectors,
} from "~/lib/config/defaults"

/** How long to wait for RoyalRoad to respond before treating it as unreachable. */
const NAV_TIMEOUT = 30_000

/**
 * Budget for the `beforeAll` navigations. It MUST stay above `NAV_TIMEOUT`.
 *
 * Playwright gives a hook the test timeout (30s by default), which is exactly
 * `NAV_TIMEOUT` — so the two raced, and the hook lost. `page.goto()` never got
 * to throw the error `isSiteUnreachable()` reads, the whole outage path below
 * was unreachable in practice, and a slow RoyalRoad surfaced as
 * `"beforeAll" hook timeout of 30000ms exceeded` pinned to whichever selector
 * test happened to be collected first. That is how a RoyalRoad gateway timeout
 * on the redesign's fiction page got reported for days as `blurb` drifting —
 * a selector that was fine and was never actually evaluated.
 *
 * Keep the margin: `goto` has to lose this race for an outage to be skippable.
 */
const HOOK_TIMEOUT = NAV_TIMEOUT + 15_000

/**
 * Budget for the resolve-to-the-right-element probes below. Short on purpose:
 * the matching `… selector exists` test already reports absence, so when a
 * selector matches nothing these should fail fast rather than spend the full
 * 30s waiting for an element that is never coming.
 */
const PROBE_TIMEOUT = 5_000

/**
 * The cookie RoyalRoad picks the layout from for a logged-out visitor.
 *
 * It was `beta-ui-v2` (`always` / `never`) until RoyalRoad replaced it, around
 * 2026-09-18, with `rr_ui_mode` (`redesign` / `legacy`) — the name its own
 * layout switcher now writes, alongside a `sitePresentationMode` account
 * setting for logged-in users. The old cookie is ignored outright: every value
 * got the legacy page, which the `served` guard below reported as the redesign
 * not being served. If that guard fails for every page of one layout at once,
 * check which cookie RoyalRoad's `/dist/site-*.js` writes before touching a
 * selector.
 */
const LAYOUT_COOKIE = "rr_ui_mode"

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
 * It keys off site CHROME rather than page content. `#chapterHeroData` served
 * as the redesign's marker once, but it only exists on chapter pages, so the
 * fiction block had no guard at all and nothing there could tell a wrong-layout
 * page from a drifted selector. The redesign is the Tailwind-built layout and
 * loads a Tailwind stylesheet that legacy never does, which identifies the
 * layout on every page type without depending on the reader's theme. Losing
 * `#chapterHeroData` here costs no coverage — `chapterTitle` and `fictionTitle`
 * are both scoped to it, so a hero that stops rendering still fails loudly.
 *
 * Whatever replaces this must survive JS. `<html class="ie8 no-js">` looks like
 * a free layout marker in `view-source`, and is not one: the site strips those
 * classes on load, so it matches under `curl` and never in a real browser.
 *
 * Verified live on both layouts, on chapter and fiction pages alike.
 *
 * Typed as a total `Record<UiVersion, ...>` on purpose: adding a layout to the
 * registry fails to compile until the canary knows how to reach it.
 */
const REDESIGN_MARKER = "link[href*='tailwind']"
const LAYOUTS: Record<UiVersion, { cookie: string; served: string }> = {
    redesign: { cookie: "redesign", served: `html:has(${REDESIGN_MARKER})` },
    legacy: { cookie: "legacy", served: `html:not(:has(${REDESIGN_MARKER}))` },
}

/**
 * Selectors RoyalRoad legitimately renders more than once. Everything else must
 * match EXACTLY one element: the extension takes the first match, so a selector
 * that suddenly matches several is how it silently starts reading the wrong one
 * (the redesign's `#chapterHeroData h4` began matching the author's name, not
 * the fiction's, and quietly pointed the blurb fetch at the author profile).
 *
 * The redesign renders its chapter nav bar both above and below the text, so the
 * previous-chapter button is genuinely duplicated — both copies point at the
 * same chapter.
 */
const MAY_REPEAT = new Set(["prevChapterBtn"])

/**
 * Title of the per-layout guard test. The selector tests skip against it: a page
 * from the wrong layout makes every selector look drifted, and only this test
 * names the actual cause.
 */
const SERVED_TEST = "RoyalRoad served this layout"

/** Why a layout the canary asked for is not the layout it got. */
function wrongLayoutMessage(version: UiVersion, label: string) {
    return `RoyalRoad did not serve the ${label} layout for ${LAYOUT_COOKIE}=${LAYOUTS[version].cookie}. The cookie may have been renamed, or this layout retired/promoted — that is a registry question, not a selector fix.`
}

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

/**
 * Message shown on the skipped tests when RoyalRoad answers but is broken.
 *
 * Named apart from `unreachableMessage` so the skip reason says which kind of
 * outage it was: "nothing answered" and "RoyalRoad answered 504" send whoever
 * reads this to different places, and only one of them is worth reporting to
 * RoyalRoad.
 */
function serverErrorMessage(url: string, status: number) {
    return `RoyalRoad returned HTTP ${status} for this page, so the live selector canary could not run. This is NOT a selector failure — it is RoyalRoad's own server failing, and it can affect one layout while the other stays healthy. Re-run this canary once the site recovers.\n  URL:    ${url}\n  Status: ${status}`
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
    // Spelled out because `browser.newContext()` does NOT inherit the project's
    // `use` options — Playwright applies those in the `context`/`page` fixtures,
    // which a shared per-describe navigation can't use. Without this the canary
    // asks RoyalRoad for pages as `HeadlessChrome`, and any markup or challenge
    // it varies on that would surface here as a selector drift.
    const context = await browser.newContext({ ...devices["Desktop Chrome"] })
    await context.addCookies([
        {
            name: LAYOUT_COOKIE,
            value: LAYOUTS[version].cookie,
            domain: ".royalroad.com",
            path: "/",
        },
    ])

    try {
        const page = await context.newPage()
        const response = await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: NAV_TIMEOUT,
        })

        // A 5xx is RoyalRoad (or Cloudflare in front of it) failing, not our
        // selectors. Without this the canary happily runs every selector against
        // a gateway error page, finds none of them, and reports the layout as
        // drifted — the same misdiagnosis the hook timeout above produced, just
        // arriving by a different route when the origin fails fast.
        const status = response?.status() ?? 0
        if (status >= 500) {
            await context.close()
            return { unreachable: serverErrorMessage(url, status) }
        }

        return { page }
    } catch (error) {
        // Only the happy path hands a page back, and `afterAll` closes contexts
        // through that page — so every other exit closes its own, or an outage
        // leaks one context per describe per retry until the worker exits.
        await context.close()
        if (isSiteUnreachable(error)) {
            return { unreachable: unreachableMessage(url, error) }
        }
        throw error
    }
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
        // Set when RoyalRoad served the OTHER layout. Playwright tests are
        // independent, so a failing guard test skips nothing by itself — this
        // flag is what actually keeps the selector tests from reporting
        // "drifted" against a page from the wrong layout.
        let wrongLayout: string | null = null

        test.beforeAll(async ({ browser }) => {
            test.setTimeout(HOOK_TIMEOUT)
            const opened = await openAs(browser, version, CHAPTER_URL)
            if ("unreachable" in opened) {
                unreachable = opened.unreachable
                return
            }
            page = opened.page

            const served = await page.locator(LAYOUTS[version].served).count()
            if (served !== 1) {
                wrongLayout = wrongLayoutMessage(version, label)
            }
        })

        test.afterAll(async () => {
            await page?.context().close()
        })

        test.beforeEach(() => {
            test.skip(unreachable !== null, unreachable ?? "")
            // Everything but the guard test itself, which has to stay reportable
            // — it is the one test that names the real cause.
            test.skip(
                wrongLayout !== null && test.info().title !== SERVED_TEST,
                wrongLayout ?? "",
            )
        })

        test(SERVED_TEST, async () => {
            await expect(
                page.locator(LAYOUTS[version].served),
                wrongLayoutMessage(version, label),
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
        // The fiction block went without this for a while, on the assumption
        // that an overview page can't be served in the wrong layout. It can —
        // RoyalRoad serves these two routes from different code paths, and one
        // can break or flip while the other stays healthy.
        let wrongLayout: string | null = null

        test.beforeAll(async ({ browser }) => {
            test.setTimeout(HOOK_TIMEOUT)
            const opened = await openAs(browser, version, FICTION_URL)
            if ("unreachable" in opened) {
                unreachable = opened.unreachable
                return
            }
            page = opened.page

            const served = await page.locator(LAYOUTS[version].served).count()
            if (served !== 1) {
                wrongLayout = wrongLayoutMessage(version, label)
            }
        })

        test.afterAll(async () => {
            await page?.context().close()
        })

        test.beforeEach(() => {
            test.skip(unreachable !== null, unreachable ?? "")
            test.skip(
                wrongLayout !== null && test.info().title !== SERVED_TEST,
                wrongLayout ?? "",
            )
        })

        test(SERVED_TEST, async () => {
            await expect(
                page.locator(LAYOUTS[version].served),
                wrongLayoutMessage(version, label),
            ).toHaveCount(1)
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
