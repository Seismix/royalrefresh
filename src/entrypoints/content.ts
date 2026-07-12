import ToggleButton from "~/components/extension/ToggleButton.svelte"
import SettingsButton from "~/components/extension/SettingsButton.svelte"
import RecapContainer from "~/components/extension/RecapContainer.svelte"
import { documentIsChapterURL, mountComponent } from "~/lib/utils/dom-utils"
import { buildPageContext } from "~/lib/adapters"
import { getSettings } from "~/lib/utils/storage-utils"
import type { ContentType } from "~/types/types"
import type { MountTarget } from "~/lib/adapters"

export default defineContentScript({
    matches: ["*://*.royalroad.com/*"],
    runAt: "document_end",
    cssInjectionMode: "ui",

    main: async (ctx) => {
        if (!documentIsChapterURL()) return

        // Resolve the active UI adapter + selectors for this page
        const settings = await getSettings()
        const page = buildPageContext(settings)

        const hasPrevChapter = page.adapter.hasPreviousChapter(page.selectors)
        const contentType: ContentType = hasPrevChapter ? "recap" : "blurb"

        const mounts = page.adapter.resolveMounts(page.selectors)
        const hostClasses = page.adapter.hostClasses

        // Helper: mount a component at a resolved mount target with cleanup
        const mountAt = (
            component: Parameters<typeof mountComponent>[0],
            { target, position }: MountTarget,
            props?: Record<string, any>,
        ) => {
            if (!target) return
            const cleanup = mountComponent(component, target, props, position)
            ctx.onInvalidated(cleanup)
        }

        // Toggle button (recap/blurb)
        if (mounts.toggle.target) {
            mountAt(ToggleButton, mounts.toggle, {
                type: contentType,
                className: hostClasses.toggleButton,
            })

            if (settings.autoExpand) {
                const buttonId = `${contentType}Button`
                // ensure DOM is ready
                requestAnimationFrame(() => {
                    const btn = document.getElementById(buttonId)
                    if (btn) btn.click()
                })
            }
        }

        // Settings button (mounts into RoyalRoad's settings dialog/modal).
        // Reporting is handled by the extension popup, not an injected button.
        mountAt(SettingsButton, mounts.settings, {
            className: hostClasses.settingsButton,
            version: page.adapter.id,
        })

        // Content container
        mountAt(RecapContainer, mounts.recap, { id: "recapContainer" })
    },
})
