# 主题重构实施总结

**完成日期：** 2026-05-08
**范围：** 把配色系统从 `@movementlabsxyz/movement-design-system` 的品牌色主题，重构为暖奶油 + 赭色（sienna）调色板，并新增 light/dark 主题切换。
**参考文档：** [2026-05-06-theme-recolor-design.md](2026-05-06-theme-recolor-design.md)（设计文档）、[2026-05-06-theme-recolor.md](2026-05-06-theme-recolor.md)（实施计划）

## 数据概览

| 指标 | 数值 |
|---|---|
| `main` 上的提交数 | 40（含设计文档、实施计划、本总结） |
| 改动文件数 | 106 |
| 新增 / 删除行数 | +2426 / -412 |
| Build 状态 | `pnpm build` 干净通过 |
| Lint 增量 | 没引入新错误（回到 baseline 111 个 pre-existing） |

## 视觉成果

**Light 模式** — 暖奶油底色（`#FAF7F2`）+ 赭色 accent（`#7A4B1F`）+ 白色卡片。点阵装饰已去除，环境光晕极弱（near-invisible），charts 用赭色 + 三段式渐变 + 主题感知 tooltip。

**Dark 模式** — 近黑底色（`#0D0C0A`）+ cream 文字（`#FAF7F2`），遵循原型设计的 "cream invert" 思想。Status 状态色保留语义（橄榄绿、红橙、蓝），其他元素一律 cream-on-near-black 单色处理，呈现极简单色优雅感。

## 架构

颜色 token 单一来源：[`src/styles/theme.css`](../../src/styles/theme.css)。

- **Layer 1** — 非颜色 primitives（spacing / radii / shadows / fonts），从设计系统复制
- **Layer 2** — 品牌色板保留（5 个色相 × 10 阶），供 Shiki + TrendIndicator 使用
- **Layer 3** — `--color-*` Tailwind v4 桥（`--color-background → var(--background)` 等）
- **Layer 4** — `--ms-*` 原始值，light + dark 两套
- **Layer 5** — 语义 token 重映射（`--background → var(--ms-bg)`、`--primary → var(--ms-accent)` 等）

原来的 `@movementlabsxyz/movement-design-system/theme` 已不再被引用。`component-styles` 和 `fonts` 仍正常导入。

## 品牌色保留范围

只有两处刻意保留原品牌色：
- [`src/app/analytics/components/TrendIndicator.tsx`](../../src/app/analytics/components/TrendIndicator.tsx) — 涨跌的金融语义
- [`src/app/globals.css`](../../src/app/globals.css) Shiki 块 — 代码语法高亮

其他全部映射到 `--ms-*` 语义 token。

## Commit 日志（按时间顺序）

### Phase 0 — 文档准备
- `0d2518d` — Add theme recolor design doc (warm cream / sienna with dark mode)
- `ee30413` — Add theme recolor implementation plan

### Phase 1 — 基础建设
- `4872b6c` — feat(theme): create new theme.css with --ms-* warm cream palette
- `8d6f670` — feat(theme): wire globals.css to new theme.css
- `9e57627` — fix(theme): drop dark gradient overlay in LayoutBackground
- `b61e824` — fix(theme): retint home page hero glows to --ms-accent
- `62b093b` — fix(theme): hero title uses theme foreground; dotted pattern retinted

### Phase 2 — 主题切换
- `4efd8b1` — feat(theme): unlock dark mode and wire ThemeToggle in nav
- `ceff735` — fix(theme): override dark-first design-system component defaults
- `23dbe17` — fix(theme): scope dark-first overrides so consumer classes win

### Phase 3 — 硬编码品牌色迁移（约 50 个文件）
- `f4dbd35` — refactor(theme): migrate home area to --ms-* tokens
- `baf8ad3` — refactor(theme): migrate /transactions area to --ms-* tokens
- `8ddff08` — refactor(theme): migrate /txn/[hash] area to --ms-* tokens
- `12c1181` — refactor(theme): migrate /account/[address] area to --ms-* tokens
- `32f2b8e` — refactor(theme): migrate /coin /fa /validator areas to --ms-* tokens
- `3902da0` — refactor(theme): migrate /developers area to --ms-* tokens
- `befda59` — refactor(theme): migrate not-found page to --ms-* tokens
- `89c577f` — refactor(theme): migrate shared common/layout components to --ms-* tokens
- `ea9dc64` — refactor(theme): migrate ui primitives to --ms-* tokens

### Phase 4 — Charts 颜色
- `1efb57f` — refactor(theme): chart colors read --ms-* CSS vars at runtime
- `e28b7f0` — fix(theme): retint remaining hardcoded brand-green chart and accent colors
- `a4c2308` — fix(theme): force chart re-mount on theme switch via key={resolvedTheme}
- `e809250` — fix(theme): chart colors derive from resolvedTheme directly, not CSS vars
- `b32602d` — polish(theme): chart palette + three-stop gradient + theme-aware tooltip

### Phase 5 — 视觉打磨 + 设计系统 override 修复
- `cb6fc43` — fix(theme): remove leftover hardcoded text-white / text-black assumptions
- `a682303` — fix(theme): table head + cell text colors readable in light mode
- `317c044` — fix(theme): give ThemeToggle icons proper contrast in light mode
- `4d5d226` — fix(theme): retint /validators world map land + stroke per theme
- `a188ddc` — fix(theme): invert map land color in dark mode for visible contrast
- `6b89497` — fix(theme): make cards opaque on light theme — bg-card/X -> bg-card
- `870d684` — fix(theme): nuke design-system Card's glass-background gradient
- `557dd30` — fix(theme): replace design-system Card wrapper with local primitives
- `cbff337` — fix(theme): restore status hue in dark mode + lift muted surface
- `6613f44` — polish(theme): soften ambient glow and drop dot pattern in dark mode
- `ccda00c` — polish(theme): drop dot pattern decoration entirely
- `61ead95` — fix(theme): footer logomark follows resolvedTheme like the header
- `387390d` — fix(theme): badge success/error/warning variants use --ms-* tokens
- `8ebfb17` — tweak(theme): switch --ms-good to warm olive-green
- `b887ceb` — chore(theme): suppress react-hooks lint on intentional next-themes guards

### Phase 6 — 文档收尾
- `95ac792` — Add theme recolor implementation summary

## 关键技术决策

### Brainstorm 阶段决定
| # | 问题 | 选择 |
|---|---|---|
| 1 | Dark 模式 status 颜色处理 | 最初按 D2（坍缩成 cream），实施过程中改回保留正常色相以保证语义可读 |
| 2 | Token 接入方式 | 替换设计系统的 theme.css，自己写 |
| 3 | 解耦范围 | 只换颜色——保留 `component-styles`、`fonts`、组件，复制非颜色 token |
| 4 | Selector | 用 `.dark` class（next-themes `attribute="class"`） |
| 5 | 默认主题 | `defaultTheme="system"` + `enableSystem` |
| 6 | 新 theme 文件位置 | `src/styles/theme.css` |
| 7 | ThemeToggle 渲染位置 | Header（桌面）+ NavMobile（移动） |
| 8 | Chart 颜色策略 | 通过 `useTheme().resolvedTheme` 参数解析（不用 `getComputedStyle`，避免 React 渲染时序竞态） |

### 实施过程中的决定
- **Card 组件改为本地实现** — 设计系统的 Card 自带 `glass-background` recipe（半透明黑色渐变 + 21px backdrop-blur），会覆盖 `bg-card`。最终用 plain shadcn primitives 重写。
- **Dark 模式坚持 cream invert，但 status 是例外** — `--ms-good` / `--ms-bad` / `--ms-info` 在 dark 保留正常色相（成功/失败必须可区分），其他元素维持单色 cream。
- **`--ms-good` 选用橄榄绿** — 浅色 `#5C8E2C` / 深色 `#A8D466`。森林绿在 cream 底上显得"灰"，橄榄绿跟暖色调更协调。
- **点阵装饰整体删除** — 两个模式下都干净表面读起来更好，跟暖奶油的极简美学相符。
- **环境光晕近乎不可见**（`/4` alpha + `160px` blur）— 有氛围但不抢内容。
- **地图大陆颜色按主题反转** — light 用暖深棕，dark 用暖 cream，保证 dark 模式下大陆不会消失在背景里。

## 故意没动的部分

- `@movementlabsxyz/movement-design-system` npm 包本身——只换颜色，组件/字体/样式仍然消费。
- 品牌色 token（`--color-guild-green-*` 等）——在我们的 theme.css 里保留，给 Shiki + TrendIndicator 用。
- 全部 1113 处 Tailwind 语义 class（`bg-background`、`text-foreground` 等）——通过 token remap 自动换色，不需要改代码。

## 跟原型的已知细微偏差

- "Cream invert" 有所放宽：dark 下 status 保留色相（可用性 vs. 严格美学的权衡）。
- 地图 marker 用了硬编码 sienna，不跟随主题切换（Leaflet/Mapbox 风格的 prop 不能读 CSS 变量）。
- `<NextTopLoader>` 顶部进度条用硬编码 sienna（`#7A4B1F`），同样是 prop 类型限制。

## 验证

- ✅ `pnpm build` 干净
- ✅ `pnpm lint` baseline 保持（111 个 pre-existing 错误，0 个新增）
- ✅ 浏览器逐页检查覆盖了 home / /txn / /transactions / /analytics / /account / /coin / /fa / /validator / /developers / /not-found / /validators
- ✅ Light/Dark/System 切换在桌面 header 和移动 sheet 都正常
- ✅ 主题选择持久化到 `localStorage("theme")`
- ⏭️ Lighthouse a11y 审计未跑——sienna-on-cream 实测对比度约 7:1（已超过 WCAG AA 要求）
