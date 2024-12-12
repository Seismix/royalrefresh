import {
    DisplayMessageType,
    ExtensionSettings,
    ExtensionSettingsPossibleTypes,
} from "@royalrefresh/types"
import DEFAULTS from "../helpers/defaults"
import StorageService from "../helpers/storageService"

/**
 * Load the extension options from the `browser.storage` and set them to the form elements in options.html
 */
async function loadOptions() {
    const options = await StorageService.getSettings()

    for (const key of Object.keys(DEFAULTS)) {
        const inputElement = document.getElementById(key)

        if (inputElement instanceof HTMLInputElement) {
            if (inputElement.type === "checkbox") {
                inputElement.checked = options[
                    key as keyof ExtensionSettings
                ] as boolean
            } else {
                inputElement.value = options[
                    key as keyof ExtensionSettings
                ] as string
            }
        }
    }
}

/**
 * Saves the options entered into the form in options.html
 */
async function saveOptions(event: Event) {
    event.preventDefault()

    const options: { [key: string]: ExtensionSettingsPossibleTypes } = {}

    for (const key of Object.keys(DEFAULTS) as Array<keyof ExtensionSettings>) {
        const inputElement = document.getElementById(key)
        options[key] = getInputValue(inputElement, DEFAULTS[key])
    }

    await StorageService.setSettings(options)
    displayMessage("success")
}

/**
 * Get the value from an input element based on its type.
 */
function getInputValue(
    inputElement: HTMLElement | null,
    defaultValue: ExtensionSettingsPossibleTypes,
) {
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
    await StorageService.restoreDefaults()
    await loadOptions()
    displayMessage("restore")
}

/**
 * Display a status message on a button and animates it
 */
function displayMessage(messageType: DisplayMessageType) {
    const buttonConfig = {
        success: {
            querySelector: "button[type='submit']",
            buttonText: "Saved ✔",
        },
        restore: {
            querySelector: "#restoreDefaults",
            buttonText: "Restored Defaults ✔",
        },
    }

    const config = buttonConfig[messageType]

    const buttonElement = document.querySelector(config.querySelector)
    if (buttonElement instanceof HTMLButtonElement) {
        animateButton(buttonElement, config.buttonText)
    }
}

/**
 * Animate the button text and class
 */
function animateButton(button: HTMLButtonElement, newText: string) {
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
