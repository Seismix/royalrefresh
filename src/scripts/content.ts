import { ExtensionSettings } from "@royalrefresh/types"
import browser from "webextension-polyfill"
import DEFAULTS from "../helpers/defaults"
import StorageService from "../helpers/storageService"

/**
 * The object that gets populated with all values loaded from `browser.storage`
 */
let extensionSettings: ExtensionSettings = DEFAULTS

// Constants
const RECAP_BUTTON_ID = "recapButton"
const RECAP_CONTAINER_ID = "recapContainer"
const TOGGLE_SPAN_ID = "toggleSpan"
const BLURB_BUTTON_ID = "blurbButton"
const SETTINGS_BUTTON_ID = "settingsButton"

init()

/** Initializes all necessary data and injects all extension code into the DOM, if some checks are passed */
async function init() {
    if (!documentIsChapterURL()) return

    await loadExtensionSettings()
    addSettingsChangeListener()

    const hasPrevChapterURL = documentHasPreviousChapterURL()

    const toggleButton = hasPrevChapterURL
        ? createRecapButton()
        : createBlurbButton()
    addToggleButtonToDOM(toggleButton)

    const settingsButton = createSettingsButton()
    if (hasPrevChapterURL) {
        addSettingsButtonToDOM(settingsButton)
    }

    const recapContainer = createRecapContainer()
    addRecapContainerToDOM(recapContainer)

    if (extensionSettings.autoExpand) {
        toggleButton.click()
    }
}

async function loadExtensionSettings() {
    extensionSettings = await StorageService.getSettings()
}

function addSettingsChangeListener() {
    browser.storage.onChanged.addListener(async (changes, area) => {
        if (area === "sync") {
            await loadExtensionSettings() // Reloads from `sync` storage
            appendFetchedRecap() // Refetch and reparse
        }
    })
}

/** Toggles the visibility of the recap div and the text on the recap button */
async function toggleRecap() {
    const toggleSpan = document.getElementById(TOGGLE_SPAN_ID)
    const recapContainer = document.getElementById(RECAP_CONTAINER_ID)

    if (!toggleSpan || !recapContainer) return

    toggleSpan.textContent =
        recapContainer.style.display === "none" ? "Hide " : "Show "

    await fetchAndDisplay(recapContainer)

    recapContainer.style.display =
        recapContainer.style.display === "none" ? "block" : "none"

    if (extensionSettings.smoothScroll) {
        recapContainer.scrollIntoView({ behavior: "smooth" })
    }
}

async function fetchAndDisplay(recapContainer: HTMLElement) {
    if (recapContainerHasContent(recapContainer)) return

    if (documentHasPreviousChapterURL()) {
        await appendFetchedRecap()
    } else {
        await appendFetchedBlurb()
    }
}

/**
 * True if the recap container has content, otherwise false.
 */
function recapContainerHasContent(recapContainer: HTMLElement): boolean {
    return recapContainer.textContent?.trim() !== ""
}

/**
 * True if `chapter` is in the URL path, otherwise false.
 */
function documentIsChapterURL(): boolean {
    return window.location.pathname.split("/").includes("chapter")
}

/**
 * True if the previous chapter button has a valid `href` attribute, otherwise false.
 */
function documentHasPreviousChapterURL(): boolean {
    const hasPrevChapterURL = document.querySelector(
        extensionSettings.prevChapterBtn.toString(),
    )

    return !!hasPrevChapterURL?.hasAttribute("href")
}

/**
 * Creates the recap button (disabled if no previous chapter)
 */
function createRecapButton() {
    const button = document.createElement("button")
    button.id = RECAP_BUTTON_ID
    button.textContent = "Recap"
    button.classList.add("btn", "btn-primary", "btn-circle")

    const toggleSpan = document.createElement("span")
    toggleSpan.id = TOGGLE_SPAN_ID
    toggleSpan.textContent = "Show "

    button.prepend(toggleSpan)

    const bookIcon = document.createElement("i")
    bookIcon.classList.add("fa", "fa-book")

    button.prepend(bookIcon)
    bookIcon.append("\u00A0")

    button.addEventListener("click", () => {
        toggleRecap()
    })

    return button
}

function createBlurbButton() {
    const button = document.createElement("button")
    button.id = BLURB_BUTTON_ID
    button.textContent = "Blurb"
    button.classList.add("btn", "btn-primary", "btn-circle")

    const toggleSpan = document.createElement("span")
    toggleSpan.id = TOGGLE_SPAN_ID
    toggleSpan.textContent = "Show "

    button.prepend(toggleSpan)

    const bookIcon = document.createElement("i")
    bookIcon.classList.add("fa", "fa-info-circle")

    button.prepend(bookIcon)
    bookIcon.append("\u00A0")

    button.addEventListener("click", () => {
        toggleRecap()
    })

    return button
}

function createSettingsButton() {
    const button = document.createElement("button")
    button.id = SETTINGS_BUTTON_ID
    button.textContent = "Open RoyalRefresh Settings"
    button.classList.add("btn", "btn-circle", "red")

    button.style.marginRight = "auto"
    button.style.marginLeft = "0"
    button.style.display = "flex"
    button.style.alignItems = "center"
    button.style.gap = "0.2em"

    const gearIcon = document.createElement("i")
    gearIcon.classList.add("fa", "fa-cog")

    button.prepend(gearIcon)

    button.addEventListener("click", () => {
        browser.runtime.sendMessage({ action: "openExtensionSettings" })

        // Close the settings modal if it's open
        const closeButton = document.querySelector(
            extensionSettings.closeButtonSelector,
        )
        if (closeButton && closeButton instanceof HTMLButtonElement) {
            closeButton.click()
        }
    })

    return button
}

function addSettingsButtonToDOM(settingsButton: HTMLButtonElement) {
    if (!settingsButton) return

    const settingsPlacement: HTMLElement | null = document.querySelector(
        extensionSettings.settingsPlacement,
    )

    if (settingsPlacement && !document.getElementById(SETTINGS_BUTTON_ID)) {
        settingsPlacement.style.display = "flex"
        settingsPlacement.style.justifyContent = "space-between"
        settingsPlacement.style.alignItems = "center"

        // Append the settings button to the container div
        settingsPlacement.prepend(settingsButton)
    }
}

function addToggleButtonToDOM(button: HTMLButtonElement) {
    if (!document.getElementById(button.id)) {
        const navButtons = document.querySelector(
            extensionSettings.togglePlacement,
        )

        if (navButtons) {
            navButtons.prepend(button)
        }
    }
}

function createRecapContainer() {
    const recapContainer = document.createElement("div")
    recapContainer.id = RECAP_CONTAINER_ID
    recapContainer.style.display = "none"

    return recapContainer
}

function addRecapContainerToDOM(recap: HTMLDivElement) {
    if (!document.getElementById(RECAP_CONTAINER_ID)) {
        const chapterDiv = document.querySelector(
            extensionSettings.chapterContent,
        )

        if (chapterDiv) {
            chapterDiv.prepend(recap)
        }
    }
}

function createRecapFragment(prevChapterHtml: string) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(prevChapterHtml, "text/html")

    // Fiction title
    const recapHeading = extractFictionTitle()
    const recapHeadingElement = document.createElement("h1")
    recapHeadingElement.textContent = `RoyalRefresh of ${recapHeading}`

    // Previous chapter name
    const recapChapterName = extractChapterName(doc)
    const recapChapterNameElement = document.createElement("h2")
    recapChapterNameElement.textContent = `Previous chapter: ${recapChapterName}`

    // Recap content
    const recapContentElement = extractChapterContent(doc)

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

async function appendFetchedRecap() {
    const recapContainer = document.getElementById(RECAP_CONTAINER_ID)
    const prevChapterBtn = document.querySelector(
        extensionSettings.prevChapterBtn,
    )

    // Clear the content
    if (recapContainer) {
        recapContainer.replaceChildren()
    }

    if (!(prevChapterBtn instanceof HTMLAnchorElement)) {
        return recapContainer?.append(
            "Could not find previous chapter URL to fetch data.",
        )
    }

    const prevChapterHtml = await fetchHtmlText(prevChapterBtn.href)

    if (!prevChapterHtml) {
        console.error("Error fetching chapter data.")
        return recapContainer?.append("Error fetching chapter. Refresh.")
    }

    const recapFragment = createRecapFragment(prevChapterHtml)

    recapContainer?.appendChild(recapFragment)
}

function createBlurbFragment(overviewHtml: string) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(overviewHtml, "text/html")

    const blurbHeading = document.createElement("h1")
    blurbHeading.textContent = `Blurb: ${extractFictionTitle()}`

    const bottomSeparator = document.createElement("hr")
    bottomSeparator.style.marginBottom = "50px"

    const blurb = extractBlurb(doc)

    const fragment = document.createDocumentFragment()
    fragment.appendChild(document.createElement("hr"))
    fragment.appendChild(blurbHeading)
    fragment.appendChild(blurb)
    fragment.appendChild(bottomSeparator)

    return fragment
}

async function appendFetchedBlurb() {
    const recapContainer = document.getElementById(RECAP_CONTAINER_ID)
    const fictionTitle = document.querySelector(extensionSettings.fictionTitle)

    if (!(fictionTitle?.parentElement instanceof HTMLAnchorElement)) {
        return
    }

    const fictionOverviewUrl = fictionTitle.parentElement.href
    const overviewHtml = await fetchHtmlText(fictionOverviewUrl)

    if (!overviewHtml) {
        recapContainer?.append("Error fetching blurb. Refresh")
        return
    }

    const blurb = createBlurbFragment(overviewHtml)

    recapContainer?.appendChild(blurb)

    if (extensionSettings.smoothScroll) {
        recapContainer?.scrollIntoView({ behavior: "smooth" })
    }
}

async function fetchHtmlText(url: string | URL | Request) {
    try {
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error("No response...")
        }

        const text = await response.text()

        return text
    } catch (error) {
        console.error("Fetching chapter failed:", error)

        return null
    }
}

function extractBlurb(overviewDoc: Document) {
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
 * Extracts the chapter content from the PREVIOUS chapter
 */
function extractChapterContent(
    prevChapterDoc: Document,
    wordCount: number = extensionSettings.wordCount,
) {
    const chapterElement = prevChapterDoc.querySelector(
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
    let remainingWordCount = wordCount

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

function buildContentFromWords(node: ChildNode, count: number): Node {
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
 * @param {Document} prevChapterDoc A parsable document of the previous chapter
 */
function extractChapterName(prevChapterDoc: Document) {
    const chapterTitleElement = prevChapterDoc.querySelector(
        extensionSettings.chapterTitle,
    )

    if (!chapterTitleElement || chapterTitleElement.textContent === null) {
        return "Error loading chapter title"
    } else {
        return chapterTitleElement.textContent.trim()
    }
}

/**
 * Extracts the fiction title from the CURRENT document, since between 2 chapters the fiction title stays the same
 */
function extractFictionTitle() {
    const fictionTitleElement = document.querySelector(
        extensionSettings.fictionTitle,
    )

    if (!fictionTitleElement || fictionTitleElement.textContent === null) {
        return "Error loading fiction title"
    } else {
        return fictionTitleElement.textContent.trim()
    }
}
