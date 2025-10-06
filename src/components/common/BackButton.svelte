<script lang="ts">
    import type { IconButtonProps } from "~/types/icon-button"
    import ArrowLeftIcon from "./ArrowLeftIcon.svelte"

    interface Props extends IconButtonProps {
        onclick: () => void
    }

    let { onclick, variant = "default" }: Props = $props()
</script>

<button
    aria-label="Back to settings"
    class="icon-button back-button"
    {onclick}>
    <ArrowLeftIcon {variant} />
</button>

<style>
    @import "~/lib/styles/icon-button.css";

    .back-button {
        position: relative;
    }
</style>
