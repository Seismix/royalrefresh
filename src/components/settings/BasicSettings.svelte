<script lang="ts">
    import type { ExtensionSettings } from "~/types/types"

    let {
        settings = $bindable(),
        onValidationChange,
        onSave,
        onRestoreDefaults,
        saveStatus = "",
        activeButton = "",
        showButtons = false,
    }: {
        settings: ExtensionSettings
        onValidationChange?: (isValid: boolean, error: string) => void
        onSave?: () => Promise<void>
        onRestoreDefaults?: () => Promise<void>
        saveStatus?: string
        activeButton?: string
        showButtons?: boolean
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
            onValidationChange(
                wordCountValidation.isValid,
                wordCountValidation.error,
            )
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
    <span>Enable smooth scroll after button click</span>
    <input type="checkbox" bind:checked={settings.smoothScroll} />
</label>

<label>
    <span>Enable auto expanding recap on page load</span>
    <input type="checkbox" bind:checked={settings.autoExpand} />
</label>

{#if showButtons}
<div class="button-controls">
    <button
        type="submit"
        class:saved={activeButton === "save" && saveStatus.includes("✔")}>
        {saveStatus === "Saved ✔" ? saveStatus : "Save"}
    </button>
    <button
        type="button"
        class:saved={activeButton === "restoreDefaults" &&
            saveStatus.includes("✔")}
        onclick={onRestoreDefaults}>
        {saveStatus === "Restored Defaults ✔"
            ? saveStatus
            : "Restore All Settings"}
    </button>
</div>
{/if}

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

    .button-controls {
        display: flex;
        gap: 10px;
        margin-top: 20px;
    }

    .button-controls button {
        flex: 1;
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
    }
</style>
