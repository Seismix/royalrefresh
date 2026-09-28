import { describe, expect, it } from "vitest"
import { HtmlSanitizer } from "./html-sanitizer"

describe("HtmlSanitizer", () => {
    describe("sanitize", () => {
        it("removes script tags", () => {
            const input = '<p>Safe content</p><script>alert("xss")</script>'
            const result = HtmlSanitizer.sanitize(input)

            expect(result).not.toContain("<script>")
            expect(result).not.toContain("alert")
            expect(result).toContain("Safe content")
        })

        it("removes event handlers", () => {
            const input = '<img src="x" onerror="alert(1)" />'
            const result = HtmlSanitizer.sanitize(input)

            expect(result).not.toContain("onerror")
            expect(result).not.toContain("alert")
        })

        it("removes onclick attributes", () => {
            const input = '<button onclick="doEvil()">Click me</button>'
            const result = HtmlSanitizer.sanitize(input)

            expect(result).not.toContain("onclick")
            expect(result).not.toContain("doEvil")
        })

        it("removes onmouseover attributes", () => {
            const input = '<div onmouseover="hack()">Hover</div>'
            const result = HtmlSanitizer.sanitize(input)

            expect(result).not.toContain("onmouseover")
        })

        it("preserves allowed tags: p", () => {
            const input = "<p>This is a paragraph</p>"

            expect(HtmlSanitizer.sanitize(input)).toBe(input)
        })

        it("preserves allowed tags: headings", () => {
            const input = "<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>"
            const result = HtmlSanitizer.sanitize(input)

            expect(result).toContain("<h1>")
            expect(result).toContain("<h2>")
            expect(result).toContain("<h3>")
        })

        it("preserves allowed tags: strong and em", () => {
            const input = "<strong>Bold</strong> and <em>italic</em>"
            const result = HtmlSanitizer.sanitize(input)

            expect(result).toContain("<strong>")
            expect(result).toContain("<em>")
        })

        it("preserves links with a safe href", () => {
            const input = '<a href="https://royalroad.com">Safe Link</a>'
            const result = HtmlSanitizer.sanitize(input)

            expect(result).toContain('href="https://royalroad.com"')
        })

        it("strips javascript: hrefs but keeps the link text", () => {
            const input = '<a href="javascript:alert(1)">Click</a>'
            const result = HtmlSanitizer.sanitize(input)

            expect(result).not.toContain("javascript:")
            expect(result).toContain("Click")
        })

        it("removes style tags", () => {
            const input =
                "<style>.evil { display: none; }</style><p>Content</p>"
            const result = HtmlSanitizer.sanitize(input)

            expect(result).not.toContain("<style>")
            expect(result).not.toContain(".evil")
            expect(result).toContain("<p>Content</p>")
        })

        it("removes inline styles", () => {
            const input = '<p style="color: red;">Styled text</p>'
            const result = HtmlSanitizer.sanitize(input)

            expect(result).not.toContain("style=")
            expect(result).not.toContain("color:")
            expect(result).toContain("Styled text")
        })

        it("returns an empty string for empty, null, or undefined input", () => {
            expect(HtmlSanitizer.sanitize("")).toBe("")
            expect(HtmlSanitizer.sanitize(null as unknown as string)).toBe("")
            expect(HtmlSanitizer.sanitize(undefined as unknown as string)).toBe(
                "",
            )
        })

        it("removes iframe tags", () => {
            const input = '<iframe src="https://evil.com"></iframe><p>Safe</p>'
            const result = HtmlSanitizer.sanitize(input)

            expect(result).not.toContain("<iframe")
            expect(result).toContain("<p>Safe</p>")
        })

        it("removes form and input tags", () => {
            const input = '<form action="/steal"><input type="text"/></form>'
            const result = HtmlSanitizer.sanitize(input)

            expect(result).not.toContain("<form")
            expect(result).not.toContain("<input")
        })

        it("removes object and embed tags", () => {
            const input =
                '<object data="evil.swf"></object><embed src="bad.swf">'
            const result = HtmlSanitizer.sanitize(input)

            expect(result).not.toContain("<object")
            expect(result).not.toContain("<embed")
        })

        it("preserves list elements", () => {
            const input = "<ul><li>Item 1</li><li>Item 2</li></ul>"

            expect(HtmlSanitizer.sanitize(input)).toBe(input)
        })

        it("preserves table elements", () => {
            const input =
                "<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>"

            expect(HtmlSanitizer.sanitize(input)).toBe(input)
        })
    })

    describe("sanitizeWithInfo", () => {
        it("reports removed script elements", () => {
            const input = "<p>Safe</p><script>bad()</script>"
            const result = HtmlSanitizer.sanitizeWithInfo(input)

            expect(result.isModified).toBe(true)
            expect(result.removed).toContain("<script>")
        })

        it("reports unmodified content as unmodified", () => {
            const input = "<p>Just a paragraph</p>"
            const result = HtmlSanitizer.sanitizeWithInfo(input)

            expect(result.sanitized).toBe(input)
            expect(result.isModified).toBe(false)
        })

        it("returns empty results for empty input", () => {
            const result = HtmlSanitizer.sanitizeWithInfo("")

            expect(result.sanitized).toBe("")
            expect(result.removed).toEqual([])
            expect(result.isModified).toBe(false)
        })

        it("lists each removed tag once", () => {
            const input =
                "<script>1</script><script>2</script><script>3</script>"
            const result = HtmlSanitizer.sanitizeWithInfo(input)

            expect(result.removed.filter((r) => r === "<script>")).toHaveLength(
                1,
            )
        })
    })

    describe("containsDangerousContent", () => {
        it("detects XSS via event handlers", () => {
            const input = '<img src="x" onerror="alert(document.cookie)">'
            expect(HtmlSanitizer.containsDangerousContent(input)).toBe(true)
        })

        it("detects script tags", () => {
            const input = '<script>alert("xss")</script>'
            expect(HtmlSanitizer.containsDangerousContent(input)).toBe(true)
        })

        it("detects style injection", () => {
            const input =
                '<div style="background: url(javascript:alert(1))">X</div>'
            expect(HtmlSanitizer.containsDangerousContent(input)).toBe(true)
        })

        it("detects iframe injection", () => {
            const input = '<iframe src="https://evil.com/steal"></iframe>'
            expect(HtmlSanitizer.containsDangerousContent(input)).toBe(true)
        })

        it("does not flag a simple paragraph", () => {
            expect(HtmlSanitizer.containsDangerousContent("<p>safe</p>")).toBe(
                false,
            )
        })

        it("returns false for empty or null input", () => {
            expect(HtmlSanitizer.containsDangerousContent("")).toBe(false)
            expect(
                HtmlSanitizer.containsDangerousContent(
                    null as unknown as string,
                ),
            ).toBe(false)
        })
    })
})
