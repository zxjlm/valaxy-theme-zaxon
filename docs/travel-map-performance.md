# 游记地图加速

## 选择：发布前生成图片

原来的游记背景由 MapLibre 实时绘制。滚动时相机不断移动、缩放，访问者需要下载不同区域、不同缩放级别的矢量瓦片，以及样式、字体和图标。现有调度器能合并请求并缓存瓦片，但不能消除首次访问时的下载、解码和 WebGL 绘制。

只给瓦片增加 CDN 缓存，仍然需要读者下载多张瓦片并实时绘制。这个项目的地图是不可拖动的文章背景，路线和地点在发布时已经确定，因此可以直接把最终画面预渲染。

现在根据文章坐标预生成完整相机路径：总览、地点，以及点到点之间的平移和缩放画面，包含桌面、手机、明暗四套版本。相机路径沿用原来的 fly 插值；远距离移动会先拉远，再移向目标并放大。

运行时在 Canvas 2D 中对已解码的地图图片做连续 Web Mercator 投影，随阅读进度平移、缩放。一次滚动可以在同一张图片上连续移动；切换附近的预生成画面时短暂混合，两张地图使用同一个相机位置，避免地理位置跳动。路线底图提前绘制，当前地点高亮单独叠加。资源齐全或有可恢复缓存时，构建不连接地图提供商；读者访问不连接地图提供商，也不加载 MapLibre GL。

每张图片在四周预留 24% 的范围，防止平移、缩放露出空白。路径按相机变化自适应采样，较远地点之间有更多画面；重复坐标直接复用。生成清单为 v2，旧的只有固定点位的生成结果不会被复用。

## 使用

生成器使用 MapLibre Native 直接绘制，sharp 编码 WebP，无需 Playwright、Chromium 或本地 HTTP 服务。推荐 Node.js 24；原生渲染器的预编译二进制与 Node ABI、操作系统、CPU 架构相关。

在本仓库中安装依赖并构建。`pnpm build`、`pnpm build:demo` 和 `pnpm dev` 均在启动 Valaxy 前自动恢复或生成所有游记地图：

```bash
pnpm install
pnpm build
```

仅生成一篇文章，文件路径相对于 `demo/`：

```bash
pnpm travel:maps --file pages/posts/79ee39fe-312d-4ffe-9397-3d602da52f9e.md
```

`pnpm travel:maps` 也可手动准备全部文章。命令首先校验本地图片；缺失或损坏时从 `demo/.cache/zaxon/travel-maps/` 恢复。缓存也不可用时才加载 Native 和 sharp 联网生成。每张图片都必须匹配文件名中的 SHA-256 内容摘要，恢复完成后再次校验。

```bash
# 只检查发布目录，缺失、损坏或过期时以非零状态退出，不恢复或生成
pnpm travel:maps:check

# 自定义持久缓存目录，目录不要放在 public/ 中
pnpm travel:maps --cache-dir /path/to/map-cache

# 绕过已有图片与缓存，更新底图
pnpm travel:maps --force
```

主题安装到其他 Valaxy 网站时：

```bash
pnpm add -D @maplibre/maplibre-gl-native@6.4.1 sharp@0.35.5
pnpm exec zaxon-travel-maps --root .
pnpm build
```

其他站点需要把 `zaxon-travel-maps --root .` 接到自己的开发和构建命令之前。例如，使用 npm 运行 `build` 的站点可增加 `"prebuild": "zaxon-travel-maps --root ."`；使用 `pnpm run` 时建议在 `build` 命令中显式串联准备步骤，不依赖包管理器是否启用 pre/post 钩子。将 `public/travel-maps/**/*.webp`、`public/travel-maps/**/*.tmp` 和 `.cache/zaxon/` 加入站点的 `.gitignore`，小型 `map.json` 可继续提交。

命令读取站点的 `valaxy.config.ts`，使用 `themeConfig.travel.style`、`darkStyle`、`zoom`、`attribution`。默认仍是 OpenFreeMap Positron / Fiord。自定义提供商应允许将生成的图片公开托管。

本仓库已针对性允许原生库的安装脚本。其他 pnpm 站点如果阻止了安装脚本，需要允许 `@maplibre/maplibre-gl-native` 和 sharp 的脚本。Linux 无显示环境根据所用原生后端可能需要 OpenGL/Mesa 和 Xvfb，可使用 `xvfb-run -a pnpm travel:maps`；这次实际验收环境是 macOS arm64、Node.js 24.13.1。

本仓库保留 `trustPolicy: no-downgrade`，并排除了 Native 包携带的旧开发工具 `npm-run-all`。已核对其安装脚本和运行入口，两者均不使用该工具；该排除项不影响下载官方预编译二进制。

生成文件位于站点的 `public/travel-maps/`，需要随网站部署。WebP 是发布产物，不进入 Git；本仓库只跟踪小型 `map.json`。本地持久缓存位于站点的 `.cache/zaxon/`，同样不进入 Git。只要坐标顺序和样式配置没有变化，重复执行会校验并复用已有结果，无须加载原生渲染库。文字、照片、地图透明度和 CDN 域名修改不会使地图失效。希望更新底图数据时执行 `pnpm travel:maps --force`。

已有 Git 图片需要一次性取消跟踪，单纯添加忽略规则无效。迁移不会删除本地图片，也不会重写已有 Git 历史。新的清单在所有资源写入后才发布；旧图片不会自动删除，以保留旧部署所引用的资源。

生成器会在单次运行中复用瓦片、字体等资源，最多并发 6 个底图资源请求；网络错误会使生成失败，manifest 只在全部图片成功后更新。Native 相机没有 padding 接口，生成器通过 Web Mercator 偏移保持原有地图焦点位置。manifest 记录 `renderer: maplibre-native`，原来的浏览器生成结果不会被当成原生结果复用。

地图图片以内容摘要命名，重新生成不同的图片会使用新 URL。坐标、缩放、样式或署名变化时，构建只接入匹配的生成结果。缺图、损坏的 manifest 或旧结果均不接入。生成失败以非零状态退出，并且不会发布不完整的 manifest。

```ts
export default defineConfig<ThemeConfig>({
  themeConfig: {
    travel: {
      rendering: 'static',
      // 可选：该域名根目录下需存在 travel-maps/，并允许图片公开访问。
      // staticBaseUrl: 'https://images.example.com/',
    },
  },
})
```

- `auto`（默认）：有匹配的生成结果时使用图片，否则使用原来的实时地图。
- `static`：只使用生成图片；含有效地点的文章缺失地图时，生产构建失败，开发时提示生成。页面不启动实时地图。演示站点采用此模式。
- `live`：使用原来的实时地图。

新增或修改游记坐标后，重新启动开发命令或执行构建会自动准备资源；若开发服务器已经运行，需要完成生成后重启。CI 在 Ubuntu 24.04、Node.js 24 下恢复 Actions 缓存，缓存不足时通过 Mesa/Xvfb 原生生成，再把验证后的资源作为构建产物交给 Linux 和 Windows 构建。构建任务无需重新渲染。缓存键包含文章、配置、生成器、清单和锁文件摘要；恢复其他缓存版本时仍按地图键和图片摘要逐项检查。

首次检出且无资源缓存的构建需要访问地图提供商，并需要可运行的原生渲染环境；后续命中完整缓存时不需要。缓存可能失效，构建始终有重新生成路径；网络或原生渲染失败会中止准备步骤，后续构建不会继续。主题将 Native 与 sharp 声明为可选 peerDependencies，普通站点构建不加载这两个库。

在 Cloudflare Pages 等托管构建平台上，构建命令仍为 `pnpm build`，Node.js 使用 24。需要确保冷构建环境支持原生库和所需图形运行库；若平台不支持，应在具备该环境的 CI 中生成、构建，再上传静态站点。GitHub 的 Actions 缓存不自动共享给其他托管平台。当前未连接任何远端资源存储；本地缓存与 GitHub CI 缓存已接入。

## Cloudflare

Cloudflare Pages 部署时，`public/` 下的文件随构建复制，静态地图和网站一同部署即可，无须 Worker 或 R2。演示站点的 `public/_headers` 已加入：

```text
/travel-maps/*.webp
  Cache-Control: public, max-age=31536000, immutable
```

内容摘要图片可使用一年浏览器缓存。`map.json` 由构建读取并嵌入页面路由，访问时不额外下载，也不设置长期不可变缓存。Cloudflare Pages 对静态资源提供边缘缓存，具体命中情况需部署后检查响应头。

若图片托管在 R2，应给自定义域名启用缓存，并设置图片对象的同等 `Cache-Control`，然后配置 `staticBaseUrl`。单纯将文件放入 R2 不等于已启用 CDN 缓存。当前改动准备了静态资源与 Pages 响应头规则，没有修改 Cloudflare 账户或发布线上网站。

## 预载与内存

页面优先加载当前相机附近的画面，显示后按阅读方向预载前方最多 4 张、后方 1 张；跨地点时会衔接下一段路径。反向滚动会反转预载方向，快速跳转会丢弃尚未开始的过时预载。图片最多并发下载 2 张。

解码缓存采用 LRU，像素预算为 16 × 1024 × 1024，约 64 MiB RGBA；当前目标会保留。Canvas 输出与短暂混合使用的图片另计。页面不会一次下载或解码整篇文章的所有图片。

没有合适画面或下载失败时保留上一幅完整地图，新的画面解码完成后继续跟随进度，不请求实时瓦片。瞬间跳过尚未预载的远处段落仍可能短暂停留；这避免为了跟随滚动而显示图片外的空白。失败的图片至少间隔 30 秒才重试。

系统开启“减少动态效果”时，只切换到地点画面，关闭连续移动和沿途预载；浏览器开启省流量时关闭预载，但仍可按阅读位置加载所需画面。

## 本地验证

逐项结果、当前文章的实际资源量和浏览器验收见[游记移动地图验收](./travel-map-acceptance.md)。包含全部地点、点到点之间的连续移动、反向滚动、明暗切换、快速跳转、资源失败及减少动态效果。

中间画面会增加发布资源总量。文章实际访问只加载当前主题和尺寸附近的画面；Cloudflare 部署后的耗时和缓存命中率仍需线上测量。

## 调研参考

- [MapLibre Map API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)：实时地图仍涉及资源加载与客户端绘制。生成工具使用相同地图引擎保留现有底图风格。
- [MapLibre Native Node API](https://github.com/maplibre/maplibre-native/blob/main/platform/node/README.md) 与 [sharp](https://sharp.pixelplumbing.com/api-output/)：不经浏览器直接绘制地图并编码 WebP。
- [OpenFreeMap](https://openfreemap.org/) 与 [项目说明](https://github.com/hyperknot/openfreemap/blob/main/README.md)：现有提供商提供矢量底图，但不提供静态地图图片生成接口，因此这里在本地原生引擎中预渲染。
- [PMTiles Concepts](https://docs.protomaps.com/pmtiles/)：把瓦片合成单文件方便托管，但浏览器仍通过 HTTP Range 按需读取瓦片。它适合保留自由缩放地图，不能直接达成这次取消读者端实时地图加载的目标。
- [Cloudflare Pages 缓存](https://developers.cloudflare.com/pages/configuration/serving-pages/) 与 [自定义响应头](https://developers.cloudflare.com/pages/configuration/headers/)：使用 Pages 静态资源缓存与 `_headers` 管理响应头。
- [R2 公共存储桶缓存](https://developers.cloudflare.com/r2/data-access/public-buckets/)：通过自定义域名接入缓存。
