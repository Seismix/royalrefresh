import { beforeEach, describe, expect, it } from "vitest"
import { render } from "@testing-library/svelte"
import { recapState } from "~/lib/state/recap-state.svelte"
import RecapContainer from "./RecapContainer.svelte"

// RecapContainer renders loading / error / content branches driven by
// recapState, and toggles its own display style. It loads settings on mount via
// fakeBrowser storage (defaults), which is enough for these render assertions.
describe("RecapContainer", () => {
    beforeEach(() => {
        recapState.hide()
        recapState.content = ""
        recapState.error = null
        recapState.type = "recap"
    })

    it("is hidden (display:none) when nothing is shown", () => {
        const { container } = render(RecapContainer)
        const root = container.querySelector("#recapContainer") as HTMLElement
        expect(root).toBeTruthy()
        expect(root.style.display).toBe("none")
    })

    it("renders the loading indicator when loading", async () => {
        const { container, findByText } = render(RecapContainer)

        recapState.setLoading()
        expect(await findByText(/loading/i)).toBeInTheDocument()

        const root = container.querySelector("#recapContainer") as HTMLElement
        expect(root.style.display).toBe("block")
    })

    it("renders the error message when in error state", async () => {
        const { findByText } = render(RecapContainer)

        recapState.setError("RoyalRoad layout changed")
        expect(await findByText("RoyalRoad layout changed")).toBeInTheDocument()
    })

    it("renders sanitized content via {@html} when visible", async () => {
        const { container } = render(RecapContainer)

        recapState.setContent(
            "<h1>RoyalRefresh of Test Story</h1><p>body</p>",
            "recap",
        )

        // Wait a microtask for the reactive update to flush
        await Promise.resolve()
        await Promise.resolve()

        const root = container.querySelector("#recapContainer") as HTMLElement
        expect(root.style.display).toBe("block")
        expect(root.innerHTML).toContain("RoyalRefresh of Test Story")
    })
})
