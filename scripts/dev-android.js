#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the device ID from command line arguments
const deviceId = process.argv[2];
if (!deviceId) {
  console.error('Usage: pnpm dev:android <device-id>');
  process.exit(1);
}

// Run the build and web-ext commands
try {
  console.log(`Building Firefox extension...`);
  execSync('pnpm build:firefox', { stdio: 'inherit', cwd: path.dirname(__dirname) });

  console.log(`Running on Android device ${deviceId}...`);
  execSync(`web-ext run --target=firefox-android --android-device=${deviceId} --firefox-apk=org.mozilla.fenix --source-dir ./.output/firefox-mv2`, {
    stdio: 'inherit',
    cwd: path.dirname(__dirname)
  });
} catch (error) {
  console.error('Command failed:', error.message);
  process.exit(1);
}
