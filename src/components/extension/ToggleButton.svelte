<script lang="ts">
    import { recapState } from "~/lib/state/recap-state.svelte";
    import { extensionState } from "~/lib/state/extension-state.svelte";
    import { ContentManager } from "~/lib/services/content-manager";

    let {
        type = "recap",
    }: {
        type?: "recap" | "blurb";
    } = $props();

    const handleToggle = async () => {
        // If we're currently visible, just toggle to hide
        if (recapState.visibility === "visible") {
            recapState.hide();
            return;
        }

        // If we have content, just show it
        if (recapState.content) {
            recapState.show();
            return;
        }

        // If we don't have content, fetch it first then show
        const result = type === "recap"
            ? await ContentManager.fetchRecap(extensionState.settings)
            : await ContentManager.fetchBlurb(extensionState.settings);

        if ('error' in result) {
            recapState.setError(result.error);
        } else {
            recapState.setContent(result.content, result.type);
        }
    };

    const buttonText = type === "recap" ? "Recap" : "Blurb";
    const iconName = type === "recap" ? "book" : "info-circle";
    const buttonId = type === "recap" ? "recapButton" : "blurbButton";
</script>

<button class="btn btn-primary btn-circle" onclick={handleToggle} id={buttonId}>
    <i class="fa fa-{iconName}" style="margin-right: 0.15em;"></i>
    <span>{recapState.toggleText}</span>{buttonText}
</button>
