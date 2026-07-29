import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
    srcDir: "src",
    zip: {
        exclude: ["**.env**"],
        // The sources zip is `includeSources - excludeSources`, globbed off the
        // filesystem — .gitignore is NOT consulted, so being gitignored is not
        // enough to keep a file out. WXT prepends its own defaults (node_modules,
        // web-ext.config.ts, __tests__, *.test.*/*.spec.*, and .output) and skips
        // dotfiles, which covers the rest. Everything below is a path that would
        // otherwise ship to AMO whenever it happens to exist at zip time:
        //   - coverage/, dist/, web-ext-artifacts/ are gitignored build output,
        //     but gitignored is not excluded — `vitest --coverage` and
        //     `web-ext build` both leave one of these behind.
        //   - CLAUDE.local.md is a machine-local symlink senn drops into every
        //     worktree; it is ignored via ~/.gitignore_global, and zipping
        //     follows symlinks, so it would ship its target's contents.
        excludeSources: [
            "CLAUDE.local.md",
            "coverage/**",
            "dist/**",
            "web-ext-artifacts/**",
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
