import type { ExtensionSelectors, HostChrome } from "~/types/types"

/** Result object convention used across services: data on success, error string otherwise. */
export type Result<T> = { data: T } | { error: string }

/** Appended to selector-failure messages — these usually mean RoyalRoad changed
 * its page layout, which the user can flag via the Report button. */
export const LAYOUT_HINT =
    "RoyalRoad's layout may have changed — please report this with the Report button."

/** Where a mounted component should be inserted relative to its target.
 * `prepend`/`append` insert as the first/last child; `after` inserts as the
 * target's next sibling (used to drop a component below its target rather than
 * inside it). */
export type MountPosition = "prepend" | "append" | "after"

export type MountTarget = {
    target: Element | null
    position: MountPosition
}

/** Resolved mount points for the injected UI pieces on a chapter page. */
export type MountSet = {
    toggle: MountTarget
    settings: MountTarget
    recap: MountTarget
    report: MountTarget
    /** Undoes any host-page restyling `prepareMounts` performed. Present only
     * when an adapter actually mutated the page; register it with
     * `ctx.onInvalidated` so the page is left as found. */
    cleanup?: () => void
}

/** Extracted blurb pieces from a fiction overview document (labels optional). */
export type BlurbParts = {
    labels: HTMLElement | null
    blurb: HTMLElement
}

/**
 * Encapsulates everything that differs between RoyalRoad UI versions: how the
 * layout is recognised, the default selectors, the DOM-extraction quirks, the
 * look of the injected buttons, and where they mount. Version-agnostic code
 * (ContentManager, ContentProcessor, content.ts, every component) depends on
 * this interface rather than on raw selector strings or a layout name — so a
 * layout can be dropped by deleting its adapter and its line in the registry.
 */
export interface UiAdapter {
    /**
     * Stable layout id. Also the key its selector overrides are stored under,
     * so renaming one orphans a user's customisations.
     *
     * Typed `string` rather than `UiVersion` because `UiVersion` is *derived*
     * from the adapter registry — annotating it here would make that derivation
     * circular. Implementations should declare it `as const` so the registry can
     * read the literal back out.
     */
    readonly id: string
    /** Human-readable layout name, shown in the Advanced Settings picker. */
    readonly label: string
    readonly defaultSelectors: ExtensionSelectors

    /** Look of the injected buttons on this layout (classes, styles, labels). */
    readonly chrome: HostChrome

    /**
     * Whether this adapter handles the given document, judged from what was
     * actually rendered. Adapters are tried in registry order and the last one
     * is the fallback, so it must accept any document.
     */
    detect(doc: Document): boolean

    /** Previous-chapter URL from the live document. */
    findPreviousChapterUrl(selectors: ExtensionSelectors): Result<string>
    /** Fiction overview URL from the live document. */
    findFictionOverviewUrl(selectors: ExtensionSelectors): Result<string>
    /** Whether the live document exposes a previous-chapter link. */
    hasPreviousChapter(selectors: ExtensionSelectors): boolean
    /** Fiction title text from the live document. */
    findFictionTitle(selectors: ExtensionSelectors): Result<string>

    /** Previous chapter's title from a fetched document. */
    findChapterName(
        doc: Document,
        selectors: ExtensionSelectors,
    ): Result<string>
    /** Previous chapter's content container from a fetched document. */
    findChapterContentEl(
        doc: Document,
        selectors: ExtensionSelectors,
    ): Result<Element>
    /** Blurb (and optional labels) from a fetched overview document. */
    findBlurb(doc: Document, selectors: ExtensionSelectors): Result<BlurbParts>

    /**
     * Resolve mount points for injected UI on the live chapter page.
     *
     * Named `prepare` rather than `resolve` because an adapter may restyle the
     * host page to make room for the injected UI (see `RedesignAdapter`). Any
     * such mutation must be undone by the returned `MountSet.cleanup`.
     */
    prepareMounts(selectors: ExtensionSelectors): MountSet
}
