<script lang="ts">
    import { GitHubIcon } from "~/components/icons"
    import type { IconButtonProps } from "~/types/icon-button"

    let { variant = "default" }: Omit<IconButtonProps, "onclick"> = $props()

    const openGitHub = () => {
        window.open(
            "https://github.com/Seismix/royalrefresh",
            "_blank",
            "noopener,noreferrer",
        )
    }
</script>

<button
    aria-label="Open GitHub repository"
    class="icon-button github-button"
    onclick={openGitHub}>
    <GitHubIcon {variant} />
</button>

<style>
    @import "~/lib/styles/icon-button.css";
</style>
