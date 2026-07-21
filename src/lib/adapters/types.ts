import type { ExtensionSelectors, HostClasses, UiVersion } from "~/types/types"

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
 * Encapsulates everything that differs between RoyalRoad UI versions: the
 * default selectors, the DOM-extraction quirks, and where injected UI mounts.
 * Version-agnostic services (ContentManager, ContentProcessor, content.ts)
 * depend on this interface rather than on raw selector strings.
 */
export interface UiAdapter {
    readonly id: UiVersion
    readonly defaultSelectors: ExtensionSelectors
    /** Host CSS classes for injected buttons (native look per UI version). */
    readonly hostClasses: HostClasses

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
