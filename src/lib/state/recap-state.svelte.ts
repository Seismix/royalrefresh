export type RecapState = "hidden" | "visible" | "error"

/**
 * Reactive recap state using Svelte 5 runes - Pure UI state management
 * No business logic, only handles visibility, content display, and error states
 */
class RecapStateManager {
    visibility = $state<RecapState>("hidden")
    content = $state<string>("")
    error = $state<string | null>(null)
    type = $state<"recap" | "blurb">("recap")

    /**
     * Sets content and makes it visible
     */
    setContent(content: string, type: "recap" | "blurb") {
        this.content = content
        this.type = type
        this.visibility = "visible"
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

    // Computed properties
    get toggleText() {
        return this.visibility === "visible" ? "Hide " : "Show "
    }

    get isVisible() {
        return this.visibility === "visible"
    }

    get hasError() {
        return this.visibility === "error" && this.error !== null
    }
}

// Singleton instance
export const recapState = new RecapStateManager()
