# Explorer 侧改动分析 — 对齐 Kong API Key 架构

**日期：** 2026-04-14
**背景：** 后端（Shayan）在 [README.md](README.md) / [implementation.md](implementation.md) / [cost-comparison.md](cost-comparison.md) 中给出了 Kong Gateway 的整体架构；Explorer 侧的原始 Developer Portal 设计在 [2026-03-23-developer-api-portal.md](2026-03-23-developer-api-portal.md) 和 [2026-03-23-developer-api-portal-design.md](2026-03-23-developer-api-portal-design.md) 里。本文档分析：
1. 当前 [src/app/developers](../../src/app/developers/) 模块要改哪些地方；
2. Portal DB 选型（Neon vs Supabase）；
3. Explorer 自己的 GraphQL 流量如何在不泄漏 service key 的前提下接入 Kong。

依赖后端回答的问题清单见 [questions-for-backend.md](questions-for-backend.md)。

---

## 1. `/developers` 模块当前状态

Phase 1（API Docs + Guides）已基本落地，Phase 2（API Keys）一行代码没写。

| 路由 | 状态 | 说明 |
|---|---|---|
| `/developers` | ✅ 完成 | 概览页，API Keys 卡片标 "Coming Soon" |
| `/developers/api` | ✅ 完成 | 交互式 API 文档 + RequestRunner |
| `/developers/guides` | ✅ 完成 | 2 篇 guide（Portfolio、DeFi Queries）|
| `/developers/api-keys` | ❌ 不存在 | 侧边栏占位，标 "Soon" |
| `/developers/ai` | ❌ 不存在 | 侧边栏注释掉了 |

其他关键现状：
- [RequestRunner.tsx:38-46](../../src/app/developers/components/RequestRunner.tsx#L38-L46) 调 `fetch(url, options)`，**不注入任何 auth header**
- [guides/data.ts](../../src/app/developers/guides/data.ts) 的所有代码示例都是裸调 `https://mainnet.movementnetwork.xyz/v1/...`，无 API key
- Developers 模块内**没有**任何 Apollo/GraphQL 使用

---

## 2. 需要改动的五块

### 2.1 新建 `/developers/api-keys` 路由 —— 最大工作量

目录不存在，整套要建。和原始 Portal Design（[2026-03-23-developer-api-portal-design.md](2026-03-23-developer-api-portal-design.md)）的区别在于：**数据源从 "自己的 Neon `api_keys` 表" 改为 "Kong Admin API"**。

**浏览器后端**（Next.js API Routes，放在 `src/app/api/developers/`）：

| Route | 作用 | 底层调用 |
|---|---|---|
| `POST /auth/nonce` | 发随机 nonce 供钱包签名 | Portal DB |
| `POST /auth/verify` | 验证签名 → 发 JWT | Portal DB + 首次调 Kong 建 consumer |
| `GET /keys` | 列出当前用户所有 key | Kong `GET /consumers/{id}/key-auth` |
| `POST /keys` | 创建新 key | Kong `POST /consumers/{id}/key-auth` |
| `DELETE /keys/[id]` | 撤销 key | Kong `DELETE /consumers/{id}/key-auth/{key_id}` |
| `GET /keys/[id]/stats` | 查某 key 的用量 | Mimir PromQL |
| `GET/POST /tier` | 查/切换 tier | Kong `/consumer_groups/{tier}/consumers` |

**Portal DB 表结构**（只存映射，不存 key 本身）：

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  kong_consumer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

原设计里的 `api_keys` 表**彻底去掉**，key 全部由 Kong 托管。label 如果 Kong `tags` 字段支持就塞 Kong 里，不支持就在这里加一张 `key_labels (kong_key_id, label)`（等问题清单 #2 答复）。

**页面 UI**：
- Key 列表（前缀掩码显示 + 创建时间 + last_used）
- "Create key" modal（创建后一次性明文展示 + 复制按钮 + 关闭后不可再看）
- 用量图表（按 endpoint / 时间）
- 当前 tier 卡片 + "Upgrade" 入口
- 钱包登录 / 登出入口

**阻塞项**：问题清单 [#1](questions-for-backend.md)（Admin API base URL / 认证方式）和 [#8](questions-for-backend.md)（Kong 版本 / 接口细节）不回答，这一块**动不了**。

---

### 2.2 RequestRunner 加 key 注入

[RequestRunner.tsx:38-46](../../src/app/developers/components/RequestRunner.tsx#L38-L46) 目前完全不带 auth header。要改成：

- 从登录态读当前用户的 key 列表
- 顶部加一个 "Authenticate as" 下拉：`Anonymous` / `<key 1 label>` / `<key 2 label>`
- 选中后按 Kong 定稿的 header 格式注入（`apikey: xxx` 还是 `Authorization: Bearer xxx`）
- 匿名状态显示一条提示条："You're making unauthenticated requests. Rate limit: 10 req/min."

**阻塞项**：问题清单 [#10](questions-for-backend.md)（CORS）——如果 Kong DP 不给 `explorer.movementnetwork.xyz` 开 CORS，RequestRunner 根本发不出跨域请求，要走 Next.js API Route 中转（详见 §4）。

---

### 2.3 guides 代码示例加 key 占位符

[guides/data.ts](../../src/app/developers/guides/data.ts) 所有 curl / JS 示例要改：

```diff
- curl https://mainnet.movementnetwork.xyz/v1/accounts/{address}/resources
+ curl -H "apikey: YOUR_API_KEY" \
+      https://mainnet.movementnetwork.xyz/v1/accounts/{address}/resources
```

并在每篇 guide 顶部加一段 "Get your API key" 的链接跳 `/developers/api-keys`。

**不阻塞**，可以立刻做。

---

### 2.4 Explorer 自己的 GraphQL 客户端要带 Service Key

这是 `/developers` **模块外**的影响，但属于同一波改动。

**背景**：Explorer 当前所有 Apollo client 都裸调 Hasura GraphQL，无 auth。Kong 接管 Hasura 后，如果 `api-anonymous` 角色 row limit 太低（文档示例 50 行），Explorer 的交易列表、区块列表会渲染不全。

**方案**：申请一个 Explorer 专属 service key，打到一个 `api-explorer` 角色（row limit 放宽到能覆盖 Explorer 常见查询）。

**关键约束**：**service key 绝对不能放在前端 bundle 里**。详见 §4 的 server-side proxy 方案。

**阻塞项**：问题清单 [#6](questions-for-backend.md)（匿名 vs service key）和 [#7](questions-for-backend.md)（Hasura 角色权限）。

---

### 2.5 小清理

- [DevelopersSidebar.tsx:30-63](../../src/app/developers/components/DevelopersSidebar.tsx#L30-L63) 去掉 API Keys 的 "Soon" badge，启用链接
- [src/app/developers/page.tsx](../../src/app/developers/page.tsx) 概览页的 "Coming Soon" 卡片改为正常卡片
- [layout.tsx](../../src/app/developers/layout.tsx) metadata 不用改，已经写了 "API key generation"

**不阻塞**，跟 2.1 一起发即可。

---

## 3. Portal DB 选型：Neon vs Supabase

**结论：推荐 Supabase。**

### 背景澄清

Shayan 后端文档里提到的 Neon（见 [README.md:47](README.md#L47)）是**他那边 Kong 的 Postgres**，用来存 Kong 自己的 consumers/keys/plugins。**我们浏览器侧的 Portal DB 和他的 Neon 完全无关，选什么都行**。

### 对比

| 能力 | Neon | Supabase |
|---|---|---|
| Postgres | ✅ | ✅ |
| 钱包签名登录 | ❌ 自写 | ❌ 自写（Supabase Auth 只支持 email / OAuth / magic link） |
| Row Level Security + JWT 自动打通 | ⚠️ 手动配 | ✅ 原生 |
| Branching / 多环境数据库 | ✅ | ❌ |
| Storage / Realtime / Edge Functions | ❌ | ✅ 附赠 |
| 序列化集成成本 | 低 | 低 |

**关键点**：两家的内置 Auth 都**不直接支持钱包签名**——nonce + verify 流程无论选哪个都要自己写。但 Supabase 允许把自签的 JWT 接进它的 Auth 层，然后 **RLS 策略就能自动生效**，省一大块"只让用户读自己 consumer"的权限代码。

**Neon 的优势**（branching、serverless 休眠）在这个场景价值不大；**Supabase 的 RLS + 生态**更匹配。

Explorer 将来如果要做 watchlist、用户配置、收藏夹这类功能，Supabase 的 Auth + Storage 也能直接复用。

---

## 4. Service Key 不能放前端 + Server-Side Proxy 方案

### 问题

如果这样写：

```ts
// ❌ 100% 泄漏
const apolloClient = new ApolloClient({
  uri: 'https://indexer.movementnetwork.xyz/v1/graphql',
  headers: { apikey: process.env.NEXT_PUBLIC_EXPLORER_SERVICE_KEY },
});
```

任何 `NEXT_PUBLIC_` 前缀的 env var 会被 Next.js 打包进 client JS bundle，用户打开 DevTools → Sources → 搜索即可拿到明文 key。

即使不加 `NEXT_PUBLIC_` 前缀，只要这段代码在 client component 里执行，打包时 `process.env.xxx` 会被替换为 `undefined`——说明它本来就**必须泄漏才能工作**。

### 正确做法：Server-Side Proxy

让 key **永远只出现在服务端**：

```
浏览器 Apollo client
      │ (无 key，指向同源 /api/graphql)
      ▼
Explorer Next.js API Route (/api/graphql)
      │ 从 server env 读 key，注入 header
      ▼
Kong DP
      │
      ▼
Hasura
```

**实现**：

1. Apollo client 的 `uri` 改为同源 `/api/graphql`
2. 新建 [src/app/api/graphql/route.ts](../../src/app/api/graphql/route.ts)：
   ```ts
   export async function POST(req: Request) {
     const body = await req.text();
     const upstream = await fetch(process.env.HASURA_UPSTREAM_URL!, {
       method: 'POST',
       headers: {
         'content-type': 'application/json',
         apikey: process.env.EXPLORER_SERVICE_KEY!, // 无 NEXT_PUBLIC_ 前缀
       },
       body,
     });
     return new Response(upstream.body, {
       status: upstream.status,
       headers: { 'content-type': 'application/json' },
     });
   }
   ```
3. `EXPLORER_SERVICE_KEY` 只写在 Vercel 的 server-side env var，不暴露给 client

### 好处附送

- **CORS 问题一起消失**：同源请求，Kong DP 不用给 Explorer 开 CORS
- Key 轮转 / 撤销只需改 Vercel 环境变量，前端不发版
- 可以在 proxy 层加日志、缓存、限流保护

### 代价

| 维度 | 影响 |
|---|---|
| 延迟 | 每个 GraphQL 请求多一跳（30-80ms，看 Vercel 边缘节点和 Kong 的地理距离） |
| 成本 | 所有请求计入 Vercel serverless function 调用次数 |
| 容量 | Explorer **全球所有用户的 GraphQL 流量加起来**共用这一把 key 的 rate limit |

最后一条很关键：需要在问题清单 [#6](questions-for-backend.md) 里问后端"如果给 Explorer 发 service key，tier 配额大概能给多少"，先估算是否够用。

---

## 5. 实施顺序

**等后端回复（阻塞）**：问题清单 [#1](questions-for-backend.md)、[#8](questions-for-backend.md)、[#10](questions-for-backend.md) —— 这三条不定下来，2.1 / 2.2 / 2.4 都动不了。

**可以立即开工（不依赖后端）**：

1. §2.3 guides 代码示例加 key 占位符
2. §2.5 小清理（去 "Soon" badge）
3. Portal DB 选型确定（§3）→ 建 Supabase 项目 → 写 `users` 表 + RLS policy
4. 技术预研：server-side proxy 的 Vercel 延迟 / 冷启动实测（§4）

**后端回复后按序推进**：

1. §2.1 API Keys 页面 + 浏览器后端 API Routes
2. §2.2 RequestRunner 注入 key
3. §2.4 Explorer Apollo client proxy 化（如果 §7 答复确认需要 service key）

---

## 附：开放问题

- 钱包登录支持哪些钱包？只支持 Razor / Petra 这种 Aptos 钱包，还是也支持 MetaMask（需要 SIWE）？
- 是否需要 email 登录备选，以覆盖不用钱包的 Developer？
- Tier 升级流程（§2.1 UI 里的 "Upgrade" 按钮）V1 走什么入口——表单提交 / 自动审批 / Stripe？
- RequestRunner 的 key 选择器是否需要"每次请求自动算出剩余配额"这种反馈（依赖问题清单 [#5](questions-for-backend.md) 的实时配额接口）？
