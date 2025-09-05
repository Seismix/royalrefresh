import { mount } from "svelte"
import ToggleButton from "~/components/extension/ToggleButton.svelte"
import SettingsButton from "~/components/extension/SettingsButton.svelte"
import RecapContainer from "~/components/extension/RecapContainer.svelte"
import {
    documentIsChapterURL,
    documentHasPreviousChapterURL,
    mountComponent,
} from "~/lib/utils/dom-utils"
import { extensionState } from "~/lib/state/extension-state.svelte"

export default defineContentScript({
    matches: ["*://*.royalroad.com/*"],
    runAt: "document_end",
    cssInjectionMode: "ui",

    main: async (ctx) => {
        if (!documentIsChapterURL()) return

        // Wait for settings to load
        await extensionState.waitForLoad()

        const settings = extensionState.settings
        const hasPrevChapter = documentHasPreviousChapterURL(settings)

        // Create toggle button
        const togglePlacement = document.querySelector(settings.togglePlacement)
        if (togglePlacement) {
            const cleanup = mountComponent(ToggleButton, togglePlacement, {
                type: hasPrevChapter ? "recap" : "blurb",
            })
            ctx.onInvalidated(cleanup)
        }

        // Create settings button (only if has previous chapter)
        if (hasPrevChapter) {
            const settingsPlacement = document.querySelector(
                settings.settingsPlacement,
            )
            if (settingsPlacement && settingsPlacement instanceof HTMLElement) {
                settingsPlacement.style.display = "flex"
                settingsPlacement.style.justifyContent = "space-between"
                settingsPlacement.style.alignItems = "center"

                const cleanup = mountComponent(
                    SettingsButton,
                    settingsPlacement,
                )
                ctx.onInvalidated(cleanup)
            }
        }

        // Create content container
        const chapterDiv = document.querySelector(settings.chapterContent)
        if (chapterDiv) {
            const cleanup = mountComponent(RecapContainer, chapterDiv, {
                id: "recapContainer",
            })
            ctx.onInvalidated(cleanup)
        }
    },
})


