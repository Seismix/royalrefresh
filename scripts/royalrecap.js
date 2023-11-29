/**
 * @typedef {import("@royalrecap/types").ExtensionSettings} ExtensionSettings
 * @typedef {import("@royalrecap/types").RecapContainerStrings} RecapContainerStrings
 */

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
const DEFAULTS_FILE = "scripts/defaults.js"

init()

/** Initializes all necessary data and injects all extension code into the DOM, if some checks are passed */
async function init() {
    if (documentIsChapterURL()) {
        await loadExtensionSettings()

        const recapButton = createRecapButton()
        addRecapButtonToDOM(recapButton)

        const recapContainer = createRecapContainer()
        addRecapContainerToDOM(recapContainer)

        if (extensionSettings.autoExpand) {
            recapButton.click()
        }
    }
}

async function importDefaultValues() {
    const src = browser.runtime.getURL(DEFAULTS_FILE)
    const { default: defaultValues } = await import(src)
    return defaultValues
}

/**
 * Loads the extension settings from the browser and fills the {@link extensionSettings} object with its values
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/sync | MDN Documentation storage.sync}
 */
async function loadExtensionSettings() {
    const defaultValues = await importDefaultValues()
    const storageItems = await browser.storage.sync.get(defaultValues)
    if (Object.keys(storageItems).length === 0) {
        extensionSettings = { ...defaultValues }
    } else {
        extensionSettings = { ...extensionSettings, ...storageItems }
    }
}

/** Toggles the visibility of the recap div and the text on the recap button */
function toggleRecap() {
    const toggleSpan = document.getElementById(TOGGLE_SPAN_ID)
    const recapContainer = document.getElementById(RECAP_CONTAINER_ID)

    if (toggleSpan && recapContainer) {
        toggleSpan.textContent =
            recapContainer.style.display === "none" ? "Hide " : "Show "

        recapContainer.style.display =
            recapContainer.style.display === "none" ? "block" : "none"
    }
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

    if (!documentHasPreviousChapterURL()) {
        button.disabled = true
    }

    const toggleSpan = document.createElement("span")
    toggleSpan.id = TOGGLE_SPAN_ID
    toggleSpan.textContent = "Show "

    button.prepend(toggleSpan)

    const bookIcon = document.createElement("i")
    bookIcon.classList.add("fa", "fa-book")

    button.prepend(bookIcon)
    bookIcon.append("\u00A0")

    button.addEventListener(
        "click",
        async () => {
            await appendFetchedRecap()
        },
        { once: true },
    )

    button.addEventListener("click", () => {
        toggleRecap()
    })

    return button
}

/**
 * @param {HTMLButtonElement} button - Button element to add
 */
function addRecapButtonToDOM(button) {
    if (!document.getElementById(RECAP_BUTTON_ID)) {
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
    recapContainer.classList.add("chapter-inner", "chapter-content")
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
        extensionSettings.prevChapterBtn.toString(),
    )

    if (!(prevChapterBtn instanceof HTMLAnchorElement)) {
        return recapContainer?.append(
            "Could not find previous chapter URL to fetch data.",
        )
    }

    const prevChapterHtml = await fetchChapterHtmlText(prevChapterBtn.href)

    if (!prevChapterHtml) {
        console.error("Error fetching chapter data.")
        return recapContainer?.append("Error fetching chapter. Refresh.")
    }

    const recapFragment = createRecapFragment(prevChapterHtml)

    recapContainer?.appendChild(recapFragment)

    if (extensionSettings.smoothScroll) {
        recapContainer?.scrollIntoView({ behavior: "smooth" })
    }
}

/**
 * @param {string | URL | Request} url
 */
async function fetchChapterHtmlText(url) {
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
