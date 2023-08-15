// @ts-check
/// <reference path="./types/firefox-browser-webext.d.ts" />
/**
 * @typedef {import("./types/types").ExtensionSettings} ExtensionSettings
 * @typedef {import("./types/types").RecapContainerStrings} RecapContainerStrings
 */

/**
 * The object containing all extension settings need for this content-script
 * ! This needs to be edited if the options change to get full intellisense
 * @type {ExtensionSettings}
 */
// @ts-ignore
let extensionSettings = {}

// Constants
const RECAP_BUTTON_ID = "recapButton"
const RECAP_CONTAINER_ID = "recapContainer"
const TOGGLE_SPAN_ID = "toggleSpan"
const DEFAULTS_FILE = "defaults.js"

init()

async function init() {
    if (isChapterURL()) {
        await loadExtensionSettings()

        const recapButton = createRecapButton({
            disabled: !hasPreviousChapterURL(),
        })
        addRecapButtonToDOM(recapButton)
    }
}

/**
 * Imports the default values from the "defaults.js" file.
 * @returns {Promise<ExtensionSettings>}
 */
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
    const storageItems = await browser.storage.sync.get()
    if (Object.keys(storageItems).length === 0) {
        const defaultValues = await importDefaultValues()
        extensionSettings = { ...defaultValues }
    } else {
        extensionSettings = { ...extensionSettings, ...storageItems }
    }
}

/**
 * Adds the recap button to the DOM if it doesn't already exist
 * @param {HTMLButtonElement} button
 */
function addRecapButtonToDOM(button) {
    if (!document.getElementById(RECAP_BUTTON_ID)) {
        const navButtons = document.querySelector(".actions")

        if (navButtons) {
            navButtons.prepend(button)
        }
    }
}

/**
 * Toggles the recap button text between `Show` and `Hide` based on element's display style
 */
function toggleRecapButton() {
    const toggleSpan = document.getElementById(TOGGLE_SPAN_ID)
    const recapContainer = document.getElementById(RECAP_CONTAINER_ID)
    if (toggleSpan && recapContainer) {
        toggleSpan.textContent =
            recapContainer.style.display === "none" ? "Hide " : "Show "
    }
}

/**
 * Toggles the display property of the recap container between `none` and `block`
 */
function toggleRecapContainer() {
    const recapContainer = document.getElementById(RECAP_CONTAINER_ID)
    if (recapContainer) {
        recapContainer.style.display =
            recapContainer.style.display === "none" ? "block" : "none"
    }
}

/**
 * Checks if the current URL is a chapter URL.
 * @returns {boolean} True if `chapter` is in the URL path, otherwise false.
 */
function isChapterURL() {
    return window.location.pathname.split("/").includes("chapter")
}

/**
 * Checks if the previous chapter button has a valid href attribute.
 * @returns {boolean} True if the previous chapter button has a valid href attribute, otherwise false.
 */
function hasPreviousChapterURL() {
    const hasPrevChapterURL = document.querySelector(
        extensionSettings.prevChapterBtn,
    )

    return !!hasPrevChapterURL?.hasAttribute("href")
}

/**
 * Creates the recap button with optional disabled state.
 * @param {Object} options - Options for creating the recap button.
 * @param {boolean} options.disabled - Whether the button should be disabled.
 * @returns {HTMLButtonElement} The created recap button element.
 */
function createRecapButton(options) {
    const button = document.createElement("button")
    button.id = RECAP_BUTTON_ID
    button.textContent = "Recap"
    button.classList.add("btn", "btn-primary", "btn-circle")

    if (options.disabled === true) {
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

    button.addEventListener("click", addRecapContainerToDOM, { once: true })

    button.addEventListener("click", () => {
        toggleRecapButton()
        toggleRecapContainer()
    })

    return button
}

/**
 * Adds the recap container div to the DOM, if it doesn't already exist
 */
function addRecapContainerToDOM() {
    if (document.getElementById(RECAP_CONTAINER_ID)) {
        return
    }
    const recapContainer = document.createElement("div")
    recapContainer.classList.add("chapter-inner", "chapter-content")
    recapContainer.id = RECAP_CONTAINER_ID
    recapContainer.style.display = "none"

    const chapterDiv = document.querySelector(extensionSettings.chapterContent)

    if (chapterDiv) {
        chapterDiv.prepend(recapContainer)
    }

    setRecapText()
}

/**
 * Fetches necessary data from the previous chapter by calling {@link fetchChapter()} and {@link extractContent()} to
 *  set the recap text inside the recap container
 */
async function setRecapText() {
    const recapContainer = document.getElementById(RECAP_CONTAINER_ID)
    const prevChapterBtn = document.querySelector(
        extensionSettings.prevChapterBtn,
    )

    if (!recapContainer || !(prevChapterBtn instanceof HTMLAnchorElement)) {
        return console.error("Could not find necessary DOM Elements")
    }

    const prevChapterURL = prevChapterBtn.href

    const prevChapterHTML = await fetchChapter(prevChapterURL)

    if (!prevChapterHTML) {
        return console.error("Error fetching previous chapter")
    }

    const recapContainerStrings = extractRecapContainerStrings(prevChapterHTML)

    const fragment = document.createDocumentFragment()
    appendRecapElements(fragment, recapContainerStrings)
    fragment.append(document.createElement("hr"))

    recapContainer.appendChild(fragment)
    recapContainer.scrollIntoView({ behavior: "smooth" })
}

/**
 * Extracts recap container strings from the provided HTML content.
 *
 * @param {string} prevChapterHTML - The HTML content as text of the previous chapter.
 * @returns {RecapContainerStrings} An object containing recap container strings.
 */
function extractRecapContainerStrings(prevChapterHTML) {
    const parser = new DOMParser()

    return {
        fictionTitle: extractContent(
            parser,
            prevChapterHTML,
            extensionSettings.fictionTitle,
        ),
        lastChapterName: extractContent(
            parser,
            prevChapterHTML,
            extensionSettings.chapterTitle,
        ),
        lastChapterContent: extractContent(
            parser,
            prevChapterHTML,
            extensionSettings.chapterContent,
        ),
    }
}

/**
 * Appends recap elements to a fragment.
 *
 * @param {DocumentFragment} fragment - The fragment to append elements to.
 * @param {RecapContainerStrings} recapContainerStrings - An object containing recap container strings.
 */
function appendRecapElements(fragment, recapContainerStrings) {
    appendTextElement(fragment, recapContainerStrings.fictionTitle, "h1")
    appendTextElement(fragment, recapContainerStrings.lastChapterName, "h2")
    appendTextElement(
        fragment,
        `Showing last ${extensionSettings.wordCount} words:`,
        "h4",
    )
    appendTextElement(
        fragment,
        "..." + recapContainerStrings.lastChapterContent,
        "div",
    )
}

/**
 *
 * @param {Node} parent The parent node to append to
 * @param {string} text The text the element contains
 * @param {string} elementType The HTML element you want to create
 * @example
 * appendTextElement(fragment, `Showing last ${RECAP_WORD_COUNT} words:`, "h4");
 */
function appendTextElement(parent, text, elementType) {
    const element = document.createElement(elementType)
    element.textContent = text
    parent.appendChild(element)
}

/**
 * Fetches the previous chapter and converts the response to text.
 * @param {string | URL | Request} url
 */
async function fetchChapter(url) {
    try {
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error("Error fetching the previous chapter...")
        }

        const text = await response.text()

        return text
    } catch (error) {
        console.error("Error fetching the chapter:", error)

        return null
    }
}

/**
 * Parses HTML text and extracts data based on the given selector.
 * Takes the value from the extension settings {@link loadExtensionSettings()}
 * but defaults to the value of RECAP_WORD_COUNT.
 * @param {DOMParser} parser
 * @param {string} html
 * @param {string} selector
 * @param {number} wordcount default `RECAP_WORD_COUNT`
 */
function extractContent(
    parser,
    html,
    selector,
    wordcount = extensionSettings.wordCount,
) {
    const doc = parser.parseFromString(html, "text/html")
    const contentElement = doc.querySelector(selector)

    if (!contentElement || contentElement.textContent === null) {
        return "Error loading recap"
    }

    // Get only the last x words, where x is wordcount
    const extracted = contentElement.textContent
        .trim()
        .split(/\s+/)
        .slice(-wordcount)
        .join(" ")
    return extracted
}
