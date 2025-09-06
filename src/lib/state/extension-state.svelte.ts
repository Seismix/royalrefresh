import type { ExtensionSettings } from "~/types/types"
import DEFAULTS, { DEFAULT_SELECTORS } from "~/lib/config/defaults"
import { storage } from "wxt/utils/storage"

/**
 * Reactive extension settings state using Svelte 5 runes and WXT storage
 */
class ExtensionState {
    private _settings = $state<ExtensionSettings>(DEFAULTS)
    isLoaded = $state(false)
    private loadPromise: Promise<void>

    private settingsStore = storage.defineItem<ExtensionSettings>(
        "sync:settings",
        {
            fallback: DEFAULTS,
        },
    )

    constructor() {
        this.loadPromise = this.loadSettings()
        this.watchSettings()
    }

    // Public readonly accessor
    get settings(): Readonly<ExtensionSettings> {
        return this._settings
    }

    /**
     * Wait for settings to be loaded from storage
     */
    async waitForLoad() {
        await this.loadPromise
    }

    private async loadSettings() {
        try {
            // .getValue() will return the fallback if no value is stored
            // or merge the stored value with the fallback.
            this._settings = await this.settingsStore.getValue()
        } catch (error) {
            console.error("Failed to load extension settings:", error)
            // If getValue fails, explicitly set to DEFAULTS
            this._settings = DEFAULTS
        } finally {
            this.isLoaded = true
        }
    }

    private watchSettings() {
        this.settingsStore.watch((newSettings) => {
            // newSettings is already merged with the fallback by wxt/storage.
            // We just need to handle the case where the value is removed.
            this._settings = newSettings ?? DEFAULTS
        })
    }

    async updateSettings(partialSettings: Partial<ExtensionSettings>) {
        const newSettings = { ...this._settings, ...partialSettings }
        await this.settingsStore.setValue(newSettings)
    }

    /**
     * Save complete settings (replaces the old StorageService.setSettings)
     */
    async setSettings(settings: Partial<ExtensionSettings>) {
        const newSettings = { ...DEFAULTS, ...settings }
        await this.settingsStore.setValue(newSettings)
    }

    /**
     * Restore all settings to defaults
     */
    async restoreDefaults() {
        await this.settingsStore.setValue(DEFAULTS)
    }

    /**
     * Restore only selector-related settings to defaults
     */
    async restoreSelectors() {
        const currentSettings = this._settings
        const updatedSettings = {
            ...currentSettings,
            // Restore all selector-related settings to defaults
            ...DEFAULT_SELECTORS,
        }
        await this.settingsStore.setValue(updatedSettings)
    }
}

export const extensionState = new ExtensionState()
