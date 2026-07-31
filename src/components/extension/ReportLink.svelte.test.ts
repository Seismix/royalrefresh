import { beforeEach, describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/svelte"
import { fakeBrowser } from "wxt/testing/fake-browser"
import ReportLink from "./ReportLink.svelte"

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
        const { getByRole } = render(ReportLink, { props: { type: "recap" } })

        const link = getByRole("link", { name: /report recap/i })
        expect(link).toBeInTheDocument()
        expect(link.getAttribute("href")).toContain("docs.google.com/forms")
        expect(link.getAttribute("target")).toBe("_blank")
    })

    it("changes its label for the blurb type", () => {
        const { getByRole } = render(ReportLink, { props: { type: "blurb" } })

        expect(getByRole("link", { name: /report blurb/i })).toBeInTheDocument()
    })

    it("applies the adapter's host classes and inline style", () => {
        const { getByRole } = render(ReportLink, {
            props: {
                type: "recap",
                className: "inline-flex w-full",
                style: "color: inherit;",
            },
        })

        const link = getByRole("link", { name: /report recap/i })
        expect(link).toHaveClass("inline-flex", "w-full")
        expect(link.getAttribute("style")).toContain("color: inherit")
    })

    it("defaults to the neutral legacy styling, not the old accent", () => {
        const { getByRole } = render(ReportLink, { props: { type: "recap" } })

        const link = getByRole("link", { name: /report recap/i })
        expect(link).toHaveClass("btn-default")
        expect(link).not.toHaveClass("yellow-gold")
    })
})
