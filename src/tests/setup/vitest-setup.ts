// Vitest global setup. Adds jest-dom matchers (toBeInTheDocument, etc.) and
// resets the fake browser + DOM between tests so state never leaks across files.
import "@testing-library/jest-dom/vitest"
import { fakeBrowser } from "wxt/testing"
import { afterEach, beforeEach, vi } from "vitest"

// jsdom does not implement scrollIntoView (it is layout-dependent), and
// RecapContainer calls it from an $effect. Without this the effect throws an
// unhandled error during component tests. Stubbing it keeps the call
// observable while staying a no-op.
Element.prototype.scrollIntoView = vi.fn()

beforeEach(() => {
    fakeBrowser.reset()
    document.body.innerHTML = ""
})

afterEach(() => {
    document.body.innerHTML = ""
})
