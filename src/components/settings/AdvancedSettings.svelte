<script lang="ts">
    import type { ExtensionSettings } from "~/types/types"

    let {
        settings = $bindable(),
    }: {
        settings: ExtensionSettings
    } = $props()
</script>

<h2>Advanced Settings</h2>

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
    Custom CSS-Selectors are overwritten if an extension update changes the
    default values.
</p>

<label>
    <span>Previous chapter buttton:</span>
    <input
        type="text"
        class="form-control"
        bind:value={settings.prevChapterBtn} />
</label>

<label>
    <span>Recap button placement:</span>
    <input
        type="text"
        class="form-control"
        bind:value={settings.togglePlacement} />
</label>

<label>
    <span>Settings button placement:</span>
    <input
        type="text"
        class="form-control"
        bind:value={settings.settingsPlacement} />
</label>

<label>
    <span>Chapter content:</span>
    <input
        type="text"
        class="form-control"
        bind:value={settings.chapterContent} />
</label>

<label>
    <span>Chapter title:</span>
    <input
        type="text"
        class="form-control"
        bind:value={settings.chapterTitle} />
</label>

<label>
    <span>Fiction title:</span>
    <input
        type="text"
        class="form-control"
        bind:value={settings.fictionTitle} />
</label>

<label>
    <span>Story blurb:</span>
    <input type="text" class="form-control" bind:value={settings.blurb} />
</label>

<label>
    <span>Story blurb labels:</span>
    <input type="text" class="form-control" bind:value={settings.blurbLabels} />
</label>

<label>
    <span>Button to close settings modal:</span>
    <input
        type="text"
        class="form-control"
        bind:value={settings.closeButtonSelector} />
</label>

<style>
    @import "~/lib/styles/forms.css";
</style>
