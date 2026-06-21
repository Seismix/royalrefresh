# Test fixtures

Small, hand-built, sanitized HTML snapshots used by the test suites.

- `chapter-page.html` — a current chapter page (has the fiction title link and
  the previous-chapter button).
- `prev-chapter.html` — the previous chapter that gets fetched for a recap.
- `fiction-overview.html` — the fiction overview page that gets fetched for a blurb.

Each file is built to match the **exact selectors** in
`src/lib/config/defaults.ts` (`DEFAULT_SELECTORS`). If RoyalRoad's layout
changes and the live `selectors.test.ts` canary starts failing, refresh these
fixtures so the unit/E2E suites keep testing realistic markup.

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
