import { afterEach, describe, expect, it, vi } from "vitest"
import { fakeBrowser } from "wxt/testing"
import {
    applyBetaCookie,
    applyLayoutCookie,
    clearBetaCookie,
    hasCookiesPermission,
    readBetaCookie,
} from "./beta-cookie"
import type { BetaCookieSettings } from "~/types/types"

const cookie = (mode: BetaCookieSettings["mode"]): BetaCookieSettings => ({
    mode,
    name: "beta-ui-v2",
    betaValue: "always",
    classicValue: "never",
})

// A cookies-namespace mock. `getAll` seeds the "already present" cookies that
// removeAllScopes enumerates before we set ours.
function cookiesMock(existing: any[] = []) {
    return {
        getAll: vi.fn().mockResolvedValue(existing),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
    }
}

// The helpers call the auto-imported `browser`, which WxtVitest points at
// `fakeBrowser`. fake-browser doesn't model `cookies`/`permissions`, so we
// inject minimal mocks and restore them after each test to avoid cross-file leaks.
const originalCookies = (fakeBrowser as any).cookies
const originalPermissions = (fakeBrowser as any).permissions

afterEach(() => {
    ;(fakeBrowser as any).cookies = originalCookies
    ;(fakeBrowser as any).permissions = originalPermissions
})

describe("beta-cookie helpers", () => {
    it("applyBetaCookie writes the RoyalRoad cookie", async () => {
        const cookies = cookiesMock()
        ;(fakeBrowser as any).cookies = cookies

        await applyBetaCookie({ name: "beta-ui-v2", value: "always" })

        expect(cookies.set).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "beta-ui-v2",
                value: "always",
                domain: ".royalroad.com",
                path: "/",
            }),
        )
    })

    it("applyBetaCookie clears a competing scope (RoyalRoad's own cookie) first", async () => {
        // Host-only cookie RoyalRoad's server would set — must be removed so ours wins.
        const cookies = cookiesMock([
            {
                name: "beta-ui-v2",
                value: "always",
                domain: "www.royalroad.com",
                path: "/",
                secure: true,
            },
        ])
        ;(fakeBrowser as any).cookies = cookies

        await applyBetaCookie({ name: "beta-ui-v2", value: "never" })

        expect(cookies.remove).toHaveBeenCalledWith({
            url: "https://www.royalroad.com/",
            name: "beta-ui-v2",
        })
        expect(cookies.set).toHaveBeenCalledWith(
            expect.objectContaining({ name: "beta-ui-v2", value: "never" }),
        )
    })

    it("clearBetaCookie removes every scope and sets nothing", async () => {
        const cookies = cookiesMock([
            {
                name: "beta-ui-v2",
                value: "always",
                domain: ".royalroad.com",
                path: "/",
                secure: true,
            },
        ])
        ;(fakeBrowser as any).cookies = cookies

        await clearBetaCookie({ name: "beta-ui-v2" })

        expect(cookies.remove).toHaveBeenCalledWith({
            url: "https://royalroad.com/",
            name: "beta-ui-v2",
        })
        expect(cookies.set).not.toHaveBeenCalled()
    })

    it("does not throw when the cookies API is unavailable", async () => {
        ;(fakeBrowser as any).cookies = undefined

        await expect(
            applyBetaCookie({ name: "x", value: "y" }),
        ).resolves.toBeUndefined()
        await expect(clearBetaCookie({ name: "x" })).resolves.toBeUndefined()
    })

    it("applyLayoutCookie sets the redesign value for mode=redesign", async () => {
        const cookies = cookiesMock()
        ;(fakeBrowser as any).cookies = cookies

        await applyLayoutCookie(cookie("redesign"))

        expect(cookies.set).toHaveBeenCalledWith(
            expect.objectContaining({ name: "beta-ui-v2", value: "always" }),
        )
    })

    it("applyLayoutCookie sets the classic value for mode=classic", async () => {
        const cookies = cookiesMock()
        ;(fakeBrowser as any).cookies = cookies

        await applyLayoutCookie(cookie("classic"))

        expect(cookies.set).toHaveBeenCalledWith(
            expect.objectContaining({ name: "beta-ui-v2", value: "never" }),
        )
    })

    it("readBetaCookie returns the royalroad cookie value", async () => {
        const cookies = cookiesMock([
            {
                name: "beta-ui-v2",
                value: "always",
                domain: ".royalroad.com",
                path: "/",
                secure: true,
            },
        ])
        ;(fakeBrowser as any).cookies = cookies

        expect(await readBetaCookie("beta-ui-v2")).toBe("always")
    })

    it("readBetaCookie returns null when unset or unreadable", async () => {
        ;(fakeBrowser as any).cookies = cookiesMock([])
        expect(await readBetaCookie("beta-ui-v2")).toBeNull()

        ;(fakeBrowser as any).cookies = undefined
        expect(await readBetaCookie("beta-ui-v2")).toBeNull()
    })

    it("hasCookiesPermission reflects permissions.contains", async () => {
        ;(fakeBrowser as any).permissions = {
            contains: vi.fn().mockResolvedValue(true),
        }
        expect(await hasCookiesPermission()).toBe(true)

        ;(fakeBrowser as any).permissions = {
            contains: vi.fn().mockResolvedValue(false),
        }
        expect(await hasCookiesPermission()).toBe(false)
    })
})
