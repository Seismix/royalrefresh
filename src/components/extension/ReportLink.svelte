<script lang="ts">
    import { browser } from "wxt/browser"
    import { buildReportFormUrl } from "~/lib/config/report-form"
    import { currentBrowser } from "~/lib/utils/platform"
    import type { ContentType } from "~/types/types"

    let { type = "recap" }: { type?: ContentType } = $props()

    const formUrl = $derived(
        buildReportFormUrl({
            chapterUrl: window.location.href,
            type,
            version: browser.runtime.getManifest().version,
            browserType: currentBrowser,
        }),
    )
    const label = $derived(
        type === "recap" ? "Report Broken Recap" : "Report Broken Blurb",
    )
</script>

<a
    class="btn btn-block yellow-gold margin-bottom-5"
    href={formUrl}
    target="_blank"
    rel="noopener noreferrer">
    <i class="fa fa-flag"></i>
    {label}
</a>
