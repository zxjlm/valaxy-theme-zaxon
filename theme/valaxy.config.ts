import type { Plugin } from 'vite'
import type { ThemeConfig } from './types'
import { defineTheme } from 'valaxy'
import { defaultThemeConfig, generateSafelist, themePlugin } from './node'

const preloadableDependency = /\.(?:js|mjs|css)$/i
const katexFontFace = /@font-face\{[^{}]*font-family:KaTeX[^{}]*\}/g
const katexStylesheet = /\.katex\{[\s\S]*?(?=:root\{--va-c-border)/g
const katexRule = /(^|\})(?:\.katex|\.katex-display)[^{}]*\{[^{}]*\}/g
const katexFontPreload = /<link rel="preload" as="font"[^>]+(?:KaTeX|data:font\/woff2)[^>]*>/g
const globalStyleChunk = /^assets\/app\.[\w-]+\.css$/

function stripKatexFontPreloads(): Plugin {
  return {
    name: 'zaxon:strip-katex-font-preloads',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset' || !globalStyleChunk.test(asset.fileName) || typeof asset.source !== 'string')
          continue

        asset.source = asset.source
          .replace(katexFontFace, '')
          .replace(katexStylesheet, '')
          .replace(katexRule, '$1')
      }
    },
    transformIndexHtml(html) {
      return html.replace(katexFontPreload, '')
    },
  }
}

export default defineTheme<ThemeConfig>((options) => {
  return {
    themeConfig: defaultThemeConfig,
    vite: {
      build: {
        modulePreload: {
          resolveDependencies(_url, deps) {
            return deps.filter(dep => preloadableDependency.test(dep))
          },
        },
      },
      plugins: [stripKatexFontPreloads(), themePlugin(options)],
    },
    unocss: {
      safelist: generateSafelist(options.config.themeConfig as ThemeConfig),
    },
  }
})
