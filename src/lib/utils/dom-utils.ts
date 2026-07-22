import { Component, mount, unmount } from "svelte"
import type { MountPosition } from "~/lib/adapters/types"

/**
 * DOM and URL utility functions for the extension.
 *
 * Selector-driven page lookups (previous chapter, fiction overview, titles,
 * blurb) live in the UI adapters (`~/lib/adapters`) so legacy/redesign DOM
 * differences stay in one place. This module keeps only version-agnostic
 * helpers.
 */

/**
 * True if `chapter` is in the URL path, otherwise false.
 */
export function isChapterUrl(url: string) {
    try {
        return new URL(url).pathname.split("/").includes("chapter")
    } catch {
        return false
    }
}

/**
 * True if the current document is a chapter page.
 */
export function documentIsChapterURL() {
    return window.location.pathname.split("/").includes("chapter")
}

/**
 * Helper function to mount a Svelte component to a target element with proper cleanup
 */
export function mountComponent<T extends Record<string, any>>(
    // `Component<any>` rather than the default `Component<{}>`: injected
    // components take required props (the active adapter's chrome), which a
    // no-props component type would reject.
    component: Component<any>,
    target: Element,
    props?: T,
    position: MountPosition = "prepend",
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
        if (position === "prepend") {
            target.prepend(element)
        } else if (position === "after") {
            target.after(element)
        } else {
            target.appendChild(element)
        }
    }

    // Return cleanup function. `unmount` tears down the Svelte 5 component
    // (running its cleanup/effects); `element?.remove()` is a harmless no-op if
    // unmount already detached the node.
    return () => {
        unmount(app)
        element?.remove()
    }
}
