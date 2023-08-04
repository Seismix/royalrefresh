document.body.style.border = "10px solid red"; // TODO: remove, Debug only

const SELECTORS = {
    PREV_CHAPTER_BTN: "div.col-md-4:nth-child(1) > a:nth-child(1)",
    CHAPTER_CONTENT: "div.chapter-inner:nth-child(3)",
    CHAPTER_TITLE: "h1.font-white",
    FICTION_TITLE: "h2.font-white"
};
let RECAP_WORD_COUNT = 250
let RECAP_TOGGLE = false

init();

function init() {
    if (!document.getElementById("recapButton")) {
        addRecapButton();
    }
}

/**
 * Adds the recap button to the DOM on initial page render and adds various click event listeners
 */
function addRecapButton() {
    const button = createRecapButton()

    button.addEventListener("click", function () {
        toggleSpan.textContent = RECAP_TOGGLE ? "Show " : "Hide ";
        RECAP_TOGGLE = !RECAP_TOGGLE;
        toggleRecapContainer(!RECAP_TOGGLE)
    });

    button.addEventListener("click", addRecapContainer, { once: true })

    const navButtons = document.querySelector(".actions");
    if (navButtons) {
        navButtons.prepend(button);
    }
}

function createRecapButton() {
    const button = document.createElement("button");
    button.id = "recapButton";
    button.textContent = "Recap";
    button.classList.add("btn", "btn-primary", "btn-circle");

    const toggleSpan = document.createElement("span")
    toggleSpan.id = "toggleSpan"
    toggleSpan.textContent = "Show "

    button.prepend(toggleSpan)

    const bookIcon = document.createElement("i");
    bookIcon.classList.add("fa", "fa-book");

    button.prepend(bookIcon);
    bookIcon.append("\u00A0")

    return button
}


/**
 * Adds the recap container div to the DOM, if it doesn't already exist
 */
function addRecapContainer() {
    if (document.getElementById("recapContainer")) {
        return
    }
    const recapContainer = document.createElement("div")
    recapContainer.classList.add("chapter-inner", "chapter-content")
    recapContainer.id = "recapContainer"

    const chapterDiv = document.querySelector(SELECTORS.CHAPTER_CONTENT)

    if (chapterDiv) {
        chapterDiv.prepend(recapContainer)
    }

    setRecapText()
}

/**
 * Toggles the display property of the recap container between `none` and `block`
 * @param {boolean} RECAP_TOGGLE 
 */
function toggleRecapContainer(RECAP_TOGGLE) {
    const recapContainer = document.getElementById("recapContainer");
    recapContainer.style.display = RECAP_TOGGLE ? "none" : "block";
}

/**
 * Fetches necessary data from the previous chapter by calling {@link fetchChapter()} and {@link extractContent()} to set the recap text 
 * inside the recap container
 */
async function setRecapText() {
    const recapContainer = document.getElementById("recapContainer")
    const prevChapterURL = document.querySelector(SELECTORS.PREV_CHAPTER_BTN).href

    if (!recapContainer || !prevChapterURL) {
        return console.error("Could not find necessary DOM Elements")
    }

    const prevChapterHTML = await fetchChapter(prevChapterURL)

    if (!prevChapterHTML) {
        return console.error("Error fetching previous chapter")
    }

    // Create a document fragment
    const fragment = document.createDocumentFragment();

    // Object containing the extracted information
    const recapContainerStrings = {
        fictionTitle: extractContent(prevChapterHTML, SELECTORS.FICTION_TITLE),
        lastChapterName: extractContent(prevChapterHTML, SELECTORS.CHAPTER_TITLE),
        lastChapterContent: extractContent(prevChapterHTML, SELECTORS.CHAPTER_CONTENT)
    }

    appendTextElement(fragment, recapContainerStrings.fictionTitle, "h1");
    appendTextElement(fragment, recapContainerStrings.lastChapterName, "h2");
    appendTextElement(fragment, `Showing last ${RECAP_WORD_COUNT} words:`, "h4");
    appendTextElement(fragment, "..." + recapContainerStrings.lastChapterContent, "div");

    // Add the line separator between the recap and the new chapter
    fragment.append(document.createElement("hr"))

    // Append the fragment to the recapContainer
    recapContainer.appendChild(fragment);

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
    const element = document.createElement(elementType);
    element.textContent = text;
    parent.appendChild(element);
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

        return text;
    } catch (error) {
        console.error('Error fetching the chapter:', error);

        return null;
    }
}

const parser = new DOMParser();

/**
 * Parses HTML text and extracts data based on the given selector. Defaults to the value of RECAP_WORD_COUNT, but can be overwritten.
 * @param {string} html
 * @param {string} selector
 * @param {number} wordcount default `RECAP_WORD_COUNT`
 */
function extractContent(html, selector, wordcount = RECAP_WORD_COUNT) {
    const doc = parser.parseFromString(html, 'text/html');
    const contentElement = doc.querySelector(selector);
    if (!contentElement) {
        return null;
    }
    // Get only the last x words, where x is wordcount
    const extracted = contentElement.textContent.trim().split(/\s+/).slice(-wordcount).join(' ');
    return extracted;
}
