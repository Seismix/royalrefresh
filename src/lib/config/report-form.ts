import type { ContentType } from "~/types/types"

export const REPORT_FORM_BASE_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSfY1V_30w8IdS4HdC9PFY6vxEjyz4Wl2oci4oTjyGSijvez4Q/viewform"

export const REPORT_URL_FIELD_ID = "entry.328681820"
// TODO: replace with real entry IDs after adding the fields in Google Forms
export const REPORT_VERSION_FIELD_ID = "entry.PLACEHOLDER_VERSION"
export const REPORT_BROWSER_FIELD_ID = "entry.PLACEHOLDER_BROWSER"
export const REPORT_TYPE_FIELD_ID = "entry.PLACEHOLDER_TYPE"

export interface ReportFormParams {
    chapterUrl: string
    type: ContentType
    version: string
    browserType: string
}

export const buildReportFormUrl = ({
    chapterUrl,
    type,
    version,
    browserType,
}: ReportFormParams) => {
    const params = new URLSearchParams({
        [REPORT_URL_FIELD_ID]: chapterUrl,
        [REPORT_VERSION_FIELD_ID]: version,
        [REPORT_BROWSER_FIELD_ID]: browserType,
        [REPORT_TYPE_FIELD_ID]: type,
    })
    return `${REPORT_FORM_BASE_URL}?${params.toString()}`
}
