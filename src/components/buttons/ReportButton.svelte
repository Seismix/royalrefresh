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

    const FORM_BASE_URL =
        "https://docs.google.com/forms/d/e/1FAIpQLSfY1V_30w8IdS4HdC9PFY6vxEjyz4Wl2oci4oTjyGSijvez4Q/viewform"
    const URL_FIELD_ID = "entry.328681820"

    const buildFormUrl = (chapterUrl: string) => {
        const params = new URLSearchParams({
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
