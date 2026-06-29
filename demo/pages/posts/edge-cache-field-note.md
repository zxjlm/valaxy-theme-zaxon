---
title: 边缘缓存失效的一次排查手记
date: 2026-06-18
categories:
  - Dev Log
tags:
  - Cloudflare
  - 缓存
  - 排障
  - ai-assisted
type: article
excerpt: 一次静态资源没有按预期刷新的排查，从响应头、构建产物到缓存规则，把问题拆回可以验证的几步。
---

缓存问题最容易让人产生错觉，因为浏览器、CDN 和构建工具都可能保留一份“看起来还合理”的旧答案。

这次现象很朴素：样式已经重新构建，线上首页却仍然加载旧的 hashed 文件。第一步不是改配置，而是把链路摊开：本地 `dist` 是否存在新文件、HTML 是否引用新 hash、CDN 是否命中新旧响应、浏览器是否被 Service Worker 接管。

```bash
curl -I https://example.com/assets/index.css
```

最后发现问题不在构建，而在一条过宽的 cache rule。它把 HTML 也当成长期静态文件缓存了。修复后保留资源文件的长缓存，只让入口 HTML 使用短缓存和重新验证。

<!-- more -->

记录下来，是因为类似问题以后还会出现。比起记住某个控制台按钮，把检查顺序固定下来更可靠。
