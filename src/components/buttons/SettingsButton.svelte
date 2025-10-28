<script lang="ts">
    import { browser } from "wxt/browser"
    import { GearIcon } from "~/components/icons"
    import type { IconButtonProps } from "~/types/icon-button"

    let { variant = "default", onclick }: IconButtonProps = $props()

    const openSettings = async () => {
        if (onclick) {
            onclick()
        } else {
            await browser.runtime.openOptionsPage()
        }
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
