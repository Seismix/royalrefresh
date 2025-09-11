<script lang="ts">
    import type { ExtensionSettings } from "~/types/types"
    import DEFAULTS from "~/lib/config/defaults"
    import { settingsStore, watchSettings } from "~/lib/utils/storage-utils"
    import BasicSettings from "~/components/settings/BasicSettings.svelte"
    import ActionButtons from "~/components/common/ActionButtons.svelte"

    let localSettings = $state<ExtensionSettings | null>(null)
    let isValid = $state<boolean>(true)

    // Load initial settings and set up watching
    $effect(() => {
        const loadSettings = async () => {
            try {
                localSettings = await settingsStore.getValue()

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
    <h1>RoyalRefresh Settings</h1>

    {#if !localSettings}
        <p>Loading settings...</p>
    {:else}
        <BasicSettings
            bind:settings={localSettings}
            onValidationChange={handleValidationChange} />

        <ActionButtons settings={localSettings} {isValid} />
    {/if}
</main>
