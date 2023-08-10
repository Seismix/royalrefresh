/**
 * @constant
 */
const DEFAULTS = {
    wordCount: 250,
    prevChapterBtn: "div.col-md-4:nth-child(1) > a:nth-child(1)",
    chapterContent: ".chapter-inner",
    chapterTitle: "h1.font-white",
    fictionTitle: "h2.font-white",
}

/**
 * Loads saved options and populates input fields.
 */
async function loadOptions() {
    const options = await browser.storage.sync.get(Object.keys(DEFAULTS))

    for (const key in DEFAULTS) {
        setInputValue(key, options[key] || DEFAULTS[key])
    }
}

/**
 * Saves the options entered by the user.
 * @param { Event } event - The submit event.
 */
async function saveOptions(event) {
    event.preventDefault()

    const options = {}
    for (const key in DEFAULTS) {
        options[key] =
            document.getElementById(key).value.trim() || DEFAULTS[key]
    }

    await browser.storage.sync.set(options)
    displayMessage("success")
}

/**
 * Restores the default options by setting the options to default values.
 */
async function restoreDefaultOptions() {
    await browser.storage.sync.set(DEFAULTS)
    await loadOptions()
    displayMessage("restore")
}

/**
 * Sets the value of an input element.
 * @param { string } elementId - The ID of the input element.
 * @param { string } value - The value to set.
 */
function setInputValue(elementId, value) {
    const inputElement = document.getElementById(elementId)
    if (inputElement) {
        inputElement.value = value
    }
}

/**
 * @typedef { "success" | "restore" } MessageType
 */

/**
 * Display a status message with customizable color
 * @param {MessageType} messageType
 */
function displayMessage(messageType) {
    switch (messageType) {
        case "success":
            const submitButton = document.querySelector("button[type='submit'")
            animateButton(submitButton, "Saved ✔")
            break
        case "restore":
            const defaultButton = document.getElementById("defaults")
            animateButton(defaultButton, "Restored Defaults ✔")
            break
        default:
            break
    }
}

/**
 * Animate the button text and class
 * @param {HTMLButtonElement} button The button element to animate
 * @param {string} newText The new text to display temporarily
 */
function animateButton(button, newText) {
    const originalText = button.textContent
    button.classList.add("saved")
    button.textContent = newText

    setTimeout(() => {
        button.textContent = originalText
        button.classList.remove("saved")
    }, 2000)
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
