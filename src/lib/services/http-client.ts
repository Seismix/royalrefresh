/**
 * HTTP Client Service - Pure functions for web requests
 * No side effects, returns result objects instead of throwing errors
 */
export class HttpClient {
    /**
     * Fetches HTML content from a URL
     * @param url - The URL to fetch content from
     * @returns Promise resolving to either success data or error message
     */
    static async fetchHtml(
        url: string | URL | Request,
    ): Promise<{ data: string } | { error: string }> {
        try {
            const response = await fetch(url)

            if (!response.ok) {
                return {
                    error: `Failed to fetch content: ${response.status} ${response.statusText}`,
                }
            }

            const html = await response.text()

            if (!html || html.trim().length === 0) {
                return {
                    error: "Received empty response from server",
                }
            }

            return { data: html }
        } catch (error) {
            // Network errors, CORS issues, etc.
            if (error instanceof Error) {
                return {
                    error: `Network error: ${error.message}`,
                }
            }
            return {
                error: "Unknown error occurred while fetching content",
            }
        }
    }
}
