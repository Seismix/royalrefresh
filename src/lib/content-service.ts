import type { ExtensionSettings } from "~/types/types"
import { recapState } from "~/lib/recap-state.svelte"
import {
    fetchHtmlText,
    createRecapFragment,
    createBlurbFragment,
    documentHasPreviousChapterURL,
} from "~/lib/content-utils"

export class ContentService {
    /**
     * Fetches and displays recap content
     */
    static async fetchRecap(
        extensionSettings: ExtensionSettings,
    ): Promise<void> {
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
    static async fetchBlurb(
        extensionSettings: ExtensionSettings,
    ): Promise<void> {
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
     * Handles the toggle action and fetches content if needed
     */
    static async handleToggle(
        extensionSettings: ExtensionSettings,
    ): Promise<void> {
        // If we already have content, just toggle visibility
        if (recapState.content && recapState.visibility === "hidden") {
            recapState.show()
            return
        }

        // If currently visible, hide it
        if (recapState.visibility === "visible") {
            recapState.hide()
            return
        }

        // If loading state, we need to fetch content
        if (recapState.visibility === "loading") {
            if (documentHasPreviousChapterURL(extensionSettings)) {
                await this.fetchRecap(extensionSettings)
            } else {
                await this.fetchBlurb(extensionSettings)
            }
        }
    }
}
