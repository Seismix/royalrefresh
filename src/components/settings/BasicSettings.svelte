<script lang="ts">
    import type { ExtensionSettings } from "~/types/types"
    import { prefersReducedMotion } from "~/lib/utils/platform"

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

    // Track previous state to detect when animations are first enabled
    let previousEnableAnimations = $state(settings.enableAnimations)

    // Set scroll behavior to smooth when animations are FIRST enabled (if jump is on and OS allows)
    $effect(() => {
        if (settings.enableAnimations && !previousEnableAnimations && !userPrefersReducedMotion && settings.enableJump) {
            if (settings.scrollBehavior === "instant") {
                settings.scrollBehavior = "smooth"
            }
        }
        previousEnableAnimations = settings.enableAnimations
    })

    // Compute effective scroll behavior - overrides to instant when animations can't run
    const effectiveScrollBehavior = $derived(
        (!settings.enableAnimations || userPrefersReducedMotion)
            ? "instant"
            : settings.scrollBehavior
    )
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
        <select
            class="form-control"
            value={effectiveScrollBehavior}
            onchange={(e) => settings.scrollBehavior = e.currentTarget.value as ScrollBehavior}
            disabled={userPrefersReducedMotion || !settings.enableAnimations}>
            <option value="smooth">Animated scroll</option>
            <option value="instant">Instant</option>
        </select>
    </label>
{/if}

<label>
    <span>Enable animations</span>
    <input type="checkbox" bind:checked={settings.enableAnimations} />
</label>

{#if settings.enableAnimations}
    {#if userPrefersReducedMotion}
        <div class="message info-message">
            <p>
                Animations are disabled because <em>prefers-reduced-motion</em> is enabled in your system settings,
                which overrides your extension settings.
            </p>
            <p>
                To enable animations, change your system's accessibility settings to allow motion.
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
