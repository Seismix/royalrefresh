<script lang="ts">
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

    const handleClick = async () => {
        browser.runtime.sendMessage({ action: "openExtensionSettings" })

        // Close the host settings modal/dialog if it's open (selector resolved
        // for the active UI version)
        const settings = await getSettings()
        const selectors = resolveActiveSelectors(settings)
        const closeButton = document.querySelector(
            selectors.closeButtonSelector,
        )
        if (closeButton && closeButton instanceof HTMLButtonElement) {
            closeButton.click()
        }
    }

    /**
     * Lay out RoyalRoad's modal footer so the button sits inline with its own
     * controls, restoring the footer's original inline styles on teardown.
     *
     * Attached to the legacy button itself rather than run in `onMount`, so the
     * redesign branch structurally cannot restyle the host dialog — no version
     * guard needed.
     */
    const layoutHostFooter = (node: HTMLButtonElement) => {
        const parent = node.parentElement
        if (!(parent instanceof HTMLElement)) return

        const previous = {
            display: parent.style.display,
            justifyContent: parent.style.justifyContent,
            alignItems: parent.style.alignItems,
        }

        parent.style.display = "flex"
        parent.style.justifyContent = "space-between"
        parent.style.alignItems = "center"

        return () => {
            parent.style.display = previous.display
            parent.style.justifyContent = previous.justifyContent
            parent.style.alignItems = previous.alignItems
        }
    }
</script>

<!-- Inline styles for browser-extension UI injection to keep specificity high
     and avoid conflicts with host page styles. -->
{#if version === "redesign"}
    <!-- Centered, content-width action in a padded, separated footer so it sits
         cleanly at the bottom of the Reading Preferences dialog. -->
    <div
        style="display: flex; justify-content: center; padding: 16px 24px 20px; margin-top: 8px; border-top: 1px solid rgba(127, 127, 127, 0.25);">
        <button id="settingsButton" class={className} onclick={handleClick}>
            <i class="fa-solid fa-gear" style="margin-right: 0.4em;"></i
            >RoyalRefresh Settings
        </button>
    </div>
{:else}
    <button
        {@attach layoutHostFooter}
        id="settingsButton"
        class={className}
        style="margin-right: auto; margin-left: 0px;"
        onclick={handleClick}>
        <i class="fa fa-cog" style="margin-right: 0.2em;"></i>Open RoyalRefresh
        Settings
    </button>
{/if}
