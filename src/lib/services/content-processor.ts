import type { ExtensionSettings } from "~/types/types"
import { HtmlSanitizer } from "./"

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

            // Sanitize the HTML content before returning
            const sanitizedContent = HtmlSanitizer.sanitize(tempDiv.innerHTML)
            return { content: sanitizedContent }
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

            // Sanitize the HTML content before returning
            const sanitizedContent = HtmlSanitizer.sanitize(tempDiv.innerHTML)
            return { content: sanitizedContent }
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
        const fragment = document.createElement("div")

        // Extract blurb labels first (appears above)
        const labelsElement = overviewDoc.querySelector(settings.blurbLabels)
        if (
            labelsElement instanceof HTMLElement &&
            labelsElement.textContent?.trim()
        ) {
            fragment.appendChild(labelsElement.cloneNode(true) as HTMLElement)
        }

        // Extract main blurb content
        const blurbElement = overviewDoc.querySelector(settings.blurb)

        if (!blurbElement || !(blurbElement instanceof HTMLElement)) {
            return { error: "Could not find story blurb in overview page" }
        }

        if (!blurbElement.textContent || !blurbElement.textContent.trim()) {
            return { error: "Story blurb appears to be empty" }
        }

        fragment.appendChild(blurbElement.cloneNode(true) as HTMLElement)

        return { data: fragment }
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

        if (!chapterElement.textContent?.trim()) {
            return { error: "Chapter content appears to be empty" }
        }

        const paragraphs = chapterElement.querySelectorAll("p")
        if (paragraphs.length === 0) {
            return { error: "No paragraphs found in chapter content" }
        }

        return this.selectParagraphsByWordCount(paragraphs, settings.wordCount)
    }

    /**
     * Selects paragraphs from the end, respecting word count limit
     */
    private static selectParagraphsByWordCount(
        paragraphs: NodeListOf<Element>,
        maxWordCount: number,
    ): { data: HTMLElement } {
        const contentDiv = document.createElement("div")
        const selectedParagraphs: Node[] = []
        let remainingWords = maxWordCount

        // Process paragraphs in reverse (from end of chapter)
        for (let i = paragraphs.length - 1; i >= 0; i--) {
            const paragraph = paragraphs[i]
            const wordCount = this.countWordsInNode(paragraph)

            if (wordCount === 0) continue

            const wordsAfterAddition = remainingWords - wordCount

            if (wordsAfterAddition >= 0) {
                // Include entire paragraph
                selectedParagraphs.push(paragraph.cloneNode(true))
                remainingWords = wordsAfterAddition
            } else {
                // Truncate paragraph to fit remaining word limit
                const truncatedParagraph = this.buildContentFromWords(
                    paragraph,
                    remainingWords,
                )
                selectedParagraphs.push(truncatedParagraph)
                break
            }
        }

        // Append in correct chronological order
        contentDiv.append(...selectedParagraphs.reverse())
        return { data: contentDiv }
    }

    /**
     * Counts words in a node's text content
     */
    private static countWordsInNode(node: Node) {
        const text = node.textContent?.trim()
        return text ? text.split(/\s+/).length : 0
    }

    /**
     * Helper function to build content from words with a specific word count
     */
    private static buildContentFromWords(node: ChildNode, count: number) {
        if (count <= 0) {
            return document.createTextNode("")
        }

        switch (node.nodeType) {
            case Node.TEXT_NODE:
                return this.truncateTextNode(node, count)

            case Node.ELEMENT_NODE:
                return this.truncateElementNode(node as HTMLElement, count)

            default:
                return document.createTextNode("")
        }
    }

    /**
     * Truncates a text node to the specified word count
     */
    private static truncateTextNode(node: ChildNode, count: number) {
        const text = node.textContent ?? ""
        const words = text.trim().split(/\s+/)

        if (words.length <= count) {
            return document.createTextNode(text)
        }

        const truncatedText = "..." + words.slice(-count).join(" ")
        return document.createTextNode(truncatedText)
    }

    /**
     * Truncates an element node and its children to the specified word count
     */
    private static truncateElementNode(element: HTMLElement, count: number) {
        const newElement = document.createElement(element.tagName.toLowerCase())

        // Copy all attributes efficiently
        this.copyAttributes(element, newElement)

        // Process children until word limit is reached
        const children = this.processChildrenWithWordLimit(
            element.childNodes,
            count,
        )

        newElement.append(...children)
        return newElement
    }

    /**
     * Copies all attributes from source to target element
     */
    private static copyAttributes(source: Element, target: Element) {
        for (const { name, value } of source.attributes) {
            target.setAttribute(name, value)
        }
    }

    /**
     * Processes child nodes until word limit is reached
     */
    private static processChildrenWithWordLimit(
        childNodes: NodeListOf<ChildNode>,
        maxWords: number,
    ) {
        const children: Node[] = []
        let wordsUsed = 0

        for (const child of childNodes) {
            if (wordsUsed >= maxWords) break

            const remainingWords = maxWords - wordsUsed
            const processedChild = this.buildContentFromWords(
                child,
                remainingWords,
            )
            const childWordCount = this.countWordsInNode(processedChild)

            children.push(processedChild)
            wordsUsed += childWordCount

            // If we used all remaining words, we're done
            if (childWordCount >= remainingWords) {
                break
            }
        }

        return children
    }

    /**
     * Creates a complete recap fragment
     */
    private static createRecapFragment(
        fictionTitle: string,
        chapterName: string,
        chapterContent: HTMLElement,
        wordCount: number,
    ) {
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
    ) {
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
