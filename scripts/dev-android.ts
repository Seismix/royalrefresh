#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the device ID from command line arguments
const deviceId: string | undefined = process.argv[2];
if (!deviceId) {
  console.error('Usage: pnpm dev:android <device-id> [web-ext flags...]');
  console.error('Example: pnpm dev:android emulator-5554 --source-dir ./custom-dir');
  process.exit(1);
}

// Get any additional flags to pass to web-ext
const additionalFlags: string[] = process.argv.slice(3);

// Extract custom source directory if provided
let customSourceDir: string | null = null;
const sourceDirIndex = additionalFlags.findIndex(flag => flag === '--source-dir' || flag === '-s');

if (sourceDirIndex !== -1) {
  // Handle -s value or --source-dir value
  customSourceDir = additionalFlags[sourceDirIndex + 1];
} else {
  // Handle --source-dir=value
  const sourceDirFlag = additionalFlags.find(flag => flag.startsWith('--source-dir='));
  if (sourceDirFlag) {
    customSourceDir = sourceDirFlag.split('=')[1];
  }
}

// WXT builds to outDir/firefox-mv2
const wxtOutDir = customSourceDir || '.output';
const actualBuildDir = `${wxtOutDir}/firefox-mv2`;

// Remove source-dir flags from additional flags (we'll set it ourselves)
const filteredFlags: string[] = [];
for (let i = 0; i < additionalFlags.length; i++) {
  const flag = additionalFlags[i];
  if (flag === '--source-dir' || flag === '-s') {
    i++; // Skip the next item (the value)
    continue;
  }
  if (flag.startsWith('--source-dir=')) {
    continue;
  }
  filteredFlags.push(flag);
}

// Build web-ext command
const webExtCommand = `web-ext run --target=firefox-android --android-device=${deviceId} --firefox-apk=org.mozilla.fenix --source-dir ${actualBuildDir} ${filteredFlags.join(' ')}`;

// Run the build and web-ext commands
try {
  // Set environment variable for custom output directory
  if (customSourceDir) {
    process.env.WXT_OUT_DIR = wxtOutDir;
    console.log(`Using custom output directory: ${wxtOutDir}`);
  }

  console.log('Building Firefox extension...');
  execSync('wxt build -b firefox', { stdio: 'inherit', cwd: path.dirname(__dirname) });

  console.log(`Running on Android device ${deviceId}...`);
  execSync(webExtCommand, { stdio: 'inherit', cwd: path.dirname(__dirname) });
} catch (error: any) {
  console.error('Command failed:', error.message);
  process.exit(1);
}
