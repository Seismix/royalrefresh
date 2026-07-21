import type { ExtensionSelectors, HostClasses, UiVersion } from "~/types/types"
import {
    LAYOUT_HINT,
    type BlurbParts,
    type MountSet,
    type Result,
    type UiAdapter,
} from "./types"

/**
 * Selector-driven implementation shared by all UI versions. Subclasses provide
 * `id` + `defaultSelectors` and override only the pieces that genuinely diverge
 * (e.g. redesign mount resolution).
 */
export abstract class BaseAdapter implements UiAdapter {
    abstract readonly id: UiVersion
    abstract readonly defaultSelectors: ExtensionSelectors
    abstract readonly hostClasses: HostClasses

    findPreviousChapterUrl(selectors: ExtensionSelectors): Result<string> {
        const prevChapterBtn = document.querySelector(selectors.prevChapterBtn)

        if (!(prevChapterBtn instanceof HTMLAnchorElement)) {
            return {
                error: "Could not find previous chapter button. Make sure you're on a chapter page with a previous chapter.",
            }
        }

        if (!prevChapterBtn.href) {
            return {
                error: "Previous chapter button found but has no link. This might be the first chapter.",
            }
        }

        return { data: prevChapterBtn.href }
    }

    findFictionOverviewUrl(selectors: ExtensionSelectors): Result<string> {
        const fictionTitleElement = document.querySelector(
            selectors.fictionTitle,
        )

        if (!fictionTitleElement) {
            return {
                error: `Could not find the story title on this page. ${LAYOUT_HINT}`,
            }
        }

        // The fiction title is wrapped in (or nested under) the overview link.
        // `closest` covers both the legacy parent-anchor and redesign layouts.
        const overviewLink = fictionTitleElement.closest("a")

        if (!(overviewLink instanceof HTMLAnchorElement)) {
            return {
                error: `Could not find a link to the story's overview page. ${LAYOUT_HINT}`,
            }
        }

        if (!overviewLink.href) {
            return {
                error: `The story's overview link is missing its address. ${LAYOUT_HINT}`,
            }
        }

        return { data: overviewLink.href }
    }

    hasPreviousChapter(selectors: ExtensionSelectors): boolean {
        const el = document.querySelector(selectors.prevChapterBtn)
        return !!el?.hasAttribute("href")
    }

    findFictionTitle(selectors: ExtensionSelectors): Result<string> {
        const el = document.querySelector(selectors.fictionTitle)

        if (!el || !el.textContent) {
            return {
                error: `Could not find the story title on this page. ${LAYOUT_HINT}`,
            }
        }

        return { data: el.textContent.trim() }
    }

    findChapterName(
        doc: Document,
        selectors: ExtensionSelectors,
    ): Result<string> {
        const el = doc.querySelector(selectors.chapterTitle)

        if (!el || !el.textContent) {
            return {
                error: `Could not find the previous chapter's title. ${LAYOUT_HINT}`,
            }
        }

        return { data: el.textContent.trim() }
    }

    findChapterContentEl(
        doc: Document,
        selectors: ExtensionSelectors,
    ): Result<Element> {
        const el = doc.querySelector(selectors.chapterContent)

        if (!el) {
            return {
                error: `Could not find the previous chapter's content. ${LAYOUT_HINT}`,
            }
        }

        if (!el.textContent?.trim()) {
            return { error: "The previous chapter appears to be empty." }
        }

        return { data: el }
    }

    findBlurb(
        doc: Document,
        selectors: ExtensionSelectors,
    ): Result<BlurbParts> {
        // Labels are optional and may be unconfigured (empty selector) on some
        // UI versions — querySelector("") throws, so guard before querying.
        let labels: HTMLElement | null = null
        if (selectors.blurbLabels) {
            const labelsEl = doc.querySelector(selectors.blurbLabels)
            if (
                labelsEl instanceof HTMLElement &&
                labelsEl.textContent?.trim()
            ) {
                labels = labelsEl
            }
        }

        const blurbEl = doc.querySelector(selectors.blurb)

        if (!(blurbEl instanceof HTMLElement)) {
            return {
                error: `Could not find the story blurb on the overview page. ${LAYOUT_HINT}`,
            }
        }

        if (!blurbEl.textContent || !blurbEl.textContent.trim()) {
            return { error: "The story blurb appears to be empty." }
        }

        return { data: { labels, blurb: blurbEl } }
    }

    prepareMounts(selectors: ExtensionSelectors): MountSet {
        return {
            toggle: {
                target: this.query(selectors.togglePlacement),
                position: "prepend",
            },
            settings: {
                target: this.query(selectors.settingsPlacement),
                position: "prepend",
            },
            recap: {
                target: this.query(selectors.chapterContent),
                position: "prepend",
            },
            report: {
                target: this.query(selectors.reportPlacement),
                position: "append",
            },
        }
    }

    /** Safe querySelector that tolerates empty/invalid selector strings. */
    protected query(selector: string): Element | null {
        if (!selector) return null
        try {
            return document.querySelector(selector)
        } catch {
            return null
        }
    }
}
