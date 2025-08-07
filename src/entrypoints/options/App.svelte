<script lang="ts">
    import type { ExtensionSettings } from "~/types/types";
    import DEFAULTS from "~/lib/defaults";

    let settings: ExtensionSettings = DEFAULTS;
    storage.getItem("sync:settings").then((s) => (settings = s));

    function saveSettings() {
        storage.setItem("sync:settings", settings);
    }

    function restoreDefaults() {
        settings = DEFAULTS;
        saveSettings();
    }

    function restoreSelectors() {
        const newSettings = { ...settings };
        for (const key in DEFAULTS) {
            if (key.endsWith("Selector") || key.endsWith("Btn") || key.endsWith("Placement") || key.endsWith("Content") || key.endsWith("Title") || key.endsWith("Blurb")) {
                newSettings[key] = DEFAULTS[key];
            }
        }
        settings = newSettings;
        saveSettings();
    }
</script>

<main>
    <h1>RoyalRefresh Settings</h1>

    <form on:submit|preventDefault={saveSettings}>
        <label>
            <span>Word Count (max 500)</span>
            <input type="number" min="1" max="500" bind:value={settings.wordCount} />
        </label>

        <label>
            <span>Enable smooth scroll after button click</span>
            <input type="checkbox" bind:checked={settings.smoothScroll} />
        </label>

        <label>
            <span>Enable auto expanding recap on page load</span>
            <input type="checkbox" bind:checked={settings.autoExpand} />
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
                <input type="text" bind:value={settings.prevChapterBtn} />
            </label>

            <label>
                <span>Recap button placement:</span>
                <input type="text" bind:value={settings.togglePlacement} />
            </label>

            <label>
                <span>Settings button placement:</span>
                <input type="text" bind:value={settings.settingsPlacement} />
            </label>

            <label>
                <span>Chapter content:</span>
                <input type="text" bind:value={settings.chapterContent} />
            </label>

            <label>
                <span>Chapter title:</span>
                <input type="text" bind:value={settings.chapterTitle} />
            </label>

            <label>
                <span>Fiction title:</span>
                <input type="text" bind:value={settings.fictionTitle} />
            </label>

            <label>
                <span>Story blurb:</span>
                <input type="text" bind:value={settings.blurb} />
            </label>

            <label>
                <span>Button to close settings modal:</span>
                <input type="text" bind:value={settings.closeButtonSelector} />
            </label>

            <button type="button" on:click={restoreSelectors}>Restore Default Selectors</button>
        </details>

        <button type="submit">Save</button>
        <button type="button" on:click={restoreDefaults}>Restore All Settings</button>
    </form>
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
</style>
