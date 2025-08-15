<script lang="ts">
    import ToggleButton from "~/components/extension/ToggleButton.svelte"
    import SettingsButton from "~/components/extension/SettingsButton.svelte"
    import RecapContainer from "~/components/extension/RecapContainer.svelte"
    import { extensionState } from "~/lib/extension-state.svelte"
    import { recapState } from "~/lib/recap-state.svelte"
    import { ContentService } from "~/lib/content-service"
    import { documentHasPreviousChapterURL } from "~/lib/content-utils"

    // Wait for settings to load before showing anything
    const isReady = $derived(extensionState.isLoaded)
    const hasPrevChapter = $derived(
        isReady && documentHasPreviousChapterURL(extensionState.settings),
    )
    const toggleType = $derived(hasPrevChapter ? "recap" : "blurb")

    // Effect to handle the content fetching when state changes
    $effect(() => {
        if (recapState.visibility === "loading" && isReady) {
            ContentService.handleToggle(extensionState.settings)
        }
    })

    // Effect to handle auto-expand
    $effect(() => {
        if (
            isReady &&
            extensionState.settings.autoExpand &&
            !recapState.content
        ) {
            recapState.toggle()
        }
    })

    // Effect to re-fetch content when settings change
    $effect(() => {
        if (isReady && recapState.content) {
            // Re-fetch content when settings change to apply new word count, etc.
            if (hasPrevChapter) {
                ContentService.fetchRecap(extensionState.settings)
            } else {
                ContentService.fetchBlurb(extensionState.settings)
            }
        }
    })
</script>

{#if isReady}
    <!-- Toggle button for recap/blurb -->
    <div class="toggle-section">
        <ToggleButton type={toggleType} />
    </div>

    <!-- Settings button (only show if has previous chapter) -->
    {#if hasPrevChapter}
        <div class="settings-section">
            <SettingsButton />
        </div>
    {/if}

    <!-- Content container -->
    <div class="content-section">
        <RecapContainer />
    </div>
{/if}

<style>
    .toggle-section {
        margin-bottom: 1rem;
    }

    .settings-section {
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .content-section {
        width: 100%;
    }
</style>
