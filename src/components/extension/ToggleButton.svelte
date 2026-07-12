<script lang="ts">
    import { recapState } from "~/lib/state/recap-state.svelte"
    import { getSettings } from "~/lib/utils/storage-utils"
    import { ContentManager } from "~/lib/services/content-manager"
    import type { ContentType } from "~/types/types"

    let {
        type = "recap",
        className = "btn btn-primary btn-circle",
    }: {
        type?: ContentType
        className?: string
    } = $props()

    // Reference to the button element
    let buttonElement: HTMLButtonElement

    const handleToggle = async (event: MouseEvent) => {
        // On the redesign the toggle is mounted inside RoyalRoad's `.rr-dialog`
        // cluster, which toggles the Reading Preferences modal on a bubbled
        // click. Stop propagation so our click doesn't also open that dialog.
        // Harmless on legacy (no ancestor listens). This only works because the
        // handler is attached natively (see `nativeClick`): Svelte's `onclick`
        // is delegated to the app root, which runs AFTER the event has already
        // bubbled through `.rr-dialog` — too late to stop it.
        event.stopPropagation()

        // Blur the button to remove focus/active state
        if (buttonElement) {
            buttonElement.blur()
        }

        // Ignore clicks while a fetch is already in flight
        if (recapState.isLoading) {
            return
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
        recapState.setLoading()
        const settings = await getSettings()
        const result =
            type === "recap"
                ? await ContentManager.fetchRecap(settings)
                : await ContentManager.fetchBlurb(settings)

        if ("error" in result) {
            recapState.setError(result.error)
        } else {
            recapState.setContent(result.content, result.type as ContentType)
        }
    }

    // Attach the click handler natively (target phase) instead of via Svelte's
    // delegated `onclick`, so `event.stopPropagation()` in handleToggle runs
    // before the click bubbles to RoyalRoad's `.rr-dialog` on the redesign.
    const nativeClick = (node: HTMLButtonElement) => {
        node.addEventListener("click", handleToggle)
        return {
            destroy: () => node.removeEventListener("click", handleToggle),
        }
    }

    let buttonText = $derived(type === "recap" ? "Recap" : "Blurb")
    let iconName = $derived(type === "recap" ? "book" : "info-circle")
    let buttonId = $derived(type === "recap" ? "recapButton" : "blurbButton")
</script>

<button
    bind:this={buttonElement}
    use:nativeClick
    class={className}
    id={buttonId}
    disabled={recapState.isLoading}
    style="outline: none !important;">
    <i class="fa fa-{iconName}" style="margin-right: 0.15em;"></i>
    {#if recapState.isLoading}
        <span>Loading…</span>
    {:else}
        <span>{recapState.toggleText}</span>{buttonText}
    {/if}
</button>
