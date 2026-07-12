import { storage } from "wxt/utils/storage"
import { getDefaults } from "~/lib/config/defaults"
import type { ExtensionSettings } from "~/types/types"
import { migrateV1toV2, migrateV2toV3, migrateV3toV4 } from "./migrations"

/**
 * WXT storage utilities for extension settings with migration support
 * Replaces the ExtensionState class with direct storage access
 */

export const settingsStore = storage.defineItem<ExtensionSettings>(
    "sync:settings",
    {
        fallback: getDefaults(),
        version: 4,
        migrations: {
            2: migrateV1toV2,
            3: migrateV2toV3,
            4: migrateV3toV4,
        },
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
 * Restore selectors to defaults by clearing all per-UI overrides
 */
export async function restoreSelectors() {
    const currentSettings = await getSettings()
    const updatedSettings: ExtensionSettings = {
        ...currentSettings,
        selectorOverrides: { legacy: {}, redesign: {} },
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
