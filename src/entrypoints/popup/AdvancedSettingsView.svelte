<script lang="ts">
    import type { Snippet } from "svelte"
    import { ActionButtons } from "~/components/buttons"
    import { GearIcon } from "~/components/icons"
    import { PageHeader } from "~/components/layout"
    import { AdvancedSettings } from "~/components/settings"
    import type { ExtensionSettings } from "~/types/types"

    type Props = {
        settings: ExtensionSettings
        isValid: boolean
        headerButtons?: Snippet
    }

    let { settings = $bindable(), isValid, headerButtons }: Props = $props()
</script>

<PageHeader title="Advanced Settings">
    {#snippet buttons()}
        {#if headerButtons}
            {@render headerButtons()}
        {/if}
    {/snippet}
</PageHeader>

<div class="content">
    <AdvancedSettings bind:settings />
</div>

<div class="actions">
    <ActionButtons {settings} {isValid} showRestoreSelectors={true} />
</div>

<style>
    @import "~/lib/styles/tokens.css";

    .content {
        padding: var(--spacing-md) 0;
        overflow-y: auto;
        flex: 1;
        min-height: 0; /* Important for flex overflow */
    }

    .actions {
        margin-top: auto;
        background-color: var(--bg-secondary);
        flex-shrink: 0;
    }
</style>
