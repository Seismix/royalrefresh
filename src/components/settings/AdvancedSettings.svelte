<script lang="ts">
    import type { ExtensionSelectors, ExtensionSettings } from "~/types/types"
    import {
        ADAPTERS,
        DEFAULT_SELECTORS_BY_VERSION,
        FALLBACK_ADAPTER,
        type UiVersion,
    } from "~/lib/adapters"

    let {
        settings = $bindable(),
    }: {
        settings: ExtensionSettings
    } = $props()

    // Which layout's selectors are being edited
    let version = $state<UiVersion>(FALLBACK_ADAPTER.id)

    // Overrides are keyed by adapter id and stored settings can predate a
    // layout, so make sure every shipped layout has a bucket to bind into.
    for (const adapter of ADAPTERS) {
        settings.selectorOverrides[adapter.id] ??= {}
    }

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

    // Built-in defaults for the selected layout, shown as placeholders
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

<!-- Nothing to pick when only one layout ships, so the control hides itself
     rather than needing to be removed by hand. -->
{#if ADAPTERS.length > 1}
    <label>
        <span>Royal Road layout:</span>
        <select class="form-control" bind:value={version}>
            {#each ADAPTERS as adapter (adapter.id)}
                <option value={adapter.id}>{adapter.label}</option>
            {/each}
        </select>
    </label>
{/if}

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
