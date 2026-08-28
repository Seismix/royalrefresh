# Test fixtures

Small, hand-built, sanitized HTML snapshots used by the test suites.

- `chapter-page.html` — a current chapter page (has the fiction title link and
  the previous-chapter button).
- `prev-chapter.html` — the previous chapter that gets fetched for a recap.
- `fiction-overview.html` — the fiction overview page that gets fetched for a blurb.

Each file is built to match the **exact selectors** of one layout's adapter in
`src/lib/adapters/` — today the legacy layout (`legacy-adapter.ts`). If
RoyalRoad's layout changes and the live `selectors.test.ts` canary starts
failing, refresh these fixtures so the unit/E2E suites keep testing realistic
markup.

Note the split in what covers what: the canary checks **every** registered
layout against the live site, while these fixtures — and so the E2E suite —
still only cover the legacy one. Redesign markup is exercised by the unit tests
in `src/lib/adapters/adapters.unit.test.ts` instead.

These are **representative** fixtures, not byte-for-byte copies of RoyalRoad —
they are intentionally tiny so word-count / truncation behavior is easy to
assert.

## Refreshing from a real page

Use the codegen helper to open a real chapter with the extension loaded:

```powershell
pnpm tsx src/tests/utils/codegen.ts
```

Then copy the relevant subtree (`.chapter-inner`, `.description .hidden-content`,
etc.), trim it down, and **remove any inline scripts/styles/tracking** before
committing. Keep the matching selectors intact.

## Usage

Import the strings via `src/tests/fixtures/index.ts`:

```ts
import { prevChapterHtml, fictionOverviewHtml } from "~/tests/fixtures"
```
