<script lang="ts">
    import ActionButtons from "~/components/common/ActionButtons.svelte"
    import AdvancedSettings from "~/components/settings/AdvancedSettings.svelte"
    import BasicSettings from "~/components/settings/BasicSettings.svelte"
    import { getDefaults } from "~/lib/config/defaults"
    import { getSettings, watchSettings } from "~/lib/utils/storage-utils"
    import type { ExtensionSettings } from "~/types/types"

    let localSettings = $state<ExtensionSettings | null>(null)
    let isValid = $state<boolean>(true)
    let isFirefox = $state(import.meta.env.FIREFOX)

    // Load initial settings and set up watching
    $effect(() => {
        const loadSettings = async () => {
            try {
                localSettings = await getSettings()

                // Watch for external changes (from other tabs/popups)
                return watchSettings((newValue) => {
                    if (newValue) {
                        localSettings = newValue
                    }
                })
            } catch (error) {
                console.error("Failed to load settings:", error)
                localSettings = getDefaults()
            }
        }

        loadSettings()
    })

    function handleValidationChange(valid: boolean) {
        isValid = valid
    }
</script>

<main class={isFirefox ? "firefox" : ""}>
    {#if !localSettings}
        <p>Loading settings...</p>
    {:else}
        <BasicSettings
            bind:settings={localSettings}
            onValidationChange={handleValidationChange} />

        <AdvancedSettings bind:settings={localSettings} />

        <ActionButtons
            settings={localSettings}
            {isValid}
            showRestoreSelectors={true} />
    {/if}
</main>

<style>
    @import "~/lib/styles/tokens.css";

    :global(body) {
        font-family: var(--font-family);
        background-color: var(--bg-secondary);
        color: var(--color-text);
        margin: 0;
        padding: 0;
        overflow-x: hidden;
        overflow-y: scroll; /* Always show vertical scrollbar to prevent CLS */
        transition:
            background-color var(--transition-slow),
            color var(--transition-slow);
    }

    main {
        --page-padding: clamp(var(--spacing-lg), 3vw, var(--spacing-xxl));

        font-family: var(--font-family);
        background-color: var(--bg-secondary);
        color: var(--color-text);
        inline-size: min(100%, var(--container-width));
        margin: 0 auto;
        padding: var(--page-padding);
        box-sizing: border-box;
        overflow-x: hidden;
    }

    .firefox {
        padding-inline: var(--page-padding);
    }

    :global(h1),
    :global(h2),
    :global(h3) {
        color: var(--color-text);
        margin-bottom: var(--spacing-lg);
    }

    :global(p) {
        color: var(--color-text);
        margin-bottom: var(--spacing-sm);
    }

    /* Details/Summary for advanced settings */
    :global(details) {
        margin-top: var(--spacing-lg);
        padding: var(--spacing-lg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        cursor: pointer;
        overflow-x: hidden;
        background-color: var(--bg-primary);
        transition:
            background-color var(--transition-slow),
            border-color var(--transition-slow);
    }

    :global(details summary) {
        padding: var(--spacing-lg);
        font-weight: var(--font-weight-bold);
        cursor: pointer;
        color: var(--color-text);
        transition: color var(--transition-fast);
    }

    :global(details summary:hover) {
        color: var(--color-primary);
    }
</style>
