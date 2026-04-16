# API Key 管理 — 文档索引

这个目录存放所有和 Movement API Key 管理相关的资料，包括后端 Kong 架构、Explorer 浏览器侧对接方案、和跨团队协作问题清单。

## 后端提供的架构文档（Shayan）

来源：https://github.com/shayansanjideh/managed-api-keys

| 文档 | 说明 |
|---|---|
| [README.md](README.md) | Kong OSS Hybrid 模式整体架构、区域部署、故障容忍、GraphQL 保护方案 |
| [implementation.md](implementation.md) | 分阶段实施计划、Terraform 模块规划、Kong Admin API 接口列表、验证步骤 |
| [cost-comparison.md](cost-comparison.md) | 自托管 vs SaaS 成本对比 |

## Explorer 侧原始设计（我们这边）

| 文档 | 说明 |
|---|---|
| [2026-03-23-developer-api-portal.md](2026-03-23-developer-api-portal.md) | Developer Portal 实施计划（V1 API Docs / V2 API Keys / V3 MCP + AI） |
| [2026-03-23-developer-api-portal-design.md](2026-03-23-developer-api-portal-design.md) | 对应的设计文档（UI、数据模型、认证流程） |

> 注：这两份文档写于后端 Kong 架构出来之前。V2 的 "自己建 Neon api_keys 表" 部分已经被新架构替代——参考下面的 gap analysis。

## 对接分析和问题清单（新）

| 文档 | 说明 |
|---|---|
| [2026-04-14-explorer-side-gap-analysis.md](2026-04-14-explorer-side-gap-analysis.md) | Explorer `/developers` 模块要改什么、Portal DB 选型（Neon vs Supabase）、service key 不能放前端 + server-side proxy 方案 |
| [questions-for-backend.md](questions-for-backend.md) | 需要后端回答的问题清单（阻塞 / 重要 / 确认三档） |
| [questions-for-backend-gdoc.txt](questions-for-backend-gdoc.txt) | 上面那份的中文纯文本版，方便粘贴到 Google Docs |
| [questions-for-backend-gdoc.en.txt](questions-for-backend-gdoc.en.txt) | 英文版，发给 Shayan 用 |

## 推荐阅读顺序

**第一次进入这个主题**：
1. [README.md](README.md) — 看后端整体架构
2. [2026-04-14-explorer-side-gap-analysis.md](2026-04-14-explorer-side-gap-analysis.md) — 看我们这边要做什么
3. [questions-for-backend.md](questions-for-backend.md) — 看还有什么阻塞项

**准备动工**：
1. [implementation.md](implementation.md) §3.3 Kong Admin API 接口列表
2. [2026-03-23-developer-api-portal-design.md](2026-03-23-developer-api-portal-design.md) UI 部分
3. [2026-04-14-explorer-side-gap-analysis.md](2026-04-14-explorer-side-gap-analysis.md) §2 改动清单

## 当前阻塞项速查

详见 [2026-04-14-explorer-side-gap-analysis.md §5](2026-04-14-explorer-side-gap-analysis.md#5-实施顺序)：

- 后端未回复：Kong Admin API base URL / 认证方式（[questions #1](questions-for-backend.md)）
- 后端未回复：Kong 版本号 / 接口细节（[questions #8](questions-for-backend.md)）
- 后端未回复：CORS 是否对 Explorer origin 开放（[questions #10](questions-for-backend.md)）
- 我方未定：Portal DB 选 Supabase 还是 Neon（倾向 Supabase）
- 我方未定：是否改造 Explorer Apollo client 走 server-side proxy
