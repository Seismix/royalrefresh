<script lang="ts">
    import { getSettings } from "~/lib/utils/storage-utils"
    import { resolveActiveSelectors } from "~/lib/adapters"
    import type { HostChrome } from "~/types/types"

    // Everything that varies between RoyalRoad's layouts arrives as data from
    // the active adapter, so this component never branches on which layout it
    // is rendering into. Any host-page restyling the button needs belongs in
    // that adapter's `prepareMounts`, where it can be undone on teardown.
    let { ui }: { ui: HostChrome["settingsButton"] } = $props()

    const handleClick = async () => {
        browser.runtime.sendMessage({ action: "openExtensionSettings" })

        // Close the host settings modal/dialog if it's open (selector resolved
        // for the active layout)
        const settings = await getSettings()
        const selectors = resolveActiveSelectors(settings)
        const closeButton = document.querySelector(
            selectors.closeButtonSelector,
        )
        if (closeButton && closeButton instanceof HTMLButtonElement) {
            closeButton.click()
        }
    }
</script>

<!-- Inline styles for browser-extension UI injection to keep specificity high
     and avoid conflicts with host page styles. -->
{#snippet button()}
    <button
        id="settingsButton"
        class={ui.className}
        style={ui.style ?? ""}
        onclick={handleClick}>
        <i class={ui.icon} style={ui.iconStyle ?? ""}></i>{ui.label}
    </button>
{/snippet}

{#if ui.wrapperStyle}
    <div style={ui.wrapperStyle}>{@render button()}</div>
{:else}
    {@render button()}
{/if}
