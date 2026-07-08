# Argus 生成 R2 图片 URL 的注意事项

本文档面向 **Argus** 侧的开发者,说明在把相册图片迁移到 Cloudflare R2 后,`static_album_export` 服务生成 manifest 时应遵循的 URL 规则。

主题(Zaxon / haru-theme)侧的归一化逻辑(`theme/composables/albums.ts`)对图片路径是**原样透传、不做任何拼接**的。这意味着:manifest 里 `preview_path` / `thumbnail_path` / `cover` / `preview_thumbnails` 写成什么,最终 `<img src>` 就是什么。URL 的正确性完全由 Argus 保证。

> 配套文档:Cloudflare R2 的 bucket 与边缘防护配置流程见 [`cloudflare-r2-setup.md`](./cloudflare-r2-setup.md)。

---

## 1. 迁移的边界:图片迁 R2,manifest 留原地

只把**体积大的图片衍生件**(preview / thumbnail)迁到 R2。manifest JSON(`index.json`、`album.json`)**继续随博客站点走**(仍导出到 `public/albums/` 由 Netlify 托管)。

原因:

- JSON 很小、请求量低,留在原地不产生 R2 成本压力。
- manifest 留在站点侧,能让图片 URL 的指向随时可控,不必为 JSON 再配一遍 R2 缓存策略。
- Zaxon 抓取 manifest 的路径(`indexPath`、`manifest_path`)无需改动。

因此本文档只讨论 manifest **内部**那几个图片字段的取值,导出目录结构和路由页(`pages/albums/*.md`)维持不变。

---

## 2. 受影响的字段

| Manifest 文件 | 字段 | 说明 |
| --- | --- | --- |
| `index.json` | `albums[].cover` | 相册封面缩略图 |
| `index.json` | `albums[].preview_thumbnails`(如启用) | 封面轮换缩略图数组 |
| `album.json` | `photos[].preview_path` | 灯箱大图 |
| `album.json` | `photos[].thumbnail_path` | 网格缩略图 |

`manifest_path` **不属于图片字段**,它指向 JSON 本身,仍是站点根相对路径(如 `/albums/kyoto-walk/album.json`),不要改成 R2 URL。

---

## 3. 核心规则

### 3.1 使用自定义域名,绝不用 R2 原始 endpoint

必须使用绑定在 Cloudflare 上的自定义域名,例如:

```
✅ https://img.example.com/albums/kyoto-walk/preview/0001-rain-lane.webp
```

严禁直接写 R2 的公共 endpoint:

```
❌ https://<account-id>.r2.cloudflarestorage.com/...
❌ https://pub-<hash>.r2.dev/...
```

原因:只有走自定义域名,请求才会经过 Cloudflare 的缓存、WAF、Rate Limiting 等边缘防护。直连 R2 endpoint 会绕过所有防护并直接计入 Class B 读操作费用,是账单爆单的主要风险来源。`r2.dev` 开发域名同理,只应用于本地调试,不得写进生产 manifest。

### 3.2 URL 用绝对 HTTPS 完整地址

因为主题侧不拼接前缀,manifest 里必须是可直接使用的完整 URL,包含 `https://` 和域名。不要写相对路径(那会退化成博客站点自身的路径而 404)。

### 3.3 R2 中的对象键(object key)复用现有目录结构

保持与当前静态导出一致的层级,便于人肉核对和批量管理:

```
albums/<slug>/preview/<ordered-name>.<ext>
albums/<slug>/thumbnail/<ordered-name>.<ext>
```

对应 URL 即 `https://img.example.com/albums/<slug>/preview/<ordered-name>.<ext>`。

### 3.4 文件名带不可变标识,启用长缓存

图片是不可变资源,配合内容哈希或有序序号命名(现有的 `0001-rain-lane` 这种就够用),让边缘缓存可以长期命中而不必回源 R2。

- **更新图片时换文件名**(改内容就改名),而不是覆盖同名对象。这样 CDN 无需失效旧缓存,新 URL 自动生效。
- 缓存头 `Cache-Control: public, max-age=31536000, immutable` 建议在**上传到 R2 时**通过对象元数据设置(见 setup 文档),也可由 Cloudflare Cache Rules 统一覆盖。

---

## 4. 建议的实现方式:可配置 base URL

不要把域名硬编码进导出逻辑。在 `static_album_export` 服务里引入一个配置项 / CLI 参数,例如 `--asset-base-url`,导出时对图片字段统一前缀:

```
final_url = asset_base_url.rstrip('/') + '/' + object_key
# 例:https://img.example.com + /albums/kyoto-walk/preview/0001-rain-lane.webp
```

CLI 示例:

```bash
argus-photo album export-published \
  --site /path/to/blog \
  --asset-base-url https://img.example.com \
  --overwrite
```

好处:

- 换 CDN / 换域名只改一个参数,无需改代码或重刷数据。
- 本地开发可传旧的站点根路径(如 `--asset-base-url ""` 保持相对路径),生产传 R2 域名,行为一致可测。

如果暂不想改 Argus,替代方案是在 Zaxon 主题的 `normalizeAlbumPhoto` / `normalizeAlbumSummary` 里加同名前缀逻辑(即"路线 B")。**两者只应选其一**,否则会出现 URL 被拼接两次的 bug。推荐放在 Argus 侧,让主题保持纯透传。

---

## 5. 导出前校验清单

`static_album_export` 在写出 manifest 前应校验(沿用现有"校验失败不覆盖旧产物"的策略):

- [ ] 每个 `preview_path` / `thumbnail_path` / `cover` 都以 `https://` 开头。
- [ ] 域名等于配置的 `asset_base_url` 域名,**不含** `r2.cloudflarestorage.com` 或 `r2.dev`。
- [ ] 对应对象已成功上传到 R2(建议导出流程先上传、校验存在,再写 manifest;避免 manifest 指向不存在的对象导致灯箱 404)。
- [ ] `thumbnail_path` 缺失时回退到 `preview_path`(维持现有契约,主题侧已兼容)。
- [ ] URL 做过 URL 编码,文件名不含空格或特殊字符(有序命名天然规避)。
- [ ] `manifest_path` 仍是站点根相对路径,**未**被改成 R2 URL。

---

## 6. 隐私与安全提醒(维持既有 Non-Goals)

迁移不改变隐私边界。R2 上只放**已发布的衍生件**(preview / thumbnail),不要上传:

- 原图 / 源文件
- 精确 GPS、完整 EXIF
- 存储密钥、provider 标识、Argus 内部工作流状态

对象键(路径)本身不应泄露相册 ID 之外的敏感信息。全公开策略下,任何能拿到 URL 的人都能访问图片,因此确保上传到 R2 的内容都是**可公开**的。

---

## 7. 回滚

因为 manifest 与图片解耦,回滚很简单:把 `--asset-base-url` 改回站点根路径(或空)重新导出即可让图片指向恢复到 `public/albums/` 下的本地文件。保留一份迁移前的静态图片副本,直到确认 R2 链路稳定。
