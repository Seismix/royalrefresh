import path from "path"
import { defineConfig } from "vite"
import webExtension, { readJsonFile } from "vite-plugin-web-extension"

const browser = process.env.TARGET || "firefox"

export default defineConfig({
    plugins: [
        webExtension({
            browser: browser,
            manifest: () => {
                const pkg = readJsonFile("package.json")
                const template = readJsonFile("manifest.json")
                return {
                    ...template,
                    version: pkg.version,
                }
            },
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
