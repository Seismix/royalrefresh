export * from "./types"
export { BaseAdapter } from "./base-adapter"
export { LegacyAdapter } from "./legacy-adapter"
export {
    RedesignAdapter,
    REDESIGN_SELECTORS,
    REDESIGN_HOST_CLASSES,
    DEFAULT_BETA_COOKIE,
} from "./redesign-adapter"
export {
    applyLayoutCookie,
    readBetaCookie,
    hasCookiesPermission,
    requestCookiesPermission,
} from "./beta-cookie"
export {
    isRedesign,
    resolveAdapter,
    getActiveSelectors,
    resolveActiveSelectors,
    buildPageContext,
    type PageContext,
} from "./resolve"
