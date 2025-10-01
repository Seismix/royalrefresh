<script lang="ts">
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

<main>
    <header>
        <h1>RoyalRefresh Patch Notes</h1>
        <p>
            Stay in the loop with the latest improvements and fixes to your
            RoyalRefresh experience.
        </p>
    </header>

    <section aria-label="Recent updates" class="updates">
        {#if patchNotes.length === 0}
            <p class="empty-state">
                No patch notes available yet. Check back soon for updates.
            </p>
        {:else}
            {#each patchNotes as update}
                <article class="update-card">
                    <header class="update-card__header">
                        <h2>Version {update.version}</h2>
                        <span class="update-card__date"
                            >{update.displayDate}</span>
                    </header>
                    <p class="update-card__summary">{update.summary}</p>
                    {#if update.new && update.new.length > 0}
                        <h3>New</h3>
                        <ul class="update-card__list">
                            {#each update.new as item}
                                <li>{item}</li>
                            {/each}
                        </ul>
                    {/if}

                    {#if update.fixes && update.fixes.length > 0}
                        <h3>Fixes</h3>
                        <ul class="update-card__list">
                            {#each update.fixes as item}
                                <li>{item}</li>
                            {/each}
                        </ul>
                    {/if}
                </article>
            {/each}
        {/if}
    </section>
</main>

<style>
    @import "~/lib/styles/tokens.css";
    @import "~/lib/styles/forms.css";

    :global(body) {
        font-family: var(--font-family);
        background-color: var(--bg-secondary);
        color: var(--color-text);
        margin: 0;
        padding: 0;
        overflow-x: hidden;
    }

    main {
        inline-size: min(100%, 1120px);
        margin: 0 auto;
        padding-block: clamp(var(--spacing-lg), 4vw, var(--spacing-xxl));
        padding-inline: clamp(var(--spacing-lg), 6vw, var(--spacing-xxl));
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
    }

    header {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        text-align: center;
    }

    h1 {
        margin: 0;
        font-size: clamp(1.5rem, 2.5vw + 1rem, 2.5rem);
        color: var(--color-text);
    }

    p {
        margin: 0;
        color: var(--color-text-secondary, var(--color-text));
        font-size: clamp(1rem, 1vw + 0.85rem, 1.1rem);
    }

    .updates {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
        align-items: stretch;
    }

    .update-card {
        background-color: var(--bg-primary);
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
        padding: clamp(var(--spacing-lg), 2vw, var(--spacing-xxl));
        inline-size: min(100%, 960px);
        margin-inline: auto;
        box-sizing: border-box;
        display: grid;
        gap: var(--spacing-md);
    }

    .update-card__header {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-xs);
    }

    .update-card__header h2 {
        margin: 0;
        font-size: clamp(1.25rem, 2vw + 1rem, 1.75rem);
        color: var(--color-text);
    }

    .update-card__date {
        font-size: 0.9rem;
        color: var(--color-text-muted, var(--color-text));
    }

    .update-card__summary {
        margin: 0;
        font-size: clamp(1rem, 1vw + 0.9rem, 1.15rem);
    }

    h3 {
        margin: var(--spacing-sm) 0;
        font-size: clamp(1.1rem, 1vw + 1rem, 1.25rem);
        color: var(--color-text);
    }

    .update-card__list {
        margin: 0;
        padding-left: var(--spacing-2xl);
        display: grid;
        gap: var(--spacing-xs);
        font-size: clamp(0.95rem, 1vw + 0.85rem, 1.1rem);
        color: var(--color-text);
    }

    .empty-state {
        margin: 0;
        padding: clamp(var(--spacing-lg), 2vw, var(--spacing-xxl));
        background-color: var(--bg-primary);
        border-radius: var(--border-radius);
        border: 1px dashed var(--border-color);
        text-align: center;
        color: var(--color-text-secondary, var(--color-text));
    }

    @media (min-width: 1024px) {
        main {
            inline-size: clamp(640px, 80vw, 1280px);
            gap: var(--spacing-xxl);
        }

        .update-card {
            padding: clamp(
                var(--spacing-lg),
                1.5vw,
                calc(var(--spacing-xxl) * 1.25)
            );
            inline-size: min(100%, 1024px);
        }
        .updates {
            gap: var(--spacing-xxl);
        }
    }
</style>
