<script lang="ts">
    import type { ExtensionSettings } from "~/types/types"

    let {
        settings = $bindable(),
        onValidationChange,
    }: {
        settings: ExtensionSettings
        onValidationChange?: (isValid: boolean) => void
    } = $props()

    // Detect prefers-reduced-motion
    const prefersReducedMotion = $derived.by(() => {
        if (typeof window !== "undefined" && window.matchMedia) {
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches
        }
        return false
    })

    // Check if user is overriding reduced motion
    // This happens when they have reduced motion enabled but chose to enable jump
    const isOverridingReducedMotion = $derived(
        prefersReducedMotion && settings.enableJump,
    )

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

{#if isOverridingReducedMotion}
    <div class="message override-warning">
        <p><strong>Accessibility Notice:</strong></p>
        <p>You have "prefers-reduced-motion" enabled in your system settings, but you've chosen to enable jump functionality which may include animations. This overrides your accessibility preference.</p>
    </div>
{/if}

{#if settings.enableJump}
    <label>
        <span class:reduced-motion={prefersReducedMotion}>Scroll behavior</span>
        <select
            class="form-control"
            bind:value={settings.scrollBehavior}
            disabled={prefersReducedMotion}>
            <option value="smooth">Smooth (animated scroll)</option>
            <option value="instant">Immediate (instant jump)</option>
        </select>
    </label>

    {#if prefersReducedMotion}
        <div class="message info-message">
            <p>Smooth scrolling is disabled because <em>prefers-reduced-motion</em> is enabled in your system settings.</p>
            <p>The browser will always use instant scrolling regardless of this setting.</p>
        </div>
    {/if}
{/if}

<label>
    <span>Enable auto expanding recap on page load</span>
    <input type="checkbox" bind:checked={settings.autoExpand} />
</label>

<style>
    @import '../../lib/styles/forms.css';
</style>
