#!/usr/bin/env node

/**
 * Mints a Chrome Web Store refresh token for the publish workflow.
 *
 * `wxt submit init` is the intended way to do this, but it still requests the
 * out-of-band redirect (`urn:ietf:wg:oauth:2.0:oob`) that Google blocked in
 * 2022, so it fails with "Access blocked: invalid_request". It also omits
 * `access_type=offline`, without which Google returns no refresh token at all.
 *
 * This script does the same job with the loopback redirect that replaced OOB.
 * It can be deleted once `wxt submit init` is fixed upstream.
 *
 * Requires an OAuth client of type "Desktop" (loopback is rejected for other
 * client types) with the Chrome Web Store API enabled.
 *
 * Usage:
 *   pnpm chrome:token
 *
 * Credentials are read from the environment so they never reach shell history:
 *   read -rsp "Client secret: " S && echo && CHROME_CLIENT_ID=<id> CHROME_CLIENT_SECRET="$S" pnpm chrome:token
 *
 * Store the result with:
 *   printf %s "<token>" | gh secret set CHROME_REFRESH_TOKEN
 */

import http from "node:http"

const clientId = process.env.CHROME_CLIENT_ID
const clientSecret = process.env.CHROME_CLIENT_SECRET
const port = Number(process.env.PORT || 8080)
const redirectUri = `http://localhost:${port}`
const scope = "https://www.googleapis.com/auth/chromewebstore"

if (!clientId || !clientSecret) {
    console.error(
        "Set CHROME_CLIENT_ID and CHROME_CLIENT_SECRET in the environment.",
    )
    console.error(
        'Example: read -rsp "Client secret: " S && echo && CHROME_CLIENT_ID=<id> CHROME_CLIENT_SECRET="$S" pnpm chrome:token',
    )
    process.exit(1)
}

// access_type=offline is what makes Google return a refresh token rather than
// only an access token. prompt=consent forces a new one even when this client
// has been authorized before, so re-running always yields a usable token.
const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope,
        access_type: "offline",
        prompt: "consent",
    })

console.log("\nOpen this URL and approve access:\n")
console.log(authUrl)
console.log(`\nWaiting for the redirect on ${redirectUri} ...\n`)

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", redirectUri)
    const code = url.searchParams.get("code")
    const error = url.searchParams.get("error")

    if (error) {
        res.end(`Authorization failed: ${error}. You can close this tab.`)
        console.error(`\nAuthorization failed: ${error}`)
        server.close()
        process.exit(1)
    }

    // Browsers also request /favicon.ico, which carries no code.
    if (!code) {
        res.end("Waiting for the authorization code...")
        return
    }

    res.end("Authorized. You can close this tab and return to the terminal.")

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
        }),
    })
    const body = await response.json()

    if (!body.refresh_token) {
        console.error("\nNo refresh token returned. Response:\n", body)
        if (body.error === "invalid_client") {
            console.error(
                "\ninvalid_client means the secret does not belong to this client ID.",
            )
        }
        server.close()
        process.exit(1)
    }

    console.log("\nRefresh token:\n")
    console.log(body.refresh_token)
    console.log("\nStore it with:\n")
    console.log(
        `printf %s "${body.refresh_token}" | gh secret set CHROME_REFRESH_TOKEN`,
    )
    server.close()
    process.exit(0)
})

server.listen(port)
