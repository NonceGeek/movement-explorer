# Movement Explorer 路线图

[English](./ROADMAP.md) | [中文](./ROADMAP.zh-CN.md)

> **项目周期**: 2 个月 (8 周)
> **开发模式**: GitHub Projects + Issues
> **管理工具**: GitHub Projects 看板
> **文档版本**: v1.1
> **创建日期**: 2025-12-22

---

### 1. 项目概览

#### 1.1 开发阶段划分

| 阶段        | 名称               | 时间范围 | 周数 | 核心目标                                      |
| ----------- | ------------------ | -------- | ---- | --------------------------------------------- |
| **Phase 1** | MVP 核心功能       | Week 1-4 | 4 周 | 搭建基础架构，实现核心浏览功能                |
| **Phase 2** | 功能增强与优化上线 | Week 5-8 | 4 周 | 完善详情页，增加高级功能，Dashboard，优化上线 |

#### 1.2 里程碑 (Milestones)

| Milestone      | 目标日期  | 交付物                               |
| -------------- | --------- | ------------------------------------ |
| `v0.1.0-alpha` | Week 4 末 | 基础框架 + 首页 + 列表页             |
| `v1.0.0`       | Week 8 末 | 全功能 (详情页+Dashboard) + 正式上线 |

---

### 2. Phase 1: MVP 核心功能 (Week 1-4)

#### 2.1 阶段目标

- 项目基础架构搭建
- 首页实现 (网络统计 + 最新动态)
- 区块/交易列表页
- 基础搜索功能
- 网络切换功能

#### 2.2 Issue 清单摘要

- **项目初始化**: Next.js 15, Movement Design System, Tailwind CSS v4, React Query.
- **首页**: Hero Section, Stats 卡片, 最新区块/交易列表.
- **区块系统**: 列表页, 详情页基础.
- **交易系统**: 列表页, 状态 Tag, 筛选.
- **通用组件**: AddressDisplay, CopyButton, DataTable, Pagination.
- **全局搜索**: 搜索框 UI, 类型识别, 跳转逻辑.

---

### 3. Phase 2: 功能增强与优化上线 (Week 5-8)

#### 3.1 阶段目标

- 交易详情页完整实现
- 账户详情页
- Token In/Out 视图
- 资源视图 (Resources Tab)
- 搜索增强
- Dashboard 仪表盘
- 性能优化
- 上线准备

#### 3.2 Issue 清单摘要

- **交易详情**: Token In/Out, Gas 消耗图, Payload/Events/Changes Tabs.
- **账户系统**: 概览, 交易记录, Resources 树形视图, Modules/Coins.
- **区块详情**: 完整属性, 区块内交易, 前后导航.
- **动画系统**: Framer Motion, 页面过渡, 数字滚动.
- **搜索增强**: 下拉建议, 模糊搜索, 移动端适配.
- **Dashboard**: 交易量/TPS/活跃账户图表.
- **性能优化**: 图片/代码分割, 缓存, Lighthouse > 90.
- **上线准备**: CI/CD, Sentry, 域名配置.
