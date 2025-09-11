<script lang="ts">
    import { onMount } from "svelte"
    import { getSettings } from "~/lib/utils/storage-utils"

    let buttonElement: HTMLButtonElement

    const handleClick = async () => {
        browser.runtime.sendMessage({ action: "openExtensionSettings" })

        // Close the settings modal if it's open
        const settings = await getSettings()
        const closeButton = document.querySelector(settings.closeButtonSelector)
        if (closeButton && closeButton instanceof HTMLButtonElement) {
            closeButton.click()
        }
    }

    onMount(() => {
        // Style the parent container to properly display the settings button
        const parent = buttonElement?.parentElement
        if (parent && parent instanceof HTMLElement) {
            parent.style.display = "flex"
            parent.style.justifyContent = "space-between"
            parent.style.alignItems = "center"
        }
    })
</script>

<!-- Using inline styles for browser extension UI injection to ensure highest CSS specificity
     and avoid conflicts with host page styles or Svelte's scoped CSS -->
<button
    bind:this={buttonElement}
    id="settingsButton"
    class="btn btn-primary btn-circle red"
    style="margin-right: auto; margin-left: 0px;"
    onclick={handleClick}>
    <i class="fa fa-cog" style="margin-right: 0.2em;"></i>Open RoyalRefresh
    Settings
</button>
