import type { ExtensionSettings } from "~/types/types"
import { devLog } from "./logger"

export function migrateV1toV2(oldSettings: any): ExtensionSettings {
    // Migration from v1 to v2: smoothScroll -> enableJump & scrollBehavior
    if ("smoothScroll" in oldSettings) {
        const { smoothScroll, ...rest } = oldSettings
        const migrated: ExtensionSettings = {
            ...rest,
            enableJump: smoothScroll === true, // Preserve user's choice
            scrollBehavior: (smoothScroll ? "smooth" : "instant") as ScrollBehavior,
        }

        devLog.log("WXT Migration v1→v2: smoothScroll ->", {
            enableJump: migrated.enableJump,
            scrollBehavior: migrated.scrollBehavior,
        })

        return migrated
    }
    return oldSettings as ExtensionSettings
}
