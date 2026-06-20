import ToggleButton from "~/components/extension/ToggleButton.svelte"
import SettingsButton from "~/components/extension/SettingsButton.svelte"
import ReportLink from "~/components/extension/ReportLink.svelte"
import RecapContainer from "~/components/extension/RecapContainer.svelte"
import {
    documentIsChapterURL,
    documentHasPreviousChapterURL,
    mountComponent,
} from "~/lib/utils/dom-utils"
import { getSettings } from "~/lib/utils/storage-utils"
import type { ContentType } from "~/types/types"

export default defineContentScript({
    matches: ["*://*.royalroad.com/*"],
    runAt: "document_end",
    cssInjectionMode: "ui",

    main: async (ctx) => {
        if (!documentIsChapterURL()) return

        // Get settings from storage
        const settings = await getSettings()
        const hasPrevChapter = documentHasPreviousChapterURL(settings)
        const contentType: ContentType = hasPrevChapter ? "recap" : "blurb"

        // Create toggle button
        const togglePlacement = document.querySelector(settings.togglePlacement)
        if (togglePlacement) {
            const cleanup = mountComponent(ToggleButton, togglePlacement, {
                type: contentType,
            })
            ctx.onInvalidated(cleanup)

            if (settings.autoExpand) {
                const buttonId = `${contentType}Button`
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

        // Create report link (label/type matches what the toggle button shows)
        const reportPlacement = document.querySelector(settings.reportPlacement)
        if (reportPlacement) {
            const cleanup = mountComponent(
                ReportLink,
                reportPlacement,
                { type: contentType },
                false,
            )
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
