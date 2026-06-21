import { describe, expect, test } from "vitest"
import {
    REPORT_BROWSER_FIELD_ID,
    REPORT_FORM_BASE_URL,
    REPORT_TYPE_FIELD_ID,
    REPORT_URL_FIELD_ID,
    REPORT_VERSION_FIELD_ID,
    buildReportFormUrl,
} from "./report-form"

const baseParams = {
    chapterUrl: "https://www.royalroad.com/fiction/1/test/chapter/2/foo",
    type: "recap" as const,
    version: "1.7.0",
    browserType: "chrome",
}

describe("buildReportFormUrl", () => {
    test("starts with the form base URL", () => {
        const url = buildReportFormUrl(baseParams)
        expect(url.startsWith(`${REPORT_FORM_BASE_URL}?`)).toBe(true)
    })

    test("includes all four prefill fields", () => {
        const url = new URL(buildReportFormUrl(baseParams))
        expect(url.searchParams.get(REPORT_URL_FIELD_ID)).toBe(
            baseParams.chapterUrl,
        )
        expect(url.searchParams.get(REPORT_VERSION_FIELD_ID)).toBe(
            baseParams.version,
        )
        expect(url.searchParams.get(REPORT_BROWSER_FIELD_ID)).toBe(
            baseParams.browserType,
        )
        expect(url.searchParams.get(REPORT_TYPE_FIELD_ID)).toBe(baseParams.type)
    })

    test("URL-encodes chapter URLs with query strings and special chars", () => {
        const tricky =
            "https://www.royalroad.com/fiction/1/title with spaces/chapter/2/foo?ref=a&b=c#frag"
        const url = new URL(
            buildReportFormUrl({ ...baseParams, chapterUrl: tricky }),
        )
        // searchParams.get decodes — so we should round-trip back to the original
        expect(url.searchParams.get(REPORT_URL_FIELD_ID)).toBe(tricky)
    })

    test("passes through 'blurb' type", () => {
        const url = new URL(
            buildReportFormUrl({ ...baseParams, type: "blurb" }),
        )
        expect(url.searchParams.get(REPORT_TYPE_FIELD_ID)).toBe("blurb")
    })

    test("passes through android-firefox browserType", () => {
        const url = new URL(
            buildReportFormUrl({
                ...baseParams,
                browserType: "android-firefox",
            }),
        )
        expect(url.searchParams.get(REPORT_BROWSER_FIELD_ID)).toBe(
            "android-firefox",
        )
    })
})
