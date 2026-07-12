# RoyalRoad "Redesign (beta)" support — map & removal guide

RoyalRoad is rolling out a Tailwind-based redesign (codename *remaster*), gated by the
`beta-ui-v2=always` cookie and detected via the `#chapterHeroData` element. This support
is **temporary**: eventually the redesign becomes the only UI (legacy dies) or is
reverted (redesign dies). Everything redesign-specific is deliberately concentrated so
either outcome is a short, mechanical change. This file is that checklist.

## Where the redesign lives

Version-agnostic code (the `UiAdapter` interface, `BaseAdapter`, `LegacyAdapter`,
`resolve.ts`, and all services/components) is **not** redesign-specific — it stays.

Redesign-specific touchpoints:

| Concern | Location |
| ------- | -------- |
| Selectors, host classes, primary-button CSS, default cookie | `redesign-adapter.ts` (exported consts — single source of truth) |
| Nav-bar mount quirks (`prepareReadingPrefsCluster`) | `redesign-adapter.ts` (`RedesignAdapter`) |
| Layout-cookie helpers (`applyLayoutCookie` etc.) | `beta-cookie.ts` |
| Detection (`#chapterHeroData` sentinel + cookie fallback) | `resolve.ts` (`isRedesign`) |
| By-version maps referencing redesign consts | `config/defaults.ts` (`HOST_CLASSES_BY_VERSION`, `DEFAULT_SELECTORS_BY_VERSION`) |
| `betaCookie` setting + startup/watch sync | `types/types.ts`, `config/defaults.ts` (`DEFAULTS`), `entrypoints/background.ts` |
| Optional `cookies` permission | `wxt.config.ts` (`optional_permissions`) |
| Layout switch (main settings) | `components/settings/BasicSettings.svelte` (mode select + permission request) |
| Editable cookie name/values (advanced) | `components/settings/AdvancedSettings.svelte` |
| Migration adding `betaCookie` | `utils/migrations.ts` (`migrateV3toV4`) |
| Tests | `adapters/adapters.unit.test.ts`, `adapters/beta-cookie.unit.test.ts`, redesign rows in other unit tests |

### The gating cookie (verified live 2026-07-12)

RoyalRoad reads `beta-ui-v2`: value `always` → redesign, `never` → classic. Its own
"Revert To Legacy UI" link hits `/home/reverttolegacyui` which sets `never` — so simply
**removing** the cookie does *not* revert (RoyalRoad may keep serving the beta); you must
set `never` to force classic. Hence the two `betaCookie.mode`s: `redesign` (`always`) and
`classic` (`never`). Values live in `DEFAULT_BETA_COOKIE` and are user-editable in
Advanced Settings. `BasicSettings` seeds the selector from the live cookie on open
(`readBetaCookie`), so it reflects what RoyalRoad is actually serving rather than a stale
stored value.

**Scope matters.** RoyalRoad's server sets its own *host-only* `beta-ui-v2` cookie that
out-ranks a single domain-scoped cookie we write (verified: a lingering host-only
`always` keeps the redesign on even after we set domain `never`). So `beta-cookie.ts`
enumerates and removes **every** `beta-ui-v2` scope via `cookies.getAll`/`remove` before
setting ours — that's why the feature needs `cookies.getAll`, not just `set`/`remove`.
The cookie is applied purely from the saved setting (no dev auto-force).

## Scenario A — redesign is reverted (delete it)

1. Delete `redesign-adapter.ts` and `beta-cookie.ts`.
2. `index.ts`: drop the `RedesignAdapter` / redesign-const / beta-cookie re-exports.
3. `resolve.ts`: collapse `isRedesign` to always-`false` (or inline `LegacyAdapter`) and
   remove the `#chapterHeroData` / cookie checks.
4. `config/defaults.ts`: remove the redesign imports and the `redesign` entries from
   `HOST_CLASSES_BY_VERSION` / `DEFAULT_SELECTORS_BY_VERSION`; drop `betaCookie` from
   `DEFAULTS`.
5. `types/types.ts`: remove `BetaCookieSettings` / `BetaLayoutMode` and the `betaCookie`
   field; consider collapsing `UiVersion` to just `"legacy"` (then `selectorOverrides` is
   single-keyed — add a flattening migration).
6. `background.ts`: delete the `syncBetaCookie` block and its imports.
7. `wxt.config.ts`: drop `optional_permissions: ["cookies"]`.
8. `BasicSettings.svelte`: remove the "RoyalRoad layout" select + `onLayoutChange`.
   `AdvancedSettings.svelte`: remove the "Redesign (beta) cookie" section.
9. Delete redesign rows/cases in the unit tests, and delete this file.

## Scenario B — redesign becomes the only UI

1. Promote `REDESIGN_SELECTORS` / `REDESIGN_HOST_CLASSES` to the sole defaults; delete
   `legacy-adapter.ts` and the legacy consts in `config/defaults.ts`.
2. Fold `RedesignAdapter`'s overrides into `BaseAdapter` (or make it the base) and
   simplify `resolveAdapter` to always return it.
3. Collapse `UiVersion` to a single value; flatten `selectorOverrides` with a migration.
4. Keep `beta-cookie.ts` + the `betaCookie` setting only if forcing the cookie is still
   useful; otherwise remove per Scenario A steps 6–8.

## Updating (not removing)

If RoyalRoad only tweaks the redesign DOM, edit **one** const block
(`REDESIGN_SELECTORS`) and, for nav-bar layout changes, `prepareReadingPrefsCluster` in
`redesign-adapter.ts`. If it renames the gating cookie or changes its values, users can
fix it live via the editable cookie name / redesign value / classic value in Advanced
Settings; update `DEFAULT_BETA_COOKIE` for the next release.
