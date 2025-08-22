import type { ExtensionSettings } from "~/types/types"

/**
 * True if `chapter` is in the URL path, otherwise false.
 */
export function documentIsChapterURL() {
    return window.location.pathname.split("/").includes("chapter")
}

/**
 * True if the previous chapter button has a valid `href` attribute, otherwise false.
 */
export function documentHasPreviousChapterURL(
    extensionSettings: ExtensionSettings,
) {
    const hasPrevChapterURL = document.querySelector(
        extensionSettings.prevChapterBtn.toString(),
    )

    return !!hasPrevChapterURL?.hasAttribute("href")
}

/**
 * Fetches HTML content from a URL
 */
export async function fetchHtmlText(url: string | URL | Request) {
    try {
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error("No response...")
        }

        const text = await response.text()
        return text
    } catch (error) {
        console.error("Fetching content failed:", error)
        return null
    }
}

/**
 * Extracts the fiction title from the CURRENT document
 */
export function extractFictionTitle(extensionSettings: ExtensionSettings) {
    const fictionTitleElement = document.querySelector(
        extensionSettings.fictionTitle,
    )

    if (!fictionTitleElement || fictionTitleElement.textContent === null) {
        return "Error loading fiction title"
    } else {
        return fictionTitleElement.textContent.trim()
    }
}

/**
 * Extracts the chapter name from a document
 */
export function extractChapterName(
    doc: Document,
    extensionSettings: ExtensionSettings,
) {
    const chapterTitleElement = doc.querySelector(
        extensionSettings.chapterTitle,
    )

    if (!chapterTitleElement || chapterTitleElement.textContent === null) {
        return "Error loading chapter title"
    } else {
        return chapterTitleElement.textContent.trim()
    }
}

/**
 * Extracts the blurb from an overview document
 */
export function extractBlurb(
    overviewDoc: Document,
    extensionSettings: ExtensionSettings,
) {
    const blurb = overviewDoc.querySelector(extensionSettings.blurb)

    if (
        !blurb ||
        blurb.textContent === null ||
        !(blurb instanceof HTMLDivElement)
    ) {
        const error = document.createElement("div")
        error.textContent = "Error loading story blurb"
        return error
    }

    blurb.querySelectorAll("input, label").forEach((element) => {
        element.remove()
    })

    return blurb
}

/**
 * Extracts the chapter content from a document and limits it to a word count
 */
export function extractChapterContent(
    chapterDoc: Document,
    extensionSettings: ExtensionSettings,
) {
    const chapterElement = chapterDoc.querySelector(
        extensionSettings.chapterContent,
    )

    const contentDiv = document.createElement("div")

    // Check if chapterElement exists and has valid text content
    if (
        !chapterElement ||
        !(chapterElement.textContent && chapterElement.textContent.trim())
    ) {
        contentDiv.textContent = "Error loading recap"
        return contentDiv
    }

    const paragraphs = chapterElement.querySelectorAll("p")
    const selectedParagraphs = []
    let remainingWordCount = extensionSettings.wordCount

    // Iterate over the paragraphs in reverse order to get the last paragraphs first
    for (let i = paragraphs.length - 1; i >= 0; i--) {
        const paragraph = paragraphs[i]
        const paragraphWordCount =
            paragraph.textContent?.trim().split(/\s+/).length ?? 0

        if (paragraphWordCount > 0) {
            remainingWordCount -= paragraphWordCount

            if (remainingWordCount > 0) {
                selectedParagraphs.push(paragraph.cloneNode(true))
            } else {
                // Rebuild the paragraph with the remaining words
                const newParagraph = buildContentFromWords(
                    paragraph,
                    paragraphWordCount + remainingWordCount,
                )

                selectedParagraphs.push(newParagraph)
                break
            }
        }
    }

    // Append the selected paragraphs to the content div in the correct order
    contentDiv.append(...selectedParagraphs.reverse())

    return contentDiv
}

/**
 * Helper function to build content from words with a specific word count
 */
function buildContentFromWords(node: ChildNode, count: number) {
    if (node.nodeType === Node.TEXT_NODE) {
        const textWords = (node.textContent ?? "").trim().split(/\s+/)
        const newText =
            textWords.length > count
                ? "..." + textWords.slice(-count).join(" ")
                : textWords.join(" ")
        return document.createTextNode(newText)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        const newElement = document.createElement(element.tagName.toLowerCase())

        // Copy attributes
        for (const attr of element.attributes) {
            newElement.setAttribute(attr.name, attr.value)
        }

        let remainingCount = count
        const newChildNodes: Node[] = []

        // Process child nodes
        for (const child of Array.from(element.childNodes)) {
            const newChild = buildContentFromWords(child, remainingCount)
            const newText = newChild.textContent ?? ""
            const newTextWords = newText.trim().split(/\s+/)

            if (newTextWords.length <= remainingCount) {
                newChildNodes.push(newChild)
                remainingCount -= newTextWords.length
            } else {
                const partialChild = buildContentFromWords(
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
 * Creates a complete recap fragment from previous chapter HTML
 */
export function createRecapFragment(
    prevChapterHtml: string,
    extensionSettings: ExtensionSettings,
) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(prevChapterHtml, "text/html")

    // Fiction title
    const recapHeading = extractFictionTitle(extensionSettings)
    const recapHeadingElement = document.createElement("h1")
    recapHeadingElement.textContent = `RoyalRefresh of ${recapHeading}`

    // Previous chapter name
    const recapChapterName = extractChapterName(doc, extensionSettings)
    const recapChapterNameElement = document.createElement("h2")
    recapChapterNameElement.textContent = `Previous chapter: ${recapChapterName}`

    // Recap content
    const recapContentElement = extractChapterContent(doc, extensionSettings)

    // Wordcount display
    const recapWordsDisplayElement = document.createElement("h4")
    recapWordsDisplayElement.textContent = `Showing last ~${extensionSettings.wordCount} words:`

    // Fragment
    const fragment = document.createDocumentFragment()
    fragment.appendChild(document.createElement("hr"))
    fragment.appendChild(recapHeadingElement)
    fragment.appendChild(recapChapterNameElement)
    fragment.appendChild(recapWordsDisplayElement)
    fragment.appendChild(recapContentElement)
    fragment.appendChild(document.createElement("hr"))

    return fragment
}

/**
 * Creates a complete blurb fragment from overview HTML
 */
export function createBlurbFragment(
    overviewHtml: string,
    extensionSettings: ExtensionSettings,
) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(overviewHtml, "text/html")

    const blurbHeading = document.createElement("h1")
    blurbHeading.textContent = `Blurb: ${extractFictionTitle(extensionSettings)}`

    const bottomSeparator = document.createElement("hr")
    bottomSeparator.style.marginBottom = "50px"

    const blurb = extractBlurb(doc, extensionSettings)

    const fragment = document.createDocumentFragment()
    fragment.appendChild(document.createElement("hr"))
    fragment.appendChild(blurbHeading)
    fragment.appendChild(blurb)
    fragment.appendChild(bottomSeparator)

    return fragment
}
