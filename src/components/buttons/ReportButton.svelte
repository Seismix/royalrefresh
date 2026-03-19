<script lang="ts">
    import { browser } from "wxt/browser"
    import { FlagIcon } from "~/components/icons"
    import { BrowserType, currentBrowser } from "~/lib/utils/platform"
    import type { IconButtonProps } from "~/types/icon-button"

    interface Props extends Omit<IconButtonProps, "onclick"> {
        chapterUrl: string
    }

    let { variant = "default", chapterUrl }: Props = $props()

    const isAndroidFirefox = currentBrowser === BrowserType.AndroidFirefox

    // TODO: Replace with your actual Google Form URL and entry IDs
    const FORM_BASE_URL =
        "https://docs.google.com/forms/d/e/FORM_ID/viewform"
    const DATE_FIELD_ID = "entry.DATE_FIELD_ID"
    const URL_FIELD_ID = "entry.URL_FIELD_ID"

    const buildFormUrl = (chapterUrl: string) => {
        const today = new Date().toISOString().split("T")[0]
        const params = new URLSearchParams({
            [DATE_FIELD_ID]: today,
            [URL_FIELD_ID]: chapterUrl,
        })
        return `${FORM_BASE_URL}?${params.toString()}`
    }

    const openReport = async () => {
        await browser.tabs.create({
            url: buildFormUrl(chapterUrl),
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
