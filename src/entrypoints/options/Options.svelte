<script lang="ts">
    import { createSettingsStore } from "~/lib/storage";

    const { settings, loading, error, save, restoreDefaults, restoreSelectors } = createSettingsStore();
    let saveStatus = $state<string>("");

    async function saveSettings() {
        try {
            await save($settings);
            showSaveStatus("Saved ✔");
        } catch (error) {
            console.error("Failed to save settings:", error);
            showSaveStatus("Save failed ✗");
        }
    }

    async function handleRestoreDefaults() {
        try {
            await restoreDefaults();
            showSaveStatus("Restored Defaults ✔");
        } catch (error) {
            console.error("Failed to restore defaults:", error);
            showSaveStatus("Restore failed ✗");
        }
    }

    async function handleRestoreSelectors() {
        try {
            await restoreSelectors();
            showSaveStatus("Restored Selectors ✔");
        } catch (error) {
            console.error("Failed to restore selectors:", error);
            showSaveStatus("Restore failed ✗");
        }
    }

    function showSaveStatus(message: string) {
        saveStatus = message;
        setTimeout(() => {
            saveStatus = "";
        }, 2000);
    }
</script>

<main>
    <h1>RoyalRefresh Settings</h1>

    {#if $loading}
        <p>Loading settings...</p>
    {:else if $error}
        <p class="error">Error loading settings: {$error}</p>
    {:else}
        <form onsubmit={(e) => { e.preventDefault(); saveSettings(); }}>
            <label>
                <span>Word Count (max 500)</span>
                <input type="number" min="1" max="500" bind:value={$settings.wordCount} />
            </label>

            <label>
                <span>Enable smooth scroll after button click</span>
                <input type="checkbox" bind:checked={$settings.smoothScroll} />
            </label>

            <label>
                <span>Enable auto expanding recap on page load</span>
                <input type="checkbox" bind:checked={$settings.autoExpand} />
            </label>

            <details>
                <summary>Advanced options: CSS-Selectors</summary>
                <p class="warning-message">
                    <strong>Warning:</strong> Please be cautious when modifying the advanced settings. Changing these values may break the functionality of the extension. If you encounter any issues, you can restore the default settings using the "Restore Default Selectors" button below.
                </p>
                <p class="warning-message">
                    Custom CSS-Selectors are overwritten if an extension update changes the default values.
                </p>

                <label>
                    <span>Previous chapter buttton:</span>
                    <input type="text" bind:value={$settings.prevChapterBtn} />
                </label>

                <label>
                    <span>Recap button placement:</span>
                    <input type="text" bind:value={$settings.togglePlacement} />
                </label>

                <label>
                    <span>Settings button placement:</span>
                    <input type="text" bind:value={$settings.settingsPlacement} />
                </label>

                <label>
                    <span>Chapter content:</span>
                    <input type="text" bind:value={$settings.chapterContent} />
                </label>

                <label>
                    <span>Chapter title:</span>
                    <input type="text" bind:value={$settings.chapterTitle} />
                </label>

                <label>
                    <span>Fiction title:</span>
                    <input type="text" bind:value={$settings.fictionTitle} />
                </label>

                <label>
                    <span>Story blurb:</span>
                    <input type="text" bind:value={$settings.blurb} />
                </label>

                <label>
                    <span>Button to close settings modal:</span>
                    <input type="text" bind:value={$settings.closeButtonSelector} />
                </label>

                <button type="button" onclick={handleRestoreSelectors}>
                    {saveStatus === "Restored Selectors ✔" ? saveStatus : "Restore Default Selectors"}
                </button>
            </details>

            <button type="submit">
                {saveStatus === "Saved ✔" ? saveStatus : "Save"}
            </button>
            <button type="button" onclick={handleRestoreDefaults}>
                {saveStatus === "Restored Defaults ✔" ? saveStatus : "Restore All Settings"}
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

    .error {
        background-color: #ffebee;
        border-left: 6px solid #f44336;
        color: #c62828;
        padding: 10px;
        margin-bottom: 15px;
    }
</style>
