<script lang="ts">
    import { prefersReducedMotion } from "~/lib/utils/platform"
    import type { ExtensionSettings } from "~/types/types"

    let {
        settings = $bindable(),
        onValidationChange,
    }: {
        settings: ExtensionSettings
        onValidationChange?: (isValid: boolean) => void
    } = $props()

    // Detect prefers-reduced-motion
    const userPrefersReducedMotion = $derived.by(() => prefersReducedMotion())

    // Validation for word count using result object pattern
    const wordCountValidation = $derived.by(() => {
        if (!settings) {
            return { isValid: true, error: "" }
        }

        const value = settings.wordCount

        if (isNaN(value) || value === null) {
            return { isValid: false, error: "Please enter a valid number" }
        }

        if (value < 1) {
            return { isValid: false, error: "Word count must be at least 1" }
        }

        if (value > 500) {
            return { isValid: false, error: "Word count cannot exceed 500" }
        }

        return { isValid: true, error: "" }
    })

    // Convenience accessors for cleaner template usage
    const isWordCountValid = $derived(wordCountValidation.isValid)
    const wordCountError = $derived(wordCountValidation.error)

    // Notify parent of validation changes
    $effect(() => {
        if (onValidationChange) {
            onValidationChange(wordCountValidation.isValid)
        }
    })
</script>

<h2>Recap Settings</h2>

<label>
    <span>Word Count (max 500)</span>
    <input
        type="number"
        min="1"
        max="500"
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
        <select class="form-control" bind:value={settings.scrollBehavior}>
            <option value="smooth">Auto (Recommended)</option>
            <option value="instant">Instant</option>
        </select>
    </label>
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
{/if}

<label>
    <span>Enable auto expanding recap on page load</span>
    <input type="checkbox" bind:checked={settings.autoExpand} />
</label>

<style>
    @import "~/lib/styles/forms.css";
</style>
