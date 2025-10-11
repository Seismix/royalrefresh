<script lang="ts">
    import type { Snippet } from "svelte"
    import type { IconButtonProps } from "~/types/icon-button"

    interface Props extends Omit<IconButtonProps, "onclick"> {
        path: Snippet  // SVG path content
        size?: number
    }

    let { variant = "default", path, size = 16 }: Props = $props()
    const variantClass = variant !== "default" ? `variant-${variant}` : ""
</script>

<div class="icon-wrapper">
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        fill="currentColor"
        class="icon {variantClass}"
        viewBox="0 0 16 16">
        {@render path()}
    </svg>
</div>

<style>
    @import "~/lib/styles/icon-button.css";
</style>
