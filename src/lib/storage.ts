import type { ExtensionSettings } from "~/types/types";
import DEFAULTS, { DEFAULT_SELECTORS } from "~/lib/defaults";
import { writable } from "svelte/store";

/**
 * Storage utilities using WXT's storage API
 */
export class StorageService {
    /**
     * Get the current extension settings, merging defaults with stored values
     */
    static async getSettings(): Promise<ExtensionSettings> {
        try {
            const storedSettings = await storage.getItem("sync:settings") as Partial<ExtensionSettings> | null;
            return { ...DEFAULTS, ...storedSettings };
        } catch (error) {
            console.error("Failed to get settings:", error);
            return DEFAULTS;
        }
    }

    /**
     * Save extension settings to storage
     */
    static async setSettings(settings: Partial<ExtensionSettings>): Promise<void> {
        try {
            await storage.setItem("sync:settings", settings);
        } catch (error) {
            console.error("Failed to save settings:", error);
            throw error;
        }
    }

    /**
     * Restore only the selector-related settings to defaults
     */
    static async restoreSelectors(): Promise<void> {
        try {
            const currentSettings = await this.getSettings();
            const updatedSettings = { ...currentSettings, ...DEFAULT_SELECTORS };
            await storage.setItem("sync:settings", updatedSettings);
        } catch (error) {
            console.error("Failed to restore selectors:", error);
            throw error;
        }
    }

    /**
     * Restore all settings to defaults
     */
    static async restoreDefaults(): Promise<void> {
        try {
            await storage.setItem("sync:settings", DEFAULTS);
        } catch (error) {
            console.error("Failed to restore defaults:", error);
            throw error;
        }
    }

    /**
     * Update settings by merging with default selectors (for extension updates)
     */
    static async updateSettings(): Promise<void> {
        try {
            const currentSettings = await this.getSettings();
            const updatedSettings = { ...currentSettings, ...DEFAULT_SELECTORS };
            await this.setSettings(updatedSettings);
        } catch (error) {
            console.error("Failed to update settings:", error);
            throw error;
        }
    }
}

/**
 * Svelte store for settings management
 * Creates reactive stores that work with Svelte's reactivity system
 */
export function createSettingsStore() {
    const settings = writable<ExtensionSettings>(DEFAULTS);
    const loading = writable(true);
    const error = writable<string | null>(null);

    // Load initial settings
    async function initialize() {
        try {
            const initialSettings = await StorageService.getSettings();
            settings.set(initialSettings);
            loading.set(false);
        } catch (e) {
            error.set(e instanceof Error ? e.message : "Failed to load settings");
            loading.set(false);
        }
    }

    // Initialize on creation
    initialize();

    // Watch for storage changes
    storage.watch("sync:settings", (newValue: ExtensionSettings | null) => {
        if (newValue) {
            settings.set({ ...DEFAULTS, ...newValue });
        }
    });

    return {
        // Subscribe to the stores
        settings: {
            subscribe: settings.subscribe,
            get: () => {
                let value: ExtensionSettings;
                settings.subscribe(v => value = v)();
                return value!;
            }
        },
        loading: {
            subscribe: loading.subscribe
        },
        error: {
            subscribe: error.subscribe
        },
        
        async save(newSettings: ExtensionSettings) {
            try {
                error.set(null);
                await StorageService.setSettings(newSettings);
                settings.set(newSettings);
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "Failed to save settings";
                error.set(errorMessage);
                throw e;
            }
        },

        async restoreDefaults() {
            try {
                error.set(null);
                await StorageService.restoreDefaults();
                settings.set({ ...DEFAULTS });
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "Failed to restore defaults";
                error.set(errorMessage);
                throw e;
            }
        },

        async restoreSelectors() {
            try {
                error.set(null);
                await StorageService.restoreSelectors();
                const currentSettings = await StorageService.getSettings();
                settings.set(currentSettings);
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "Failed to restore selectors";
                error.set(errorMessage);
                throw e;
            }
        }
    };
}
