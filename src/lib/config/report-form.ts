export const REPORT_FORM_BASE_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSfY1V_30w8IdS4HdC9PFY6vxEjyz4Wl2oci4oTjyGSijvez4Q/viewform"
export const REPORT_URL_FIELD_ID = "entry.328681820"

export const buildReportFormUrl = (chapterUrl: string) => {
    const params = new URLSearchParams({
        [REPORT_URL_FIELD_ID]: chapterUrl,
    })
    return `${REPORT_FORM_BASE_URL}?${params.toString()}`
}
