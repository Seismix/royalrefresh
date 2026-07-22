import { describe, expect, test } from "vitest"
import {
    migrateV1toV2,
    migrateV2toV3,
    migrateV3toV4,
    migrateV4toV5,
} from "./migrations"
import { LEGACY_SELECTORS } from "~/lib/config/defaults"

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

    // Chain: v4 -> v5
    if (startVersion < 5) {
        migrated = migrateV4toV5(migrated)
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
            name: "v2 to Latest: chain runs through every step",
            fromVersion: 2,
            input: {
                wordCount: 250,
                enableJump: true,
                scrollBehavior: "smooth",
                autoExpand: false,
                ...LEGACY_SELECTORS,
            },
            expected: {
                selectorOverrides: { legacy: {}, redesign: {} },
            },
            // betaCookie is added by v3→v4 and removed again by v4→v5
            shouldNotHave: ["prevChapterBtn", "reportPlacement", "betaCookie"],
        },
        {
            name: "v2 to Latest: customized reportPlacement survives as an override",
            fromVersion: 2,
            input: {
                wordCount: 250,
                enableJump: true,
                scrollBehavior: "smooth",
                autoExpand: false,
                ...LEGACY_SELECTORS,
                reportPlacement: "div.my-custom-sidebar",
            },
            expected: {
                selectorOverrides: {
                    legacy: { reportPlacement: "div.my-custom-sidebar" },
                    redesign: {},
                },
            },
            shouldNotHave: ["reportPlacement"],
        },
        {
            name: "v3 to Latest: settings survive without gaining betaCookie",
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
            },
            shouldNotHave: ["betaCookie"],
        },
        {
            name: "v4 to Latest: an existing betaCookie is dropped",
            fromVersion: 4,
            input: {
                wordCount: 250,
                enableJump: true,
                scrollBehavior: "smooth",
                autoExpand: false,
                selectorOverrides: { legacy: {}, redesign: {} },
                betaCookie: {
                    mode: "redesign",
                    name: "beta-ui-v2",
                    betaValue: "always",
                    classicValue: "never",
                },
            },
            expected: {
                wordCount: 250,
                selectorOverrides: { legacy: {}, redesign: {} },
            },
            shouldNotHave: ["betaCookie"],
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

    test("v2→v3 emits no betaCookie, so v3→v4 stays reachable", () => {
        // Regression guard for the hermetic-snapshot fix: when migrateV2toV3
        // spread live defaults it emitted betaCookie itself, which tripped
        // migrateV3toV4's "already migrated" guard and silently skipped that
        // step for everyone coming from v2.
        const v3 = migrateV2toV3({
            wordCount: 250,
            enableJump: true,
            scrollBehavior: "smooth",
            autoExpand: false,
            ...LEGACY_SELECTORS,
        })
        expect(v3).not.toHaveProperty("betaCookie")

        // v4 therefore still has work to do, which v5 then undoes.
        expect(migrateV3toV4(v3)).toHaveProperty("betaCookie")
        expect(migrateV4toV5(migrateV3toV4(v3))).not.toHaveProperty(
            "betaCookie",
        )
    })

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
