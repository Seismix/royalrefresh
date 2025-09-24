<h1 align="center">
  <img src="public/icons/royalroad_128.png" alt="RoyalRefresh Logo" width="128" height="128">
</h1>

<h1 align="center">RoyalRefresh</h1>

<p align="center">A web extension for <a href="https://royalroad.com">royalroad.com</a>.<br>For people who juggle multiple stories.</p>

<h2 align="center">Install</h2>
<p align="center">
    <a href="https://addons.mozilla.org/en-US/firefox/addon/royalrefresh">
        <img src="https://img.shields.io/badge/Firefox-royalrefresh-orange?logo=firefoxbrowser&style=flat-square" alt="Install Firefox Add-on" style="margin-right: 4px;">
    </a>
    <a href="https://chromewebstore.google.com/detail/royalrefresh/dfedgngibbhkdhcengnfhdolgcogmijc">
        <img src="https://img.shields.io/badge/Chrome-royalrefresh-blue?logo=googlechrome&style=flat-square" alt="Install from Chrome Web Store" style="margin-right: 4px;">
    </a>
    <a href="https://chromewebstore.google.com/detail/royalrefresh/dfedgngibbhkdhcengnfhdolgcogmijc">
        <img src="https://img.shields.io/badge/Edge-royalrefresh-green?&style=flat-square" alt="Install for Edge from Chrome Web Store" style="margin-right: 4px;">
    </a>
    <a href="https://chromewebstore.google.com/detail/royalrefresh/dfedgngibbhkdhcengnfhdolgcogmijc">
        <img src="https://img.shields.io/badge/Opera-royalrefresh-red?logo=opera&style=flat-square" alt="Install for Opera from Chrome Web Store">
    </a>
</p>

## Why?

I've been an avid reader on [royalroad.com](https://royalroad.com) since 2019 and like many others, I juggle
multiple stories at the same time. At some point this got somewhat unmanageable and often I drew a blank when thinking
about what happened in the last chapter of the story I just opened. More and more I found myself having to go back one
chapter and scroll all the way down just to re-read the last few paragraphs as a refresher. This is especially annoying
while on mobile, where I often read while on the train.

That's when decided on trying to implement this little idea implementing a refresh of what happened in the last chapter.

## What is it?

RoyalRefresh is a browser extension for [royalroad.com](https://royalroad.com) that inserts a button next to RoyalRoad's
"Reader Preferences" button on chapter URLs. When clicked, the last few paragraphs of the previous chapter get fetched
and displayed at the top of the chapter, which you can toggle on and off using the button. The extension defaults to
showing you the last 250 words of the previous chapter (adjustable in extension settings, [see Settings](#settings)).

Here's an example of what it looks like:

![Refresh example](docs/recap_example.png)

## Settings

The extension comes with a settings page where you can adjust the refresh length and other settings.
There are a few ways to access the settings page:

1. Click the extension icon in the browser toolbar to open the popup (Recommended)
1. Open RoyalRoad's "Reader Preferences" menu and click "Open RoyalRefresh settings"
1. Depending on your browser, there may be alternative methods to access the extension settings,
(such as using `about:addons` in Firefox)

<details>
  <summary>Basic Settings popup</summary>
  
  ![Settings page](docs/basic_settings.png)
  
</details>  

Advanced users can change CSS selectors in the settings if the site design changes, until a new extension update is pushed.

> [!NOTE]
> Advanced settings for CSS selectors are only available in the full extension settings page, not in the popup. Use the
> popup to quickly access basic settings, but open the full settings page for advanced configuration.

<details>
  <summary>Advanced settings</summary>
  
  ![Advanced settings](docs/advanced_settings.png)
  
</details>

## Tech Stack

This extension is built using:

- **[WXT](https://wxt.dev/)**: A framework for building web extensions with a modern development experience.
- **Svelte 5**: A reactive component framework for building the user interface.

## Bug reports & Ideas

Check out everything I'm tracking in this project's [issues](https://github.com/Seismix/royalrefresh/issues/).

This is my first public repo, for now and until changes are needed, just create a issue with an appropriate label and a
descriptive message and I will take a look. Any contributions are welcome, issues where I specifically need help are
marked with the `contributions welcome` label.

## Contributing

### Prerequisites

- Node.js (version 18 or higher)
- pnpm (package manager)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Seismix/royalrefresh.git
cd royalrefresh
pnpm install
```

### Development

To start the development server for Chrome (default):

```bash
pnpm dev
```

To start the development server for Firefox:

```bash
pnpm dev:firefox
```

To develop for Firefox Android:

```bash
pnpm dev:android
```

This will build the Firefox version and run it on a connected Android device. Make sure you have ADB set up and the device connected.

### Building

To build the extension for chromium browsers:

```bash
pnpm build
```

To build specifically for Firefox:

```bash
pnpm build:firefox
```

### Browser Configuration

You can configure browser startup options using `web-ext.config.ts` files. For more information, see WXT's
[Browser Startup documentation](https://wxt.dev/guide/essentials/config/browser-startup.html).

For example, to set custom browser binaries or startup URLs, create a `web-ext.config.ts` file:

```typescript
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  startUrl: [
    "https://www.royalroad.com/",
    "about:addons"
  ],
  binaries: {
    firefox: 'firefoxdeveloperedition',
  },
});
```

For a full list of options, see the [web-ext command reference](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/).
