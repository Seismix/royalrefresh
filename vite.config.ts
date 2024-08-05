import path from "path"
import { defineConfig } from "vite"
import webExtension from "vite-plugin-web-extension"

const browser = process.env.TARGET || "firefox"

export default defineConfig({
    define: {
        __BROWSER__: JSON.stringify(browser),
    },
    plugins: [
        webExtension({
            browser: browser,
        }),
    ],
    build: {
        outDir: path.join(__dirname, "dist", browser),
        rollupOptions: {
            output: {
                // Create a subdirectory for each target browser
                dir: path.join(__dirname, "dist", browser),
            },
        },
    },
})
