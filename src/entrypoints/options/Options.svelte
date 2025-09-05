<script lang="ts">
    import { extensionState } from "~/lib/extension-state.svelte"
    import type { ExtensionSettings } from "~/types/types"

    let saveStatus = $state<string>("")
    let activeButton = $state<string>("")

    // Wait for extension state to load
    extensionState.waitForLoad()

    // Local reactive state that syncs with the extension state
    let localSettings = $state<ExtensionSettings>({ ...extensionState.settings })

    // Sync local settings with extension state changes
    $effect(() => {
        localSettings = { ...extensionState.settings }
    })

    // Validation for word count
    const isWordCountValid = $derived(
        !isNaN(localSettings.wordCount) &&
            localSettings.wordCount !== null &&
            localSettings.wordCount >= 1 &&
            localSettings.wordCount <= 500,
    )

    const wordCountError = $derived(
        isNaN(localSettings.wordCount) || localSettings.wordCount === null
            ? "Please enter a valid number"
            : localSettings.wordCount > 500
              ? "Word count cannot exceed 500"
              : localSettings.wordCount < 1
                ? "Word count must be at least 1"
                : "",
    )

    async function saveSettings() {
        if (!isWordCountValid) {
            showSaveStatus("Invalid word count ✗", "save")
            return
        }

        try {
            await extensionState.updateSettings(localSettings)
            showSaveStatus("Saved ✔", "save")
        } catch (error) {
            console.error("Failed to save settings:", error)
            showSaveStatus("Save failed ✗", "save")
        }
    }

    async function handleRestoreDefaults() {
        try {
            await extensionState.restoreDefaults()
            showSaveStatus("Restored Defaults ✔", "restoreDefaults")
        } catch (error) {
            console.error("Failed to restore defaults:", error)
            showSaveStatus("Restore failed ✗", "restoreDefaults")
        }
    }

    async function handleRestoreSelectors() {
        try {
            await extensionState.restoreSelectors()
            showSaveStatus("Restored Selectors ✔", "restoreSelectors")
        } catch (error) {
            console.error("Failed to restore selectors:", error)
            showSaveStatus("Restore failed ✗", "restoreSelectors")
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

    {#if !extensionState.isLoaded}
        <p>Loading settings...</p>
    {:else}
        <form
            onsubmit={(e) => {
                e.preventDefault()
                saveSettings()
            }}>
            <label>
                <span>Word Count (max 500)</span>
                <input
                    type="number"
                    min="1"
                    max="500"
                    bind:value={localSettings.wordCount}
                    class:invalid={!isWordCountValid} />
                {#if wordCountError}
                    <p class="validation-error">{wordCountError}</p>
                {/if}
            </label>

            <label>
                <span>Enable smooth scroll after button click</span>
                <input
                    type="checkbox"
                    bind:checked={localSettings.smoothScroll} />
            </label>

            <label>
                <span>Enable auto expanding recap on page load</span>
                <input
                    type="checkbox"
                    bind:checked={localSettings.autoExpand} />
            </label>

            <details>
                <summary>Advanced options: CSS-Selectors</summary>
                <p class="warning-message">
                    <strong>Warning:</strong> Please be cautious when modifying the
                    advanced settings. Changing these values may break the functionality
                    of the extension. If you encounter any issues, you can restore
                    the default settings using the "Restore Default Selectors" button
                    below.
                </p>
                <p class="warning-message">
                    Custom CSS-Selectors are overwritten if an extension update
                    changes the default values.
                </p>

                <label>
                    <span>Previous chapter buttton:</span>
                    <input
                        type="text"
                        bind:value={localSettings.prevChapterBtn} />
                </label>

                <label>
                    <span>Recap button placement:</span>
                    <input
                        type="text"
                        bind:value={localSettings.togglePlacement} />
                </label>

                <label>
                    <span>Settings button placement:</span>
                    <input
                        type="text"
                        bind:value={localSettings.settingsPlacement} />
                </label>

                <label>
                    <span>Chapter content:</span>
                    <input
                        type="text"
                        bind:value={localSettings.chapterContent} />
                </label>

                <label>
                    <span>Chapter title:</span>
                    <input
                        type="text"
                        bind:value={localSettings.chapterTitle} />
                </label>

                <label>
                    <span>Fiction title:</span>
                    <input
                        type="text"
                        bind:value={localSettings.fictionTitle} />
                </label>

                <label>
                    <span>Story blurb:</span>
                    <input type="text" bind:value={localSettings.blurb} />
                </label>

                <label>
                    <span>Button to close settings modal:</span>
                    <input
                        type="text"
                        bind:value={localSettings.closeButtonSelector} />
                </label>

                <button
                    type="button"
                    class:saved={activeButton === "restoreSelectors" &&
                        saveStatus.includes("✔")}
                    onclick={handleRestoreSelectors}>
                    {saveStatus === "Restored Selectors ✔"
                        ? saveStatus
                        : "Restore Default Selectors"}
                </button>
            </details>

            <button
                type="submit"
                class:saved={activeButton === "save" &&
                    saveStatus.includes("✔")}>
                {saveStatus === "Saved ✔" ? saveStatus : "Save"}
            </button>
            <button
                type="button"
                class:saved={activeButton === "restoreDefaults" &&
                    saveStatus.includes("✔")}
                onclick={handleRestoreDefaults}>
                {saveStatus === "Restored Defaults ✔"
                    ? saveStatus
                    : "Restore All Settings"}
            </button>
        </form>
    {/if}
</main>

<style>
    main {
        padding: 1em;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1em;
    }

    .warning-message {
        background-color: #ffdddd;
        border-left: 6px solid #f44336;
        padding: 10px;
        margin-bottom: 15px;
    }

    .validation-error {
        color: #c62828;
        font-size: 0.875rem;
        margin-top: 4px;
        margin-bottom: 0;
    }

    input.invalid {
        border-color: #f44336;
        background-color: #ffebee;
    }
</style>
