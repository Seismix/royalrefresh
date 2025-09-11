<script lang="ts">
    import type { ExtensionSettings } from "~/types/types"

    let {
        settings = $bindable(),
        onValidationChange,
    }: {
        settings: ExtensionSettings
        onValidationChange?: (isValid: boolean) => void
    } = $props()

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
        bind:value={settings.wordCount}
        class:invalid={!isWordCountValid} />
    {#if wordCountError}
        <p class="validation-error">{wordCountError}</p>
    {/if}
</label>

<label>
    <span>Jump to recap</span>
    <input type="checkbox" bind:checked={settings.enableJump} />
</label>

{#if settings.enableJump}
    <label>
        <span>Scroll behavior</span>
        <select bind:value={settings.scrollBehavior}>
            <option value="smooth">Smooth (animated scroll)</option>
            <option value="instant">Immediate (instant jump)</option>
        </select>
    </label>
{/if}

<label>
    <span>Enable auto expanding recap on page load</span>
    <input type="checkbox" bind:checked={settings.autoExpand} />
</label>

<style>
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

    select {
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        background-color: white;
        color: #333;
        margin-left: 8px;
    }

    /* Dark mode styles */
    @media (prefers-color-scheme: dark) {
        .validation-error {
            color: #ef5350;
        }

        input.invalid {
            border-color: #e57373;
            background-color: #2d1b1b;
            color: #ffcdd2;
        }

        select {
            background-color: #2d2d2d;
            color: #e0e0e0;
            border-color: #555;
        }

        select:hover {
            border-color: #777;
        }
    }
</style>
