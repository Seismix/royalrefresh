<script lang="ts">
    import { prefersReducedMotion } from "~/lib/utils/platform"
    import {
        validateWordCount,
        WORD_COUNT_MAX,
        WORD_COUNT_MIN,
    } from "~/lib/config/validation"
    import type { ExtensionSettings } from "~/types/types"

    let {
        settings = $bindable(),
    }: {
        settings: ExtensionSettings
    } = $props()

    // Detect prefers-reduced-motion
    const userPrefersReducedMotion = $derived.by(() => prefersReducedMotion())

    // Word-count validation. The shared validator is the same one parents use to
    // gate Save, so this form never has to push its validity upward.
    const wordCountValidation = $derived(validateWordCount(settings.wordCount))
    const isWordCountValid = $derived(wordCountValidation.isValid)
    const wordCountError = $derived(wordCountValidation.error)
</script>

<h2>Recap Settings</h2>

<label>
    <span>Word Count (max {WORD_COUNT_MAX})</span>
    <input
        type="number"
        min={WORD_COUNT_MIN}
        max={WORD_COUNT_MAX}
        class="form-control"
        bind:value={settings.wordCount}
        class:invalid={!isWordCountValid} />
    {#if wordCountError}
        <p class="validation-error">{wordCountError}</p>
    {/if}
</label>

<label>
    <span>Enable jump to recap</span>
    <input type="checkbox" bind:checked={settings.enableJump} />
</label>

{#if settings.enableJump}
    <label>
        <span>Scroll behavior</span>
        {#if userPrefersReducedMotion && settings.scrollBehavior === "smooth"}
            <div class="message info-message">
                <p>
                    <strong>System Reduced Motion Detected</strong>
                </p>
                <p>
                    Your system has reduced motion enabled, so "Auto" will use
                    instant scrolling. If you prefer not to jump at all, disable
                    "Enable jump to recap" above.
                </p>
            </div>
        {/if}
        <select class="form-control" bind:value={settings.scrollBehavior}>
            <option value="smooth">Auto (Recommended)</option>
            <option value="instant">Instant</option>
        </select>
    </label>
{/if}

<label>
    <span>Enable auto expanding recap on page load</span>
    <input type="checkbox" bind:checked={settings.autoExpand} />
</label>

<style>
    @import "~/lib/styles/forms.css";
</style>
