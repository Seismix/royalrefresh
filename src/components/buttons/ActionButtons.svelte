<script lang="ts">
    import {
        restoreDefaults,
        restoreSelectors,
        updateSettings,
    } from "~/lib/utils/storage-utils"
    import type { ExtensionSettings } from "~/types/types"

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
    <div class="action-buttons-full">
        <button
            type="button"
            class="btn btn-danger"
            class:saved={restoreSelectorsText.includes("✔")}
            onclick={handleRestoreSelectors}>
            {restoreSelectorsText}
        </button>
    </div>
{/if}

<div class="action-buttons">
    <button
        type="submit"
        class="btn btn-primary"
        class:saved={saveText.includes("✔")}
        onclick={handleSave}>
        {saveText}
    </button>

    <button
        type="button"
        class="btn btn-danger"
        class:saved={restoreAllText.includes("✔")}
        onclick={handleRestoreAll}>
        {restoreAllText}
    </button>
</div>

<style>
    @import "~/lib/styles/buttons.css";

    .action-buttons-full {
        display: flex;
        gap: var(--spacing-lg);
        margin-top: var(--spacing-xxl);
        width: 100%;
    }

    .action-buttons-full button {
        flex: 1;
        white-space: normal;
    }

    .action-buttons {
        display: flex;
        gap: var(--spacing-lg);
        margin-top: var(--spacing-xxl);
        width: 100%;
    }

    .action-buttons button {
        flex: 1;
        white-space: normal;
    }

    /* State-specific styles */
    button.saved {
        background-color: var(--color-success);
    }

    button.saved:hover {
        background-color: var(--color-success-hover);
    }
</style>
