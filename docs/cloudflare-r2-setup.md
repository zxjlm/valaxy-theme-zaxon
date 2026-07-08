# Cloudflare R2 配置流程(相册图片托管)

本文档说明如何从零创建 Cloudflare R2 bucket,并配置好自定义域名、缓存与防护,用于托管本项目相册模块的公开图片。目标是**在防止账单爆单的前提下,提供图片的公开访问**。

前置条件:

- 一个 Cloudflare 账号。
- 一个由 Cloudflare 托管 DNS 的域名(可用现有博客域名的子域,如 `img.example.com`)。R2 的自定义域名必须挂在 Cloudflare 上的 Zone 里。

> 配套文档:Argus 侧生成图片 URL 的规则见 [`argus-r2-url-guidelines.md`](./argus-r2-url-guidelines.md)。

---

## 成本背景(先理解威胁模型)

R2 的计费和 S3 不同,理解这点才知道防护重点:

- **出站流量(egress)永久免费** —— 大量下载不会产生流量费。
- **Class B 操作(读 / GET)**:约 $0.36 / 百万次,**免费额度每月 1000 万次**。
- **Class A 操作(写 / PUT / List)**:约 $4.50 / 百万次,免费额度每月 100 万次。
- **存储**:约 $0.015 / GB / 月,免费额度 10 GB。

相册是"读多写少",真正的爆单风险是**海量 GET 刷 Class B 次数**。核心对策只有一句话:**让请求命中 Cloudflare 边缘缓存,不要触达 R2**。命中缓存的请求不计任何 R2 操作费用。下面的步骤围绕这个目标展开。

---

## 步骤 1:开通 R2 并创建 bucket

1. 登录 Cloudflare Dashboard,左侧进入 **R2 Object Storage**。首次使用需要在账单页确认开通(免费额度内无需付费,但可能要求绑定支付方式)。
2. 点击 **Create bucket**。
   - **Bucket name**:如 `blog-albums`(全局账号内唯一,小写)。
   - **Location**:选 **Automatic**(自动就近),或按主要访问地区选一个 hint。
   - **Storage class**:**Standard**。
3. 创建后进入 bucket 设置页,确认 **Public access** 当前为 **禁用**(默认)。我们**不通过 `r2.dev` 公共链接暴露**,而是走自定义域名(步骤 3)。

---

## 步骤 2:上传图片对象

保持与项目现有静态目录一致的键结构(对象键即 URL 路径):

```
albums/<slug>/preview/<ordered-name>.<ext>
albums/<slug>/thumbnail/<ordered-name>.<ext>
```

上传方式二选一:

### 方式 A:Dashboard 手动上传(小批量 / 首次验证)

在 bucket 页用 **Upload** 拖拽文件,注意手动创建 `albums/<slug>/preview/` 这样的前缀路径。

### 方式 B:命令行 / 脚本(推荐,配合 Argus 导出)

R2 兼容 S3 API,可用 `rclone` 或 AWS CLI。先在 **R2 → Manage R2 API Tokens** 创建一个 **Object Read & Write** 权限的 API Token,拿到 `Access Key ID` / `Secret Access Key` 和账号的 S3 endpoint(`https://<account-id>.r2.cloudflarestorage.com`)。

用 `rclone` 上传并**在上传时就写入长缓存头**(关键):

```bash
# rclone 配置一次(交互式:rclone config,类型选 s3,provider 选 Cloudflare)
rclone copy ./public/albums r2:blog-albums/albums \
  --header-upload "Cache-Control: public, max-age=31536000, immutable" \
  --s3-no-check-bucket
```

> 在对象上直接设置 `Cache-Control` 能让浏览器和 CDN 都长期缓存。即便这里漏设,步骤 4 的 Cache Rules 也会在边缘层兜底。

**安全提醒**:API Token 的密钥等同于对 bucket 的读写权限,不要提交进 Git,存进 `.env` 或密钥管理器,并给 Token 限定最小权限(仅这一个 bucket、Read & Write)。

---

## 步骤 3:绑定自定义域名(必须,防护的入口)

这是整个方案最关键的一步。**只有走自定义域名,请求才会经过 Cloudflare 的缓存和 WAF。**

1. 在 bucket 页进入 **Settings → Custom Domains → Connect Domain**。
2. 输入子域名,如 `img.example.com`。该域名的 Zone 必须已在你的 Cloudflare 账号下。
3. Cloudflare 会自动创建对应的 CNAME 记录并签发 TLS 证书,等待状态变为 **Active**。
4. 验证:访问一个已上传对象的 URL,应能正常返回图片:

   ```
   https://img.example.com/albums/kyoto-walk/preview/0001-rain-lane.webp
   ```

完成后,把这个域名(`https://img.example.com`)配置给 Argus 作为 `--asset-base-url`(见配套文档)。

> **不要**启用或对外使用 `r2.dev` 公共开发域名 —— 它绕过缓存与防护,且计入 Class B 费用。仅在本地临时调试时使用。

---

## 步骤 4:配置缓存规则(省钱主力)

让不可变的图片长期命中边缘缓存,绝大部分重复请求就停在 CDN,不回源 R2。

进入自定义域名所在的 **Zone → Caching → Cache Rules → Create rule**:

- **规则名**:`albums-images-cache`
- **匹配条件**:`Hostname equals img.example.com`(如需更细,可加 `URI Path starts with /albums/`)
- **Then(缓存行为)**:
  - **Cache eligibility**:`Eligible for cache`(即 Cache Everything)
  - **Edge TTL**:`Override origin` → 设一年(如 31536000 秒)。因为文件名不可变,长 TTL 安全。
  - **Browser TTL**:`Override` → 一年,或让其遵循源站 `Cache-Control`。

配合"改内容就改文件名"的约定(见配套文档 §3.4),更新图片时用新 URL,无需手动清缓存。

验证缓存是否生效:连续请求同一图片,查看响应头 `cf-cache-status`,第二次起应为 `HIT`。`HIT` 的请求不计 R2 Class B 费用。

---

## 步骤 5:速率限制(挡自动化刷量)

进入 **Zone → Security → WAF → Rate limiting rules → Create rule**:

- **规则名**:`albums-rate-limit`
- **匹配**:`Hostname equals img.example.com`
- **速率**:如同一 IP `10 秒内超过 100 次请求`(按你的相册单页图片数留足余量,别误伤正常浏览)
- **动作**:`Managed Challenge` 或 `Block`,持续 `60 秒`

免费套餐提供基础的 rate limiting 规则,足以拦截脚本化的密集刷量。上线后观察一段时间日志再调阈值。

---

## 步骤 6:防盗链(可选,挡外站热链)

避免别的网站直接 `<img src>` 你的图片消耗额度。进入 **Zone → Security → WAF → Custom rules → Create rule**:

- **规则名**:`albums-hotlink-protection`
- **表达式**(示例):

  ```
  (http.host eq "img.example.com")
  and (http.request.uri.path.starts_with "/albums/")
  and not (any(http.request.headers["referer"][*] contains "example.com"))
  and (http.referer ne "")
  ```

- **动作**:`Block`

说明:允许空 Referer(部分浏览器/隐私设置不发 Referer,避免误伤直接打开图片的正常用户),只拦截**带有非本站 Referer** 的请求。Referer 可伪造,这只是辅助层,不作为唯一防线。

Cloudflare 也内置了 **Scrape Shield → Hotlink Protection** 开关,但它作用于整个 Zone 且规则较粗;用上面的自定义规则更可控。

---

## 步骤 7:用量与账单告警(兜底)

任何上层防护失效时,要能第一时间发现,而不是月底看账单。

1. 进入 **Notifications → Add**。
2. 添加 R2 相关的用量通知(如存储 / 操作数接近额度),或账单用量告警。
3. 设一个明显低于付费阈值的提醒线,收件到你的邮箱。

---

## 验收清单

- [ ] bucket 已创建,`r2.dev` 公共访问**保持关闭**。
- [ ] 图片按 `albums/<slug>/{preview,thumbnail}/` 键结构上传完成。
- [ ] 自定义域名 `img.example.com` 状态 Active,能正常返回图片。
- [ ] 连续请求同一图片,`cf-cache-status` 从 `MISS` 变为 `HIT`。
- [ ] Rate limiting 规则已启用。
- [ ] (可选)防盗链规则已启用,且不误伤正常浏览。
- [ ] 用量 / 账单告警已配置。
- [ ] Argus 的 `--asset-base-url` 已指向 `https://img.example.com`,重新导出后 manifest 里的图片 URL 已更新(见配套文档)。

---

## 常见问题

**Q:免费额度够用吗?**
个人博客相册,只要缓存命中率正常,正常流量远吃不满每月 1000 万次 Class B 免费额度,且流量不计费。主要成本风险来自缓存被绕过或穿透,上面的步骤 3/4 就是为此设计。

**Q:`cf-cache-status` 一直是 `MISS` / `DYNAMIC` 怎么办?**
确认走的是自定义域名而非 `r2.dev`;确认 Cache Rule 的 Cache eligibility 设为 Eligible;确认响应没有 `no-store`/`private` 等阻止缓存的头。

**Q:换域名或换 CDN 怎么办?**
图片对象键不变,只需在 Cloudflare 绑新的自定义域名,并把 Argus 的 `--asset-base-url` 指过去重新导出 manifest。图片与 manifest 解耦,迁移成本很低。
