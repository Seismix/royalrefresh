<script lang="ts">
    import {
        ActionButtons,
        BackButton,
        GitHubButton,
        PatchNotesButton,
        SettingsButton,
    } from "~/components/buttons"
    import AdvancedSettingsView from "~/entrypoints/popup/AdvancedSettingsView.svelte"
    import PatchNotes from "~/entrypoints/popup/PatchNotes.svelte"
    import { untrack } from "svelte"
    import { PageHeader } from "~/components/layout"
    import { BasicSettings } from "~/components/settings"
    import { getDefaults } from "~/lib/config/defaults"
    import { BrowserType, currentBrowser } from "~/lib/utils/platform"
    import { getSettings, watchSettings } from "~/lib/utils/storage-utils"
    import type { ExtensionSettings } from "~/types/types"

    type View = "settings" | "patch-notes" | "advanced-settings"

    let localSettings = $state<ExtensionSettings | null>(null)
    let isValid = $state<boolean>(true)
    let currentView = $state<View>("settings")
    const isAndroidFirefox = currentBrowser === BrowserType.AndroidFirefox

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

    function showAdvancedSettings() {
        currentView = "advanced-settings"
    }

    function showSettings() {
        currentView = "settings"
    }
</script>

<main class:android-firefox={isAndroidFirefox}>
    {#if currentView === "settings"}
        <PageHeader title="RoyalRefresh Settings">
            {#snippet buttons()}
                <PatchNotesButton onclick={showPatchNotes} />
                {#if isAndroidFirefox}
                    <SettingsButton onclick={showAdvancedSettings} />
                {:else}
                    <SettingsButton />
                {/if}
            {/snippet}
        </PageHeader>

        <div class="content">
            {#if !localSettings}
                <p>Loading settings...</p>
            {:else}
                <BasicSettings
                    bind:settings={localSettings}
                    onValidationChange={handleValidationChange} />
            {/if}
        </div>

        {#if localSettings}
            <div class="actions">
                <ActionButtons
                    settings={localSettings}
                    {isValid}
                    showRestoreSelectors={false} />
            </div>
        {/if}
    {:else if currentView === "patch-notes"}
        <div class="patch-notes-wrapper">
            <PatchNotes>
                {#snippet headerButtons()}
                    <GitHubButton />
                    <BackButton onclick={showSettings} />
                {/snippet}
            </PatchNotes>
        </div>
    {:else if currentView === "advanced-settings"}
        <div class="advanced-settings-wrapper">
            {#if localSettings}
                <AdvancedSettingsView bind:settings={localSettings} {isValid}>
                    {#snippet headerButtons()}
                        <BackButton onclick={showSettings} />
                    {/snippet}
                </AdvancedSettingsView>
            {/if}
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
        max-width: 400px;
        /* Remove overflow-y: scroll to avoid double scrollbars in popup */
        transition:
            background-color var(--transition-slow),
            color var(--transition-slow);
    }

    /* Android Firefox body takes full width */
    :global(body:has(.android-firefox)) {
        max-width: 100vw;
    }

    main {
        font-family: var(--font-family);
        background-color: var(--bg-secondary);
        color: var(--color-text);
        padding: var(--spacing-lg);
        min-width: 300px;
        max-width: 400px;
        width: 400px;
        min-height: 400px;
        max-height: 600px;
        box-sizing: border-box;
        position: relative; /* For absolute positioning of utility buttons */
        display: flex;
        flex-direction: column;
    }

    /* Android Firefox popup takes full screen height */
    main.android-firefox {
        min-height: 100vh;
        max-height: 100vh;
        height: 100vh;
        width: 100vw;
        max-width: 100vw;
        overflow: hidden;
    }

    .content {
        flex: 1;
        overflow-y: auto;
        margin-bottom: var(--spacing-md);
        min-height: 0; /* Important for flex overflow */
    }

    .patch-notes-wrapper {
        flex: 1;
        min-height: 0; /* Important for flex overflow */
        display: flex;
        flex-direction: column;
    }

    .advanced-settings-wrapper {
        flex: 1;
        min-height: 0; /* Important for flex overflow */
        display: flex;
        flex-direction: column;
    }

    .actions {
        margin-top: auto;
        background-color: var(--bg-secondary);
        flex-shrink: 0;
    }
</style>
