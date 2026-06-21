import { beforeEach, describe, expect, it } from "vitest"
import { render, fireEvent } from "@testing-library/svelte"
import { recapState } from "~/lib/state/recap-state.svelte"
import ToggleButton from "./ToggleButton.svelte"

// These tests drive the button purely off recapState (no network): we
// pre-seed content so clicks just toggle show/hide, which is the deterministic,
// side-effect-free path. The fetch path is covered by ContentManager unit tests.
describe("ToggleButton", () => {
    beforeEach(() => {
        recapState.hide()
        recapState.content = ""
        recapState.error = null
        recapState.type = "recap"
    })

    it("renders the Recap label with a Show prefix when hidden", () => {
        const { getByRole } = render(ToggleButton, { props: { type: "recap" } })
        const button = getByRole("button")
        expect(button.textContent).toContain("Show")
        expect(button.textContent).toContain("Recap")
    })

    it("renders the Blurb label for the blurb type", () => {
        const { getByRole } = render(ToggleButton, { props: { type: "blurb" } })
        expect(getByRole("button").textContent).toContain("Blurb")
    })

    it("flips to 'Hide' once content is visible", async () => {
        const { getByRole } = render(ToggleButton, { props: { type: "recap" } })

        recapState.setContent("<p>cached recap</p>", "recap")
        await Promise.resolve()

        expect(getByRole("button").textContent).toContain("Hide")
    })

    it("shows a Loading label and is disabled while loading", async () => {
        const { getByRole } = render(ToggleButton, { props: { type: "recap" } })

        recapState.setLoading()
        await Promise.resolve()

        const button = getByRole("button") as HTMLButtonElement
        expect(button.textContent).toContain("Loading")
        expect(button.disabled).toBe(true)
    })

    it("clicking with existing content toggles visibility (no fetch)", async () => {
        // Pre-seed content but hide it -> click should just show it
        recapState.setContent("<p>cached recap</p>", "recap")
        recapState.hide()

        const { getByRole } = render(ToggleButton, { props: { type: "recap" } })
        const button = getByRole("button")

        await fireEvent.click(button)
        expect(recapState.isVisible).toBe(true)

        // Clicking again hides
        await fireEvent.click(button)
        expect(recapState.visibility).toBe("hidden")
    })
})
