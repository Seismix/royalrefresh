<script lang="ts">
    import { untrack } from "svelte"
    import { recapState } from "~/lib/state/recap-state.svelte"
    import { getSettings, watchSettings } from "~/lib/utils/storage-utils"
    import { ContentManager } from "~/lib/services/content-manager"
    import { getDefaults } from "~/lib/config/defaults"
    import { prefersReducedMotion } from "~/lib/utils/platform"
    import type { ContentType, ExtensionSettings } from "~/types/types"

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

    // Effect: Scroll into view when content becomes visible. We intentionally
    // do NOT scroll on the loading state: jumping on button press and then
    // filling content a moment later causes a jarring layout shift (CLS),
    // especially with instant/reduced-motion scrolling.
    $effect(() => {
        if (recapState.isVisible && currentSettings?.enableJump) {
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
            const settings = currentSettings

            // Try to refresh from cache first (fast, no network)
            const result = ContentManager.refreshRecapFromCache(settings)

            if ("error" in result) {
                // Cache expired or missing — re-fetch so the new word count
                // still takes effect instead of leaving stale content on screen
                recapState.setLoading()
                ContentManager.fetchRecap(settings).then((fetchResult) => {
                    if ("error" in fetchResult) {
                        recapState.setError(fetchResult.error)
                    } else {
                        recapState.setContent(
                            fetchResult.content,
                            fetchResult.type as ContentType,
                        )
                    }
                })
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
