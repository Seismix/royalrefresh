<script lang="ts">
    import { recapState } from "~/lib/recap-state.svelte";
    import { extensionState } from "~/lib/extension-state.svelte";
    import { ContentService } from "~/lib/content-service";

    let {
        type = "recap",
    }: {
        type?: "recap" | "blurb";
    } = $props();

    const handleToggle = async () => {
        recapState.toggle();
        
        // If we're now in loading state, fetch content
        if (recapState.visibility === "loading") {
            await ContentService.handleToggle(extensionState.settings);
        }
    };

    const buttonText = $derived(type === "recap" ? "Recap" : "Blurb");
    const iconName = $derived(type === "recap" ? "book" : "info-circle");
    const buttonId = $derived(type === "recap" ? "recapButton" : "blurbButton");
</script>

<button class="btn btn-primary btn-circle" onclick={handleToggle} id={buttonId}>
    <i class="fa fa-{iconName}" style="margin-right: 0.15em;"></i>
    <span>{recapState.toggleText}</span>{buttonText}
</button>
