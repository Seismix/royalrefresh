import type { ExtensionSettings } from "~/types/types"
import DEFAULTS from "~/lib/defaults"
import { storage } from "wxt/utils/storage"

/**
 * Reactive extension settings state using Svelte 5 runes and WXT storage
 */
class ExtensionState {
    settings = $state<ExtensionSettings>(DEFAULTS)
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

    /**
     * Wait for settings to be loaded from storage
     */
    async waitForLoad() {
        await this.loadPromise
    }

    private async loadSettings() {
        try {
            const settings = await this.settingsStore.getValue()
            this.settings = { ...DEFAULTS, ...settings }
            this.isLoaded = true
        } catch (error) {
            console.error("Failed to load extension settings:", error)
            this.settings = DEFAULTS
            this.isLoaded = true
        }
    }

    private watchSettings() {
        this.settingsStore.watch((newSettings) => {
            this.settings = newSettings
                ? { ...DEFAULTS, ...newSettings }
                : DEFAULTS
        })
    }

    async updateSettings(partialSettings: Partial<ExtensionSettings>) {
        const newSettings = { ...this.settings, ...partialSettings }
        await this.settingsStore.setValue(newSettings)
        // The watch will update this.settings automatically
    }
}

// Singleton instance
export const extensionState = new ExtensionState()
