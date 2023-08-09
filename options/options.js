const CONSTANTS = {
    prevChapterBtnSelector: "div.col-md-4:nth-child(1) > a:nth-child(1)",
    chapterContentSelector: ".chapter-inner",
    chapterTitleSelector: "h1.font-white",
    fictionTitleSelector: "h2.font-white",
    defaultWordCount: 250,
}

function setInputValue(elementId, value) {
    const inputElement = document.getElementById(elementId)
    if (inputElement) {
        inputElement.value = value
    }
}

function saveOptions(e) {
    e.preventDefault()

    const newWordCount = document.getElementById("wordCount").value.trim()
    const newPrevChapterBtn = document.getElementById("prevChapterBtn").value
    const newChapterContent = document.getElementById("chapterContent").value
    const newChapterTitle = document.getElementById("chapterTitle").value
    const newFictionTitle = document.getElementById("fictionTitle").value

    browser.storage.sync
        .set({
            wordCount: newWordCount,
            prevChapterBtn: newPrevChapterBtn,
            chapterContent: newChapterContent,
            chapterTitle: newChapterTitle,
            fictionTitle: newFictionTitle,
        })
        .then(() => {
            displayMessage("Options have been saved ✔", true)
        })
}

async function loadOptions() {
    const options = await browser.storage.sync.get([
        "wordCount",
        "prevChapterBtn",
        "chapterContent",
        "chapterTitle",
        "fictionTitle",
    ])

    setInputValue("wordCount", options.wordCount || CONSTANTS.defaultWordCount)
    setInputValue(
        "prevChapterBtn",
        options.prevChapterBtn || CONSTANTS.prevChapterBtnSelector,
    )
    setInputValue(
        "chapterContent",
        options.chapterContent || CONSTANTS.chapterContentSelector,
    )
    setInputValue(
        "chapterTitle",
        options.chapterTitle || CONSTANTS.chapterTitleSelector,
    )
    setInputValue(
        "fictionTitle",
        options.fictionTitle || CONSTANTS.fictionTitleSelector,
    )
}

async function restoreDefaultOptions() {
    const options = {
        wordCount: CONSTANTS.defaultWordCount,
        prevChapterBtn: CONSTANTS.prevChapterBtnSelector,
        chapterContent: CONSTANTS.chapterContentSelector,
        chapterTitle: CONSTANTS.chapterTitleSelector,
        fictionTitle: CONSTANTS.fictionTitleSelector,
    }

    await browser.storage.sync.set(options)
    await loadOptions() // Update input values with defaults
    displayMessage("Default settings have been applied ✔", true)
}

/**
 * @param {string} message The message to pass
 * @param {boolean} isSuccess Sets the colour of the message (`true` = green, `false` = red)
 */
function displayMessage(message, isSuccess) {
    let status = document.getElementById("status")
    status.textContent = message

    status.style.color = isSuccess ? "#4bb543" : "crimson"

    status.style.display = "block"
    setTimeout(() => {
        status.style.display = "none"
    }, 2000) // Hide the status message after 3 seconds
}

// TODO: Remove this and all mentions before deployment
function debugHelper(content) {
    let debugSpan = document.getElementById("debug")
    debugSpan.textContent = content
}

document.addEventListener("DOMContentLoaded", loadOptions)
document.querySelector("form").addEventListener("submit", saveOptions)
document
    .getElementById("defaults")
    .addEventListener("click", restoreDefaultOptions)
