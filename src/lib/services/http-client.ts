/** Abort a request that takes longer than this, so a hung connection
 * surfaces a real error instead of leaving the recap stuck loading forever. */
const REQUEST_TIMEOUT_MS = 15000

/**
 * Maps an HTTP status to a reader-friendly message.
 */
function describeHttpError(status: number) {
    if (status === 404) {
        return "That chapter could not be found on RoyalRoad (404)."
    }
    if (status === 429) {
        return "RoyalRoad is rate-limiting requests. Please wait a moment and try again."
    }
    if (status >= 500) {
        return "RoyalRoad is having problems right now. Please try again later."
    }
    return "RoyalRoad could not load that page. Please try again."
}

/**
 * Fetches HTML content from a URL
 * @param url - The URL to fetch content from
 * @returns Promise resolving to either success data or error message
 */
export async function fetchHtml(
    url: string | URL | Request,
): Promise<{ data: string } | { error: string }> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
        const response = await fetch(url, { signal: controller.signal })

        if (!response.ok) {
            return {
                error: describeHttpError(response.status),
            }
        }

        const html = await response.text()

        if (!html || html.trim().length === 0) {
            return {
                error: "RoyalRoad returned an empty page. Please try again.",
            }
        }

        return { data: html }
    } catch (error) {
        // Timeout: AbortController fired before the request completed
        if (error instanceof Error && error.name === "AbortError") {
            return {
                error: "Request timed out — RoyalRoad took too long to respond. Please try again.",
            }
        }
        // Network errors, CORS issues, etc.
        if (error instanceof Error) {
            return {
                error: "Could not reach RoyalRoad. Please check your connection and try again.",
            }
        }
        return {
            error: "Something went wrong while loading the content. Please try again.",
        }
    } finally {
        clearTimeout(timeoutId)
    }
}
