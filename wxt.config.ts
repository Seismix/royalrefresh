import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
    srcDir: "src",
    zip: {
        exclude: ["**.env**"],
        // WXT >=0.21 computes the sources zip as `includeSources -
        // excludeSources` and honours .gitignore, so the build output that used
        // to need listing here (dist/, web-ext-artifacts/) is already gone.
        // What .gitignore does NOT cover is anything ignored globally
        // (~/.gitignore_global): CLAUDE.local.md is a machine-local symlink
        // senn drops into every worktree, and it would otherwise ship to AMO.
        excludeSources: [
            "CLAUDE.local.md",
            "test-results/**",
            "blob-report/**",
            "playwright-report/**",
            "playwright/.cache/**",
        ],
    },
    outDir: process.env.WXT_OUT_DIR || ".output",
    modules: ["@wxt-dev/module-svelte"],
    // No `cookies` permission: the extension detects whichever RoyalRoad layout
    // was served and adapts to it, rather than forcing one. (`manifest` is a
    // function purely for WXT's `data_collection_permissions` type inference.)
    manifest: () => ({
        name: "RoyalRefresh",
        description:
            "A web extension for royalroad.com. For people who juggle multiple stories",
        homepage_url: "https://github.com/Seismix/royalrefresh",
        permissions: ["storage"],
        host_permissions: ["*://*.royalroad.com/*"],
        browser_specific_settings: {
            gecko: {
                id: "royalrefresh.extension@example.com",
                data_collection_permissions: {
                    required: ["none"],
                },
            },
            gecko_android: {},
        },
        icons: {
            "48": "icons/royalroad_48.png",
            "96": "icons/royalroad_96.png",
            "128": "icons/royalroad_128.png",
        },
    }),
})
