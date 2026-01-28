# Movement Explorer Roadmap

[English](./ROADMAP.md) | [中文](./ROADMAP.zh-CN.md)

> **Project Cycle**: 3 Months (12 Weeks)
> **Development Mode**: GitHub Projects + Issues
> **Management Tool**: GitHub Projects Kanban
> **Version**: v1.0

---

### 1. Overview

#### 1.1 Phases

| Phase | Name | Timeline | Duration | Core Objectives |
| ----- | ---- | -------- | -------- | --------------- |
| **Phase 1** | MVP Core Features | Week 1-4 | 4 Weeks | Infrastructure setup, core browsing features |
| **Phase 2** | Feature Enhancement | Week 5-8 | 4 Weeks | Complete details page, advanced features |
| **Phase 3** | Optimization & Launch | Week 9-12 | 4 Weeks | Performance, Dashboard, Launch prep |

#### 1.2 Milestones

| Milestone | Target Date | Deliverables |
| --------- | ----------- | ------------ |
| `v0.1.0-alpha` | End of Week 4 | Basic Framework + Home + List Pages |
| `v0.2.0-beta` | End of Week 8 | Complete Detail Pages + Search |
| `v1.0.0-rc` | End of Week 11 | Full Features + Performance Optimization |
| `v1.0.0` | End of Week 12 | Official Launch Release |

---

### 2. Phase 1: MVP Core Features (Week 1-4)

#### 2.1 Goals
- Project Infrastructure Setup
- Home Page (Network Stats + Latest Activity)
- Blocks/Transactions List Pages
- Basic Search
- Network Switching

#### 2.2 Key Epics
1. **Infra**: Next.js 15, Tailwind v4, React Query, API Client setup.
2. **Home Page**: Hero section, Stats card, Latest Blocks/Txns.
3. **Blocks**: Block list, pagination, basic block detail.
4. **Transactions**: Tx list, status badges, filtering.
5. **Components**: AddressDisplay, CopyButton, Skeleton, DataTable.
6. **Search**: global search UI, input type recognition.

---

### 3. Phase 2: Feature Enhancement (Week 5-8)

#### 3.1 Goals
- Complete Transaction Details
- Account Details
- Token In/Out Views
- Resources View
- Search Enhancements

#### 3.2 Key Epics
1. **Tx Details**: Overview, Token Transfers, Gas visualization, Payload/Events tabs.
2. **Accounts**: Account overview, transaction history, resources tree view, coins/tokens.
3. **Block Details**: Full attributes, transactions within block, navigation.
4. **Animation**: Framer Motion integration, page transitions, list updates.
5. **Search**: Autocomplete results, fuzzy search, mobile enhancements.

---

### 4. Phase 3: Optimization & Launch (Week 9-12)

#### 4.1 Goals
- Dashboard
- Theme System (Dark/Light)
- Performance Optimization
- SEO & Accessibility
- Launch Prep

#### 4.2 Key Epics
1. **Dashboard**: Charts for Volume, TPS, Active Accounts.
2. **Theming**: Dark mode support, theme toggle.
3. **Performance**: Image optimization, code splitting, caching, Lighthouse score > 90.
4. **SEO/A11y**: Metadata, Open Graph, Sitemap, ARIA labels, Keyboard nav.
5. **Launch**: CI/CD, Error Monitoring (Sentry), Analytics, Production deployment.
