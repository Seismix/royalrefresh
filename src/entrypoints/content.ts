import { mount } from "svelte"
import ToggleButton from "~/components/extension/ToggleButton.svelte"
import SettingsButton from "~/components/extension/SettingsButton.svelte"
import RecapContainer from "~/components/extension/RecapContainer.svelte"
import {
    documentIsChapterURL,
    documentHasPreviousChapterURL,
} from "~/lib/dom-utils"
import { extensionState } from "~/lib/extension-state.svelte"

export default defineContentScript({
    matches: ["*://*.royalroad.com/*"],
    runAt: "document_end",
    cssInjectionMode: "ui",

    main: async (ctx) => {
        if (!documentIsChapterURL()) return

        // Wait for settings to load
        await extensionState.waitForLoad()

        const settings = extensionState.settings
        const hasPrevChapter = documentHasPreviousChapterURL(settings)

        // Create toggle button
        const togglePlacement = document.querySelector(settings.togglePlacement)
        if (togglePlacement) {
            const cleanup = mountComponent(ToggleButton, togglePlacement, {
                type: hasPrevChapter ? "recap" : "blurb",
            })
            ctx.onInvalidated(cleanup)
        }

        // Create settings button (only if has previous chapter)
        if (hasPrevChapter) {
            const settingsPlacement = document.querySelector(
                settings.settingsPlacement,
            )
            if (settingsPlacement && settingsPlacement instanceof HTMLElement) {
                settingsPlacement.style.display = "flex"
                settingsPlacement.style.justifyContent = "space-between"
                settingsPlacement.style.alignItems = "center"

                const cleanup = mountComponent(
                    SettingsButton,
                    settingsPlacement,
                )
                ctx.onInvalidated(cleanup)
            }
        }

        // Create content container
        const chapterDiv = document.querySelector(settings.chapterContent)
        if (chapterDiv) {
            const cleanup = mountComponent(RecapContainer, chapterDiv, {
                id: "recapContainer",
            })
            ctx.onInvalidated(cleanup)
        }
    },
})

/**
 * Helper function to mount a Svelte component to a target element with proper cleanup
 */
function mountComponent<T extends Record<string, any>>(
    component: any,
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
