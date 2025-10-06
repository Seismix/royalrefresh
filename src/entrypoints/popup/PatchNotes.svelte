<script lang="ts">
    import type { Snippet } from "svelte"

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
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                fill="currentColor"
                                class="version-icon"
                                viewBox="0 0 16 16">
                                <path
                                    d="M5 10.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5" />
                                <path
                                    d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2" />
                                <path
                                    d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z" />
                            </svg>
                            <span>v{update.version}</span>
                        </div>
                        <span class="update-card__date"
                            >{update.displayDate}</span>
                    </div>
                    <p class="update-card__summary">{update.summary}</p>
                    {#if update.new && update.new.length > 0}
                        <div class="section new-section">
                            <div class="section-header">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    fill="currentColor"
                                    class="section-icon"
                                    viewBox="0 0 16 16">
                                    <path
                                        d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                    <path
                                        d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                                </svg>
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
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    fill="currentColor"
                                    class="section-icon"
                                    viewBox="0 0 16 16">
                                    <path
                                        d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                    <path
                                        d="M11.354 4.646a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L5 10.293l5.646-5.647a.5.5 0 0 1 .708 0" />
                                </svg>
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

    .version-icon {
        flex-shrink: 0;
        display: block;
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

    .section-icon {
        display: block;
        flex-shrink: 0;
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

    .new-section .section-icon {
        color: var(--color-error);
    }

    .fixes-section .section-icon {
        color: var(--color-success);
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
