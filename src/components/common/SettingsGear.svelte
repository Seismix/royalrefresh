<script lang="ts">
    import { browser } from "wxt/browser"
    import type { IconButtonProps } from "~/types/icon-button"
    import GearIcon from "./GearIcon.svelte"

    let { variant = "default" }: Omit<IconButtonProps, "onclick"> = $props()

    const openSettings = async () => {
        await browser.runtime.openOptionsPage()
    }
</script>

<button
    aria-label="Open settings"
    class="icon-button settings-gear"
    onclick={openSettings}>
    <GearIcon {variant} />
</button>

<style>
    @import "~/lib/styles/icon-button.css";
</style>
