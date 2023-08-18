/** @typedef {import("@royalrecap/types").DisplayMessageType} DisplayMessageType */
import DEFAULTS from "../scripts/defaults.js"

/**
 * Loads saved options and populates input fields.
 */
async function loadOptions() {
    const options = await browser.storage.sync.get(DEFAULTS)

    for (const key in DEFAULTS) {
        if (DEFAULTS.hasOwnProperty(key)) {
            const defaultValue = DEFAULTS[key]
            const element = document.getElementById(key)

            if (element instanceof HTMLInputElement) {
                if (element.type === "number") {
                    setInputValue(
                        key,
                        options[key] !== undefined
                            ? options[key]
                            : defaultValue,
                    )
                } else if (element.type === "checkbox") {
                    element.checked =
                        options[key] !== undefined ? options[key] : defaultValue
                } else {
                    setInputValue(
                        key,
                        options[key] !== undefined
                            ? options[key]
                            : defaultValue,
                    )
                }
            } else {
                setInputValue(
                    key,
                    options[key] !== undefined ? options[key] : defaultValue,
                )
            }
        }
    }

    console.log(options)
}

/**
 * Saves the options entered by the user.
 * @param { Event } event - The submit event.
 */
async function saveOptions(event) {
    event.preventDefault()

    /** @type {{ [key: string]: string | number | boolean }} */
    const options = {}
    for (const key in DEFAULTS) {
        const element = document.getElementById(key)
        if (element) {
            if (element instanceof HTMLInputElement) {
                if (element.type === "number") {
                    options[key] = parseFloat(element.value) || DEFAULTS[key]
                } else if (element.type === "checkbox") {
                    options[key] = element.checked
                } else {
                    options[key] = element.value
                }
            } else {
                options[key] = DEFAULTS[key]
            }
        }
    }

    console.log(options)
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
    if (inputElement && inputElement instanceof HTMLInputElement) {
        inputElement.value = value
    }
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
