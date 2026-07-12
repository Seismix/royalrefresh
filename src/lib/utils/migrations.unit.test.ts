import { describe, expect, test } from "vitest"
import { migrateV1toV2, migrateV2toV3, migrateV3toV4 } from "./migrations"
import { LEGACY_SELECTORS } from "~/lib/config/defaults"
import { DEFAULT_BETA_COOKIE } from "~/lib/adapters"

// Helper to simulate the full migration chain
// As you add more versions, update this function
function migrateToLatest(settings: any, startVersion: number) {
    let migrated = { ...settings }

    // Chain: v1 -> v2
    if (startVersion < 2) {
        migrated = migrateV1toV2(migrated)
    }

    // Chain: v2 -> v3
    if (startVersion < 3) {
        migrated = migrateV2toV3(migrated)
    }

    // Chain: v3 -> v4
    if (startVersion < 4) {
        migrated = migrateV3toV4(migrated)
    }

    return migrated
}

describe("Settings Migrations", () => {
    // Test Scenarios
    // Add new test cases here instead of writing new test blocks
    const scenarios = [
        {
            name: "v1 to Latest: smoothScroll=true",
            fromVersion: 1,
            input: { wordCount: 250, smoothScroll: true, autoExpand: false },
            expected: {
                enableJump: true,
                scrollBehavior: "smooth",
                wordCount: 250,
            },
            shouldNotHave: ["smoothScroll"],
        },
        {
            name: "v1 to Latest: smoothScroll=false",
            fromVersion: 1,
            input: { wordCount: 250, smoothScroll: false, autoExpand: false },
            expected: {
                enableJump: false,
                scrollBehavior: "instant",
            },
            shouldNotHave: ["smoothScroll"],
        },
        {
            name: "v1 to Latest: preserves unknown properties",
            fromVersion: 1,
            input: { wordCount: 500, smoothScroll: true, customProp: "kept" },
            expected: {
                wordCount: 500,
                customProp: "kept",
            },
            shouldNotHave: ["smoothScroll"],
        },
        {
            name: "v2 to Latest: customized selector -> selectorOverrides.legacy",
            fromVersion: 2,
            input: {
                wordCount: 250,
                enableJump: true,
                scrollBehavior: "smooth",
                autoExpand: false,
                ...LEGACY_SELECTORS,
                // user customized one selector
                prevChapterBtn: "a.my-custom-prev",
            },
            expected: {
                wordCount: 250,
                enableJump: true,
                selectorOverrides: {
                    legacy: { prevChapterBtn: "a.my-custom-prev" },
                    redesign: {},
                },
            },
            // flat selector keys are removed
            shouldNotHave: ["prevChapterBtn", "chapterContent", "blurb"],
        },
        {
            name: "v3 to Latest: adds default betaCookie",
            fromVersion: 3,
            input: {
                wordCount: 250,
                enableJump: true,
                scrollBehavior: "smooth",
                autoExpand: false,
                selectorOverrides: { legacy: {}, redesign: {} },
            },
            expected: {
                wordCount: 250,
                selectorOverrides: { legacy: {}, redesign: {} },
                betaCookie: {
                    mode: "classic",
                    name: DEFAULT_BETA_COOKIE.name,
                    betaValue: DEFAULT_BETA_COOKIE.betaValue,
                    classicValue: DEFAULT_BETA_COOKIE.classicValue,
                },
            },
        },
    ]

    for (const scenario of scenarios) {
        test(scenario.name, () => {
            const result = migrateToLatest(scenario.input, scenario.fromVersion)

            // 1. Verify expected values match
            expect(result).toMatchObject(scenario.expected)

            // 2. Verify cleaned up keys
            if (scenario.shouldNotHave) {
                for (const key of scenario.shouldNotHave) {
                    expect(result).not.toHaveProperty(key)
                }
            }
        })
    }

    test("should return input unchanged if already at latest version schema (idempotency check)", () => {
        const v2Settings = {
            wordCount: 250,
            enableJump: true,
            scrollBehavior: "smooth",
        }

        // If we are already at v2 (or logically check the schema),
        // migrateV1toV2 returns input if 'smoothScroll' is missing.
        const result = migrateV1toV2(v2Settings)

        expect(result).toBe(v2Settings)
    })
})
