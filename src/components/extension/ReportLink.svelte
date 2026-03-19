<script lang="ts">
    const FORM_BASE_URL =
        "https://docs.google.com/forms/d/e/1FAIpQLSfY1V_30w8IdS4HdC9PFY6vxEjyz4Wl2oci4oTjyGSijvez4Q/viewform"
    const URL_FIELD_ID = "entry.328681820"

    const buildFormUrl = () => {
        const params = new URLSearchParams({
            [URL_FIELD_ID]: window.location.href,
        })
        return `${FORM_BASE_URL}?${params.toString()}`
    }

    const formUrl = buildFormUrl()
</script>

<a
    class="btn btn-block yellow-gold margin-bottom-5"
    href={formUrl}
    target="_blank"
    rel="noopener noreferrer">
    <i class="fa fa-flag"></i> Report Broken Recap
</a>
