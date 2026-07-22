export * from "./types"
export { BaseAdapter } from "./base-adapter"
export { LegacyAdapter } from "./legacy-adapter"
export {
    RedesignAdapter,
    REDESIGN_SELECTORS,
    REDESIGN_HOST_CLASSES,
} from "./redesign-adapter"
export {
    isRedesign,
    resolveAdapter,
    getActiveSelectors,
    resolveActiveSelectors,
    buildPageContext,
    type PageContext,
} from "./resolve"
