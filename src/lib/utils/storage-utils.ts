import { storage } from "wxt/utils/storage"
import { DEFAULT_SELECTORS, getDefaults } from "~/lib/config/defaults"
import type { ExtensionSettings } from "~/types/types"

/**
 * WXT storage utilities for extension settings with migration support
 * Replaces the ExtensionState class with direct storage access
 */

export const settingsStore = storage.defineItem<ExtensionSettings>(
    "sync:settings",
    {
        fallback: getDefaults(),
        version: 2,
        migrations: {
            2: (oldSettings: any) => {
                // Migration from v1 to v2: smoothScroll -> enableJump & scrollBehavior
                if ("smoothScroll" in oldSettings) {
                    const migrated = {
                        ...oldSettings,
                        enableJump: oldSettings.smoothScroll === true,
                        scrollBehavior: oldSettings.smoothScroll ? "smooth" : "auto",
                    } as ExtensionSettings

                    // Remove the old property
                    delete (migrated as any).smoothScroll

                    console.log("WXT Migration v1→v2: smoothScroll ->", {
                        enableJump: migrated.enableJump,
                        scrollBehavior: migrated.scrollBehavior
                    })

                    return migrated
                }
                return oldSettings as ExtensionSettings
            }
        }
    },
)

/**
 * Get current settings from storage
 */
export async function getSettings(): Promise<ExtensionSettings> {
    return await settingsStore.getValue()
}

/**
 * Update settings with partial changes
 */
export async function updateSettings(
    partialSettings: Partial<ExtensionSettings>,
): Promise<void> {
    const currentSettings = await getSettings()
    const newSettings = { ...currentSettings, ...partialSettings }
    await settingsStore.setValue(newSettings)
}

/**
 * Set complete settings (replaces old settings entirely)
 */
export async function setSettings(
    settings: Partial<ExtensionSettings>,
): Promise<void> {
    const newSettings = { ...getDefaults(), ...settings }
    await settingsStore.setValue(newSettings)
}

/**
 * Restore all settings to defaults
 */
export async function restoreDefaults(): Promise<void> {
    await settingsStore.setValue(getDefaults())
}

/**
 * Restore only selector-related settings to defaults
 */
export async function restoreSelectors(): Promise<void> {
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
