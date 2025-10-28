<script lang="ts">
    import type { IconButtonProps } from "~/types/icon-button"
    import Icon from "./Icon.svelte"

    let { variant = "default" }: Omit<IconButtonProps, "onclick"> = $props()
</script>

<Icon {variant}>
    {#snippet path()}
        <!-- https://icons.getbootstrap.com/icons/arrow-left/ -->
        <path
            fill-rule="evenodd"
            d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
    {/snippet}
</Icon>
