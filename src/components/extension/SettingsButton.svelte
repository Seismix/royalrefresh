<script lang="ts">
    import { extensionState } from "~/lib/extension-state.svelte";

    const handleClick = () => {
        browser.runtime.sendMessage({ action: "openExtensionSettings" });

        // Close the settings modal if it's open  
        const closeButton = document.querySelector(
            extensionState.settings.closeButtonSelector,
        );
        if (closeButton && closeButton instanceof HTMLButtonElement) {
            closeButton.click();
        }
    };
</script>

<!-- Using inline styles for browser extension UI injection to ensure highest CSS specificity 
     and avoid conflicts with host page styles or Svelte's scoped CSS -->
<button 
    id="settingsButton"
    class="btn btn-primary btn-circle red"
    style="margin-right: auto; margin-left: 0px;"
    onclick={handleClick}
>
    <i class="fa fa-cog" style="margin-right: 0.2em;"></i>Open RoyalRefresh Settings
</button>
