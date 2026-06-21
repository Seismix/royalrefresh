import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

// Loads the hand-built HTML fixtures as strings. Used by Vitest unit tests
// (ContentProcessor / ContentManager) and reusable by Playwright E2E for
// context.route fulfilment. Reading from disk keeps a single source of truth.
const here = dirname(fileURLToPath(import.meta.url))

const read = (name: string) => readFileSync(join(here, name), "utf-8")

export const chapterPageHtml = read("chapter-page.html")
export const prevChapterHtml = read("prev-chapter.html")
export const fictionOverviewHtml = read("fiction-overview.html")
