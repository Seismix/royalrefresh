import { defineConfig } from "vitest/config"
import { WxtVitest } from "wxt/testing/vitest-plugin"
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte"
import { svelteTesting } from "@testing-library/svelte/vite"

// Vitest is the unit/component runner. WxtVitest auto-mocks `browser.*`
// (via @webext-core/fake-browser) and resolves WXT's `~/` and `wxt/*` aliases.
//
// Test-file convention (keeps Vitest and Playwright from double-collecting):
//   - Vitest unit/component tests -> `*.unit.test.ts` / `*.svelte.test.ts`,
//     co-located next to the source they cover.
//   - Playwright tests -> `src/tests/*.test.ts` (its testDir), with the Vitest
//     patterns excluded in playwright.config.ts via `testIgnore`.
export default defineConfig({
    plugins: [
        // Compile .svelte components AND *.svelte.ts/.svelte.test.ts rune
        // modules. WxtVitest does not wire the Svelte transform into the test
        // pipeline, so we register it ourselves (configFile:false mirrors how
        // @wxt-dev/module-svelte configures it for the real build).
        svelte({ configFile: false, preprocess: [vitePreprocess()] }),
        svelteTesting(),
        WxtVitest(),
    ],
    resolve: {
        // Use the browser build of Svelte (and deps) in the test DOM.
        conditions: ["browser"],
    },
    test: {
        // jsdom, not happy-dom: DOMPurify (>=3.4) mis-walks the DOM under
        // happy-dom and removes the wrong nodes, so <script> survives
        // sanitization there while <p> gets stripped. The same input sanitizes
        // correctly under jsdom and in real Chromium, so the sanitizer tests
        // are only meaningful on jsdom.
        environment: "jsdom",
        globals: true,
        include: ["src/**/*.unit.test.ts", "src/**/*.svelte.test.ts"],
        setupFiles: ["src/tests/setup/vitest-setup.ts"],
    },
})
