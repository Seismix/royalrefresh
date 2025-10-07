import { storage } from "wxt/utils/storage"
import { DEFAULT_SELECTORS, getDefaults, hasReducedMotionOverride } from "~/lib/config/defaults"
import type { ExtensionSettings } from "~/types/types"
import { devLog } from "./logger"
import { prefersReducedMotion } from "./platform"

/**
 * WXT storage utilities for extension settings with migration support
 * Replaces the ExtensionState class with direct storage access
 */

export const settingsStore = storage.defineItem<ExtensionSettings>(
    "sync:settings",
    {
        fallback: {
            wordCount: 250,
            enableJump: true, // Will be adjusted in getSettings() based on reduced motion
            scrollBehavior: "smooth" as ScrollBehavior,
            enableAnimations: true,
            autoExpand: false,
            // hasDetectedReducedMotion is undefined for fresh installs - this triggers detection
            ...DEFAULT_SELECTORS,
        },
        version: 2,
        migrations: {
            2: (oldSettings: any) => {
                // Migration from v1 to v2: smoothScroll -> enableJump & scrollBehavior
                if ("smoothScroll" in oldSettings) {
                    const migrated = {
                        ...oldSettings,
                        enableJump: oldSettings.smoothScroll === true,
                        scrollBehavior: (oldSettings.smoothScroll
                            ? "smooth"
                            : "instant") as ScrollBehavior,
                        enableAnimations: true,  // Add new field
                        // Migration: mark as having been detected so we don't override user's choice
                        hasDetectedReducedMotion: true,
                    } as ExtensionSettings

                    // Remove the old property
                    delete (migrated as any).smoothScroll

                    devLog.log("WXT Migration v1→v2: smoothScroll ->", {
                        enableJump: migrated.enableJump,
                        scrollBehavior: migrated.scrollBehavior,
                    })

                    return migrated
                }
                return oldSettings as ExtensionSettings
            },
        },
    },
)

/**
 * Get current settings from storage
 * Automatically performs first-time reduced motion detection if needed
 */
export async function getSettings(): Promise<ExtensionSettings> {
    const settings = await settingsStore.getValue()

    // Skip if we've already done detection
    if (settings?.hasDetectedReducedMotion) {
        return settings
    }

    try {
        const reducedMotion = prefersReducedMotion()

        let updatedSettings = {
            ...settings,
            hasDetectedReducedMotion: true,
        }

        // For users without reduced motion preference, enable jump and animations by default if not already set
        if (!reducedMotion) {
            updatedSettings = {
                ...updatedSettings,
                enableJump: settings?.enableJump ?? true,
                scrollBehavior: settings?.scrollBehavior ?? ("smooth" as ScrollBehavior),
                enableAnimations: settings?.enableAnimations ?? true,
            }
        } else {
            // Respect reduced motion by ensuring instant scrolling and disabling animations
            updatedSettings = {
                ...updatedSettings,
                scrollBehavior: "instant" as ScrollBehavior,
                enableAnimations: settings?.enableAnimations ?? false,
            }
        }

        await settingsStore.setValue(updatedSettings)
        return updatedSettings
    } catch (error) {
        devLog.log("Could not detect reduced motion preference:", error)
    }

    // Fallback: just mark as detected
    const fallbackSettings = {
        ...settings,
        hasDetectedReducedMotion: true,
    }
    await settingsStore.setValue(fallbackSettings)
    return fallbackSettings
}

/**
 * Update settings with partial changes
 */
export async function updateSettings(
    partialSettings: Partial<ExtensionSettings>,
) {
    const currentSettings = await getSettings()
    const newSettings = { ...currentSettings, ...partialSettings }
    await settingsStore.setValue(newSettings)
}

/**
 * Set complete settings (replaces old settings entirely)
 */
export async function setSettings(settings: Partial<ExtensionSettings>) {
    const newSettings = { ...getDefaults(), ...settings }
    await settingsStore.setValue(newSettings)
}

/**
 * Restore all settings to defaults
 */
export async function restoreDefaults() {
    await settingsStore.setValue(getDefaults())
}

/**
 * Restore only selector-related settings to defaults
 */
export async function restoreSelectors() {
    const currentSettings = await getSettings()
    const updatedSettings = {
        ...currentSettings,
        // Restore all selector-related settings to defaults
        ...DEFAULT_SELECTORS,
    }
    await settingsStore.setValue(updatedSettings)
}

/**
 * Watch for settings changes
 */
export function watchSettings(
    callback: (newSettings: ExtensionSettings | null) => void,
) {
    return settingsStore.watch(callback)
}
