<script lang="ts">
    import { onMount } from "svelte"
    import { prefersReducedMotion } from "~/lib/utils/platform"
    import {
        hasCookiesPermission,
        readBetaCookie,
        requestCookiesPermission,
    } from "~/lib/adapters"
    import {
        validateWordCount,
        WORD_COUNT_MAX,
        WORD_COUNT_MIN,
    } from "~/lib/config/validation"
    import type { BetaLayoutMode, ExtensionSettings } from "~/types/types"

    let {
        settings = $bindable(),
    }: {
        settings: ExtensionSettings
    } = $props()

    // RoyalRoad layout override. `bind:value` updates the mode; switching layout
    // sets a cookie, which needs the optional `cookies` permission — requested
    // here on the user gesture. The cookie itself is applied by the background
    // once settings are saved. Fine-tuned (name/values) in Advanced Settings.
    let betaLayoutError = $state("")

    // The layout as it stood when this view opened (after seeding from the live
    // cookie below). The "save and reload" hint only matters once the user
    // actually picks a different layout — shown unconditionally it's just clutter.
    let initialLayoutMode = $state<BetaLayoutMode | null>(null)
    const layoutChanged = $derived(
        initialLayoutMode !== null &&
            settings.betaCookie.mode !== initialLayoutMode,
    )

    // Seed the selector from the layout RoyalRoad is actually serving: read the
    // live cookie (if we can) so the dropdown reflects reality rather than a
    // possibly-stale stored value.
    onMount(async () => {
        if (await hasCookiesPermission()) {
            const value = await readBetaCookie(settings.betaCookie.name)
            // Only trust an exact match. Anything else (RoyalRoad changed its
            // values, or set something we don't recognise) would otherwise be
            // displayed as "Classic", which may be flatly wrong — leave the
            // stored choice alone.
            if (value === settings.betaCookie.betaValue) {
                settings.betaCookie.mode = "redesign"
            } else if (value === settings.betaCookie.classicValue) {
                settings.betaCookie.mode = "classic"
            }
        }
        // Baseline is taken after seeding, so seeding never counts as a change.
        initialLayoutMode = settings.betaCookie.mode
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
{:else if layoutChanged}
    <p class="message info-message">
        Save, then reload a RoyalRoad page to apply. Adjust the cookie in
        Advanced Settings if RoyalRoad changes it.
    </p>
{/if}

<style>
    @import "~/lib/styles/forms.css";
</style>
