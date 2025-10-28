<script lang="ts">
    import type { Snippet } from "svelte"

    interface Props {
        title: string
        buttons?: Snippet
        variant?: "popup" | "options" | "patch-notes"
    }

    let { title, buttons, variant = "popup" }: Props = $props()
</script>

<header class="page-header" class:variant-options={variant === "options"}>
    <h1>{title}</h1>
    {#if buttons}
        <div class="header-buttons" aria-label="Page utilities">
            {@render buttons()}
        </div>
    {/if}
</header>

<style>
    @import "~/lib/styles/tokens.css";

    .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 2rem;
        flex-shrink: 0;
        margin: 0;
    }

    h1 {
        font-size: 1.2rem;
        margin: 0;
        flex: 1;
        color: var(--color-text);
    }

    .variant-options h1 {
        font-size: 1.5rem;
    }

    .header-buttons {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        height: 100%;
    }
</style>
