<script lang="ts">
    import { recapState } from "~/lib/state/recap-state.svelte"
    import { getSettings, watchSettings } from "~/lib/utils/storage-utils"
    import { ContentManager } from "~/lib/services/content-manager"
    import DEFAULTS from "~/lib/config/defaults"

    let { id = "recapContainer" }: { id?: string } = $props()

    // Track previous settings to detect changes
    let previousWordCount = $state<number>(DEFAULTS.wordCount)
    let currentSettings = $state<any>(null)

    // Load initial settings and watch for changes
    $effect(() => {
        const loadSettings = async () => {
            try {
                currentSettings = await getSettings()
                previousWordCount = currentSettings.wordCount

                // Watch for settings changes
                return watchSettings((newSettings) => {
                    if (newSettings) {
                        currentSettings = newSettings
                    }
                })
            } catch (error) {
                console.error("Failed to load settings:", error)
            }
        }

        loadSettings()
    })

    // Effect: scroll into view when content becomes visible
    $effect(() => {
        if (recapState.isVisible && currentSettings?.smoothScroll) {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
        }
    })

    // Effect: refresh content when word count changes (uses cache to avoid re-fetching)
    $effect(() => {
        if (
            recapState.isVisible &&
            recapState.content &&
            recapState.type === "recap" &&
            currentSettings &&
            currentSettings.wordCount !== previousWordCount
        ) {
            // Try to refresh from cache first
            const result = ContentManager.refreshRecapFromCache(currentSettings)

            if ('error' in result) {
                // If cache refresh fails, the user can manually refresh
                console.warn("Could not refresh from cache:", result.error)
            } else {
                recapState.setContent(result.content, result.type)
            }

            previousWordCount = currentSettings.wordCount
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
