<script lang="ts">
    import { untrack } from "svelte"
    import { recapState } from "~/lib/state/recap-state.svelte"
    import { getSettings, watchSettings } from "~/lib/utils/storage-utils"
    import { ContentManager } from "~/lib/services/content-manager"
    import { getDefaults } from "~/lib/config/defaults"
    import { prefersReducedMotion } from "~/lib/utils/platform"
    import type { ExtensionSettings } from "~/types/types"

    let { id = "recapContainer" }: { id?: string } = $props()

    // Track previous word count to detect changes (derived from settings)
    let previousWordCount = $state<number>(getDefaults().wordCount)
    let currentSettings = $state<ExtensionSettings | null>(null)

    // Load initial settings once on mount
    const initSettings = async () => {
        try {
            const settings = await getSettings()
            // Use untrack to prevent effect re-runs when updating state
            untrack(() => {
                currentSettings = settings
                previousWordCount = settings.wordCount
            })
        } catch (error) {
            console.error("Failed to load settings:", error)
        }
    }

    initSettings()

    // Effect: Watch for external settings changes (from other tabs/popups)
    $effect(() => {
        if (!currentSettings) return

        return watchSettings((newSettings) => {
            if (newSettings) {
                // Use untrack to prevent infinite loops
                untrack(() => {
                    currentSettings = newSettings
                })
            }
        })
    })

    // Effect: Scroll into view as soon as the recap is shown — including while
    // it's still loading, so the reader is taken to the indicator immediately
    // rather than waiting for the fetch to finish.
    $effect(() => {
        if (
            (recapState.isVisible || recapState.isLoading) &&
            currentSettings?.enableJump
        ) {
            // Use scroll behavior, but override to instant if OS prefers reduced motion
            const behavior = prefersReducedMotion()
                ? "instant"
                : currentSettings.scrollBehavior

            document.getElementById(id)?.scrollIntoView({ behavior })
        }
    })

    // Effect: Refresh content when word count changes (uses cache to avoid re-fetching)
    $effect(() => {
        if (
            recapState.isVisible &&
            recapState.content &&
            recapState.type === "recap" &&
            currentSettings &&
            currentSettings.wordCount !== previousWordCount
        ) {
            // Store the word count before processing to maintain type safety
            const newWordCount = currentSettings.wordCount

            // Try to refresh from cache first
            const result = ContentManager.refreshRecapFromCache(currentSettings)

            if ("error" in result) {
                // If cache refresh fails, the user can manually refresh
                console.warn("Could not refresh from cache:", result.error)
            } else {
                recapState.setContent(result.content, result.type)
            }

            // Update tracked value using untrack to prevent effect re-run
            untrack(() => {
                previousWordCount = newWordCount
            })
        }
    })
</script>

<div
    {id}
    style="display: {recapState.isVisible ||
    recapState.hasError ||
    recapState.isLoading
        ? 'block'
        : 'none'}">
    {#if recapState.isLoading}
        <!-- Reuse RoyalRoad's Bootstrap utility classes so loading/error states
         inherit the page theme (text-muted/text-danger read on light + dark) -->
        <div class="text-center text-muted" style="padding: 1rem;">
            Loading…
        </div>
    {:else if recapState.hasError}
        <div class="text-center text-danger" style="padding: 1rem;">
            {recapState.error}
        </div>
    {:else if recapState.content}
        {@html recapState.content}
    {/if}
</div>
