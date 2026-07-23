import type { ExtensionSelectors, SelectorOverrides } from "~/types/types"
import { LegacyAdapter } from "./legacy-adapter"
import { RedesignAdapter } from "./redesign-adapter"

/**
 * Every RoyalRoad layout the extension supports, in DETECTION ORDER: the first
 * adapter whose `detect()` accepts the document wins, and the LAST entry is the
 * fallback, so its `detect()` must accept any document.
 *
 * The only place in `src/` that names a layout: `UiVersion`, the by-layout maps,
 * `emptyOverrides()`, `resolveAdapter()` and the Advanced Settings picker all
 * derive from this array. Removing a layout is therefore its adapter file plus
 * the line below, with no storage migration — `selectorOverrides` is keyed by
 * adapter id, so a departed layout's overrides sit unread.
 *
 * (`utils/migrations.ts` is the deliberate exception: it spells layout keys out
 * literally, because migrations must not track the live registry.)
 */
export const ADAPTERS = [new RedesignAdapter(), new LegacyAdapter()] as const

/** The layout used when no adapter recognises the page. */
export const FALLBACK_ADAPTER = ADAPTERS[ADAPTERS.length - 1]

/** Ids of the layouts the extension currently ships, derived from `ADAPTERS`. */
export type UiVersion = (typeof ADAPTERS)[number]["id"]

/** Built-in default selectors per layout. */
export const DEFAULT_SELECTORS_BY_VERSION = Object.fromEntries(
    ADAPTERS.map((adapter) => [adapter.id, adapter.defaultSelectors]),
) as Record<UiVersion, ExtensionSelectors>

/** A fresh, empty selector-override bucket for each shipped layout. */
export function emptyOverrides(): Record<string, SelectorOverrides> {
    return Object.fromEntries(ADAPTERS.map((adapter) => [adapter.id, {}]))
}
