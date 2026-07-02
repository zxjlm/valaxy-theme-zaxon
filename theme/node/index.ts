import type { ResolvedValaxyOptions } from 'valaxy'
import type { Plugin } from 'vite'
import type { ThemeConfig } from '../types'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

/**
 * Default Config
 */
export const defaultThemeConfig: ThemeConfig = {
  valaxyDarkOptions: {
    circleTransition: true,
    useDarkOptions: {
      initialValue: 'dark',
    },
  },

  colors: {
    primary: '#5E918D',
  },

  footer: {
    since: 2022,
    icon: {
      name: 'i-ri-seedling-line',
      animated: true,
      color: 'var(--st-accent-lantern)',
      url: '/',
      title: 'Zaxon',
    },

    powered: true,

    beian: {
      enable: false,
      icp: '',
    },
  },

  nav: [],
}

export function markdownSourcePathForUrl(url: string, userRoot: string): string | null {
  let pathname: string

  try {
    pathname = decodeURIComponent(new URL(url, 'http://valaxy.local').pathname)
  }
  catch {
    return null
  }

  if (!pathname.startsWith('/posts/') || !pathname.endsWith('.md'))
    return null

  const segments = pathname.slice(1).split('/')
  if (segments.some(segment => !segment || segment === '.' || segment === '..' || segment.includes('\0')))
    return null

  return join(userRoot, 'pages', ...segments)
}

function markdownFilesInPosts(userRoot: string): string[] {
  const postsDir = join(userRoot, 'pages', 'posts')
  if (!existsSync(postsDir))
    return []

  const files: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const entryPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(entryPath)
      }
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(entryPath)
      }
    }
  }

  walk(postsDir)
  return files
}

function isDraftMarkdown(source: string): boolean {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return !!frontmatter?.[1].match(/^draft:\s*true\s*$/m)
}

// write a vite plugin
// https://vitejs.dev/guide/api-plugin.html
export function themePlugin(options: ResolvedValaxyOptions<ThemeConfig>): Plugin {
  const themeConfig = options.config.themeConfig || {}

  return {
    name: 'valaxy-theme-zaxon',
    enforce: 'pre',

    config() {
      return {
        css: {
          preprocessorOptions: {
            scss: {
              additionalData: `$c-primary: ${themeConfig.colors?.primary || '#0078E7'} !default;`,
            },
          },
        },

        valaxy: {},
      }
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const sourcePath = markdownSourcePathForUrl(req.url || '', options.userRoot)
        if (!sourcePath || !existsSync(sourcePath)) {
          next()
          return
        }

        res.statusCode = 200
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
        res.end(readFileSync(sourcePath, 'utf-8'))
      })
    },

    generateBundle() {
      const pagesDir = join(options.userRoot, 'pages')

      for (const file of markdownFilesInPosts(options.userRoot)) {
        const source = readFileSync(file, 'utf-8')
        if (isDraftMarkdown(source))
          continue

        this.emitFile({
          type: 'asset',
          fileName: relative(pagesDir, file).split(sep).join('/'),
          source,
        })
      }
    },
  }
}

/**
 * generateSafelist by config
 * @param themeConfig
 */
export function generateSafelist(themeConfig: ThemeConfig) {
  const safelist: string[] = []

  const footerIcon = themeConfig.footer?.icon?.name
  if (footerIcon)
    safelist.push(footerIcon)

  return safelist
}
