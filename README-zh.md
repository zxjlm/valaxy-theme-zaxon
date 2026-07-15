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
- 支持 Argus 静态相册：通过隐私安全的 JSON manifest 和本地缩略图 / 预览图渲染 `/albums/` 与 `/albums/<slug>/`。
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
      { text: '相册', link: '/albums' },
      { text: '归档', link: '/archives/' },
      { text: '关于', link: '/about/' },
    ],

    content: {
      lifeCategories: ['生活', '旅行', '阅读'],
      devCategories: ['Dev Log', '工程'],
    },

    hero: {
      desktopLight: 'https://cdn.example.com/hero-desktop-light.png',
      desktopDark: 'https://cdn.example.com/hero-desktop-dark.png',
      mobileLight: 'https://cdn.example.com/hero-mobile-light.png',
      mobileDark: 'https://cdn.example.com/hero-mobile-dark.png',
      // 可选：先显示 WebP 预览图，再加载对应高清图。
      desktopLightPreview: 'https://cdn.example.com/hero-desktop-light-low.webp',
      desktopDarkPreview: 'https://cdn.example.com/hero-desktop-dark-low.webp',
      mobileLightPreview: 'https://cdn.example.com/hero-mobile-light-low.webp',
      mobileDarkPreview: 'https://cdn.example.com/hero-mobile-dark-low.webp',
    },

    albums: {
      enable: true,
      indexPath: '/albums/index.json',
      title: '相册',
      description: '从 Argus 发布的照片记录。',
      featured: {
        enable: false,
        limit: 6,
      },
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
| `hero.desktopLight` | `string` | 内置 GitHub Raw 地址 | 桌面端浅色模式的必填高清图。 |
| `hero.desktopDark` | `string` | 内置 GitHub Raw 地址 | 桌面端深色模式的必填高清图。 |
| `hero.mobileLight` | `string` | 内置 GitHub Raw 地址 | 移动端浅色模式的必填高清图。 |
| `hero.mobileDark` | `string` | 内置 GitHub Raw 地址 | 移动端深色模式的必填高清图。 |
| `hero.desktopLightPreview` | `string?` | 内置 GitHub Raw 地址 | 可选 WebP 预览图；省略或设为 `''` 时直接加载高清图。 |
| `hero.desktopDarkPreview` | `string?` | 内置 GitHub Raw 地址 | 可选 WebP 预览图；省略或设为 `''` 时直接加载高清图。 |
| `hero.mobileLightPreview` | `string?` | 内置 GitHub Raw 地址 | 可选 WebP 预览图；省略或设为 `''` 时直接加载高清图。 |
| `hero.mobileDarkPreview` | `string?` | 内置 GitHub Raw 地址 | 可选 WebP 预览图；省略或设为 `''` 时直接加载高清图。 |
| `albums.enable` | `boolean` | `true` | 是否启用 Argus 静态相册路由。关闭后，相册 composable 不会加载 manifest。 |
| `albums.indexPath` | `string` | `/albums/index.json` | Argus 生成的相册索引 manifest 的公开路径。 |
| `albums.title` | `string` | `相册` | `/albums/` 页面的标题。 |
| `albums.description` | `string` | `从 Argus 发布的照片记录。` | 相册标题下方的说明文字。 |
| `albums.featured.enable` | `boolean` | `false` | 为未来的精选照片入口预留；Phase 1 不会在首页或 `/notes/` 渲染精选照片。 |
| `albums.featured.limit` | `number` | `6` | 为未来精选照片入口预留的数量上限。 |
| `footer.since` | `number` | `2022` | 版权起始年份。 |
| `footer.icon.name` | `string` | `i-ri-seedling-line` | 年份与作者之间展示的 Iconify / UnoCSS 图标类名。 |
| `footer.icon.animated` | `boolean` | `true` | 为动态图标预留的配置项。 |
| `footer.icon.color` | `string` | `var(--st-accent-lantern)` | 页脚图标颜色。 |
| `footer.icon.url` | `string` | `/` | 页脚图标链接。 |
| `footer.icon.title` | `string` | `Zaxon` | 页脚图标标题。 |
| `footer.powered` | `boolean` | `true` | 是否展示 Valaxy 与主题 Powered by 信息。 |
| `footer.beian.enable` | `boolean` | `false` | 是否在页脚展示 ICP 备案号。 |
| `footer.beian.icp` | `string` | `''` | ICP 备案号文本。 |

## Argus 静态相册

Zaxon 在 Valaxy 构建期和浏览器运行时都不会调用 Argus API。两者的边界是一份由 Argus 生成、复制进 Valaxy 站点的静态发布包。Argus 负责私有相册管理、发布决策、读取派生图和隐私过滤；Zaxon 只负责渲染公开包。

一个发布包应包含：

```text
public/albums/index.json
public/albums/<slug>/album.json
public/albums/<slug>/preview/<ordered-photo-name>.<ext>
public/albums/<slug>/thumbnail/<ordered-photo-name>.<ext>
pages/albums/index.md
pages/albums/<slug>.md
```

Markdown 文件只是路由入口。索引页使用 `layout: albums`，详情页使用 `layout: album`，由主题接管相册列表、照片网格和键盘可访问的 lightbox。

```md
---
title: 相册
layout: albums
nav: false
comment: false
---
```

```md
---
title: Kyoto Walk
layout: album
nav: false
comment: false
---
```

`public/albums/index.json` 是相册列表，每个条目指向对应的详情 manifest：

```json
{
  "schema_version": 1,
  "generated_at": "2026-07-04T00:00:00Z",
  "albums": [
    {
      "id": "album-id",
      "slug": "kyoto-walk",
      "title": "Kyoto Walk",
      "description": "A quiet walk after rain.",
      "cover": "/albums/kyoto-walk/thumbnail/0001-photo.webp",
      "photo_count": 24,
      "updated_at": "2026-07-04T00:00:00Z",
      "published_at": "2026-07-04T00:00:00Z",
      "sort_order": 10,
      "manifest_path": "/albums/kyoto-walk/album.json"
    }
  ]
}
```

`public/albums/<slug>/album.json` 是照片网格和 lightbox 使用的公开照片数据。可选字段为空时，主题会直接省略对应元信息。

```json
{
  "schema_version": 1,
  "album_id": "album-id",
  "slug": "kyoto-walk",
  "title": "Kyoto Walk",
  "description": "A quiet walk after rain.",
  "cover_photo_id": "photo-id",
  "updated_at": "2026-07-04T00:00:00Z",
  "photos": [
    {
      "id": "photo-id",
      "original_filename": "DSC0001.jpg",
      "width": 1600,
      "height": 1200,
      "captured_at": "2026-07-04T00:00:00Z",
      "city": "Kyoto",
      "camera_make": "Argus Camera",
      "camera_model": "A1",
      "lens_model": "Prime",
      "ai_tags": ["travel"],
      "manual_tags": ["published"],
      "preview_path": "/albums/kyoto-walk/preview/0001-photo.webp",
      "thumbnail_path": "/albums/kyoto-walk/thumbnail/0001-photo.webp",
      "featured": false,
      "featured_order": null,
      "journal_excerpt": null
    }
  ]
}
```

请只发布白名单字段。静态 manifest 不应包含原图、精确 GPS、完整 EXIF、存储 key、云厂商标识、凭据、工作流状态、评分或失败详情。

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
