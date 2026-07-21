import type { BetaCookieSettings } from "~/types/types"

/**
 * Redesign-only: set/clear the cookie that makes RoyalRoad serve its
 * "Redesign (beta)" UI. Reused by the Advanced Settings toggle (immediate apply)
 * and the background script (re-apply on startup so the choice survives browser
 * restarts / cookie expiry).
 *
 * The `cookies` permission is optional in production (requested on demand when
 * the user enables the toggle) and always granted on the dev server. Every entry
 * point here guards against `browser.cookies` being undefined so a missing
 * permission can never throw synchronously. See src/lib/adapters/REDESIGN.md.
 */

const COOKIE_URL = "https://www.royalroad.com/"
const COOKIE_DOMAIN = ".royalroad.com"

/** Whether the `cookies` permission is currently granted. */
export async function hasCookiesPermission() {
    if (!browser.permissions?.contains) return false
    try {
        return await browser.permissions.contains({ permissions: ["cookies"] })
    } catch {
        return false
    }
}

/**
 * Request the optional `cookies` permission. MUST be called synchronously from a
 * user-gesture handler (e.g. a checkbox change) — do not `await` anything before
 * it. Returns whether the permission is now granted.
 */
export async function requestCookiesPermission() {
    if (!browser.permissions?.request) return false
    try {
        return await browser.permissions.request({ permissions: ["cookies"] })
    } catch {
        return false
    }
}

/**
 * Remove every cookie of this name on royalroad.com across ALL scopes — host-only
 * and domain-wide, including HttpOnly ones the page can't touch. RoyalRoad's own
 * server sets a host-only `beta-ui-v2` that would otherwise out-rank a single
 * domain-scoped cookie we set (verified live: a lingering host-only `always`
 * keeps the redesign on even after we write domain `never`). Clearing every scope
 * first guarantees the value we set is the only one RoyalRoad sees.
 */
async function removeAllScopes(name: string) {
    if (!browser.cookies?.getAll || !browser.cookies?.remove || !name) return
    try {
        const existing = await browser.cookies.getAll({ name })
        for (const cookie of existing) {
            if (!cookie.domain.includes("royalroad.com")) continue
            const scheme = cookie.secure ? "https" : "http"
            const host = cookie.domain.replace(/^\./, "")
            await browser.cookies.remove({
                url: `${scheme}://${host}${cookie.path}`,
                name: cookie.name,
            })
        }
    } catch {
        // Best effort — missing permission or race, nothing to do.
    }
}

/** Set the gating cookie to a specific value (clearing any other scope first).
 * No-op without permission. Internal — callers use `applyLayoutCookie`. */
async function applyBetaCookie(cookie: { name: string; value: string }) {
    if (!browser.cookies?.set || !cookie.name) return
    await removeAllScopes(cookie.name)
    try {
        await browser.cookies.set({
            url: COOKIE_URL,
            domain: COOKIE_DOMAIN,
            path: "/",
            name: cookie.name,
            value: cookie.value,
        })
    } catch {
        // Missing permission or blocked — nothing to do.
    }
}

/**
 * Apply the gating cookie for the chosen layout: `redesign` → `betaValue`,
 * `classic` → `classicValue`. This is the single place that turns a
 * `BetaCookieSettings` into a cookie action; the background calls it on startup
 * and whenever settings change.
 */
export async function applyLayoutCookie(cookie: BetaCookieSettings) {
    const value =
        cookie.mode === "redesign" ? cookie.betaValue : cookie.classicValue
    await applyBetaCookie({ name: cookie.name, value })
}

/**
 * Read the current value of the gating cookie on royalroad.com, or null if it's
 * unset / unreadable (no `cookies` permission). Lets the settings UI seed the
 * layout selector from what RoyalRoad is actually serving.
 */
export async function readBetaCookie(name: string) {
    if (!browser.cookies?.getAll || !name) return null
    try {
        const existing = await browser.cookies.getAll({ name })
        const match = existing.find((c) => c.domain.includes("royalroad.com"))
        return match?.value ?? null
    } catch {
        return null
    }
}
