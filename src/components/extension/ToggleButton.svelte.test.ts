import { flushSync, type ComponentProps } from "svelte"
import { beforeEach, describe, expect, it } from "vitest"
import { render } from "~/tests/setup/render"
import { recapState } from "~/lib/state/recap-state.svelte"
import ToggleButton from "./ToggleButton.svelte"

function renderButton(props: ComponentProps<typeof ToggleButton>) {
    return render(ToggleButton, props).querySelector(
        "button",
    ) as HTMLButtonElement
}

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
        const button = renderButton({ type: "recap" })
        expect(button.textContent).toContain("Show")
        expect(button.textContent).toContain("Recap")
    })

    it("renders the Blurb label for the blurb type", () => {
        expect(renderButton({ type: "blurb" }).textContent).toContain("Blurb")
    })

    it("flips to 'Hide' once content is visible", () => {
        const button = renderButton({ type: "recap" })

        recapState.setContent("<p>cached recap</p>", "recap")
        flushSync()

        expect(button.textContent).toContain("Hide")
    })

    it("shows a Loading label and is disabled while loading", () => {
        const button = renderButton({ type: "recap" })

        recapState.setLoading()
        flushSync()

        expect(button.textContent).toContain("Loading")
        expect(button.disabled).toBe(true)
    })

    it("stops the click from bubbling to an ancestor (redesign dialog trigger)", () => {
        // On the redesign the toggle mounts inside RoyalRoad's `.rr-dialog`,
        // whose bubbled click opens the Reading Preferences modal. The toggle
        // must stop propagation so it doesn't also trigger that ancestor.
        recapState.setContent("<p>cached recap</p>", "recap")
        recapState.hide()

        const button = renderButton({ type: "recap" })
        let ancestorClicked = false
        button.parentElement!.addEventListener(
            "click",
            () => (ancestorClicked = true),
        )

        button.click()
        expect(ancestorClicked).toBe(false)
    })

    it("clicking with existing content toggles visibility (no fetch)", () => {
        // Pre-seed content but hide it -> click should just show it
        recapState.setContent("<p>cached recap</p>", "recap")
        recapState.hide()

        const button = renderButton({ type: "recap" })

        button.click()
        flushSync()
        expect(recapState.isVisible).toBe(true)

        // Clicking again hides
        button.click()
        flushSync()
        expect(recapState.visibility).toBe("hidden")
    })
})
