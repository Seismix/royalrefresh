// Vitest global setup. Adds jest-dom matchers (toBeInTheDocument, etc.) and
// resets the fake browser + DOM between tests so state never leaks across files.
import "@testing-library/jest-dom/vitest"
import { fakeBrowser } from "wxt/testing"
import { afterEach, beforeEach } from "vitest"

beforeEach(() => {
    fakeBrowser.reset()
    document.body.innerHTML = ""
})

afterEach(() => {
    document.body.innerHTML = ""
})
