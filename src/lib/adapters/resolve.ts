import type { ExtensionSelectors, ExtensionSettings } from "~/types/types"
import { LegacyAdapter } from "./legacy-adapter"
import { RedesignAdapter } from "./redesign-adapter"
import type { UiAdapter } from "./types"

const legacyAdapter = new LegacyAdapter()
const redesignAdapter = new RedesignAdapter()

/**
 * Detect whether a document uses the redesign UI. Primary signal is the
 * redesign-only `#chapterHeroData` element (value-agnostic, works on fetched
 * documents too); the `beta-ui-v2` cookie is a confirmatory fallback for the
 * live page.
 */
export function isRedesign(doc: Document = document): boolean {
    if (doc.querySelector("#chapterHeroData")) return true

    const isLiveDocument = typeof document !== "undefined" && doc === document
    if (isLiveDocument && document.cookie.includes("beta-ui-v2=always")) {
        return true
    }

    return false
}

/** Resolve the adapter for a given document (defaults to the live page). */
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
