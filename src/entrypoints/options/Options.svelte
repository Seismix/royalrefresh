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
    .firefox {
        padding-left: 20px;
    }
</style>
