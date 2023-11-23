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
    if (isChapterURL()) {
        await loadExtensionSettings()

        const recapButton = createRecapButton({
            disabled: !hasPreviousChapterURL(),
        })

        addRecapButtonToDOM(recapButton)

        if (extensionSettings.autoExpand) {
            addRecapContainerToDOM()
            toggleRecap()
        }

        await debug()
    }
}

// ! DEBUG
async function debug() {
    const prevChapterBtn = document.querySelector(
        extensionSettings.prevChapterBtn.toString(),
    )

    if (!(prevChapterBtn instanceof HTMLAnchorElement)) {
        return console.error("Could not find necessary DOM Elements")
    }

    const prevChapterURL = prevChapterBtn.href

    const prevChapterHtml = await fetchChapter(prevChapterURL)

    if (!prevChapterHtml) {
        return console.error("Error fetching previous chapter")
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(prevChapterHtml, "text/html")

    const test = {
        fiction: extractFictionTitle(),
        chapter: extractChapterName(doc),
        content: extractChapterContent(doc),
    }

    console.log(test)
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
    const defaultValues = await importDefaultValues()
    const storageItems = await browser.storage.sync.get(defaultValues)
    if (Object.keys(storageItems).length === 0) {
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
        const navButtons = document.querySelector(
            extensionSettings.buttonPlacement,
        )

        if (navButtons) {
            navButtons.prepend(button)
        }
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
        extensionSettings.prevChapterBtn.toString(),
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
        toggleRecap()
    })

    return button
}

/**
 * Creates and adds the recap container div to the DOM, if it doesn't already exist
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
        extensionSettings.prevChapterBtn.toString(),
    )

    if (!recapContainer || !(prevChapterBtn instanceof HTMLAnchorElement)) {
        return console.error("Could not find necessary DOM Elements")
    }

    const prevChapterURL = prevChapterBtn.href

    const prevChapterHtml = await fetchChapter(prevChapterURL)

    // TODO: MAybe set the recap container error message here?
    if (!prevChapterHtml) {
        return console.error("Error fetching previous chapter")
    }

    // const recapContainerStrings = extractRecapContainerStrings(prevChapterHtml)
    // const fragment = document.createDocumentFragment()
    // fragment.append(document.createElement("hr"))

    // appendRecapElements(fragment, recapContainerStrings)

    const recapFragment = createRecapFragment(prevChapterHtml)

    recapContainer.appendChild(recapFragment)

    if (extensionSettings.smoothScroll) {
        recapContainer.scrollIntoView({ behavior: "smooth" })
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
    fragment.append(document.createElement("hr"))
    fragment.append(recapHeadingElement)
    fragment.append(recapChapterNameElement)
    fragment.append(recapWordsDisplayElement)
    fragment.append(recapContentElement)
    fragment.append(document.createElement("hr"))

    return fragment
}

// /**
//  * Extracts recap container strings from the provided HTML content.
//  *
//  * @param {string} prevChapterHtml - The HTML content as text of the previous chapter.
//  * @returns {RecapContainerStrings} An object containing recap container strings.
//  */
// function extractRecapContainerStrings(prevChapterHtml) {
//     const parser = new DOMParser()

//     const fictionTitleElement = document.querySelector(
//         extensionSettings.fictionTitle,
//     )

//     let fictionTitle = "No title found"

//     if (
//         fictionTitleElement &&
//         fictionTitleElement instanceof HTMLHeadingElement &&
//         fictionTitleElement.textContent !== null
//     ) {
//         fictionTitle = fictionTitleElement.textContent.trim()
//     }

//     return {
//         fictionTitle: fictionTitle,
//         lastChapterName: extractContent(
//             parser,
//             prevChapterHtml,
//             extensionSettings.chapterTitle,
//         ),
//         lastChapterContent: extractContent(
//             parser,
//             prevChapterHtml,
//             extensionSettings.chapterContent,
//         ),
//     }
// }

// /**
//  * Appends recap elements to a fragment.
//  *
//  * @param {DocumentFragment} fragment - The fragment to append elements to.
//  * @param {RecapContainerStrings} recapContainerStrings - An object containing recap container strings.
//  */
// function appendRecapElements(fragment, recapContainerStrings) {
//     const recapHeading = `RoyalRecap of ${recapContainerStrings.fictionTitle}`
//     const recapChapter = `Previous chapter: ${recapContainerStrings.lastChapterName}`
//     const recapWordsDisplay = `Showing last ${extensionSettings.wordCount} words:`
//     const recapContent = `${recapContainerStrings.lastChapterContent}`

//     appendTextElement(fragment, recapHeading, "h1")
//     appendTextElement(fragment, recapChapter, "h2")
//     appendTextElement(fragment, recapWordsDisplay, "h4")
//     appendTextElement(fragment, recapContent, "div")
// }

// /**
//  *
//  * @param {Node} parent The parent node to append to
//  * @param {string} text The text the element contains
//  * @param {string} elementType The HTML element you want to create
//  */
// function appendTextElement(parent, text, elementType) {
//     const element = document.createElement(elementType)
//     element.textContent = text
//     parent.appendChild(element)
// }

/**
 * Fetches the previous chapter and converts the response to text.
 * @param {string | URL | Request} url
 */
async function fetchChapter(url) {
    try {
        const response = await fetch(url)

        // TODO: Solve this by displaying the error message in the recapContainer
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

// /**
//  * Parses HTML text and extracts data based on the given selector.
//  * Takes the value from the extension settings {@link loadExtensionSettings()}
//  * but defaults to the value of RECAP_WORD_COUNT.
//  * @param {DOMParser} parser
//  * @param {string} html
//  * @param {string} selector
//  * @param {number} wordcount default `RECAP_WORD_COUNT`
//  */
// function extractContent(
//     parser,
//     html,
//     selector,
//     wordcount = extensionSettings.wordCount,
// ) {
//     const doc = parser.parseFromString(html, "text/html")
//     const contentElement = doc.querySelector(selector)

//     if (!contentElement || contentElement.textContent === null) {
//         return "Error loading recap"
//     }

//     // Get only the last x words, where x is wordcount
//     const extracted = contentElement.textContent
//         .trim()
//         .split(/\s+/)
//         .slice(-wordcount)
//         .join(" ")
//     return extracted
// }

/**
 * Extracts the chapter content from the PREVIOUS chapter
 * @param {Document} doc A parsable document
 * @param {number} [wordCount=extensionSettings.wordCount]
 */
function extractChapterContent(doc, wordCount = extensionSettings.wordCount) {
    const chapterElement = doc.querySelector(extensionSettings.chapterContent)

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

        if (!words) {
            break
        }

        const wordsPerParagraph = words.length

        if (wordsPerParagraph > 0) {
            const remainingWords = wordCount - wordsPerParagraph

            wordCount -= wordsPerParagraph

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
 * Extracts the chapter title from the PREVIOUS chapter
 * @param {Document} doc A parsable document
 */
function extractChapterName(doc) {
    const chapterTitleElement = doc.querySelector(
        extensionSettings.chapterTitle,
    )

    if (!chapterTitleElement || chapterTitleElement.textContent === null) {
        return "Error loading chapter title"
    } else {
        return chapterTitleElement.textContent.trim()
    }

    // const chapterTitleHeading = document.createElement("h2")

    // if (!chapterTitleElement || chapterTitleElement.textContent === null) {
    //     chapterTitleHeading.textContent = "Error loading chapter title"
    //     return chapterTitleHeading
    // }

    // chapterTitleHeading.textContent = chapterTitleElement.textContent.trim()

    // return chapterTitleHeading
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

    // const fictionHeading = document.createElement("h1")

    // if (!fictionTitleElement || fictionTitleElement.textContent === null) {
    //     fictionHeading.textContent = "Error loading fiction title"
    //     return fictionHeading
    // }

    // fictionHeading.textContent = fictionTitleElement.textContent.trim()

    // return fictionHeading
}
