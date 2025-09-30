<script lang="ts">
    import ActionButtons from "~/components/common/ActionButtons.svelte"
    import PatchNotesButton from "~/components/common/PatchNotesButton.svelte"
    import SettingsGear from "~/components/common/SettingsGear.svelte"
    import AdvancedSettings from "~/components/settings/AdvancedSettings.svelte"
    import BasicSettings from "~/components/settings/BasicSettings.svelte"
    import DEFAULTS from "~/lib/config/defaults"
    import { BrowserType, currentBrowser } from "~/lib/utils/platform"
    import { getSettings, watchSettings } from "~/lib/utils/storage-utils"
    import type { ExtensionSettings } from "~/types/types"

    let localSettings = $state<ExtensionSettings | null>(null)
    let isValid = $state<boolean>(true)
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
</script>

<main>
    <div class="utility-buttons" aria-label="Extension utilities">
        <PatchNotesButton />
        {#if !isAndroidFirefox}
            <SettingsGear />
        {/if}
    </div>
    <h1>RoyalRefresh Settings</h1>

    {#if !localSettings}
        <p>Loading settings...</p>
    {:else}
        <BasicSettings
            bind:settings={localSettings}
            onValidationChange={handleValidationChange} />

        {#if isAndroidFirefox}
            <section class="advanced-section" aria-label="Advanced settings">
                <AdvancedSettings bind:settings={localSettings} />
            </section>
        {/if}

        <ActionButtons
            settings={localSettings}
            {isValid}
            showRestoreSelectors={isAndroidFirefox} />
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
        overflow-y: auto;
        box-sizing: border-box;
    }

    h1 {
        color: var(--color-text);
        margin-bottom: var(--spacing-lg);
        font-size: 1.2rem;
        margin-top: 0;
    }

    main {
        position: relative; /* For absolute positioning of SettingsButton */
    }

    p {
        color: var(--color-text);
        margin-bottom: var(--spacing-sm);
    }

    .advanced-section {
        margin: var(--spacing-lg) 0;
        border-top: 1px solid var(--border-color);
        padding-top: var(--spacing-md);
    }

    .utility-buttons {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-sm);
        display: flex;
        gap: var(--spacing-xs);
    }
</style>
