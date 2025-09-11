import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'RoyalRefresh',
    description: 'A web extension for royalroad.com. For people who juggle multiple stories',
    homepage_url: 'https://github.com/Seismix/royalrefresh',
    permissions: ['storage', '*://*.royalroad.com/*'],
    browser_specific_settings: {
        gecko: {
            id: 'royalrefresh.extension@example.com'
        },
    },
    icons: {
        "48": "icons/royalroad_48.png",
        "96": "icons/royalroad_96.png",
        "128": "icons/royalroad_128.png"
    }
  },
});
