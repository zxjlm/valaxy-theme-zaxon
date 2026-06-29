# Valaxy Theme Zaxon

Zaxon 是 [Valaxy](https://valaxy.site) 自定义主题。它的视觉核心是「Field Notes」：技术长文、生活记录、旅行照片、短笔记与摘录被放进同一个低饱和像素手帐空间里。

> English documentation: [README.md](./README.md).

## 预览

实际效果预览: [Zaxon Blog](https://blog.harumonia.moe/)

![dark](https://cdn.jsdelivr.net/gh/zxjlm/my-static-files@master/img/20260629205330055.png)

![light](https://cdn.jsdelivr.net/gh/zxjlm/my-static-files@master/img/20260629205433992.png)

## 功能特性

- Field Notes 视觉风格：响应式像素素材、明暗模式首屏图与安静的手帐氛围。
- 基于 Valaxy 明暗模式能力，内置 light / dark 切换与过渡效果。
- 响应式导航：桌面导航、移动端菜单、归档快捷入口与主题切换按钮。
- 首页文章卡片会根据文章元信息自动显示 DEV / LIFE / NOTE 标签。
- 文章页包含日期、分类、作者区块、上下篇切换与统一样式的 Markdown 正文。
- 对带有 `ai-assisted` 或 `ai-use` 标签的文章自动展示 AI 辅助说明。
- 内置归档、分类、标签与生活记录页面，采用 field catalog / timeline 风格。
- `/notes/` 生活流支持通过配置将生活类文章与开发类文章分离。
- 页脚支持版权年份、图标、Powered by 信息与可选 ICP 备案号。
- 从 `valaxy-theme-zaxon` 导出 TypeScript 主题配置类型。

## 安装

```bash
pnpm add valaxy-theme-zaxon
```

如果是在本仓库内开发，请在 workspace 根目录安装依赖：

```bash
pnpm install
pnpm dev
```

## 使用

在 Valaxy 配置中将主题设为 `zaxon`。

```ts
import type { ThemeConfig } from 'valaxy-theme-zaxon'
import { defineConfig } from 'valaxy'

export default defineConfig<ThemeConfig>({
  theme: 'zaxon',
})
```

站点名称、作者、社交链接等身份信息仍然使用 Valaxy 的站点配置。

```ts
import { defineSiteConfig } from 'valaxy'

export default defineSiteConfig({
  lang: 'zh-CN',
  title: 'Zaxon',
  subtitle: '代码、日常与旅途中的观察记录',
  url: 'https://example.com/',
  author: {
    name: 'Your Name',
    avatar: '/pwa-192x192.png',
  },
  description: '记录代码与生活，收集微小而确定的光。',
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

## 主题配置

Zaxon 的主题选项写在 `valaxy.config.ts` 的 `themeConfig` 中。

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
      { text: '首页', link: '/' },
      { text: '开发', link: '/categories/' },
      { text: '生活', link: '/notes/' },
      { text: '归档', link: '/archives/' },
      { text: '关于', link: '/about/' },
    ],

    content: {
      lifeCategories: ['生活', '旅行', '阅读'],
      devCategories: ['Dev Log', '工程'],
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

### 配置项说明

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `colors.primary` | `string` | `#5E918D` | 主题主色，会传入主题 SCSS。 |
| `nav` | `{ text: string, link: string, icon?: string }[]` | 内置首页 / 开发 / 生活 / 归档 / 关于 | 主导航项目。目前界面会渲染 `text` 与 `link`。 |
| `content.lifeCategories` | `string[]` | `[]` | 归入 `/notes/` 生活流的分类名。 |
| `content.devCategories` | `string[]` | `[]` | 归为开发内容的分类名，用于避免进入 `/notes/`。 |
| `footer.since` | `number` | `2022` | 版权起始年份。 |
| `footer.icon.name` | `string` | `i-ri-seedling-line` | 年份与作者之间展示的 Iconify / UnoCSS 图标类名。 |
| `footer.icon.animated` | `boolean` | `true` | 为动态图标预留的配置项。 |
| `footer.icon.color` | `string` | `var(--st-accent-lantern)` | 页脚图标颜色。 |
| `footer.icon.url` | `string` | `/` | 页脚图标链接。 |
| `footer.icon.title` | `string` | `Zaxon` | 页脚图标标题。 |
| `footer.powered` | `boolean` | `true` | 是否展示 Valaxy 与主题 Powered by 信息。 |
| `footer.beian.enable` | `boolean` | `false` | 是否在页脚展示 ICP 备案号。 |
| `footer.beian.icp` | `string` | `''` | ICP 备案号文本。 |

## 内容约定

Zaxon 使用标准 Valaxy 文章与 frontmatter。一个典型文章如下：

```md
---
title: 边缘缓存失效的一次排查手记
date: 2026-06-18
categories:
  - Dev Log
tags:
  - Cloudflare
  - 缓存
  - 排障
type: article
excerpt: 一次静态资源没有按预期刷新的排查，从响应头、构建产物到缓存规则，把问题拆回可以验证的几步。
---

正文内容。
```

文章卡片与 `/notes/` 标签会根据 `title`、`excerpt`、`type`、`tags`、`categories` 推断类型。

- 照片类：包含 `photo`、`travel`、`摄影`、`旅行`、`照片` 等词。
- 摘录类：包含 `quote`、`摘录`、`引用`、`句子` 等词。
- 笔记类：包含 `note`、`memo`、`笔记`、`随记`、`灵感` 等词。
- 生活类：可通过 `content.lifeCategories` 明确配置，或包含 `life`、`生活`、`阅读`、`音乐`、`咖啡` 等词。

如果希望稳定地区分生活内容和开发内容，建议优先配置 `content.lifeCategories` 与 `content.devCategories`。

### AI 辅助文章

当文章主要由 AI 生成或翻译、并经过人工校对时，可以添加 `ai-assisted` 标签：

```yaml
tags:
  - ai-assisted
```

主题会在文章正文前自动插入 AI 辅助说明。兼容标签 `ai-use` 也会触发同样效果。

## 内置页面

在你的 Valaxy 站点中创建对应 Markdown 入口后，可启用这些路由：

- `/archives/`：归档时间线。
- `/categories/`：分类目录。
- `/tags/`：标签云。
- `/notes/`：生活记录时间线。
- `/about/`：普通 Markdown 页面，使用主题布局渲染。

示例可以参考本仓库的 `demo/pages/`。

## 开发

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

可发布的主题代码位于 `theme/`，本地展示站点位于 `demo/`。

## 致谢

Created by Harumonia, built on Valaxy.
