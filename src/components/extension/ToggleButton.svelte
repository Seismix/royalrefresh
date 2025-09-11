<script lang="ts">
    import { recapState } from "~/lib/state/recap-state.svelte"
    import { getSettings } from "~/lib/utils/storage-utils"
    import { ContentManager } from "~/lib/services/content-manager"

    let {
        type = "recap",
    }: {
        type?: "recap" | "blurb"
    } = $props()

    // Reference to the button element
    let buttonElement: HTMLButtonElement

    const handleToggle = async (event: MouseEvent) => {
        // Blur the button to remove focus/active state
        if (buttonElement) {
            buttonElement.blur()
        }

        // If we're currently visible, just toggle to hide
        if (recapState.visibility === "visible") {
            recapState.hide()
            return
        }

        // If we have content, just show it
        if (recapState.content) {
            recapState.show()
            return
        }

        // If we don't have content, fetch it first then show
        const settings = await getSettings()
        const result =
            type === "recap"
                ? await ContentManager.fetchRecap(settings)
                : await ContentManager.fetchBlurb(settings)

        if ("error" in result) {
            recapState.setError(result.error)
        } else {
            recapState.setContent(
                result.content,
                result.type as "recap" | "blurb",
            )
        }
    }

    const buttonText = type === "recap" ? "Recap" : "Blurb"
    const iconName = type === "recap" ? "book" : "info-circle"
    const buttonId = type === "recap" ? "recapButton" : "blurbButton"
</script>

<button
    bind:this={buttonElement}
    class="btn btn-primary btn-circle"
    onclick={handleToggle}
    id={buttonId}
    style="outline: none !important;">
    <i class="fa fa-{iconName}" style="margin-right: 0.15em;"></i>
    <span>{recapState.toggleText}</span>{buttonText}
</button>
