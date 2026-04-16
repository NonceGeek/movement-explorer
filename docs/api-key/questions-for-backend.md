# Questions for Backend — Kong API Key Architecture

**Context:** 基于 [README.md](README.md) / [implementation.md](implementation.md) / [cost-comparison.md](cost-comparison.md) 三篇后端架构文档，以下是 Explorer 浏览器里 API Key 管理模块需要和后端对齐的问题。分三档：阻塞性 / 重要 / 确认性。

---

## 🔴 阻塞性问题（未定稿则 API Key 管理模块无法动工）

### 1. 浏览器后端如何访问 Kong Admin API？

文档 3.1 列了三种暴露方式（内部 HAProxy + IP 允许列表 / 私有 DNS / in-cluster service），但没定稿。

- [ ] 最终选哪种方式？
- [ ] **base URL 是什么**？testnet / staging / mainnet 三套环境各自的 Admin API 地址、端口、是否走 TLS？
  - 文档里提到的 `kong-admin.{env}.movementnetwork.xyz` 只是举例，实际域名是什么？
  - DNS 能在公网解析，还是只能在 VPN / EKS 内网里解析？
- [ ] 若 浏览器后端以 **Next.js API Routes 部署在 Vercel**，Vercel 出口 IP 不固定，走 VPN / Tailscale / 专线，还是要求 浏览器后端必须跑在 EKS 集群内？
- [ ] Admin API 的认证方式：mTLS 证书？静态 admin token？IAM？浏览器后端如何持有/轮转凭证？

> 这一条决定 浏览器后端的部署形态，是所有工作的前提。

### 2. Consumer / Key 的数据模型是否支持多 key + label？

Explorer 原设计里每个 key 有独立的 `label`（如 "My bot"、"Portfolio dashboard"），用户可建多把。

- [ ] 一个 user → 一个 Kong consumer → N 把 key 的模型可行？
- [ ] Kong key-auth 的 key 对象上能存自定义元数据（label、创建来源、备注）吗？是否可以用 `tags` 字段？
- [ ] 如果不能，`kong_key_id → label` 的映射是否要在 浏览器后端的 Neon 里单独维护？
- [ ] `last_used_at` 时间戳能从 Kong 拿到吗？还是只能从 Mimir 指标推断？

### 3. Key 格式最终是什么？

文档提到支持 `mvmt_live_xxxxxxxxxxxx` 这种自定义前缀。需要确认：

- [ ] testnet / mainnet 是否用不同前缀（`mvmt_test_` / `mvmt_live_`）？
- [ ] 前缀后的长度和字符集？（用于前端展示时的掩码格式，例如 `mvmt_live_a3b2…f8c1`）
- [ ] 由 Kong 自动生成，还是 浏览器后端生成后提交给 Kong？
- [ ] 创建时返回的完整 key 能否获取一次后就只能看到前缀（符合"仅创建时显示一次"的安全规范）？

---

## 🟡 重要问题（影响 UI 和数据流设计）

### 4. Tier 升降级的流程由谁负责？

- [ ] 浏览器后端是否可以**直接**调 `POST /consumer_groups/{tier}/consumers` 自助切换 tier？
- [ ] 还是需要经过审批 / 付款 / 手动流程？现阶段的规划是什么？
- [ ] 现阶段所有新用户默认是 `free`？升级到 `standard` / `premium` 走什么入口？
- [ ] 是否有"试用期"或"临时提额"的机制？

### 5. 用量数据的来源和维度

文档说用 Prometheus/Mimir + Kong rate-limiting status。细节需要敲定：

- [ ] Mimir 的查询 endpoint 对 浏览器后端开放吗？访问方式 / 认证？
- [ ] Kong Prometheus plugin 导出的 metric 是否带 **`consumer` label**？（per-user 统计的前提）
- [ ] 是否带 **`route` / `service` label**？（Explorer 想展示"哪个 endpoint 被调最多"）
- [ ] 是否区分 REST vs GraphQL 请求？
- [ ] Mimir 的历史数据保留多久？(影响 Explorer 的历史图表时间范围)
- [ ] 实时剩余配额用哪个接口？`/plugins/rate-limiting/status` 的响应结构示例？
- [ ] 被限流（429）的请求是否也能查到？

### 6. 匿名 / 未认证请求如何处理？

- [ ] anonymous consumer 的 rate limit 具体数值？（文档写 10/min TBD）
- [ ] **Explorer 自己**页面上的 API 调用算作 anonymous 还是走一个 service key？
- [ ] 如果是 service key，由谁管理、谁轮转？Explorer 部署时从哪里注入？
- [ ] 如果走 anonymous，Explorer 的流量和普通用户的流量会不会互相挤占配额？

### 7. GraphQL (Hasura) 保护对 Explorer 自己的影响

Explorer 当前大量依赖 Hasura GraphQL，且大部分是无 key 的 public 查询。Kong 接管后：

- [ ] Explorer 的 Apollo client 要改成带 key 调用吗？
- [ ] anonymous tier 的 row limit（文档示例 50 行）是否够 Explorer 的常见查询？
  - 区块列表 / 交易列表页通常一次取 25-50 行，翻页时可能更多
- [ ] `api-anonymous` 角色下是否能访问 Explorer 需要的所有表？是否有表会被限制？
- [ ] Explorer 需要在哪个 tier 才能正常工作？是否应该让 Explorer 走一个 `api-explorer` 专属角色？
- [ ] Kong 注入 `x-hasura-role` 的逻辑对 Explorer 自身的 GraphQL 请求如何生效？

---

## 🟢 确认性问题（影响不大但需对齐）

### 8. 当前实现状态与接口细节

- [ ] 上述架构**现在是否已经落地**？testnet / mainnet 各自处于哪个阶段？
- [ ] Kong Admin API 当前是否可访问？有无环境地址（testnet / staging）给浏览器后端接入联调？
- [ ] 浏览器的 api 管理是等 testnet 就能开工，还是需要等 mainnet？

文档 §3.3 已经列了 7 个 Kong Admin API 路径（`/consumers`、`/consumers/{id}/key-auth` 等），但这些指向的是 **Kong 自带 Admin API**。需要进一步明确：

- [ ] **Kong 版本号**？（不同版本 Admin API 的字段和行为差异较大，尤其 `consumer_groups` 的支持程度）
- [ ] 浏览器后端是**直接调 Kong 原生 Admin API**，还是后端团队会在前面再封一层自定义 REST 服务？如果是后者，能给一份 OpenAPI / curl 示例吗？
- [ ] **自定义 key 前缀 `mvmt_live_xxx`** 怎么落地？通过 `POST /consumers/{id}/key-auth` 时传 `key` 参数，还是浏览器后端自己生成后提交？是否有字符集/长度约束？
- [ ] **`/plugins/rate-limiting/status`**（§3.3 表格最后一行）在 Kong OSS 官方 Admin API 里并不存在，这个路径是：
  - 后端团队计划自己封装的 endpoint？
  - 还是笔误，实际上走 Prometheus/Mimir 查询？
  - 如果走 Mimir，具体的 metric 名称和 PromQL 示例能给一份吗？
- [ ] Kong key-auth 的 `tags` 字段是否启用？（关系到能不能把 label 塞在 Kong 里而不是 Neon）
- [ ] 建 key 时返回 body 里 `key` 字段是否只在创建时出现一次？后续 GET 是否只返回 id 和掩码？

### 9. 同一把 Key 跨网络（testnet / mainnet）通用吗？

- [ ] Consumer / key 是 per-network 的，还是跨网络全局的？
- [ ] Explorer 的 `NetworkSelect` 切换时，用户看到的 key 列表要不要切换？
- [ ] Rate limit 配额是每个网络独立计数还是合并计数？
- [ ] Tier 归属是全局的还是 per-network？

### 10. CORS / 浏览器直连

Explorer 的 API Docs 页面允许用户"在浏览器里点 Send Request"直接请求生产 API。

- [ ] Kong DP 会放开公网浏览器 CORS 吗？允许 `explorer.movementnetwork.xyz` 作为 origin？
- [ ] 如果不开 CORS，Explorer 需要自己跑一个 proxy endpoint 中转，这会计入 Explorer 自己的配额——是否可以避免？

### 11. Key 轮转 / 泄漏撤销

- [ ] 是否有原生的 "regenerate key" 语义？还是 UI 上靠 delete + create 两步实现？
- [ ] key 被撤销后，Kong DP 缓存中的 key 多久失效？（关乎泄漏时的响应速度）
- [ ] 有没有审计日志可以给用户看："这把 key 最近从哪些 IP / UA 调过"？
- [ ] 批量撤销 / 紧急 kill-switch 接口？

---

## 附：我们这边的假设（请求确认）

根据文档推断的一些设计决策，列在这里请后端确认是否正确：

1. 浏览器后端是一个**无状态的 thin wrapper**，除 `user_id ↔ kong_consumer_id` 映射外不存任何 key 相关数据。✅/❌
2. API key 的明文**只在创建接口的响应里返回一次**，之后浏览器只能展示前缀。✅/❌
3. Rate limit 是**按 tier（consumer group）**生效，不是 per-key。同一 consumer 下所有 key 共享配额。✅/❌
4. 浏览器后端不参与 key 校验，校验全部在 Kong DP 层完成。Explorer 不需要本地维护 key 黑/白名单。✅/❌
5. 用户升级 tier 后，新 tier 对该用户所有 key 立即生效，无需浏览器侧额外操作。✅/❌
