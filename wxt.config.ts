import ViteYaml from "@modyfi/vite-plugin-yaml"
import react from "@vitejs/plugin-react"
import { defineConfig } from "wxt"
// entrypoints/content-runtime, the ES module behind every page's content scripts
const CONTENT_RUNTIME_NAME = "content-runtime"

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  imports: false,
  modules: ["@wxt-dev/i18n/module"],
  manifestVersion: 3,
  manifest: ({ mode, browser }) => ({
    name: "__MSG_extName__",
    description: "__MSG_extDescription__",
    default_locale: "en",
    // Fixed extension ID for development
    ...(mode === "development" &&
      (browser === "chrome" || browser === "edge") && {
        key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAh4fEY21YQIz1x4LGT9gV38c1alkjMtC4AHAVA+i/d7c6JpUI/mC7dTJxMHGdWrelSMBbq02rJDZzhPoJ3EAiSsi7M1z1dtC+1fwzRKK/fMqKiMO1pYTx8Hrv8faBKYfn+1PtafmTzecYPv3e/0gfKNBaym/Q1o+77rjhYpfVZOrKhMpQWX2Dg3+/YSLIoNzpDq0DnMmQHnbYapziQlrPayuG0JcTCCslMBVbAF4nZcnacqO2EoWA3klS5cHrCSugNfKCpn92aEJrxlDG2B/i4knJRO6eRg5j5xtNl+MilZMKWFKNjfgifMr/z1tG2+ogYuV2QnnJ3MPsqocDIXVBmwIDAQAB",
      }),
    permissions: [
      "storage",
      "declarativeNetRequestWithHostAccess",
      // Config, backups and the translation caches are the only state this
      // extension keeps. Without this, IndexedDB is "best-effort" and the browser
      // may evict it under disk pressure — fine for the caches, data loss for the
      // settings the user typed by hand.
      "unlimitedStorage",
      "tabs",
      "alarms",
      "identity",
      "scripting",
      "webNavigation",
      ...(browser !== "firefox" ? ["offscreen"] : []),
    ],
    host_permissions: [
      "*://*/*", // Required for scripting.executeScript in any frame
    ],
    // Allow images/SVGs referenced by content-script UI <img> tags to be loaded from
    // moz-extension:// URLs on regular pages. Firefox enforces this more strictly.
    web_accessible_resources: [
      {
        resources: ["assets/*.png", "assets/*.svg", "assets/*.webp"],
        matches: ["*://*/*", "file:///*"],
      },
      // The shared content runtime the loader content script imports. Pages
      // can request it too; the dynamic URL keeps it from a fixed address.
      {
        resources: [`${CONTENT_RUNTIME_NAME}.js`],
        matches: ["*://*/*", "file:///*"],
        use_dynamic_url: true,
      },
      // Its chunks can't have one: Chrome resolves a module's relative imports
      // against the extension's static id, even when the module itself came
      // from the dynamic URL. Their names change with their content.
      {
        resources: [`${CONTENT_RUNTIME_NAME}/*`],
        matches: ["*://*/*", "file:///*"],
      },
    ],
    // Firefox-specific settings for MV3
    ...(browser === "firefox" && {
      // Override default CSP to exclude `upgrade-insecure-requests` (Firefox MV3 default),
      // which would upgrade custom provider HTTP URLs (e.g. LAN) to HTTPS.
      content_security_policy: {
        extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
      },
      browser_specific_settings: {
        gecko: {
          id: "{7c2f5a94-1b6e-4d38-9a05-e3f14c8b72d6}",
          strict_min_version: "140.0",
          data_collection_permissions: {
            required: ["none"],
            optional: ["technicalAndInteraction"],
          },
        },
      },
    }),
  }),
  zip: {
    includeSources: ["**/*", ".env.production"],
    excludeSources: ["docs/**/*", "assets/**/*", "repos/**/*"],
  },
  hooks: {
    "vite:build:extendConfig": (entrypoints, viteConfig) => {
      const entrypoint = entrypoints.length === 1 ? entrypoints[0] : undefined
      if (entrypoint?.type === "unlisted-script" && entrypoint.name === CONTENT_RUNTIME_NAME) {
        // WXT builds every script as one IIFE. The content runtime is imported
        // as an ES module instead, so it can leave code (such as the locales
        // it doesn't use) in chunks that load when needed.
        if (viteConfig.build?.lib) viteConfig.build.lib.formats = ["es"]
        const output = viteConfig.build?.rollupOptions?.output
        for (const outputOptions of Array.isArray(output) ? output : output ? [output] : []) {
          outputOptions.chunkFileNames = `${CONTENT_RUNTIME_NAME}/[name]-[hash].js`
          outputOptions.assetFileNames = "assets/[name]-[hash].[ext]"
          // Vite keeps whitespace and pure annotations in ES library output for
          // the bundlers that would consume it; nothing bundles this one again.
          if (viteConfig.build?.minify !== false) {
            outputOptions.minify = true
            outputOptions.comments = false
          }
        }
        return
      }
      if (entrypoint?.type !== "content-script") return

      const output = viteConfig.build?.rollupOptions?.output
      if (!output) return

      for (const outputOptions of Array.isArray(output) ? output : [output]) {
        outputOptions.assetFileNames = (assetInfo) =>
          assetInfo.names.some((name) => name.endsWith(".css"))
            ? `content-scripts/${entrypoint.name}.[ext]`
            : "assets/[name]-[hash].[ext]"
      }
    },
  },
  dev: {
    server: {
      // Prefer 3333 over WXT's default 3000 while still allowing WXT to pick
      // another open port when 3333 is already taken.
      port: 3333,
      strictPort: false,
    },
  },
  vite: () => ({
    build: {
      // Content scripts are one bundle per entrypoint by design (the browser loads
      // each as a single file), so Rolldown cannot split them and the default
      // 500 kB budget flags every one of them without anything actionable to do.
      chunkSizeWarningLimit: 3500,
      rolldownOptions: {
        onwarn(warning, defaultHandler) {
          // `mdast-util-to-hast` writes a bare `''` statement at the top of each
          // file so VS Code shows the JSDoc type imports above it. Rolldown treats
          // any leading string expression as a module directive and warns that it
          // cannot keep it, but the statement is a no-op either way.
          if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes('""')) return
          defaultHandler(warning)
        },
      },
    },
    resolve: {
      // CodeMirror breaks with "Unrecognized extension value in extension set"
      // if the bundle contains more than one copy of these packages (#1782).
      dedupe: [
        "@codemirror/state",
        "@codemirror/view",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/autocomplete",
        "@codemirror/search",
        "@codemirror/commands",
        "@lezer/common",
        // @codemirror/lang-liquid's parser and highlighting share these with the other languages.
        "@lezer/highlight",
        "@lezer/lr",
      ],
    },
    plugins: [
      react(),
      // Lets the runtime i18next facade (src/utils/i18n) `import` the `src/locales/*.yml`
      // files as JS objects so i18next can bundle them for runtime language switching.
      //
      // This does NOT replace `@wxt-dev/i18n/module` (still registered in `modules` above).
      // That module reads the same .yml files via its own fs-based mechanism — a separate
      // path from this Vite `import` — and is kept ONLY for two build-time jobs it still owns:
      //   1. Emitting `_locales/*/messages.json`, which the browser uses to localize the
      //      manifest `__MSG_extName__` / `__MSG_extDescription__` below. That is chosen by
      //      the browser UI language at load time and is NOT runtime-switchable (platform
      //      constraint), so it stays with @wxt-dev/i18n.
      //   2. Generating the `#i18n` key types (.wxt/i18n/structure.d.ts) that the facade
      //      reuses for autocomplete/type-checking at every `i18n.t('key')` call site.
      // Runtime UI string lookup itself no longer goes through @wxt-dev/i18n.
      ViteYaml(),
    ],
  }),
})
