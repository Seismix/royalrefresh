/** @import { ExtensionSettings } from "@royalrecap/types" */
/** @import { RecapContainerStrings } from "@royalrecap/types" */

/**
 * The object that gets populated with all values loaded from `browser.storage`
 * @type {ExtensionSettings}
 */
// @ts-ignore
let extensionSettings = {}

// Constants
const RECAP_BUTTON_ID = "recapButton"
const RECAP_CONTAINER_ID = "recapContainer"
const TOGGLE_SPAN_ID = "toggleSpan"
const BLURB_BUTTON_ID = "blurbButton"
const DEFAULTS_FILE = "scripts/defaults.js"

init()

/** Initializes all necessary data and injects all extension code into the DOM, if some checks are passed */
async function init() {
    if (!documentIsChapterURL()) return

    await loadExtensionSettings()
    addSettingsChangeListener()

    const toggleButton = documentHasPreviousChapterURL()
        ? createRecapButton()
        : createBlurbButton()

    addToggleButtonToDOM(toggleButton)

    const recapContainer = createRecapContainer()
    addRecapContainerToDOM(recapContainer)

    if (extensionSettings.autoExpand) {
        toggleButton.click()
    }
}

async function loadExtensionSettings() {
    // Request default settings from the background script
    const defaultValues = await browser.runtime.sendMessage({
        request: "getDefaultSettings",
    })

    // Load settings, automatically falling back to default values if not set
    const settings = await browser.storage.sync.get(defaultValues)

    // Assign the retrieved settings to extensionSettings
    extensionSettings = { ...defaultValues, ...settings }
}

function addSettingsChangeListener() {
    browser.storage.onChanged.addListener(async (changes, area) => {
        if (area === "sync" && changes) {
            for (const key in changes) {
                if (changes.hasOwnProperty(key)) {
                    extensionSettings[key] = changes[key].newValue
                }
            }
            await appendFetchedRecap() // Refetch and reparse
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

/**
 * @param {HTMLElement} recapContainer
 */
async function fetchAndDisplay(recapContainer) {
    if (recapContainerHasContent(recapContainer)) return

    if (documentHasPreviousChapterURL()) {
        await appendFetchedRecap()
    } else {
        await appendFetchedBlurb()
    }
}

/**
 * @param {HTMLElement} recapContainer
 * @returns {boolean} True if the recap container has content, otherwise false.
 */
function recapContainerHasContent(recapContainer) {
    return recapContainer.textContent?.trim() !== ""
}

/**
 * @returns {boolean} True if `chapter` is in the URL path, otherwise false.
 */
function documentIsChapterURL() {
    return window.location.pathname.split("/").includes("chapter")
}

/**
 * @returns {boolean} True if the previous chapter button has a valid `href` attribute, otherwise false.
 */
function documentHasPreviousChapterURL() {
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

/**
 * @param {HTMLButtonElement} button - Button element to add
 */
function addToggleButtonToDOM(button) {
    if (!document.getElementById(button.id)) {
        const navButtons = document.querySelector(
            extensionSettings.buttonPlacement,
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

/**
 * @param {HTMLDivElement} recap
 */
function addRecapContainerToDOM(recap) {
    if (!document.getElementById(RECAP_CONTAINER_ID)) {
        const chapterDiv = document.querySelector(
            extensionSettings.chapterContent,
        )

        if (chapterDiv) {
            chapterDiv.prepend(recap)
        }
    }
}

/**
 * @param {string} prevChapterHtml
 */
function createRecapFragment(prevChapterHtml) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(prevChapterHtml, "text/html")

    // Fiction title
    const recapHeading = extractFictionTitle()
    const recapHeadingElement = document.createElement("h1")
    recapHeadingElement.textContent = `RoyalRecap of ${recapHeading}`

    // Previous chapter name
    const recapChapterName = extractChapterName(doc)
    const recapChapterNameElement = document.createElement("h2")
    recapChapterNameElement.textContent = `Previous chapter: ${recapChapterName}`

    // Wordcount display
    const recapWordsAmount = extensionSettings.wordCount
    const recapWordsDisplayElement = document.createElement("h4")
    recapWordsDisplayElement.textContent = `Showing last ${recapWordsAmount} words:`

    // Recap content
    const recapContentElement = extractChapterContent(doc)

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
        recapContainer.innerHTML = ""
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

/**
 * @param {string} overviewHtml
 */
function createBlurbFragment(overviewHtml) {
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

/**
 * @param {string | URL | Request} url
 */
async function fetchHtmlText(url) {
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

/**
 * @param {Document} overviewDoc
 */
function extractBlurb(overviewDoc) {
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
 * @param {Document} prevChapterDoc A parsable document of the previous chapter
 * @param {number} [wordCount=extensionSettings.wordCount]
 */
function extractChapterContent(
    prevChapterDoc,
    wordCount = extensionSettings.wordCount,
) {
    const chapterElement = prevChapterDoc.querySelector(
        extensionSettings.chapterContent,
    )

    const contentDiv = document.createElement("div")

    if (!chapterElement || chapterElement.textContent === null) {
        contentDiv.textContent = "Error loading recap"
        return contentDiv
    }

    const paragraphs = chapterElement.querySelectorAll("p")
    const selectedParagraphs = []

    for (let i = paragraphs.length - 1; i >= 0; i--) {
        const paragraph = paragraphs[i]
        const words = paragraph.textContent?.trim().split(/\s+/)

        if (words && words.length > 0) {
            const remainingWords = wordCount - words.length

            wordCount -= words.length

            if (remainingWords > 0) {
                selectedParagraphs.push(paragraph)
            } else {
                const pSlice = words.slice(-remainingWords)

                paragraph.textContent = "..." + pSlice.join(" ")

                selectedParagraphs.push(paragraph)
                break
            }
        }
    }

    contentDiv.append(...selectedParagraphs.reverse())

    return contentDiv
}

/**
 * @param {Document} prevChapterDoc A parsable document of the previous chapter
 */
function extractChapterName(prevChapterDoc) {
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
