<script lang="ts">
    import { recapState } from "~/lib/state/recap-state.svelte"
    import { extensionState } from "~/lib/state/extension-state.svelte"
    import { ContentManager } from "~/lib/services/content-manager"

    let { id = "recapContainer" }: { id?: string } = $props()

    // Track previous settings to detect changes
    let previousWordCount = $state(extensionState.settings.wordCount)

    // Effect: scroll into view when content becomes visible
    $effect(() => {
        if (recapState.isVisible && extensionState.settings.smoothScroll) {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
        }
    })

    // Effect: refresh content when word count changes (uses cache to avoid re-fetching)
    $effect(() => {
        if (
            recapState.isVisible &&
            recapState.content &&
            recapState.type === "recap" &&
            extensionState.isLoaded &&
            extensionState.settings.wordCount !== previousWordCount
        ) {
            // Try to refresh from cache first
            const result = ContentManager.refreshRecapFromCache(extensionState.settings)

            if ('error' in result) {
                // If cache refresh fails, the user can manually refresh
                console.warn("Could not refresh from cache:", result.error)
            } else {
                recapState.setContent(result.content, result.type)
            }

            previousWordCount = extensionState.settings.wordCount
        }
    })
</script>

<div {id} style="display: {recapState.isVisible || recapState.hasError ? 'block' : 'none'}">
    {#if recapState.hasError}
        <div class="error">{recapState.error}</div>
    {:else if recapState.content}
        {@html recapState.content}
    {/if}
</div>

<style>
    .error {
        padding: 1rem;
        text-align: center;
        color: #ff4444;
    }
</style>
