<script lang="ts">
    import { onMount } from "svelte"
    import { prefersReducedMotion } from "~/lib/utils/platform"
    import {
        hasCookiesPermission,
        readBetaCookie,
        requestCookiesPermission,
    } from "~/lib/adapters"
    import type { ExtensionSettings } from "~/types/types"

    let {
        settings = $bindable(),
        onValidationChange,
    }: {
        settings: ExtensionSettings
        onValidationChange?: (isValid: boolean) => void
    } = $props()

    // RoyalRoad layout override. `bind:value` updates the mode; switching layout
    // sets a cookie, which needs the optional `cookies` permission — requested
    // here on the user gesture. The cookie itself is applied by the background
    // once settings are saved. Fine-tuned (name/values) in Advanced Settings.
    let betaLayoutError = $state("")

    // Seed the selector from the layout RoyalRoad is actually serving: read the
    // live cookie (if we can) so the dropdown reflects reality rather than a
    // possibly-stale stored value.
    onMount(async () => {
        if (!(await hasCookiesPermission())) return
        const value = await readBetaCookie(settings.betaCookie.name)
        if (value === null) return
        settings.betaCookie.mode =
            value === settings.betaCookie.betaValue ? "redesign" : "classic"
    })

    async function onLayoutChange() {
        betaLayoutError = ""

        // Requesting when already granted resolves immediately with no prompt.
        const granted = await requestCookiesPermission()
        if (!granted) {
            betaLayoutError =
                "Permission to change RoyalRoad cookies was declined, so the layout was left unchanged."
            // Revert to the previous choice (binary toggle).
            settings.betaCookie.mode =
                settings.betaCookie.mode === "redesign" ? "classic" : "redesign"
        }
    }

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

<label>
    <span>RoyalRoad layout</span>
    <select
        class="form-control"
        bind:value={settings.betaCookie.mode}
        onchange={onLayoutChange}>
        <option value="redesign">Redesign (beta)</option>
        <option value="classic">Classic (legacy)</option>
    </select>
</label>

{#if betaLayoutError}
    <p class="message warning-message">{betaLayoutError}</p>
{:else}
    <p class="message info-message">
        Save, then reload a RoyalRoad page to apply. Adjust the cookie in
        Advanced Settings if RoyalRoad changes it.
    </p>
{/if}

<style>
    @import "~/lib/styles/forms.css";
</style>
