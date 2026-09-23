import type { ExtensionSelectors, ExtensionSettings } from "~/types/types"
import { ADAPTERS, FALLBACK_ADAPTER } from "./registry"
import type { UiAdapter } from "./types"

/**
 * Resolve the adapter for a given document (defaults to the live page) by asking
 * each one, in registry order, whether it recognises the page.
 *
 * The extension deliberately does NOT decide which layout RoyalRoad serves — it
 * adapts to whichever one arrived, judged from the rendered DOM rather than from
 * RoyalRoad's `rr_ui_mode` cookie: the page is what it is, a cookie only records
 * what was once asked for.
 *
 * NOTE: layout sentinels generally exist only on chapter pages, so passing a
 * fetched *fiction overview* document here falls through to the fallback
 * adapter. Callers should build the context from the live chapter page and reuse
 * it for fetched documents — as `ContentManager` does.
 */
export function resolveAdapter(doc: Document = document): UiAdapter {
    return ADAPTERS.find((adapter) => adapter.detect(doc)) ?? FALLBACK_ADAPTER
}

/** Merge an adapter's built-in selectors with the user's per-layout overrides.
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
