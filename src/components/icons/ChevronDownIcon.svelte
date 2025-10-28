<script lang="ts">
    import type { IconButtonProps } from "~/types/icon-button"
    import Icon from "./Icon.svelte"

    let { variant = "default" }: Omit<IconButtonProps, "onclick"> = $props()
</script>

<Icon {variant}>
    {#snippet path()}
        <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none" />
    {/snippet}
</Icon>
