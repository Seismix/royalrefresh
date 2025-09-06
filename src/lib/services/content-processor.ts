import type { ExtensionSettings } from "~/types/types"

/**
 * Content Processing Service - Pure functions for processing HTML content
 * No side effects, returns result objects with processed content or errors
 */
export class ContentProcessor {
    /**
     * Creates a recap from raw HTML content
     * @param html - The raw HTML from the previous chapter
     * @param settings - Extension settings for processing
     * @returns Processed recap content or error message
     */
    static createRecap(
        html: string,
        settings: ExtensionSettings,
    ): { content: string } | { error: string } {
        try {
            const parser = new DOMParser()
            const doc = parser.parseFromString(html, "text/html")

            // Extract fiction title from current document
            const fictionTitle =
                this.extractFictionTitleFromCurrentDocument(settings)
            if ("error" in fictionTitle) {
                return fictionTitle
            }

            // Extract chapter name from parsed document
            const chapterName = this.extractChapterName(doc, settings)
            if ("error" in chapterName) {
                return chapterName
            }

            // Extract and process chapter content
            const chapterContent = this.extractChapterContent(doc, settings)
            if ("error" in chapterContent) {
                return chapterContent
            }

            // Create recap fragment
            const fragment = this.createRecapFragment(
                fictionTitle.data,
                chapterName.data,
                chapterContent.data,
                settings.wordCount,
            )

            // Convert fragment to HTML string
            const tempDiv = document.createElement("div")
            tempDiv.appendChild(fragment)

            return { content: tempDiv.innerHTML }
        } catch (error) {
            return {
                error:
                    error instanceof Error
                        ? `Failed to process recap: ${error.message}`
                        : "Failed to process recap content",
            }
        }
    }

    /**
     * Creates a blurb from raw HTML content
     * @param html - The raw HTML from the fiction overview page
     * @param settings - Extension settings for processing
     * @returns Processed blurb content or error message
     */
    static createBlurb(
        html: string,
        settings: ExtensionSettings,
    ): { content: string } | { error: string } {
        try {
            const parser = new DOMParser()
            const doc = parser.parseFromString(html, "text/html")

            // Extract fiction title from current document
            const fictionTitle =
                this.extractFictionTitleFromCurrentDocument(settings)
            if ("error" in fictionTitle) {
                return fictionTitle
            }

            // Extract blurb content from overview document
            const blurbContent = this.extractBlurb(doc, settings)
            if ("error" in blurbContent) {
                return blurbContent
            }

            // Create blurb fragment
            const fragment = this.createBlurbFragment(
                fictionTitle.data,
                blurbContent.data,
            )

            // Convert fragment to HTML string
            const tempDiv = document.createElement("div")
            tempDiv.appendChild(fragment)

            return { content: tempDiv.innerHTML }
        } catch (error) {
            return {
                error:
                    error instanceof Error
                        ? `Failed to process blurb: ${error.message}`
                        : "Failed to process blurb content",
            }
        }
    }

    /**
     * Extracts the fiction title from the current document
     */
    private static extractFictionTitleFromCurrentDocument(
        settings: ExtensionSettings,
    ): { data: string } | { error: string } {
        const fictionTitleElement = document.querySelector(
            settings.fictionTitle,
        )

        if (!fictionTitleElement || !fictionTitleElement.textContent) {
            return { error: "Could not find fiction title on current page" }
        }

        return { data: fictionTitleElement.textContent.trim() }
    }

    /**
     * Extracts the chapter name from a document
     */
    private static extractChapterName(
        doc: Document,
        settings: ExtensionSettings,
    ): { data: string } | { error: string } {
        const chapterTitleElement = doc.querySelector(settings.chapterTitle)

        if (!chapterTitleElement || !chapterTitleElement.textContent) {
            return { error: "Could not find chapter title in fetched content" }
        }

        return { data: chapterTitleElement.textContent.trim() }
    }

    /**
     * Extracts the blurb from an overview document
     */
    private static extractBlurb(
        overviewDoc: Document,
        settings: ExtensionSettings,
    ): { data: HTMLElement } | { error: string } {
        const blurbElement = overviewDoc.querySelector(settings.blurb)

        if (!blurbElement || !(blurbElement instanceof HTMLElement)) {
            return { error: "Could not find story blurb in overview page" }
        }

        if (!blurbElement.textContent || !blurbElement.textContent.trim()) {
            return { error: "Story blurb appears to be empty" }
        }

        return { data: blurbElement.cloneNode(true) as HTMLElement }
    }

    /**
     * Extracts chapter content and limits it to a word count
     */
    private static extractChapterContent(
        chapterDoc: Document,
        settings: ExtensionSettings,
    ): { data: HTMLElement } | { error: string } {
        const chapterElement = chapterDoc.querySelector(settings.chapterContent)

        if (!chapterElement) {
            return { error: "Could not find chapter content in fetched page" }
        }

        if (!chapterElement.textContent || !chapterElement.textContent.trim()) {
            return { error: "Chapter content appears to be empty" }
        }

        const paragraphs = chapterElement.querySelectorAll("p")
        if (paragraphs.length === 0) {
            return { error: "No paragraphs found in chapter content" }
        }

        const contentDiv = document.createElement("div")
        const selectedParagraphs: Node[] = []
        let remainingWordCount = settings.wordCount

        // Iterate over paragraphs in reverse order to get the last paragraphs first
        for (let i = paragraphs.length - 1; i >= 0; i--) {
            const paragraph = paragraphs[i]
            const paragraphWordCount =
                paragraph.textContent?.trim().split(/\s+/).length ?? 0

            if (paragraphWordCount > 0) {
                remainingWordCount -= paragraphWordCount

                if (remainingWordCount > 0) {
                    selectedParagraphs.push(paragraph.cloneNode(true))
                } else {
                    // Build paragraph with remaining words
                    const truncatedParagraph = this.buildContentFromWords(
                        paragraph,
                        paragraphWordCount + remainingWordCount,
                    )
                    selectedParagraphs.push(truncatedParagraph)
                    break
                }
            }
        }

        // Append selected paragraphs in correct order
        contentDiv.append(...selectedParagraphs.reverse())

        return { data: contentDiv }
    }

    /**
     * Helper function to build content from words with a specific word count
     */
    private static buildContentFromWords(node: ChildNode, count: number): Node {
        if (node.nodeType === Node.TEXT_NODE) {
            const textWords = (node.textContent ?? "").trim().split(/\s+/)
            const newText =
                textWords.length > count
                    ? "..." + textWords.slice(-count).join(" ")
                    : textWords.join(" ")
            return document.createTextNode(newText)
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            const newElement = document.createElement(
                element.tagName.toLowerCase(),
            )

            // Copy attributes
            for (const attr of element.attributes) {
                newElement.setAttribute(attr.name, attr.value)
            }

            let remainingCount = count
            const newChildNodes: Node[] = []

            // Process child nodes
            for (const child of Array.from(element.childNodes)) {
                const newChild = this.buildContentFromWords(
                    child,
                    remainingCount,
                )
                const newText = newChild.textContent ?? ""
                const newTextWords = newText.trim().split(/\s+/)

                if (newTextWords.length <= remainingCount) {
                    newChildNodes.push(newChild)
                    remainingCount -= newTextWords.length
                } else {
                    const partialChild = this.buildContentFromWords(
                        child,
                        remainingCount,
                    )
                    newChildNodes.push(partialChild)
                    remainingCount = 0
                    break
                }

                if (remainingCount <= 0) {
                    break
                }
            }

            newElement.append(...newChildNodes)
            return newElement
        }

        return document.createTextNode("")
    }

    /**
     * Creates a complete recap fragment
     */
    private static createRecapFragment(
        fictionTitle: string,
        chapterName: string,
        chapterContent: HTMLElement,
        wordCount: number,
    ): DocumentFragment {
        // Recap heading
        const recapHeadingElement = document.createElement("h1")
        recapHeadingElement.textContent = `RoyalRefresh of ${fictionTitle}`

        // Previous chapter name
        const recapChapterNameElement = document.createElement("h2")
        recapChapterNameElement.textContent = `Previous chapter: ${chapterName}`

        // Word count display
        const recapWordsDisplayElement = document.createElement("h4")
        recapWordsDisplayElement.textContent = `Showing last ~${wordCount} words:`

        // Create fragment
        const fragment = document.createDocumentFragment()
        fragment.appendChild(document.createElement("hr"))
        fragment.appendChild(recapHeadingElement)
        fragment.appendChild(recapChapterNameElement)
        fragment.appendChild(recapWordsDisplayElement)
        fragment.appendChild(chapterContent)
        fragment.appendChild(document.createElement("hr"))

        return fragment
    }

    /**
     * Creates a complete blurb fragment
     */
    private static createBlurbFragment(
        fictionTitle: string,
        blurbContent: HTMLElement,
    ): DocumentFragment {
        const blurbHeading = document.createElement("h1")
        blurbHeading.textContent = `Blurb: ${fictionTitle}`

        const bottomSeparator = document.createElement("hr")
        bottomSeparator.style.marginBottom = "50px"

        const fragment = document.createDocumentFragment()
        fragment.appendChild(document.createElement("hr"))
        fragment.appendChild(blurbHeading)
        fragment.appendChild(blurbContent)
        fragment.appendChild(bottomSeparator)

        return fragment
    }
}
