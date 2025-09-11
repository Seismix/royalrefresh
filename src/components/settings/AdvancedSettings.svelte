<script lang="ts">
    import type { ExtensionSettings } from "~/types/types"

    let {
        settings = $bindable(),
        onRestoreSelectors,
        onSave,
        saveStatus = "",
        activeButton = "",
        showButtons = false,
    }: {
        settings: ExtensionSettings
        onRestoreSelectors?: () => Promise<void>
        onSave?: () => Promise<void>
        saveStatus?: string
        activeButton?: string
        showButtons?: boolean
    } = $props()
</script>

<h2>Advanced Settings</h2>

<p>
    These settings allow you to customize CSS selectors used by the extension.
    If Royal Road changes their website structure before an extension update,
    you can modify these selectors as a temporary workaround.
</p>

<p class="warning-message">
    Changing these values may break the functionality of the extension. If you
    encounter any issues, you can restore the default settings using the
    "Restore Default Selectors" button below.
</p>
<p class="info-message">
    Custom CSS-Selectors are overwritten if an extension update changes the
    default values.
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
    <span>Story blurb labels:</span>
    <input type="text" bind:value={settings.blurbLabels} />
</label>

<label>
    <span>Button to close settings modal:</span>
    <input type="text" bind:value={settings.closeButtonSelector} />
</label>

{#if showButtons}
    <button
        type="button"
        class:saved={activeButton === "save" && saveStatus.includes("✔")}
        onclick={onSave}>
        {saveStatus === "Saved ✔" ? saveStatus : "Save CSS Selectors"}
    </button>

    <button
        type="button"
        class:saved={activeButton === "restoreSelectors" &&
            saveStatus.includes("✔")}
        onclick={onRestoreSelectors}>
        {saveStatus === "Restored Selectors ✔"
            ? saveStatus
            : "Restore Default Selectors"}
    </button>
{/if}

<style>
    .info-message {
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
        padding: 12px;
        margin-bottom: 16px;
        border-radius: 4px;
    }

    .warning-message {
        background-color: #fff8e1;
        border-left: 6px solid #eed202;
        padding: 10px;
        margin-bottom: 15px;
        color: #8b6f00;
    }

    /* Dark mode styles */
    @media (prefers-color-scheme: dark) {
        .info-message {
            background-color: #1a2332;
            border-left-color: #64b5f6;
        }

        .warning-message {
            background-color: #2a1f00;
            border-left-color: #eed202;
            color: #eed202;
        }
    }
</style>
