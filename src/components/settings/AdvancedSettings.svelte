<script lang="ts">
    import type {
        ExtensionSelectors,
        ExtensionSettings,
        UiVersion,
    } from "~/types/types"
    import { DEFAULT_SELECTORS_BY_VERSION } from "~/lib/config/defaults"

    let {
        settings = $bindable(),
    }: {
        settings: ExtensionSettings
    } = $props()

    // Which UI version's selectors are being edited
    let version = $state<UiVersion>("legacy")

    const fields: { key: keyof ExtensionSelectors; label: string }[] = [
        { key: "prevChapterBtn", label: "Previous chapter button:" },
        { key: "togglePlacement", label: "Recap button placement:" },
        { key: "settingsPlacement", label: "Settings button placement:" },
        { key: "reportPlacement", label: "Report link placement:" },
        { key: "chapterContent", label: "Chapter content:" },
        { key: "chapterTitle", label: "Chapter title:" },
        { key: "fictionTitle", label: "Fiction title:" },
        { key: "blurb", label: "Story blurb:" },
        { key: "blurbLabels", label: "Story blurb labels:" },
        {
            key: "closeButtonSelector",
            label: "Button to close settings modal:",
        },
    ]

    // Built-in defaults for the selected version, shown as placeholders
    let defaults = $derived(DEFAULT_SELECTORS_BY_VERSION[version])
</script>

<h2>Advanced Settings</h2>

<h3>CSS selectors</h3>

<p>
    These settings allow you to customize CSS selectors used by the extension.
    If Royal Road changes their website structure before an extension update,
    you can modify these selectors as a temporary workaround.
</p>

<p class="message warning-message">
    Changing these values may break the functionality of the extension. If you
    encounter any issues, you can restore the default settings using the
    "Restore Default Selectors" button below.
</p>
<p class="message info-message">
    Leave a field empty to use the built-in default (shown as the placeholder).
    Selectors are kept separately for each Royal Road layout — pick the layout
    you want to edit below.
</p>

<label>
    <span>Royal Road layout:</span>
    <select class="form-control" bind:value={version}>
        <option value="legacy">Legacy (classic)</option>
        <option value="redesign">Redesign (beta)</option>
    </select>
</label>

{#each fields as field (field.key)}
    <label>
        <span>{field.label}</span>
        <input
            type="text"
            class="form-control"
            placeholder={defaults[field.key]}
            bind:value={settings.selectorOverrides[version][field.key]} />
    </label>
{/each}

<style>
    @import "~/lib/styles/forms.css";
</style>
