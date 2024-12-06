import browser from "webextension-polyfill"
import { ExtensionSettings } from "@royalrefresh/types"
import DEFAULTS from "./defaults"

class StorageService {
    static async getSettings(): Promise<ExtensionSettings> {
        const defaultValues = DEFAULTS
        const userSettings = await browser.storage.sync.get(defaultValues)
        return { ...defaultValues, ...userSettings }
    }

    static async setSettings(settings: Partial<ExtensionSettings>) {
        await browser.storage.sync.set(settings)
    }

    static async restoreDefaults() {
        await browser.storage.sync.set(DEFAULTS)
    }
}

export default StorageService
