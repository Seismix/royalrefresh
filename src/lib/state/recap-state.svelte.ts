import type { ContentType } from "~/types/types"

export type RecapState = "hidden" | "visible" | "error" | "loading"

/**
 * Reactive recap state using Svelte 5 runes - Pure UI state management
 * No business logic, only handles visibility, content display, and error states
 */
class RecapStateManager {
    visibility = $state<RecapState>("hidden")
    content = $state<string>("")
    error = $state<string | null>(null)
    type = $state<ContentType>("recap")

    /**
     * Sets content and makes it visible
     */
    setContent(content: string, type: ContentType) {
        this.content = content
        this.type = type
        this.visibility = "visible"
        this.error = null
    }

    /**
     * Marks content as loading. Keeps any existing content (e.g. during a
     * word-count refresh) but clears errors and shows the loading indicator.
     */
    setLoading() {
        this.visibility = "loading"
        this.error = null
    }

    /**
     * Sets error message and hides content
     */
    setError(error: string) {
        this.error = error
        this.content = ""
        this.visibility = "error"
    }

    /**
     * Hides content and error
     */
    hide() {
        this.visibility = "hidden"
        this.error = null
    }

    /**
     * Shows content if available
     */
    show() {
        if (this.content) {
            this.visibility = "visible"
            this.error = null
        }
    }

    // Computed properties using $derived
    toggleText = $derived(this.visibility === "visible" ? "Hide " : "Show ")
    isVisible = $derived(this.visibility === "visible")
    isLoading = $derived(this.visibility === "loading")
    hasError = $derived(this.visibility === "error" && this.error !== null)
}

// Singleton instance
export const recapState = new RecapStateManager()
