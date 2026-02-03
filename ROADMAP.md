# Movement Explorer Roadmap

[English](./ROADMAP.md) | [中文](./ROADMAP.zh-CN.md)

> **Project Cycle**: 2 Months (8 Weeks)
> **Development Mode**: GitHub Projects + Issues
> **Management Tool**: GitHub Projects Kanban
> **Version**: v1.1
> **Created Date**: 2025-12-22

---

### 1. Overview

#### 1.1 Phases

| Phase       | Name                              | Timeline | Duration | Core Objectives                                                  |
| ----------- | --------------------------------- | -------- | -------- | ---------------------------------------------------------------- |
| **Phase 1** | MVP Core Features                 | Week 1-4 | 4 Weeks  | Infrastructure setup, core browsing features                     |
| **Phase 2** | Feature Enhancement & Launch Opt. | Week 5-8 | 4 Weeks  | Complete details page, advanced features, Dashboard, Launch prep |

#### 1.2 Milestones

| Milestone      | Target Date   | Deliverables                                                  |
| -------------- | ------------- | ------------------------------------------------------------- |
| `v0.1.0-alpha` | End of Week 4 | Basic Framework + Home + List Pages                           |
| `v1.0.0`       | End of Week 8 | Full Features (Details + Dashboard) + Official Launch Release |

---

### 2. Phase 1: MVP Core Features (Week 1-4)

#### 2.1 Goals

- Project Infrastructure Setup
- Home Page (Network Stats + Latest Activity)
- Blocks/Transactions List Pages
- Basic Search
- Network Switching

#### 2.2 Key Epics

- **Infra**: Next.js 15, Movement Design System, Tailwind v4, React Query, API Client setup.
- **Home Page**: Hero section, Stats card, Latest Blocks/Txns.
- **Blocks**: Block list, pagination, basic block detail.
- **Transactions**: Tx list, status badges, filtering.
- **Components**: AddressDisplay, CopyButton, DataTable, Pagination.
- **Search**: global search UI, input type recognition, navigation logic.

---

### 3. Phase 2: Feature Enhancement & Launch Opt. (Week 5-8)

#### 3.1 Goals

- Complete Transaction Details
- Account Details
- Token In/Out Views
- Resources View
- Search Enhancements
- Dashboard
- Performance Optimization
- Launch Prep

#### 3.2 Key Epics

- **Tx Details**: Overview, Token Transfers, Gas visualization, Payload/Events tabs.
- **Accounts**: Account overview, transaction history, resources tree view, coins/tokens.
- **Block Details**: Full attributes, transactions within block, navigation.
- **Animation**: Framer Motion integration, page transitions, list updates.
- **Search**: Autocomplete results, fuzzy search, mobile enhancements.
- **Dashboard**: Charts for Volume, TPS, Active Accounts.
- **Performance**: Image optimization, code splitting, caching, Lighthouse > 90.
- **Launch**: CI/CD, Error Monitoring (Sentry), Domain configuration.
