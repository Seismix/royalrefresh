<script lang="ts">
    import { browser } from "wxt/browser"
    import { GitHubIcon } from "~/components/icons"
    import { BrowserType, currentBrowser } from "~/lib/utils/platform"
    import type { IconButtonProps } from "~/types/icon-button"

    let { variant = "default" }: Omit<IconButtonProps, "onclick"> = $props()

    const isAndroidFirefox = currentBrowser === BrowserType.AndroidFirefox

    const openGitHub = async () => {
        await browser.tabs.create({
            url: "https://github.com/Seismix/royalrefresh",
            active: true,
        })

        // Close popup on Android to give user feedback that action was taken
        if (isAndroidFirefox) {
            window.close()
        }
    }
</script>

<button
    aria-label="Open GitHub repository"
    class="icon-button github-button"
    onclick={openGitHub}>
    <GitHubIcon {variant} />
</button>

<style>
    @import "~/lib/styles/icon-button.css";
</style>
