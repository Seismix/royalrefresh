import DOMPurify from "dompurify"

/**
 * HTML Sanitizer Service - Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify to clean HTML while preserving safe formatting elements
 */
export class HtmlSanitizer {
    private static readonly config = {
        // Allow common text formatting and structure tags that are safe for Royal Road content
        ALLOWED_TAGS: [
            // Text formatting
            "p",
            "br",
            "strong",
            "b",
            "em",
            "i",
            "u",
            "s",
            "sup",
            "sub",
            // Headings
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            // Lists
            "ul",
            "ol",
            "li",
            // Links (but remove javascript: and data: schemes)
            "a",
            // Quotes and divisions
            "blockquote",
            "div",
            "span",
            // Line breaks and horizontal rules
            "hr",
            // Tables (common in some stories)
            "table",
            "thead",
            "tbody",
            "tr",
            "td",
            "th",
        ],

        // Allow safe attributes
        ALLOWED_ATTR: [
            "href",
            "title",
            "alt",
            "class",
            "id",
            // Table attributes
            "colspan",
            "rowspan",
        ],

        // Allow only safe URL schemes for links
        ALLOWED_URI_REGEXP:
            /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,

        // Remove any script-related attributes
        FORBID_ATTR: ["style", "onclick", "onload", "onerror", "onmouseover"],

        // Remove script and style tags completely
        FORBID_TAGS: [
            "script",
            "style",
            "object",
            "embed",
            "iframe",
            "form",
            "input",
        ],

        // Keep whitespace structure
        KEEP_CONTENT: true,

        // Return a string instead of DOM node
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,

        // Don't add any additional trusted types
        RETURN_TRUSTED_TYPE: false,
    }

    /**
     * Sanitizes HTML content to prevent XSS while preserving safe formatting
     * @param html - Raw HTML string to sanitize
     * @returns Sanitized HTML string safe for use with {@html}
     */
    static sanitize(html: string): string {
        if (!html || typeof html !== "string") {
            return ""
        }

        try {
            // Use DOMPurify to clean the HTML - ensure we get a string result
            const cleaned = DOMPurify.sanitize(html, this.config) as string

            console.log("Sanitized HTML")

            // Additional cleanup: remove any remaining empty attributes that might cause issues
            return cleaned
                .replace(/\s+class=""/g, "") // Remove empty class attributes
                .replace(/\s+id=""/g, "") // Remove empty id attributes
                .replace(/\s+title=""/g, "") // Remove empty title attributes
                .trim()
        } catch (error) {
            console.error("HTML sanitization failed:", error)
            // Return empty string on error to be safe
            return ""
        }
    }

    /**
     * Sanitizes HTML and provides additional info about what was cleaned
     * Useful for debugging or logging purposes
     * @param html - Raw HTML string to sanitize
     * @returns Object with sanitized HTML and info about removed elements
     */
    static sanitizeWithInfo(html: string): {
        sanitized: string
        removed: string[]
        isModified: boolean
    } {
        if (!html || typeof html !== "string") {
            return {
                sanitized: "",
                removed: [],
                isModified: false,
            }
        }

        const original = html
        const removed: string[] = []

        // Hook into DOMPurify's removal process
        DOMPurify.addHook("uponSanitizeElement", (node, data) => {
            if (data.allowedTags[data.tagName] === undefined) {
                removed.push(`<${data.tagName}>`)
            }
        })

        const sanitized = this.sanitize(html)

        // Clean up the hook
        DOMPurify.removeAllHooks()

        return {
            sanitized,
            removed: [...new Set(removed)], // Remove duplicates
            isModified: original !== sanitized,
        }
    }

    /**
     * Quick check if HTML content contains potentially dangerous elements
     * @param html - HTML string to check
     * @returns true if HTML contains elements that would be removed by sanitization
     */
    static containsDangerousContent(html: string): boolean {
        if (!html || typeof html !== "string") {
            return false
        }

        const result = this.sanitizeWithInfo(html)
        return result.isModified || result.removed.length > 0
    }
}
