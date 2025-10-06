<script lang="ts">
    import ActionButtons from "@/components/buttons/ActionButtons.svelte"
    import BackButton from "@/components/buttons/BackButton.svelte"
    import PatchNotesButton from "@/components/buttons/PatchNotesButton.svelte"
    import SettingsButton from "@/components/buttons/SettingsButton.svelte"
    import PatchNotes from "@/entrypoints/popup/PatchNotes.svelte"
    import AdvancedSettings from "~/components/settings/AdvancedSettings.svelte"
    import BasicSettings from "~/components/settings/BasicSettings.svelte"
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

<main>
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
        <PatchNotes>
            {#snippet headerButtons()}
                <BackButton onclick={showSettings} />
            {/snippet}
        </PatchNotes>
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

    main {
        font-family: var(--font-family);
        background-color: var(--bg-secondary);
        color: var(--color-text);
        padding: var(--spacing-lg);
        min-width: 300px;
        max-width: 400px;
        width: 400px;
        max-height: 600px;
        overflow-y: auto;
        box-sizing: border-box;
        position: relative; /* For absolute positioning of utility buttons */
        display: flex;
        flex-direction: column;
    }

    .content {
        flex: 1;
        overflow-y: auto;
        margin-bottom: var(--spacing-md);
    }

    .actions {
        margin-top: auto;
        background-color: var(--bg-secondary);
    }

    .popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 2rem; /* Ensure minimum height for buttons */
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
