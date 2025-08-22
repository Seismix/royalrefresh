<script lang="ts">
    import { recapState } from "~/lib/recap-state.svelte"
    import { extensionState } from "~/lib/extension-state.svelte"
    import { ContentService } from "~/lib/content-service"

    let { id = "recapContainer" }: { id?: string } = $props()

    // Effect: scroll into view when content becomes visible
    $effect(() => {
        if (recapState.isVisible && extensionState.settings.smoothScroll) {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
        }
    })

    // Effect: regenerate content when settings change and recap is visible
    $effect(() => {
        if (
            recapState.isVisible &&
            recapState.content &&
            extensionState.isLoaded
        ) {
            ContentService.refreshCurrentContent(extensionState.settings)
        }
    })
</script>

<div {id} style="display: {recapState.isVisible ? 'block' : 'none'}">
    {#if recapState.error}
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
