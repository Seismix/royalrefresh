<script lang="ts">
    import { recapState } from "~/lib/recap-state.svelte";
    import { extensionState } from "~/lib/extension-state.svelte";
    import { ContentService } from "~/lib/content-service";

    let {
        id = "recapContainer"
    }: {
        id?: string;
    } = $props();

    // Track previous settings to detect changes
    let previousSettings = $state({ ...extensionState.settings });

    // Effect to scroll into view when content becomes visible
    $effect(() => {
        if (recapState.isVisible && extensionState.settings.smoothScroll) {
            const container = document.getElementById(id);
            if (container) {
                container.scrollIntoView({ behavior: "smooth" });
            }
        }
    });

    // Effect to regenerate content when settings change and recap is visible
    $effect(() => {
        if (recapState.isVisible && recapState.content && extensionState.isLoaded) {
            // Check if settings that affect content have changed
            const currentSettings = extensionState.settings;
            const settingsChanged = 
                previousSettings.wordCount !== currentSettings.wordCount ||
                previousSettings.chapterContent !== currentSettings.chapterContent ||
                previousSettings.prevChapterBtn !== currentSettings.prevChapterBtn ||
                previousSettings.chapterTitle !== currentSettings.chapterTitle ||
                previousSettings.fictionTitle !== currentSettings.fictionTitle ||
                previousSettings.blurb !== currentSettings.blurb;

            if (settingsChanged) {
                // Regenerate content with new settings
                ContentService.refreshCurrentContent(currentSettings);
                previousSettings = { ...currentSettings };
            }
        } else if (extensionState.isLoaded) {
            // Update previous settings even when content is not visible to avoid false positives
            previousSettings = { ...extensionState.settings };
        }
    });
</script>

<div 
    {id} 
    style="display: {recapState.isVisible ? 'block' : 'none'}"
>
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
