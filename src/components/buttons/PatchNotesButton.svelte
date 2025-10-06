<script lang="ts">
    import JournalIcon from "~/components/icons/JournalIcon.svelte"
    import type { IconButtonProps } from "~/types/icon-button"

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
