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

    const toggle = async () => {
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

    /**
     * Attach the click handler natively (target phase) rather than via Svelte's
     * `onclick`. This is load-bearing, not a style choice: on the redesign the
     * toggle mounts inside RoyalRoad's `.rr-dialog` cluster, which opens the
     * Reading Preferences modal on a bubbled click. Svelte delegates `onclick`
     * to the app root, so a delegated handler's `stopPropagation` would run
     * AFTER the event had already bubbled through `.rr-dialog` — too late.
     * A native target-phase listener stops it in time. Harmless on legacy,
     * where no ancestor listens.
     */
    const nativeClick = (node: HTMLButtonElement) => {
        const onClick = (event: MouseEvent) => {
            event.stopPropagation()
            // Remove focus/active state left behind by the click
            node.blur()
            void toggle()
        }

        node.addEventListener("click", onClick)
        return () => node.removeEventListener("click", onClick)
    }

    let buttonText = $derived(type === "recap" ? "Recap" : "Blurb")
    let iconName = $derived(type === "recap" ? "book" : "info-circle")
    let buttonId = $derived(type === "recap" ? "recapButton" : "blurbButton")
</script>

<button
    {@attach nativeClick}
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
