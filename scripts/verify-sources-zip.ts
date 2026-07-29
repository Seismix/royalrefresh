#!/usr/bin/env node

/**
 * Verifies the AMO source archive the way AMO reviewers verify it: unpack
 * `royalrefresh-<version>-sources.zip` into an empty directory, install and
 * build it there, then compare the extension it produces file-by-file against
 * the shipped `royalrefresh-<version>-firefox.zip`.
 *
 * Run `pnpm zip:firefox` first — this only checks artifacts that already exist.
 *
 * The two zip CONTAINERS are expected to differ by a few dozen bytes: each
 * entry header carries a DOS timestamp, so two back-to-back builds of the same
 * source differ too. Only the hashes of the files inside are meaningful, which
 * is what this compares.
 *
 * Usage:
 *   pnpm verify:sources          # verify, then clean up
 *   pnpm verify:sources --keep   # leave the work directory for inspection
 */

import { execFileSync, execSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
} from "node:fs"
import { mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const keepWorkDir = process.argv.includes("--keep")

/** A verification failure, as opposed to a crash. Reported without a stack. */
class VerificationError extends Error {}

/** Every file under `dir`, as repo-relative POSIX paths, sorted. */
function listFiles(dir: string, base = dir): string[] {
    return readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) => {
            const absolute = path.join(dir, entry.name)
            return entry.isDirectory()
                ? listFiles(absolute, base)
                : [path.relative(base, absolute).split(path.sep).join("/")]
        })
        .sort()
}

function sha256(file: string): string {
    return createHash("sha256").update(readFileSync(file)).digest("hex")
}

function run(command: string, cwd: string): void {
    execSync(command, { cwd, stdio: "inherit" })
}

function unzip(zip: string, into: string): void {
    execFileSync("unzip", ["-q", zip, "-d", into], { stdio: "inherit" })
}

/**
 * Aborts the run. This throws rather than calling `process.exit`, which would
 * skip the `finally` that decides whether to keep the work directory.
 */
function fail(message: string): never {
    throw new VerificationError(message)
}

async function main(): Promise<void> {
    try {
        execFileSync("unzip", ["-v"], { stdio: "ignore" })
    } catch {
        fail(
            "`unzip` is not on PATH. Install it (apt install unzip) and re-run.",
        )
    }

    const { version } = JSON.parse(
        readFileSync(path.join(repoRoot, "package.json"), "utf-8"),
    ) as { version: string }

    const outDir = path.join(repoRoot, ".output")
    const sourcesZip = path.join(outDir, `royalrefresh-${version}-sources.zip`)
    const shippedZip = path.join(outDir, `royalrefresh-${version}-firefox.zip`)

    for (const required of [sourcesZip, shippedZip]) {
        try {
            statSync(required)
        } catch {
            fail(
                `${path.relative(repoRoot, required)} not found. Run \`pnpm zip:firefox\` first.`,
            )
        }
    }

    const workDir = mkdtempSync(path.join(tmpdir(), "royalrefresh-sources-"))
    const sourcesRoot = path.join(workDir, "sources")
    const shippedFiles = path.join(workDir, "shipped")
    const rebuiltFiles = path.join(workDir, "rebuilt")

    let mismatches = 0
    let failed = false

    try {
        console.log(`Work directory: ${workDir}\n`)

        console.log("→ Unpacking the source archive...")
        await mkdir(sourcesRoot, { recursive: true })
        unzip(sourcesZip, sourcesRoot)

        console.log("\n→ Installing and building from the archive alone...")
        run("pnpm install --frozen-lockfile", sourcesRoot)
        run("pnpm zip:firefox", sourcesRoot)

        const rebuiltZip = path.join(
            sourcesRoot,
            ".output",
            `royalrefresh-${version}-firefox.zip`,
        )
        try {
            statSync(rebuiltZip)
        } catch {
            fail(
                `The rebuild did not produce royalrefresh-${version}-firefox.zip.`,
            )
        }

        console.log("\n→ Comparing file hashes...\n")
        unzip(shippedZip, shippedFiles)
        unzip(rebuiltZip, rebuiltFiles)

        const shipped = listFiles(shippedFiles)
        const rebuilt = new Set(listFiles(rebuiltFiles))

        const width = Math.max(...shipped.map((file) => file.length), 20)
        for (const file of shipped) {
            if (!rebuilt.delete(file)) {
                console.log(`  ${file.padEnd(width)}  MISSING from the rebuild`)
                mismatches++
                continue
            }
            const a = sha256(path.join(shippedFiles, file))
            const b = sha256(path.join(rebuiltFiles, file))
            if (a === b) {
                console.log(`  ${file.padEnd(width)}  ok    ${a.slice(0, 12)}`)
            } else {
                console.log(`  ${file.padEnd(width)}  DIFFERS`)
                console.log(`  ${"".padEnd(width)}    shipped ${a}`)
                console.log(`  ${"".padEnd(width)}    rebuilt ${b}`)
                mismatches++
            }
        }

        for (const extra of rebuilt) {
            console.log(`  ${extra.padEnd(width)}  EXTRA in the rebuild`)
            mismatches++
        }

        const shippedBytes = statSync(shippedZip).size
        const rebuiltBytes = statSync(rebuiltZip).size
        console.log(
            `\n  ${shipped.length} file(s) compared; containers ${shippedBytes} vs ${rebuiltBytes} bytes` +
                ` (a small delta here is entry timestamps, not content).`,
        )

        if (mismatches > 0) {
            fail(
                `${mismatches} file(s) did not match. The source archive is NOT reproducible.`,
            )
        }

        console.log(
            "\n✔ Every file matches. The source archive rebuilds to the shipped extension.",
        )
    } catch (error) {
        // Anything that went wrong is worth inspecting, not just a hash
        // mismatch — a failed install or build leaves its logs in here too.
        failed = true
        throw error
    } finally {
        if (keepWorkDir || failed) {
            console.log(`\nWork directory kept at ${workDir}`)
        } else {
            rmSync(workDir, { recursive: true, force: true })
        }
    }
}

try {
    await main()
} catch (error) {
    if (error instanceof VerificationError) {
        console.error(`\n✖ ${error.message}`)
        process.exit(1)
    }
    throw error
}
