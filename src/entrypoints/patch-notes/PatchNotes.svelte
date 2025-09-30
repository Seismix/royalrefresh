<script lang="ts">
    const sampleUpdates = [
        {
            version: "1.3.0",
            date: "September 30, 2025",
            summary: "Introduced a dedicated patch notes page and refreshed UI components.",
            changes: [
                "Adds a dedicated Patch Notes view directly accessible from the extension popup",
                "Improves responsive layout spacing across small and large screens",
                "Prepares infrastructure for richer release documentation",
            ],
        },
    ]
</script>

<main>
    <header>
        <h1>RoyalRefresh Patch Notes</h1>
        <p>Stay in the loop with the latest improvements and fixes to your RoyalRefresh experience.</p>
    </header>

    <section aria-label="Recent updates" class="updates">
        {#each sampleUpdates as update}
            <article class="update-card">
                <header class="update-card__header">
                    <h2>Version {update.version}</h2>
                    <span class="update-card__date">{update.date}</span>
                </header>
                <p class="update-card__summary">{update.summary}</p>
                <ul class="update-card__list">
                    {#each update.changes as change}
                        <li>{change}</li>
                    {/each}
                </ul>
            </article>
        {/each}
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
        transition:
            background-color var(--transition-slow),
            color var(--transition-slow);
    }

    main {
        inline-size: min(100%, var(--container-width));
        margin: 0 auto;
        padding: clamp(var(--spacing-lg), 4vw, var(--spacing-xxl));
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
        display: grid;
        gap: var(--spacing-lg);
    }

    .update-card {
        background-color: var(--bg-primary);
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
        padding: clamp(var(--spacing-lg), 2vw, var(--spacing-xxl));
        box-shadow: var(--shadow-sm);
        display: grid;
        gap: var(--spacing-md);
        transition:
            border-color var(--transition-normal),
            box-shadow var(--transition-normal);
    }

    .update-card:hover {
        border-color: var(--color-primary);
        box-shadow: var(--shadow-md);
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

    .update-card__list {
        margin: 0;
        padding-left: var(--spacing-lg);
        display: grid;
        gap: var(--spacing-xs);
        font-size: clamp(0.95rem, 1vw + 0.85rem, 1.1rem);
        color: var(--color-text);
    }

    @media (min-width: 768px) {
        .updates {
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }

        header {
            text-align: left;
        }
    }
</style>
