<script lang="ts">
    import { untrack } from "svelte"
    import {
        ActionButtons,
        BackButton,
        GitHubButton,
        PatchNotesButton,
    } from "~/components/buttons"
    import PatchNotes from "~/entrypoints/popup/PatchNotes.svelte"
    import { PageHeader } from "~/components/layout"
    import { AdvancedSettings, BasicSettings } from "~/components/settings"
    import { getDefaults } from "~/lib/config/defaults"
    import { getSettings, watchSettings } from "~/lib/utils/storage-utils"
    import type { ExtensionSettings } from "~/types/types"

    type View = "settings" | "patch-notes"

    let localSettings = $state<ExtensionSettings | null>(null)
    let isValid = $state<boolean>(true)
    let isFirefox = $state(import.meta.env.FIREFOX)
    let currentView = $state<View>("settings")

    // Load initial settings once on mount
    const initSettings = async () => {
        try {
            localSettings = await getSettings()
        } catch (error) {
            console.error("Failed to load settings:", error)
            localSettings = getDefaults()
        }
    }

    initSettings()

    // Effect: Watch for external settings changes (from other tabs/popups)
    $effect(() => {
        if (!localSettings) return

        return watchSettings((newValue) => {
            if (newValue) {
                // Use untrack to prevent infinite loops when updating state in effect
                untrack(() => {
                    localSettings = newValue
                })
            }
        })
    })

    function handleValidationChange(valid: boolean) {
        isValid = valid
    }

    function showPatchNotes() {
        currentView = "patch-notes"
    }

    function showSettings() {
        currentView = "settings"
    }
</script>

<main class={isFirefox ? "firefox" : ""}>
    {#if currentView === "settings"}
        <PageHeader title="RoyalRefresh Settings" variant="options">
            {#snippet buttons()}
                <PatchNotesButton onclick={showPatchNotes} />
            {/snippet}
        </PageHeader>

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
    {:else}
        <div class="patch-notes-wrapper">
            <PatchNotes>
                {#snippet headerButtons()}
                    <GitHubButton />
                    <BackButton onclick={showSettings} />
                {/snippet}
            </PatchNotes>
        </div>
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
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    .firefox {
        padding-inline: var(--page-padding);
    }

    .patch-notes-wrapper {
        flex: 1;
        min-height: 0; /* Important for flex overflow */
        display: flex;
        flex-direction: column;
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
