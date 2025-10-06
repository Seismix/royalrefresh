<script lang="ts">
    import type { IconButtonProps } from "~/types/icon-button"
    import JournalIcon from "./JournalIcon.svelte"

    let { onclick, variant = "default" }: IconButtonProps = $props()
</script>

<button
    aria-label="Open patch notes"
    class="icon-button patch-notes-button"
    {onclick}>
    <JournalIcon {variant} />
</button>

<style>
    @import "~/lib/styles/icon-button.css";
</style>
