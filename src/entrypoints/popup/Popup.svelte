<script lang="ts">
    import { ActionButtons, BackButton, GitHubButton, PatchNotesButton, SettingsButton } from "@/components/buttons"
    import PatchNotes from "@/entrypoints/popup/PatchNotes.svelte"
    import { AdvancedSettings, BasicSettings } from "~/components/settings"
    import DEFAULTS from "~/lib/config/defaults"
    import { BrowserType, currentBrowser } from "~/lib/utils/platform"
    import { getSettings, watchSettings } from "~/lib/utils/storage-utils"
    import type { ExtensionSettings } from "~/types/types"

    type View = "settings" | "patch-notes"

    let localSettings = $state<ExtensionSettings | null>(null)
    let isValid = $state<boolean>(true)
    let currentView = $state<View>("settings")
    const isAndroidFirefox = currentBrowser === BrowserType.AndroidFirefox

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
                localSettings = DEFAULTS
            }
        }

        loadSettings()
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

<main class:android-firefox={isAndroidFirefox}>
    {#if currentView === "settings"}
        <header class="popup-header">
            <h1>RoyalRefresh Settings</h1>
            <div class="utility-buttons" aria-label="Extension utilities">
                <PatchNotesButton onclick={showPatchNotes} />
                {#if !isAndroidFirefox}
                    <SettingsButton />
                {/if}
            </div>
        </header>

        <div class="content">
            {#if !localSettings}
                <p>Loading settings...</p>
            {:else}
                <BasicSettings
                    bind:settings={localSettings}
                    onValidationChange={handleValidationChange} />

                {#if isAndroidFirefox}
                    <section
                        class="advanced-section"
                        aria-label="Advanced settings">
                        <AdvancedSettings bind:settings={localSettings} />
                    </section>
                {/if}
            {/if}
        </div>

        {#if localSettings}
            <div class="actions">
                <ActionButtons
                    settings={localSettings}
                    {isValid}
                    showRestoreSelectors={isAndroidFirefox} />
            </div>
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

    .actions {
        margin-top: auto;
        background-color: var(--bg-secondary);
        flex-shrink: 0;
    }

    .popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 2rem; /* Ensure minimum height for buttons */
        flex-shrink: 0;
    }

    h1 {
        color: var(--color-text);
        font-size: 1.2rem;
        margin: 0;
        flex: 1;
    }

    .utility-buttons {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        height: 100%;
    }
</style>
