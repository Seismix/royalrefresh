<script lang="ts">
    import { recapState } from "~/lib/recap-state.svelte";
    import { extensionState } from "~/lib/extension-state.svelte";

    let {
        id = "recapContainer"
    }: {
        id?: string;
    } = $props();

    // Effect to scroll into view when content becomes visible
    $effect(() => {
        if (recapState.isVisible && extensionState.settings.smoothScroll) {
            const container = document.getElementById(id);
            if (container) {
                container.scrollIntoView({ behavior: "smooth" });
            }
        }
    });
</script>

<div 
    {id} 
    style="display: {recapState.isVisible ? 'block' : 'none'}"
>
    {#if recapState.isLoading}
        <div class="loading">Loading...</div>
    {:else if recapState.error}
        <div class="error">{recapState.error}</div>
    {:else if recapState.content}
        {@html recapState.content}
    {/if}
</div>

<style>
    .loading, .error {
        padding: 1rem;
        text-align: center;
    }
    
    .error {
        color: #ff4444;
    }
</style>
