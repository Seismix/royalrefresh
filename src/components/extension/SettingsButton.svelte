<script lang="ts">
    import { onMount } from "svelte"
    import { getSettings } from "~/lib/utils/storage-utils"
    import { resolveActiveSelectors } from "~/lib/adapters"
    import type { UiVersion } from "~/types/types"

    let {
        className = "btn btn-primary btn-circle red",
        version = "legacy",
    }: {
        className?: string
        version?: UiVersion
    } = $props()

    let buttonElement = $state<HTMLButtonElement>()

    const handleClick = async () => {
        browser.runtime.sendMessage({ action: "openExtensionSettings" })

        // Close the host settings modal/dialog if it's open (selector resolved
        // for the active UI version)
        const settings = await getSettings()
        const selectors = resolveActiveSelectors(settings)
        const closeButton = document.querySelector(selectors.closeButtonSelector)
        if (closeButton && closeButton instanceof HTMLButtonElement) {
            closeButton.click()
        }
    }

    onMount(() => {
        // Legacy only: lay out the host modal footer so the button sits inline
        // with RoyalRoad's own footer controls. The redesign uses its own
        // wrapper (below) and must NOT restyle the host dialog.
        if (version !== "legacy") return
        const parent = buttonElement?.parentElement
        if (parent && parent instanceof HTMLElement) {
            parent.style.display = "flex"
            parent.style.justifyContent = "space-between"
            parent.style.alignItems = "center"
        }
    })
</script>

<!-- Inline styles for browser-extension UI injection to keep specificity high
     and avoid conflicts with host page styles. -->
{#if version === "redesign"}
    <!-- Centered, content-width action in a padded, separated footer so it sits
         cleanly at the bottom of the Reading Preferences dialog. -->
    <div
        style="display: flex; justify-content: center; padding: 16px 24px 20px; margin-top: 8px; border-top: 1px solid rgba(127, 127, 127, 0.25);">
        <button id="settingsButton" class={className} onclick={handleClick}>
            <i class="fa-solid fa-gear" style="margin-right: 0.4em;"></i>RoyalRefresh
            Settings
        </button>
    </div>
{:else}
    <button
        bind:this={buttonElement}
        id="settingsButton"
        class={className}
        style="margin-right: auto; margin-left: 0px;"
        onclick={handleClick}>
        <i class="fa fa-cog" style="margin-right: 0.2em;"></i>Open RoyalRefresh
        Settings
    </button>
{/if}
