import { beforeEach, describe, expect, it } from "vitest"
import { recapState } from "./recap-state.svelte"

// recapState is a singleton — reset it to "hidden" before each test so state
// never leaks between cases. Using the public API (hide) keeps it honest.
beforeEach(() => {
    recapState.hide()
    recapState.content = ""
    recapState.error = null
    recapState.type = "recap"
})

describe("recapState transitions", () => {
    it("starts hidden", () => {
        expect(recapState.visibility).toBe("hidden")
        expect(recapState.isVisible).toBe(false)
        expect(recapState.isLoading).toBe(false)
        expect(recapState.hasError).toBe(false)
    })

    it("setContent makes it visible and clears errors", () => {
        recapState.setError("old error")
        recapState.setContent("<p>hi</p>", "recap")

        expect(recapState.visibility).toBe("visible")
        expect(recapState.content).toBe("<p>hi</p>")
        expect(recapState.type).toBe("recap")
        expect(recapState.error).toBeNull()
        expect(recapState.isVisible).toBe(true)
        expect(recapState.hasError).toBe(false)
    })

    it("setLoading shows loading and clears errors but keeps content", () => {
        recapState.setContent("<p>cached</p>", "recap")
        recapState.setLoading()

        expect(recapState.visibility).toBe("loading")
        expect(recapState.isLoading).toBe(true)
        expect(recapState.error).toBeNull()
        // Existing content is preserved during a refresh
        expect(recapState.content).toBe("<p>cached</p>")
    })

    it("setError shows the error and clears content", () => {
        recapState.setContent("<p>hi</p>", "recap")
        recapState.setError("something broke")

        expect(recapState.visibility).toBe("error")
        expect(recapState.error).toBe("something broke")
        expect(recapState.content).toBe("")
        expect(recapState.hasError).toBe(true)
        expect(recapState.isVisible).toBe(false)
    })

    it("hide clears visibility and error", () => {
        recapState.setError("oops")
        recapState.hide()

        expect(recapState.visibility).toBe("hidden")
        expect(recapState.error).toBeNull()
        expect(recapState.isVisible).toBe(false)
    })

    it("show makes content visible only if content exists", () => {
        // No content -> stays hidden
        recapState.show()
        expect(recapState.visibility).toBe("hidden")

        // With content -> becomes visible
        recapState.setContent("<p>hi</p>", "blurb")
        recapState.hide()
        recapState.show()
        expect(recapState.visibility).toBe("visible")
        expect(recapState.type).toBe("blurb")
    })
})

describe("recapState derived values", () => {
    it("toggleText flips between Show and Hide", () => {
        expect(recapState.toggleText).toBe("Show ")

        recapState.setContent("<p>hi</p>", "recap")
        expect(recapState.toggleText).toBe("Hide ")

        recapState.hide()
        expect(recapState.toggleText).toBe("Show ")
    })

    it("hasError is false when in error state without a message", () => {
        // setError always sets a message, but the derived guards on error !== null
        recapState.visibility = "error"
        recapState.error = null
        expect(recapState.hasError).toBe(false)
    })
})
