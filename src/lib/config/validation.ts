import type { ExtensionSettings } from "~/types/types"

/** Bounds for the recap word count. Shared by the number input's min/max and the
 * validator below so the two can't drift apart. */
export const WORD_COUNT_MIN = 1
export const WORD_COUNT_MAX = 500

export type ValidationResult = { isValid: boolean; error: string }

const VALID: ValidationResult = { isValid: true, error: "" }

/**
 * Validate the recap word count.
 *
 * Pure and shared so the settings form (for its inline error) and its parents
 * (to gate Save) can each `$derived` it from the same settings object. Pushing
 * validity upward through a callback fired in an `$effect` made the parent's
 * flag lag a render behind and go stale whenever the form unmounted.
 */
export function validateWordCount(value: number): ValidationResult {
    // `bind:value` on a number input yields null when the field is emptied
    if (typeof value !== "number" || Number.isNaN(value)) {
        return { isValid: false, error: "Please enter a valid number" }
    }

    if (value < WORD_COUNT_MIN) {
        return {
            isValid: false,
            error: `Word count must be at least ${WORD_COUNT_MIN}`,
        }
    }

    if (value > WORD_COUNT_MAX) {
        return {
            isValid: false,
            error: `Word count cannot exceed ${WORD_COUNT_MAX}`,
        }
    }

    return VALID
}

/** Whether a settings object is valid enough to save. Null (still loading)
 * counts as valid so the Save button isn't disabled during the initial load. */
export function settingsAreValid(settings: ExtensionSettings | null): boolean {
    if (!settings) return true
    return validateWordCount(settings.wordCount).isValid
}
