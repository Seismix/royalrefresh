import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
    srcDir: "src",
    zip: {
        exclude: ["**.env**"],
        excludeSources: [
            "test-results/**",
            "blob-report/**",
            "playwright-report/**",
            "playwright/.cache/**",
        ],
    },
    outDir: process.env.WXT_OUT_DIR || ".output",
    modules: ["@wxt-dev/module-svelte"],
    // `cookies` is an optional permission the user grants on demand when they pick
    // a non-default RoyalRoad layout in Settings — this keeps the install-time
    // permission prompt clean. See src/lib/adapters/beta-cookie.ts. (`manifest` is
    // a function purely for WXT's `data_collection_permissions` type inference.)
    manifest: () => ({
        name: "RoyalRefresh",
        description:
            "A web extension for royalroad.com. For people who juggle multiple stories",
        homepage_url: "https://github.com/Seismix/royalrefresh",
        permissions: ["storage"],
        optional_permissions: ["cookies"],
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
