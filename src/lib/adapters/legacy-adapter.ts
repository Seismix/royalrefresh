import type { ExtensionSelectors, HostClasses } from "~/types/types"
import {
    HOST_CLASSES_BY_VERSION,
    LEGACY_SELECTORS,
} from "~/lib/config/defaults"
import { BaseAdapter } from "./base-adapter"

/** Adapter for the legacy (pre-redesign) RoyalRoad layout. */
export class LegacyAdapter extends BaseAdapter {
    readonly id = "legacy" as const
    readonly defaultSelectors: ExtensionSelectors = LEGACY_SELECTORS
    readonly hostClasses: HostClasses = HOST_CLASSES_BY_VERSION.legacy
}
