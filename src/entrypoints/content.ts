import ToggleButton from "~/components/extension/ToggleButton.svelte"
import SettingsButton from "~/components/extension/SettingsButton.svelte"
import RecapContainer from "~/components/extension/RecapContainer.svelte"
import {
    documentIsChapterURL,
    documentHasPreviousChapterURL,
    mountComponent,
} from "~/lib/utils/dom-utils"
import { getSettings } from "~/lib/utils/storage-utils"

export default defineContentScript({
    matches: ["*://*.royalroad.com/*"],
    runAt: "document_end",
    cssInjectionMode: "ui",

    main: async (ctx) => {
        if (!documentIsChapterURL()) return

        // Get settings from storage
        const settings = await getSettings()
        const hasPrevChapter = documentHasPreviousChapterURL(settings)

        // Create toggle button
        const togglePlacement = document.querySelector(settings.togglePlacement)
        if (togglePlacement) {
            const cleanup = mountComponent(ToggleButton, togglePlacement, {
                type: hasPrevChapter ? "recap" : "blurb",
            })
            ctx.onInvalidated(cleanup)

            if (settings.autoExpand) {
                const buttonId = hasPrevChapter ? "recapButton" : "blurbButton"
                // ensure DOM is ready
                requestAnimationFrame(() => {
                    const btn = document.getElementById(buttonId)
                    if (btn) btn.click()
                })
            }
        }

        const settingsPlacement = document.querySelector(
            settings.settingsPlacement,
        )
        if (settingsPlacement) {
            const cleanup = mountComponent(SettingsButton, settingsPlacement)
            ctx.onInvalidated(cleanup)
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
