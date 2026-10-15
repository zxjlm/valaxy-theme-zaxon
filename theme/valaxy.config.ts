import type { Plugin } from 'vite'
import type { ThemeConfig } from './types'
import { defineTheme } from 'valaxy'
import { defaultThemeConfig, generateSafelist, themePlugin } from './node'
import { travelStopsPlugin } from './node/travel-markdown'
import { readStaticTravelMap, travelPoints } from './node/travel-static'

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
    extendMd(ctx) {
      if (ctx.data.layout !== 'travel')
        return
      const config = (options.config.themeConfig as ThemeConfig).travel
      const map = readStaticTravelMap(options.userRoot, travelPoints(ctx.content, ctx.data), config)
      if (map) {
        ctx.route.addToMeta({ frontmatter: { travelMap: map } })
      }
      else if (config?.rendering === 'static' && travelPoints(ctx.content, ctx.data).length) {
        const message = `[zaxon] Missing or outdated static travel map: ${ctx.path}. Run zaxon-travel-maps before building.`
        if (options.mode === 'build')
          throw new Error(message)
        console.warn(message)
      }
    },
    markdown: {
      // Valaxy's config merge recurses when theme and site both define the same hook,
      // and sites usually add markdown-it plugins through `config`.
      preConfig(md) {
        md.use(travelStopsPlugin)
      },
    },
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
