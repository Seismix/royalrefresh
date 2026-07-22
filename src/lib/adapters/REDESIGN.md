# RoyalRoad "Redesign (beta)" support — map & removal guide

RoyalRoad is rolling out a Tailwind-based redesign (codename *remaster*), gated on their
side by the `beta-ui-v2` cookie and detected here via the `#chapterHeroData` element.

The extension does **not** choose which layout RoyalRoad serves — it detects whichever one
arrived and mounts the matching adapter. An earlier build could force the layout by writing
that cookie, which needed the `cookies` permission; that was removed because the permission
is effectively ungrantable on Firefox for Android (no prompt, no reachable UI for a
temporarily-installed add-on), leaving the feature dead there. Users switch layout with
RoyalRoad's own control instead.

This support is **temporary**: eventually the redesign becomes the only UI (legacy dies) or is
reverted (redesign dies). Everything redesign-specific is deliberately concentrated so
either outcome is a short, mechanical change. This file is that checklist.

## Where the redesign lives

Version-agnostic code (the `UiAdapter` interface, `BaseAdapter`, `LegacyAdapter`,
`resolve.ts`, and all services/components) is **not** redesign-specific — it stays.

`prepareMounts` is named `prepare`, not `resolve`, because an adapter may restyle the host
page to make room for the injected UI. Anything it mutates must be undone by the
`MountSet.cleanup` it returns — `content.ts` registers that with `ctx.onInvalidated`, so
disabling or updating the extension leaves RoyalRoad's DOM as it was found.

Redesign-specific touchpoints:

| Concern | Location |
| ------- | -------- |
| Selectors, host classes, primary-button CSS, default cookie | `redesign-adapter.ts` (exported consts — single source of truth) |
| Nav-bar mount quirks + their teardown (`prepareReadingPrefsCluster`) | `redesign-adapter.ts` (`RedesignAdapter`) |
| Report-link placement (after RoyalRoad's own `/report/chapter/` link) | `redesign-adapter.ts` (`REDESIGN_SELECTORS.reportPlacement`) |
| Detection (`#chapterHeroData` sentinel) | `resolve.ts` (`isRedesign`) |
| By-version maps referencing redesign consts | `config/defaults.ts` (`HOST_CLASSES_BY_VERSION`, `DEFAULT_SELECTORS_BY_VERSION`) |
| Tests | `adapters/adapters.unit.test.ts`, redesign rows in other unit tests |

### The gating cookie (informational)

RoyalRoad reads `beta-ui-v2`: `always` → redesign, `never` → classic (what its own "Revert
To Legacy UI" link sets, via `/home/reverttolegacyui`). Removing the cookie does *not*
reliably revert — RoyalRoad may keep serving the beta. The extension only ever reads the
rendered page, never this cookie, so none of that is our concern; it is recorded here
because it is how you put a browser into the redesign to test against.

The cookie is not HttpOnly, so `document.cookie = "beta-ui-v2=always"` on royalroad.com
followed by a reload is enough to switch a dev browser over, logged out included.

## Scenario A — redesign is reverted (delete it)

1. Delete `redesign-adapter.ts`.
2. `index.ts`: drop the `RedesignAdapter` / redesign-const re-exports.
3. `resolve.ts`: collapse `isRedesign` to always-`false` (or inline `LegacyAdapter`) and
   remove the `#chapterHeroData` check.
4. `config/defaults.ts`: remove the redesign imports and the `redesign` entries from
   `HOST_CLASSES_BY_VERSION` / `DEFAULT_SELECTORS_BY_VERSION`.
5. `types/types.ts`: remove `HostClasses.reportLinkStyle` (redesign-only); consider
   collapsing `UiVersion` to just `"legacy"` (then `selectorOverrides` is single-keyed —
   add a flattening migration). Leave `migrations.ts` alone: its snapshots are frozen
   historical schemas, not live defaults.
6. Delete redesign rows/cases in the unit tests, and delete this file.

## Scenario B — redesign becomes the only UI

1. Promote `REDESIGN_SELECTORS` / `REDESIGN_HOST_CLASSES` to the sole defaults; delete
   `legacy-adapter.ts` and the legacy consts in `config/defaults.ts`.
2. Fold `RedesignAdapter`'s overrides into `BaseAdapter` (or make it the base) and
   simplify `resolveAdapter` to always return it.
3. Collapse `UiVersion` to a single value; flatten `selectorOverrides` with a migration.
4. `resolve.ts`: `isRedesign` can become a constant `true`.

## Updating (not removing)

If RoyalRoad only tweaks the redesign DOM, edit **one** const block
(`REDESIGN_SELECTORS`) and, for nav-bar layout changes, `prepareReadingPrefsCluster` in
`redesign-adapter.ts`. Users can also patch selectors live from Advanced Settings, which
keeps a separate set per layout.

If RoyalRoad changes the `#chapterHeroData` sentinel, update `isRedesign` in `resolve.ts` —
that is the single point of detection, and picking the wrong adapter is what breaks first.
