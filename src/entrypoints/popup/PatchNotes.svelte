<script lang="ts">
    import type { Snippet } from "svelte"
    import { slide } from "svelte/transition"
    import { tick } from "svelte"
    import { PageHeader } from "~/components/layout"
    import { ChevronDownIcon, MegaphoneIcon, ToolsIcon, JournalIcon } from "~/components/icons"
    import { getSettings } from "~/lib/utils/storage-utils"
    import type { ExtensionSettings } from "~/types/types"

    interface Props {
        headerButtons?: Snippet
    }

    let { headerButtons }: Props = $props()

    let settings = $state<ExtensionSettings | null>(null)

    // Load settings on mount
    getSettings().then((loadedSettings) => {
        settings = loadedSettings
    })

    type PatchNote = {
        version: string
        releasedOn: string
        summary: string
        new?: string[]
        fixes?: string[]
    }

    // Eagerly loaded at build time - safe to use at module level
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

    // Track expanded state for each patch note
    let expandedStates = $state<Record<string, boolean>>(
        patchNotes.reduce(
            (acc, note, index) => {
                // Only the first (most recent) patch note is expanded by default
                acc[note.version] = index === 0
                return acc
            },
            {} as Record<string, boolean>,
        ),
    )

    // Store references to article elements
    let articleRefs = $state<Record<string, HTMLElement | null>>({})

    const toggleExpanded = async (version: string) => {
        const wasExpanded = expandedStates[version]
        expandedStates[version] = !expandedStates[version]

        // If we're expanding (not collapsing), scroll into view after the DOM updates
        if (!wasExpanded && settings) {
            await tick()
            const article = articleRefs[version]
            if (article) {
                article.scrollIntoView({
                    behavior: settings.scrollBehavior || "smooth",
                    block: "nearest"
                })
            }
        }
    }
</script>

<div class="patch-notes-content">
    <PageHeader title="What's New" variant="patch-notes">
        {#snippet buttons()}
            {#if headerButtons}
                {@render headerButtons()}
            {/if}
        {/snippet}
    </PageHeader>

    <p class="description">Latest updates & improvements</p>
    <section aria-label="Recent updates" class="updates">
        {#if patchNotes.length === 0}
            <p class="empty-state">No updates available yet.</p>
        {:else}
            {#each patchNotes as update (update.version)}
                {@const isExpanded = expandedStates[update.version]}
                <article class="update-card" bind:this={articleRefs[update.version]}>
                    <button
                        type="button"
                        class="update-card__header"
                        onclick={() => toggleExpanded(update.version)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded
                            ? `Collapse version ${update.version}`
                            : `Expand version ${update.version}`}>
                        <div class="version-badge">
                            <JournalIcon variant="primary" />
                            <span>v{update.version}</span>
                        </div>
                        <span class="update-card__date"
                            >{update.displayDate}</span>
                        <div class="expand-icon" class:expanded={isExpanded}>
                            <ChevronDownIcon />
                        </div>
                    </button>
                    {#if isExpanded}
                        <div
                            class="update-card__content"
                            transition:slide|global={{
                                duration: 0,
                            }}>
                            <p class="update-card__summary">{update.summary}</p>
                            {#if update.new && update.new.length > 0}
                                <div class="section new-section">
                                    <div class="section-header">
                                        <MegaphoneIcon variant="success" />
                                        <h4>New Features</h4>
                                    </div>
                                    <ul class="update-card__list">
                                        {#each update.new as item, index (index)}
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
                                        {#each update.fixes as item, index (index)}
                                            <li>{item}</li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}
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
        height: 100%;
        min-height: 0; /* Important for flex overflow */
    }

    .description {
        margin: 0;
        color: var(--color-text-secondary, var(--color-text));
        font-size: 0.85rem;
        line-height: 1.4;
        opacity: 0.8;
        flex-shrink: 0;
    }

    .updates {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: stretch;
        flex: 1;
        min-height: 0; /* Important for flex overflow */
        overflow-y: auto;
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
        overflow: visible;
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
        background: transparent;
        border: none;
        padding: var(--spacing-sm);
        margin: calc(var(--spacing-sm) * -1);
        width: calc(100% + var(--spacing-sm) * 2);
        min-height: 44px;
        cursor: pointer;
        color: inherit;
        font-family: inherit;
        text-align: left;
        transition: opacity 0.2s ease;
    }

    .update-card__header:hover {
        opacity: 0.8;
        background: rgba(0, 0, 0, 0.02);
    }

    .update-card__header:active {
        background: rgba(0, 0, 0, 0.04);
    }

    .update-card__header:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-radius: 8px;
    }

    .expand-icon {
        flex-shrink: 0;
        color: var(--color-text-muted, var(--color-text));
        opacity: 0.6;
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    @media (prefers-reduced-motion: reduce) {
        .expand-icon {
            transition: none;
        }
    }

    .expand-icon.expanded {
        transform: rotate(180deg);
    }

    .update-card__content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-sm);
        will-change: height;
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
        margin-left: auto;
        margin-right: var(--spacing-xs);
    }

    .update-card__summary {
        margin: 0;
        margin-top: var(--spacing-sm);
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
