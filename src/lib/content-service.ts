import type { ExtensionSettings } from "~/types/types"
import { recapState } from "~/lib/recap-state.svelte"
import {
    fetchHtmlText,
    createRecapFragment,
    createBlurbFragment,
} from "~/lib/content-utils"

export class ContentService {
    /**
     * Fetches and displays recap content
     */
    static async fetchRecap(extensionSettings: ExtensionSettings) {
        try {
            const prevChapterBtn = document.querySelector(
                extensionSettings.prevChapterBtn,
            )

            if (!(prevChapterBtn instanceof HTMLAnchorElement)) {
                recapState.setError(
                    "Could not find previous chapter URL to fetch data.",
                )
                return
            }

            const prevChapterHtml = await fetchHtmlText(prevChapterBtn.href)

            if (!prevChapterHtml) {
                recapState.setError("Error fetching chapter. Refresh.")
                return
            }

            const recapFragment = createRecapFragment(
                prevChapterHtml,
                extensionSettings,
            )
            const tempDiv = document.createElement("div")
            tempDiv.appendChild(recapFragment)

            recapState.setContent(tempDiv.innerHTML, "recap")
        } catch (error) {
            console.error("Error fetching recap:", error)
            recapState.setError("Error fetching recap. Please try again.")
        }
    }

    /**
     * Fetches and displays blurb content
     */
    static async fetchBlurb(extensionSettings: ExtensionSettings) {
        try {
            const fictionTitle = document.querySelector(
                extensionSettings.fictionTitle,
            )

            if (!(fictionTitle?.parentElement instanceof HTMLAnchorElement)) {
                recapState.setError("Could not find fiction overview URL.")
                return
            }

            const fictionOverviewUrl = fictionTitle.parentElement.href
            const overviewHtml = await fetchHtmlText(fictionOverviewUrl)

            if (!overviewHtml) {
                recapState.setError("Error fetching blurb. Refresh")
                return
            }

            const blurbFragment = createBlurbFragment(
                overviewHtml,
                extensionSettings,
            )
            const tempDiv = document.createElement("div")
            tempDiv.appendChild(blurbFragment)

            recapState.setContent(tempDiv.innerHTML, "blurb")
        } catch (error) {
            console.error("Error fetching blurb:", error)
            recapState.setError("Error fetching blurb. Please try again.")
        }
    }

    /**
     * Handles the toggle action - simply toggles visibility
     */
    static handleToggle() {
        recapState.toggle()
    }

    /**
     * Refreshes the current content based on the current type and new settings
     * Preserves visibility state while regenerating content
     * This is called automatically when settings change to update things like word count
     */
    static async refreshCurrentContent(extensionSettings: ExtensionSettings) {
        if (!recapState.content || !recapState.isVisible) {
            return // No content to refresh or not visible
        }

        try {
            if (recapState.type === "recap") {
                await ContentService.fetchRecap(extensionSettings)
            } else {
                await ContentService.fetchBlurb(extensionSettings)
            }
        } catch (error) {
            console.error("Error refreshing content:", error)
            // Don't set error state to avoid hiding existing content
            // Just log the error and keep the previous content visible
        }
    }
}
