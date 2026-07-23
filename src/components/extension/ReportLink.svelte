<script lang="ts">
    import { browser } from "wxt/browser"
    import { buildReportFormUrl } from "~/lib/config/report-form"
    import { currentBrowser } from "~/lib/utils/platform"
    import type { ContentType } from "~/types/types"

    // `className`/`style` come from the active adapter's host classes so the link
    // looks native on whichever RoyalRoad layout is being served.
    let {
        type = "recap",
        className = "btn btn-block btn-default margin-bottom-5",
        style = "",
    }: {
        type?: ContentType
        className?: string
        style?: string
    } = $props()

    const formUrl = $derived(
        buildReportFormUrl({
            chapterUrl: window.location.href,
            type,
            version: browser.runtime.getManifest().version,
            browserType: currentBrowser,
        }),
    )
    // Kept short so it fits on one line in the redesign's narrow (~184px) action
    // column, where a wrapped label would make the button visibly taller than
    // RoyalRoad's own. Unambiguous in context — it sits directly under the recap.
    const label = $derived(type === "recap" ? "Report Recap" : "Report Blurb")
</script>

<a
    class={className}
    {style}
    href={formUrl}
    target="_blank"
    rel="noopener noreferrer">
    <i class="fa fa-flag"></i>
    {label}
</a>
