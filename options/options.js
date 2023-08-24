/** @typedef {import("@royalrecap/types").DisplayMessageType} DisplayMessageType */
/** @typedef {import("@royalrecap/types").ExtensionSettingsPossibleTypes} ExtensionSettingsPossibleTypes */
import DEFAULTS from "../scripts/defaults.js"

/**
 * Load the extension options from the `browser.storage` and set them to the form elements in options.html
 */
async function loadOptions() {
    const options = await browser.storage.sync.get(DEFAULTS)

    for (const key of Object.keys(DEFAULTS)) {
        const inputElement = document.getElementById(key)

        if (inputElement instanceof HTMLInputElement) {
            if (inputElement.type === "checkbox") {
                inputElement.checked = options[key]
            } else {
                inputElement.value = options[key]
            }
        }
    }
}

/**
 * Saves the options entered into the form in options.html
 * @param { Event } event - The submit event.
 */
async function saveOptions(event) {
    event.preventDefault()

    /** @type {{ [key: string]: string | number | boolean }} */
    const options = {}

    for (const key of Object.keys(DEFAULTS)) {
        const inputElement = document.getElementById(key)
        options[key] = getInputValue(inputElement, DEFAULTS[key])
    }

    await browser.storage.sync.set(options)
    displayMessage("success")
}

/**
 * Get the value from an input element based on its type.
 * @param { HTMLElement | null } inputElement - The input element.
 * @param {ExtensionSettingsPossibleTypes} defaultValue - The default value to use if the input is not found.
 * @returns {ExtensionSettingsPossibleTypes} - The value of the input or the default value.
 */
function getInputValue(inputElement, defaultValue) {
    if (!inputElement || !(inputElement instanceof HTMLInputElement)) {
        return defaultValue
    }

    switch (inputElement.type) {
        case "checkbox":
            return inputElement.checked
        case "number":
            const value = parseInt(inputElement.value, 10)
            return isNaN(value) ? defaultValue : value
        default:
            return inputElement.value
    }
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
 * Display a status message on a button and animates it
 * @param {DisplayMessageType} messageType
 */
function displayMessage(messageType) {
    const buttonConfig = {
        success: {
            querySelector: "button[type='submit']",
            buttonText: "Saved ✔",
        },
        restore: {
            querySelector: "#defaults",
            buttonText: "Restored Defaults ✔",
        },
    }

    const config = buttonConfig[messageType]

    if (config) {
        const buttonElement = document.querySelector(config.querySelector)
        if (buttonElement instanceof HTMLButtonElement) {
            animateButton(buttonElement, config.buttonText)
        }
    }
}

/**
 * Animate the button text and class
 * @param {HTMLButtonElement} button The button element to animate
 * @param {string} newText The new text to display temporarily
 */
function animateButton(button, newText) {
    const savedClassName = "saved"

    const originalText = button.textContent

    button.classList.add(savedClassName)
    button.textContent = newText

    setTimeout(() => {
        button.textContent = originalText
        button.classList.remove(savedClassName)
    }, 2000)
}

document.addEventListener("DOMContentLoaded", function () {
    const formElement = document.querySelector("form")
    if (formElement) {
        formElement.addEventListener("submit", saveOptions)
    }

    /** The CSS ID of the button to restore defaults */
    const DEFAULT_BUTTON_ID = "restoreDefaults"

    const defaultsElement = document.getElementById(DEFAULT_BUTTON_ID)
    if (defaultsElement) {
        defaultsElement.addEventListener("click", restoreDefaultOptions)
    }

    loadOptions()
})
