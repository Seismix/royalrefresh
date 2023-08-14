/**
 * @typedef {Object} extensionSettings
 * @property {string} prevChapterBtn - The selector for the previous chapter button.
 * @property {string} chapterContent - The selector for the chapter content.
 * @property {string} chapterTitle - The selector for the chapter title.
 * @property {string} fictionTitle - The selector for the fiction title.
 * @property {number} wordCount - The selector for the fiction title.
 */

/**
 * The object containing all extension settings need for this content-script
 * ! This needs to be edited if the options change to get full intellisense
 * @type {extensionSettings}
 */
let extensionSettings = {}

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
 * @returns {Promise<import("./defaults").DefaultValues>}
 */
async function importDefaultValues() {
    const src = browser.runtime.getURL("defaults.js")
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
        extensionSettings = Object.assign({}, defaultValues)
    } else {
        extensionSettings = Object.assign({}, extensionSettings, storageItems)
    }
}

/**
 * Adds the recap button to the DOM if it doesn't already exist
 */
function addRecapButtonToDOM(button) {
    if (!document.getElementById("recapButton")) {
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
    const toggleSpan = document.getElementById("toggleSpan")
    toggleSpan.textContent =
        document.getElementById("recapContainer").style.display === "none"
            ? "Hide "
            : "Show "
}

/**
 * Toggles the display property of the recap container between `none` and `block`
 */
function toggleRecapContainer() {
    const recapContainer = document.getElementById("recapContainer")
    recapContainer.style.display =
        recapContainer.style.display === "none" ? "block" : "none"
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
    button.id = "recapButton"
    button.textContent = "Recap"
    button.classList.add("btn", "btn-primary", "btn-circle")

    if (options.disabled === true) {
        button.disabled = true
    }

    const toggleSpan = document.createElement("span")
    toggleSpan.id = "toggleSpan"
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
    if (document.getElementById("recapContainer")) {
        return
    }
    const recapContainer = document.createElement("div")
    recapContainer.classList.add("chapter-inner", "chapter-content")
    recapContainer.id = "recapContainer"
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
    const recapContainer = document.getElementById("recapContainer")
    const prevChapterURL = document.querySelector(
        extensionSettings.prevChapterBtn,
    ).href

    if (!recapContainer || !prevChapterURL) {
        return console.error("Could not find necessary DOM Elements")
    }

    const prevChapterHTML = await fetchChapter(prevChapterURL)

    if (!prevChapterHTML) {
        return console.error("Error fetching previous chapter")
    }

    // Create a document fragment
    const fragment = document.createDocumentFragment()

    const parser = new DOMParser()

    // Object containing the extracted information
    const recapContainerStrings = {
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

    // Add the line separator between the recap and the new chapter
    fragment.append(document.createElement("hr"))

    recapContainer.appendChild(fragment)

    recapContainer.scrollIntoView({ behavior: "smooth" })
}

/**
 *
 * @param {HTMLElement} parent The parent element to append to
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
 * @param {DOMParser}
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
    if (!contentElement) {
        return null
    }
    // Get only the last x words, where x is wordcount
    const extracted = contentElement.textContent
        .trim()
        .split(/\s+/)
        .slice(-wordcount)
        .join(" ")
    return extracted
}
