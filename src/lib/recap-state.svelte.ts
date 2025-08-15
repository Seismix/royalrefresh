export type RecapState = "hidden" | "loading" | "visible"

/**
 * Reactive recap state using Svelte 5 runes and WXT storage
 */
class RecapStateManager {
    visibility = $state<RecapState>("hidden")
    content = $state<string>("")
    isLoading = $state(false)
    error = $state<string | null>(null)
    type = $state<"recap" | "blurb">("recap")

    toggle() {
        if (this.visibility === "visible") {
            this.visibility = "hidden"
        } else {
            this.visibility = "loading"
            this.isLoading = true
        }
    }

    setContent(content: string, type: "recap" | "blurb") {
        this.content = content
        this.type = type
        this.visibility = "visible"
        this.isLoading = false
        this.error = null
    }

    setError(error: string) {
        this.error = error
        this.visibility = "hidden"
        this.isLoading = false
    }

    hide() {
        this.visibility = "hidden"
    }

    show() {
        if (this.content) {
            this.visibility = "visible"
        }
    }

    get toggleText() {
        return this.visibility === "visible" ? "Hide " : "Show "
    }

    get isVisible() {
        return this.visibility === "visible"
    }
}

// Singleton instance
export const recapState = new RecapStateManager()
