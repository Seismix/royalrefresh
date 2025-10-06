<script lang="ts">
    import type { Snippet } from "svelte"
    import MegaphoneIcon from "~/components/icons/MegaphoneIcon.svelte"
    import ToolsIcon from "~/components/icons/ToolsIcon.svelte"
    import JournalIcon from "~/components/icons/JournalIcon.svelte"

    interface Props {
        headerButtons?: Snippet
    }

    let { headerButtons }: Props = $props()

    type PatchNote = {
        version: string
        releasedOn: string
        summary: string
        new?: string[]
        fixes?: string[]
    }

    const patchModules = import.meta.glob<PatchNote>(
        "~/assets/patches/*.json",
        {
            eager: true,
            import: "default",
        },
    )

    const formatDate = (isoDate: string) => {
        const date = new Date(isoDate)
        if (Number.isNaN(date.getTime())) return isoDate

        return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(
            date,
        )
    }

    const patchNotes = Object.values(patchModules)
        .map((note) => ({
            ...note,
            displayDate: formatDate(note.releasedOn),
        }))
        .sort(
            (a, b) =>
                new Date(b.releasedOn).getTime() -
                new Date(a.releasedOn).getTime(),
        )
</script>

<div class="patch-notes-content">
    <header class="patch-notes-header">
        <h2>What's New</h2>
        {#if headerButtons}
            <div class="header-buttons">
                {@render headerButtons()}
            </div>
        {/if}
    </header>
    <p class="description">Latest updates & improvements</p>
    <section aria-label="Recent updates" class="updates">
        {#if patchNotes.length === 0}
            <p class="empty-state">No updates available yet.</p>
        {:else}
            {#each patchNotes as update}
                <article class="update-card">
                    <div class="update-card__header">
                        <div class="version-badge">
                            <JournalIcon variant="primary" />
                            <span>v{update.version}</span>
                        </div>
                        <span class="update-card__date"
                            >{update.displayDate}</span>
                    </div>
                    <p class="update-card__summary">{update.summary}</p>
                    {#if update.new && update.new.length > 0}
                        <div class="section new-section">
                            <div class="section-header">
                                <MegaphoneIcon variant="success" />
                                <h4>New Features</h4>
                            </div>
                            <ul class="update-card__list">
                                {#each update.new as item}
                                    <li>{item}</li>
                                {/each}
                            </ul>
                        </div>
                    {/if}

                    {#if update.fixes && update.fixes.length > 0}
                        <div class="section fixes-section">
                            <div class="section-header">
                                <ToolsIcon variant="error" />
                                <h4>Bug Fixes</h4>
                            </div>
                            <ul class="update-card__list">
                                {#each update.fixes as item}
                                    <li>{item}</li>
                                {/each}
                            </ul>
                        </div>
                    {/if}
                </article>
            {/each}
        {/if}
    </section>
</div>

<style>
    @import "~/lib/styles/tokens.css";

    .patch-notes-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
    }

    .patch-notes-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 2rem;
        margin: 0;
    }

    h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--color-text);
        flex: 1;
    }

    .header-buttons {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        height: 100%;
    }

    .description {
        margin: 0;
        color: var(--color-text-secondary, var(--color-text));
        font-size: 0.85rem;
        line-height: 1.4;
        opacity: 0.8;
    }

    .updates {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: stretch;
    }

    .update-card {
        background: linear-gradient(
            135deg,
            var(--bg-primary) 0%,
            var(--bg-primary) 100%
        );
        border-radius: 12px;
        border: 1px solid var(--border-color);
        padding: var(--spacing-md);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transition: all 0.2s ease;
    }

    .update-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
    }

    .update-card__header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: var(--spacing-xs);
    }

    .version-badge {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--color-primary);
        letter-spacing: -0.01em;
    }

    .update-card__date {
        font-size: 0.7rem;
        color: var(--color-text-muted, var(--color-text));
        opacity: 0.6;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .update-card__summary {
        margin: 0;
        font-size: 0.85rem;
        line-height: 1.5;
        color: var(--color-text);
        font-weight: 500;
    }

    .section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        margin-top: var(--spacing-md);
    }

    .section-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }

    h4 {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--color-text);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        opacity: 0.9;
    }

    .update-card__list {
        margin: 0;
        padding-left: var(--spacing-lg);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        font-size: 0.8rem;
        line-height: 1.5;
        color: var(--color-text);
    }

    .update-card__list li {
        margin: 0;
        padding-left: var(--spacing-xs);
        opacity: 0.9;
    }

    .update-card__list li::marker {
        color: var(--color-text-muted, var(--color-text));
        opacity: 0.5;
    }

    .empty-state {
        margin: 0;
        padding: var(--spacing-xl);
        background-color: var(--bg-primary);
        border-radius: 12px;
        border: 1px dashed var(--border-color);
        text-align: center;
        color: var(--color-text-secondary, var(--color-text));
        font-size: 0.85rem;
        opacity: 0.8;
    }
</style>
