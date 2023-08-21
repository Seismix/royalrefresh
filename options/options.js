/** @typedef {import("@royalrecap/types").DisplayMessageType} DisplayMessageType */
import DEFAULTS from "../scripts/defaults.js"

/**
 * Loads saved options and populates input fields.
 */
async function loadOptions() {
    const options = await browser.storage.sync.get(DEFAULTS)

    // Loop through the default options and set values in form elements
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
 * Saves the options entered by the user.
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
 * @param {*} defaultValue - The default value to use if the input is not found.
 * @returns {*} - The value of the input or the default value.
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
 * Display a status message with customizable color
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
    const originalText = button.textContent
    button.classList.add("saved")
    button.textContent = newText

    setTimeout(() => {
        button.textContent = originalText
        button.classList.remove("saved")
    }, 2000)
}

document.addEventListener("DOMContentLoaded", function () {
    const formElement = document.querySelector("form")
    if (formElement) {
        formElement.addEventListener("submit", saveOptions)
    }

    const defaultsElement = document.getElementById("defaults")
    if (defaultsElement) {
        defaultsElement.addEventListener("click", restoreDefaultOptions)
    }

    loadOptions()
})
