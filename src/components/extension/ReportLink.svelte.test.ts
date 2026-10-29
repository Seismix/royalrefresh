import type { ComponentProps } from "svelte"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render } from "~/tests/setup/render"
import { fakeBrowser } from "wxt/testing/fake-browser"
import ReportLink from "./ReportLink.svelte"

function renderLink(props: ComponentProps<typeof ReportLink>) {
    return render(ReportLink, props).querySelector("a") as HTMLAnchorElement
}

// ReportLink builds its href from window.location.href, the manifest version
// (browser.runtime.getManifest) and currentBrowser. fakeBrowser doesn't
// implement getManifest, so we stub it.
describe("ReportLink", () => {
    beforeEach(() => {
        vi.spyOn(fakeBrowser.runtime, "getManifest").mockReturnValue({
            version: "1.7.1",
        } as ReturnType<typeof fakeBrowser.runtime.getManifest>)
    })

    it("renders a report link pointing at the Google Form", () => {
        const link = renderLink({ type: "recap" })
        expect(link.textContent).toMatch(/report recap/i)
        expect(link.getAttribute("href")).toContain("docs.google.com/forms")
        expect(link.getAttribute("target")).toBe("_blank")
    })

    it("changes its label for the blurb type", () => {
        expect(renderLink({ type: "blurb" }).textContent).toMatch(
            /report blurb/i,
        )
    })

    it("applies the adapter's host classes and inline style", () => {
        const link = renderLink({
            type: "recap",
            className: "inline-flex w-full",
            style: "color: inherit;",
        })

        expect(link.classList).toContain("inline-flex")
        expect(link.classList).toContain("w-full")
        expect(link.getAttribute("style")).toContain("color: inherit")
    })

    it("defaults to the neutral legacy styling, not the old accent", () => {
        const link = renderLink({ type: "recap" })
        expect(link.classList).toContain("btn-default")
        expect(link.classList).not.toContain("yellow-gold")
    })
})
