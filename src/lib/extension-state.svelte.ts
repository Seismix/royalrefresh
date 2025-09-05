import type { ExtensionSettings } from "~/types/types"
import DEFAULTS, { DEFAULT_SELECTORS } from "~/lib/defaults"
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
            const settings = await this.settingsStore.getValue()
            this._settings = { ...DEFAULTS, ...settings }
            this.isLoaded = true
        } catch (error) {
            console.error("Failed to load extension settings:", error)
            this._settings = DEFAULTS
            this.isLoaded = true
        }
    }

    private watchSettings() {
        this.settingsStore.watch((newSettings) => {
            this._settings = newSettings
                ? { ...DEFAULTS, ...newSettings }
                : DEFAULTS
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
