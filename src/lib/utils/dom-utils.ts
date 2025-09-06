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
