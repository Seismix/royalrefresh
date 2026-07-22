import type { ExtensionSelectors, ExtensionSettings } from "~/types/types"
import { LegacyAdapter } from "./legacy-adapter"
import { RedesignAdapter } from "./redesign-adapter"
import type { UiAdapter } from "./types"

const legacyAdapter = new LegacyAdapter()
const redesignAdapter = new RedesignAdapter()

/**
 * Detect whether a document uses the redesign UI, from the redesign-only
 * `#chapterHeroData` element. Value-agnostic and works on fetched documents too.
 *
 * The extension deliberately does NOT decide which layout RoyalRoad serves — it
 * adapts to whichever one arrived. Detecting from the rendered page rather than
 * from the `beta-ui-v2` cookie also avoids trusting a stale cookie: the sentinel
 * reflects what was actually served, a cookie only what was once requested.
 */
export function isRedesign(doc: Document = document): boolean {
    return !!doc.querySelector("#chapterHeroData")
}

/** Resolve the adapter for a given document (defaults to the live page).
 *
 * NOTE: `#chapterHeroData` only exists on chapter pages, so passing a fetched
 * *fiction overview* document here resolves to legacy even on the redesign.
 * Callers should build the context from the live chapter page and reuse it for
 * fetched documents — as `ContentManager` does. */
export function resolveAdapter(doc: Document = document): UiAdapter {
    return isRedesign(doc) ? redesignAdapter : legacyAdapter
}

/** Merge an adapter's built-in selectors with the user's per-version overrides.
 * Empty/whitespace override values are ignored so a cleared Advanced Settings
 * field falls back to the built-in default. */
export function getActiveSelectors(
    adapter: UiAdapter,
    settings: ExtensionSettings,
): ExtensionSelectors {
    const overrides = settings.selectorOverrides?.[adapter.id] ?? {}
    const cleaned: Partial<ExtensionSelectors> = {}
    for (const [key, value] of Object.entries(overrides)) {
        if (typeof value === "string" && value.trim() !== "") {
            cleaned[key as keyof ExtensionSelectors] = value
        }
    }
    return { ...adapter.defaultSelectors, ...cleaned }
}

export type PageContext = {
    settings: ExtensionSettings
    adapter: UiAdapter
    selectors: ExtensionSelectors
}

/** Resolve the active adapter and selectors for the current page. */
export function buildPageContext(
    settings: ExtensionSettings,
    doc: Document = document,
): PageContext {
    const adapter = resolveAdapter(doc)
    const selectors = getActiveSelectors(adapter, settings)
    return { settings, adapter, selectors }
}

/** Convenience: resolve just the active selectors for the live page. */
export function resolveActiveSelectors(
    settings: ExtensionSettings,
    doc: Document = document,
): ExtensionSelectors {
    return getActiveSelectors(resolveAdapter(doc), settings)
}
