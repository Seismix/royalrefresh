<script lang="ts">
    import { buildReportFormUrl } from "~/lib/config/report-form"

    const formUrl = buildReportFormUrl(window.location.href)
</script>

<a
    class="btn btn-block yellow-gold margin-bottom-5"
    href={formUrl}
    target="_blank"
    rel="noopener noreferrer">
    <i class="fa fa-flag"></i> Report Broken Recap
</a>
