import { ExtensionSettings } from "@royalrefresh/types"
import browser from "webextension-polyfill"
import DEFAULTS, { DEFAULT_SELECTORS } from "./defaults"

class StorageService {
    static async getSettings(): Promise<ExtensionSettings> {
        const defaultValues = DEFAULTS
        const userSettings = await browser.storage.sync.get(defaultValues)
        return { ...defaultValues, ...userSettings }
    }

    static async setSettings(settings: Partial<ExtensionSettings>) {
        await browser.storage.sync.set(settings)
    }

    static async restoreSelectors() {
        await browser.storage.sync.set(DEFAULT_SELECTORS)
    }

    static async restoreDefaults() {
        await browser.storage.sync.set(DEFAULTS)
    }

    static async updateSettings() {
        const currentSettings = await this.getSettings()
        const updatedSettings = { ...currentSettings, ...DEFAULT_SELECTORS }
        await this.setSettings(updatedSettings)
    }
}

export default StorageService
