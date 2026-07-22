// Layout-agnostic surface. Deliberately does NOT re-export the concrete
// adapters or their constants: consumers that needed those by name would each
// become a place to edit when a layout is dropped. `registry.ts` is the only
// module that names them; tests import them from their own files, which are
// deleted along with the layout.
export * from "./types"
export { BaseAdapter } from "./base-adapter"
export {
    ADAPTERS,
    DEFAULT_SELECTORS_BY_VERSION,
    emptyOverrides,
    FALLBACK_ADAPTER,
    type UiVersion,
} from "./registry"
export {
    resolveAdapter,
    getActiveSelectors,
    resolveActiveSelectors,
    buildPageContext,
    type PageContext,
} from "./resolve"
