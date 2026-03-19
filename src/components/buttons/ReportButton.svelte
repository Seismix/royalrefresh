<script lang="ts">
    import { browser } from "wxt/browser"
    import { FlagIcon } from "~/components/icons"
    import { buildReportFormUrl } from "~/lib/config/report-form"
    import { BrowserType, currentBrowser } from "~/lib/utils/platform"
    import type { IconButtonProps } from "~/types/icon-button"

    interface Props extends Omit<IconButtonProps, "onclick"> {
        chapterUrl: string
    }

    let { variant = "default", chapterUrl }: Props = $props()

    const isAndroidFirefox = currentBrowser === BrowserType.AndroidFirefox

    const openReport = async () => {
        await browser.tabs.create({
            url: buildReportFormUrl(chapterUrl),
            active: true,
        })

        if (isAndroidFirefox) {
            window.close()
        }
    }
</script>

<button
    aria-label="Report broken recap"
    class="icon-button report-button"
    onclick={openReport}>
    <FlagIcon {variant} />
</button>

<style>
    @import "~/lib/styles/icon-button.css";
</style>
