<script lang="ts">
    import type { ExtensionSettings } from "~/types/types"
    import DEFAULTS from "~/lib/config/defaults"
    import {
        settingsStore,
        updateSettings,
        restoreDefaults,
        watchSettings,
    } from "~/lib/utils/storage-utils"
    import BasicSettings from "~/components/settings/BasicSettings.svelte"

    let saveStatus = $state<string>("")
    let activeButton = $state<string>("")
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

    function handleValidationChange(valid: boolean, error: string) {
        isValid = valid
    }

    async function handleSave() {
        if (!isValid || !localSettings) {
            showSaveStatus("Invalid word count ✗", "save")
            return
        }

        try {
            await updateSettings(localSettings)
            showSaveStatus("Saved ✔", "save")
        } catch (error) {
            console.error("Failed to save settings:", error)
            showSaveStatus("Save failed ✗", "save")
        }
    }

    async function handleRestoreDefaults() {
        try {
            await restoreDefaults()
            showSaveStatus("Restored Defaults ✔", "restoreDefaults")
        } catch (error) {
            console.error("Failed to restore defaults:", error)
            showSaveStatus("Restore failed ✗", "restoreDefaults")
        }
    }

    function showSaveStatus(message: string, buttonType: string) {
        saveStatus = message
        activeButton = buttonType
        setTimeout(() => {
            saveStatus = ""
            activeButton = ""
        }, 1000)
    }
</script>

<main>
    <h1>RoyalRefresh Settings</h1>

    {#if !localSettings}
        <p>Loading settings...</p>
    {:else}
        <form
            onsubmit={(e) => {
                e.preventDefault()
                handleSave()
            }}>
            <BasicSettings
                bind:settings={localSettings}
                onValidationChange={handleValidationChange}
                onSave={handleSave}
                onRestoreDefaults={handleRestoreDefaults}
                {saveStatus}
                {activeButton}
                showButtons={true} />
        </form>
    {/if}
</main>
