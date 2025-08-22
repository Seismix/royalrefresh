export type RecapState = "hidden" | "visible"

/**
 * Reactive recap state using Svelte 5 runes and WXT storage
 */
class RecapStateManager {
    visibility = $state<RecapState>("hidden")
    content = $state<string>("")
    error = $state<string | null>(null)
    type = $state<"recap" | "blurb">("recap")

    toggle() {
        this.visibility = this.visibility === "visible" ? "hidden" : "visible"
    }

    setContent(content: string, type: "recap" | "blurb") {
        this.content = content
        this.type = type
        this.visibility = "visible"
        this.error = null
    }

    setError(error: string) {
        this.error = error
        this.visibility = "hidden"
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
