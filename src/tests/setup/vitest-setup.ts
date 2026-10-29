// Vitest global setup. Resets the fake browser + DOM and unmounts rendered
// components between tests so state never leaks across files.
import { fakeBrowser } from "wxt/testing/fake-browser"
import { afterEach, beforeEach, vi } from "vitest"
import { cleanup } from "./render"

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
    cleanup()
    document.body.innerHTML = ""
})
