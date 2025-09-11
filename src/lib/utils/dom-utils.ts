import { Component, mount } from "svelte"
import type { ExtensionSettings } from "~/types/types"

/**
 * DOM and URL utility functions for the extension
 */

/**
 * True if `chapter` is in the URL path, otherwise false.
 */
export function documentIsChapterURL(): boolean {
    return window.location.pathname.split("/").includes("chapter")
}

/**
 * True if the previous chapter button has a valid `href` attribute, otherwise false.
 */
export function documentHasPreviousChapterURL(
    extensionSettings: ExtensionSettings,
): boolean {
    const hasPrevChapterURL = document.querySelector(
        extensionSettings.prevChapterBtn,
    )

    return !!hasPrevChapterURL?.hasAttribute("href")
}

/**
 * Helper function to mount a Svelte component to a target element with proper cleanup
 */
export function mountComponent<T extends Record<string, any>>(
    component: Component,
    target: Element,
    props?: T,
    prepend = true,
) {
    // Create temporary container for mounting
    const tempContainer = document.createElement("div")

    // Mount component to temporary container
    const app = mount(component, {
        target: tempContainer,
        props,
    })

    // Move the mounted element to the target
    const element = tempContainer.firstElementChild
    if (element) {
        if (prepend) {
            target.prepend(element)
        } else {
            target.appendChild(element)
        }
    }

    // Return cleanup function
    return () => {
        if (app && typeof app === "object" && "$destroy" in app) {
            ;(app as any).$destroy()
        }
        element?.remove()
    }
}

/**
 * Finds the previous chapter URL from the current page DOM
 * @param settings - Extension settings containing selectors
 * @returns Previous chapter URL or error message
 */
export function findPreviousChapterUrl(
    settings: ExtensionSettings,
): { data: string } | { error: string } {
    const prevChapterBtn = document.querySelector(settings.prevChapterBtn)

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

/**
 * Finds the fiction overview URL from the current page DOM
 * @param settings - Extension settings containing selectors
 * @returns Fiction overview URL or error message
 */
export function findFictionOverviewUrl(
    settings: ExtensionSettings,
): { data: string } | { error: string } {
    const fictionTitleElement = document.querySelector(settings.fictionTitle)

    if (!fictionTitleElement) {
        return {
            error: "Could not find fiction title on current page.",
        }
    }

    if (!(fictionTitleElement.parentElement instanceof HTMLAnchorElement)) {
        return {
            error: "Fiction title found but is not linked to overview page.",
        }
    }

    if (!fictionTitleElement.parentElement.href) {
        return {
            error: "Fiction title link found but has no URL.",
        }
    }

    return { data: fictionTitleElement.parentElement.href }
}
