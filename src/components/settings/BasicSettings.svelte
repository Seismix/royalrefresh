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
    <div class="override-warning">
        <p><strong>Accessibility Notice:</strong></p>
        <p>You have "prefers-reduced-motion" enabled in your system settings, but you've chosen to enable jump functionality which may include animations. This overrides your accessibility preference.</p>
    </div>
{/if}

{#if settings.enableJump}
    <span class="label-text" class:reduced-motion={prefersReducedMotion}
        >Scroll behavior</span>
    <select
        bind:value={settings.scrollBehavior}
        disabled={prefersReducedMotion}>
        <option value="smooth">Smooth (animated scroll)</option>
        <option value="instant">Immediate (instant jump)</option>
    </select>

    {#if prefersReducedMotion}
        <div class="info-message">
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
        transition: border-color 0.2s ease;
    }

    select:disabled {
        background-color: #f5f5f5;
        color: #999;
        border-color: #ddd;
        cursor: not-allowed;
        opacity: 0.6;
    }

    .info-message {
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 16px;
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
        font-size: smaller;
    }

    .info-message p {
        margin: 0 0 8px 0;
    }

    .info-message p:last-child {
        margin-bottom: 0;
    }

    .override-warning {
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 16px;
        background-color: #fff3e0;
        border-left: 4px solid #ff9800;
        font-size: smaller;
    }

    .override-warning p {
        margin: 0 0 8px 0;
    }

    .override-warning p:last-child {
        margin-bottom: 0;
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

        select:hover:not(:disabled) {
            border-color: #777;
        }

        select:disabled {
            background-color: #1a1a1a;
            color: #666;
            border-color: #444;
        }

        .info-message {
            background-color: #1a2332;
            border-left-color: #64b5f6;
        }

        .override-warning {
            background-color: #2d2319;
            border-left-color: #ffb74d;
        }
    }
</style>
