document.body.style.border = "10px solid red"; // TODO: remove, Debug only

const SELECTOR_PREV_CHAPTER_BTN = "div.col-md-4:nth-child(1) > a:nth-child(1)"
const SELECTOR_CHAPTER_CONTENT = "div.chapter-inner:nth-child(3)"
const SELECTOR_CHAPTER_TITLE = "h1.font-white"
const SELECTOR_FICTION_TITLE = "h2.font-white"
let RECAP_WORD_COUNT = 250
let RECAP_TOGGLE = false


if (!document.getElementById("recapButton")) {
    addRecapButton()
}

/**
 * Adds the recap button to the DOM on initial page render and adds various click event listeners
 */
function addRecapButton() {
    const button = document.createElement("button");
    button.id = "recapButton";
    button.textContent = "Recap";
    button.classList.add("btn", "btn-primary", "btn-circle");

    const toggleSpan = document.createElement("span")
    toggleSpan.id = "toggleSpan"
    toggleSpan.innerHTML = "Show "

    button.prepend(toggleSpan)

    const icon = document.createElement("i");
    icon.classList.add("fa", "fa-book");

    button.prepend(icon);
    icon.append("\u00A0")

    button.addEventListener("click", function () {
        toggleSpan.innerHTML = RECAP_TOGGLE ? "Show " : "Hide ";
        RECAP_TOGGLE = !RECAP_TOGGLE;
    });

    button.addEventListener("click", addRecapContainer)

    button.addEventListener("click", function () {
        toggleRecapContainer(!RECAP_TOGGLE)
    });

    const navButtons = document.querySelector(".actions");
    if (navButtons) {
        navButtons.prepend(button);
    }

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

    const chapterDiv = document.querySelector(SELECTOR_CHAPTER_CONTENT)

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
    const prevChapterURL = document.querySelector(SELECTOR_PREV_CHAPTER_BTN).href

    if (!recapContainer || !prevChapterURL) {
        return console.error("Could not find necessary DOM Elements")
    }

    const prevChapterHTML = await fetchChapter(prevChapterURL)

    if (!prevChapterHTML) {
        return console.error("Error fetching previous chapter")
    }

    // Extract and add the fiction title to the recap container
    const fictionTitle = extractContent(prevChapterHTML, SELECTOR_FICTION_TITLE)
    const recapFictionTitle = document.createElement("h1")
    recapFictionTitle.innerHTML = `Previously in ${fictionTitle.italics()}...`
    recapContainer.appendChild(recapFictionTitle)

    // Extract and add the previous chapter title to the recap container
    const recapTitle = extractContent(prevChapterHTML, SELECTOR_CHAPTER_TITLE)
    const recapIntro = document.createElement("h2")
    recapIntro.innerHTML = `Last chapter name: ${recapTitle.italics()}`
    recapContainer.appendChild(recapIntro)

    const recapBlurb = document.createElement("h4")
    recapBlurb.innerHTML = `Showing last ${RECAP_WORD_COUNT} words:`
    recapContainer.appendChild(recapBlurb)

    // Extract and add the content to the recap container
    const recapText = extractContent(prevChapterHTML, SELECTOR_CHAPTER_CONTENT)
    const recapContent = document.createElement("div")
    recapContent.innerHTML = "..." + recapText
    recapContainer.appendChild(recapContent)

    // Add the line separator between the recap and the new chapter
    recapContainer.append(document.createElement("hr"))

    recapContainer.scrollIntoView({ behavior: "smooth" })
}

/**
 * Fetches the previous chapter and converts the response to text.
 * @param {string | URL | Request} url 
 */
async function fetchChapter(url) {
    try {
        const response = await fetch(url)
        const text = response.text()
        return text;
    } catch (error) {
        console.error('Error fetching the chapter:', error);
        return null;
    }
}

/**
 * Parses HTML text and extracts data based on the given selector. Defaults to the value of RECAP_WORD_COUNT, but can be overwritten.
 * @param {string} html
 * @param {string} selector
 * @param {number} wordcount default `RECAP_WORD_COUNT`
 */
function extractContent(html, selector, wordcount = RECAP_WORD_COUNT) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const contentElement = doc.querySelector(selector);
    // Get only the last x words, where x is wordcount
    const extracted = contentElement ? contentElement.textContent.trim().split(/\s+/).slice(-wordcount).join(' ') : null;

    return extracted;
}
