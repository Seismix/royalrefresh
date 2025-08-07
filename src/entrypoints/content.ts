import type { ExtensionSettings } from "~/types/types"
import DEFAULTS from "~/lib/defaults"
import { StorageService } from "~/lib/storage"
import {
    RECAP_CONTAINER_ID,
    TOGGLE_SPAN_ID,
    addRecapContainerToDOM,
    addSettingsButtonToDOM,
    addToggleButtonToDOM,
    appendFetchedBlurb,
    appendFetchedRecap,
    createBlurbButton,
    createRecapButton,
    createRecapContainer,
    createSettingsButton,
    documentHasPreviousChapterURL,
    documentIsChapterURL,
} from "~/lib/content-helpers"

export default defineContentScript({
    matches: ["*://*.royalroad.com/*"],
    runAt: "document_end",

    main: async () => {
        /**
         * The object that gets populated with all values loaded from `browser.storage`
         */
        let extensionSettings: ExtensionSettings = DEFAULTS

        if (!documentIsChapterURL()) return

        await loadExtensionSettings()
        addSettingsChangeListener()

        const hasPrevChapterURL = documentHasPreviousChapterURL(extensionSettings)

        const toggleButton = hasPrevChapterURL
            ? createRecapButton(toggleRecap)
            : createBlurbButton(toggleRecap)
        addToggleButtonToDOM(toggleButton, extensionSettings)

        const settingsButton = createSettingsButton(extensionSettings)
        if (hasPrevChapterURL) {
            addSettingsButtonToDOM(settingsButton, extensionSettings)
        }

        const recapContainer = createRecapContainer()
        addRecapContainerToDOM(recapContainer, extensionSettings)

        if (extensionSettings.autoExpand) {
            toggleButton.click()
        }

        async function loadExtensionSettings() {
            extensionSettings = await StorageService.getSettings();
        }

        function addSettingsChangeListener() {
            storage.watch<ExtensionSettings>("sync:settings", (newSettings) => {
                extensionSettings = newSettings ? { ...DEFAULTS, ...newSettings } : DEFAULTS;
                appendFetchedRecap(extensionSettings); // Refetch and reparse
            });
        }

        /** Toggles the visibility of the recap div and the text on the recap button */
        async function toggleRecap() {
            const toggleSpan = document.getElementById(TOGGLE_SPAN_ID)
            const recapContainer = document.getElementById(RECAP_CONTAINER_ID)

            if (!toggleSpan || !recapContainer) return

            toggleSpan.textContent =
                recapContainer.style.display === "none" ? "Hide " : "Show "

            await fetchAndDisplay(recapContainer)

            recapContainer.style.display =
                recapContainer.style.display === "none" ? "block" : "none"

            if (extensionSettings.smoothScroll) {
                recapContainer.scrollIntoView({ behavior: "smooth" })
            }
        }

        async function fetchAndDisplay(recapContainer: HTMLElement) {
            if (recapContainerHasContent(recapContainer)) return

            if (documentHasPreviousChapterURL(extensionSettings)) {
                await appendFetchedRecap(extensionSettings)
            } else {
                await appendFetchedBlurb(extensionSettings)
            }
        }

        /**
         * True if the recap container has content, otherwise false.
         */
        function recapContainerHasContent(recapContainer: HTMLElement): boolean {
            return recapContainer.textContent?.trim() !== ""
        }
    },
})
