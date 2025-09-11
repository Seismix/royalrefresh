<script lang="ts">
    import type { ExtensionSettings } from "~/types/types"
    import {
        updateSettings,
        restoreDefaults,
        restoreSelectors,
    } from "~/lib/utils/storage-utils"

    let {
        settings,
        isValid = true,
        showRestoreSelectors = false,
    }: {
        settings: ExtensionSettings
        isValid?: boolean
        showRestoreSelectors?: boolean
    } = $props()

    let saveText = $state("Save")
    let restoreAllText = $state("Restore All")
    let restoreSelectorsText = $state("Restore Default Selectors")

    function animateSuccess(
        setText: (text: string) => void,
        successText: string,
        defaultText: string,
    ) {
        setText(successText)
        setTimeout(() => setText(defaultText), 1000)
    }

    async function handleSave() {
        if (!isValid) {
            saveText = "Invalid settings"
            setTimeout(() => (saveText = "Save"), 1000)
            return
        }

        try {
            await updateSettings(settings)
            animateSuccess((text) => (saveText = text), "Saved ✔", "Save")
        } catch (error) {
            console.error("Failed to save settings:", error)
            animateSuccess((text) => (saveText = text), "Save failed", "Save")
        }
    }

    async function handleRestoreAll() {
        try {
            await restoreDefaults()
            await restoreSelectors()
            animateSuccess(
                (text) => (restoreAllText = text),
                "Restored ✔",
                "Restore All",
            )
        } catch (error) {
            console.error("Failed to restore all:", error)
            animateSuccess(
                (text) => (restoreAllText = text),
                "Restore failed",
                "Restore All",
            )
        }
    }

    async function handleRestoreSelectors() {
        try {
            await restoreSelectors()
            animateSuccess(
                (text) => (restoreSelectorsText = text),
                "Restored Default Selectors ✔",
                "Restore Default Selectors",
            )
        } catch (error) {
            console.error("Failed to restore selectors:", error)
            animateSuccess(
                (text) => (restoreSelectorsText = text),
                "Restore failed",
                "Restore Selectors",
            )
        }
    }
</script>

{#if showRestoreSelectors}
    <div class="action-buttons">
        <button
            type="button"
            class:saved={restoreSelectorsText.includes("✔")}
            onclick={handleRestoreSelectors}>
            {restoreSelectorsText}
        </button>
    </div>
{/if}

<div class="action-buttons">
    <button
        type="submit"
        class:saved={saveText.includes("✔")}
        onclick={handleSave}>
        {saveText}
    </button>

    <button
        type="button"
        class:saved={restoreAllText.includes("✔")}
        onclick={handleRestoreAll}>
        {restoreAllText}
    </button>
</div>

<style>
    .action-buttons {
        display: flex;
        gap: 10px;
        margin-top: 20px;
    }

    .action-buttons button {
        flex: auto;
        white-space: nowrap;
    }

    button.saved {
        background-color: #00cc00;
    }

    @media (prefers-color-scheme: dark) {
        button.saved {
            background-color: #51cf66;
        }

        button.saved:hover {
            background-color: #40c057;
        }
    }
</style>
