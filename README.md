# Valaxy Theme Zaxon

Zaxon is a custom [Valaxy](https://valaxy.site) theme by Harumonia. It is designed around a quiet "Field Notes" concept: long-form technical articles, life logs, travel photos, short notes, and quotes share one low-saturation pixel-art notebook space.

> 中文文档见 [README-zh.md](./README-zh.md).

Preview: [Zaxon Blog](https://blog.harumonia.moe/)

![dark](https://cdn.jsdelivr.net/gh/zxjlm/my-static-files@master/img/20260629205330055.png)

![light](https://cdn.jsdelivr.net/gh/zxjlm/my-static-files@master/img/20260629205433992.png)

## Features

- Field Notes visual direction with responsive pixel-art assets, day/night hero imagery, and a calm handwritten-notebook atmosphere.
- Built-in light and dark mode using Valaxy's dark-mode transition support.
- Responsive navigation with desktop links, mobile menu, archive shortcut, and theme toggle.
- Home feed article cards with automatic DEV / LIFE / NOTE labels based on post metadata.
- Dedicated post layout with date, category metadata, author block, article pager, and styled Markdown content.
- AI disclosure block for posts tagged `ai-assisted` or `ai-use`.
- Archive, category, tag, and life-log pages styled as field catalogs and timelines.
- `/notes/` life stream that can separate life posts from development posts through configurable categories.
- Footer with copyright year range, icon, powered-by line, and optional ICP record.
- TypeScript theme config types exported from `valaxy-theme-zaxon`.

## Installation

```bash
pnpm add valaxy-theme-zaxon
```

If you are working inside this repository, install dependencies from the workspace root instead:

```bash
pnpm install
pnpm dev
```

## Usage

Set the theme to `zaxon` in your Valaxy config.

```ts
import type { ThemeConfig } from 'valaxy-theme-zaxon'
import { defineConfig } from 'valaxy'

export default defineConfig<ThemeConfig>({
  theme: 'zaxon',
})
```

Most site identity fields still use Valaxy's site config.

```ts
import { defineSiteConfig } from 'valaxy'

export default defineSiteConfig({
  lang: 'en',
  title: 'Zaxon',
  subtitle: 'Code, daily life, and field observations',
  url: 'https://example.com/',
  author: {
    name: 'Your Name',
    avatar: '/pwa-192x192.png',
  },
  description: 'A personal field notebook for code and life.',
  social: [
    {
      name: 'GitHub',
      link: 'https://github.com/your-name',
      icon: 'i-ri-github-line',
      color: '#6e5494',
    },
  ],
  comment: {
    enable: false,
  },
})
```

## Theme Configuration

Configure Zaxon through `themeConfig` in `valaxy.config.ts`.

```ts
import type { ThemeConfig } from 'valaxy-theme-zaxon'
import { defineConfig } from 'valaxy'

export default defineConfig<ThemeConfig>({
  theme: 'zaxon',

  themeConfig: {
    colors: {
      primary: '#5E918D',
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Development', link: '/categories/' },
      { text: 'Life', link: '/notes/' },
      { text: 'Archive', link: '/archives/' },
      { text: 'About', link: '/about/' },
    ],

    content: {
      lifeCategories: ['Life', 'Travel', 'Reading'],
      devCategories: ['Dev Log', 'Engineering'],
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
  },
})
```

### Configuration Reference

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `colors.primary` | `string` | `#5E918D` | Primary theme color passed into theme SCSS. |
| `nav` | `{ text: string, link: string, icon?: string }[]` | Built-in Home / Development / Life / Archive / About links | Main navigation items. The current UI renders `text` and `link`. |
| `content.lifeCategories` | `string[]` | `[]` | Category names treated as life entries for `/notes/`. |
| `content.devCategories` | `string[]` | `[]` | Category names treated as development entries, preventing them from appearing in `/notes/`. |
| `footer.since` | `number` | `2022` | First copyright year. |
| `footer.icon.name` | `string` | `i-ri-seedling-line` | Iconify / UnoCSS icon class used between the year and author name. |
| `footer.icon.animated` | `boolean` | `true` | Reserved in config for animated footer icons. |
| `footer.icon.color` | `string` | `var(--st-accent-lantern)` | Footer icon color. |
| `footer.icon.url` | `string` | `/` | Footer icon link target. |
| `footer.icon.title` | `string` | `Zaxon` | Footer icon title. |
| `footer.powered` | `boolean` | `true` | Show the Valaxy and theme powered-by line. |
| `footer.beian.enable` | `boolean` | `false` | Show ICP record in the footer. |
| `footer.beian.icp` | `string` | `''` | ICP record text. |

## Content Conventions

Zaxon uses normal Valaxy posts and frontmatter. A typical post looks like this:

```md
---
title: Debugging an Edge Cache Issue
date: 2026-06-18
categories:
  - Dev Log
tags:
  - Cloudflare
  - Cache
  - Debugging
type: article
excerpt: A field note on tracing stale static assets from headers to cache rules.
---

Your article content.
```

Post cards and `/notes/` labels are inferred from `title`, `excerpt`, `type`, `tags`, and `categories`.

- Photo-like entries: include words such as `photo`, `travel`, `摄影`, `旅行`, or `照片`.
- Quote-like entries: include words such as `quote`, `摘录`, `引用`, or `句子`.
- Note-like entries: include words such as `note`, `memo`, `笔记`, `随记`, or `灵感`.
- Life entries: include life categories through `content.lifeCategories`, or words such as `life`, `生活`, `阅读`, `音乐`, or `咖啡`.

For precise life/development separation, prefer configuring `content.lifeCategories` and `content.devCategories`.

### AI-Assisted Posts

Add the `ai-assisted` tag to a post when the article is mainly generated or translated by AI and then manually reviewed:

```yaml
tags:
  - ai-assisted
```

The theme prepends an AI disclosure block to the article. `ai-use` is also supported as a compatibility alias.

## Built-In Pages

Create the corresponding Markdown entry files in your Valaxy site to enable these routes:

- `/archives/`: archive timeline.
- `/categories/`: category catalog.
- `/tags/`: tag cloud.
- `/notes/`: life-log timeline.
- `/about/`: regular Markdown page styled by the theme layout.

The demo site includes examples under `demo/pages/`.

## Development

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

The publishable theme lives in `theme/`. The local showcase site lives in `demo/`.

## Credits

Created by Harumonia, built on Valaxy.
