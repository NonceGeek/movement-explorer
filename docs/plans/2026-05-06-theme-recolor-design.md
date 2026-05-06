# Theme Recolor — Warm Cream / Sienna with Light/Dark Switching

**Date:** 2026-05-06
**Status:** Design approved, ready for implementation plan
**Reference:** [docs/movescan-wc-vars.css](../movescan-wc-vars.css), [docs/theme/](../theme/) (1.png — 4.png prototypes)

## Goal

Refactor the color system from the current `@movementlabsxyz/movement-design-system` brand-color theme to a warm cream + sienna palette, and add light/dark theme switching. Match the prototype screenshots in `docs/theme/`. **Color tokens only — no layout, typography, spacing, or component-structure changes.**

## Decisions (from brainstorming)

| # | Decision | Choice |
|---|---|---|
| Q1 | Hardcoded brand-color usages | Migrate (mostly) — see §3 for kept exceptions |
| Q2 | Token plumbing | Replace the design-system theme.css with our own |
| Q3 | Decoupling scope | Only colors — keep `component-styles`, `fonts`, components, and copy non-color tokens |
| Q4a | Dark selector | `.dark` class (next-themes `attribute="class"` unchanged) |
| Q4b | Default behavior | `defaultTheme="system"` + `enableSystem` |
| Q5a | New theme file | `src/styles/theme.css` |
| Q5b | ThemeToggle placement | Render in desktop `Header.tsx` and mobile `NavMobile.tsx` |
| D2 | Status tokens (`--success`/`--destructive` etc.) | Map to `--ms-good`/`--ms-bad` (collapse to cream in dark) |
| Charts | Strategy | Runtime `getComputedStyle` of `--ms-*` (chart libs use color strings) |
| GasUsageBar | Dark-mode degradation | Graceful — use `--ms-ink` opacity stops |

## §1 — Architecture & File Changes

Single source of truth: `src/styles/theme.css`. Replaces the design system's `theme.css` import. All other design-system imports (`component-styles`, `fonts`) and component imports stay.

| File | Operation | Notes |
|---|---|---|
| `src/styles/theme.css` | New | `--ms-*` raw values (light/dark), semantic token remap, brand color palettes (kept), non-color primitives (copied) |
| `src/app/globals.css` | Modify | Replace `@import "@movementlabsxyz/movement-design-system/theme"` with `@import "../styles/theme.css"`. Keep Shiki + scrollbar blocks. |
| `src/app/providers.tsx` | Modify | Remove `forcedTheme="light"`; set `defaultTheme="system"`, `enableSystem` |
| `src/app/layout.tsx` | Modify | Add `suppressHydrationWarning` to `<html>` |
| `src/components/layout/Header.tsx` | Modify | Render `<ThemeToggle />` next to `NetworkSelect` (desktop) |
| `src/components/layout/NavMobile.tsx` | Modify | Actually render the imported `<ThemeToggle />` (currently dead import) |
| `src/components/layout/ThemeToggle.tsx` | Keep | Existing 3-option dropdown is fine |

**Untouched:** the design-system npm package; the 1113 Tailwind semantic-class usages across 165 files (they auto-recolor via the remap).

## §2 — Token Mapping

### 2.1 `--ms-*` raw values

Copied verbatim from [docs/movescan-wc-vars.css](../movescan-wc-vars.css). Both light (`:root`) and dark (`.dark`) blocks.

### 2.2 Semantic token remap (Tailwind classes → `--ms-*`)

| Tailwind class | Token | Light | Dark |
|---|---|---|---|
| `bg-background` | `--background` | `--ms-bg` (#FAF7F2) | `--ms-bg` (#0D0C0A) |
| `text-foreground` | `--foreground` | `--ms-ink` | `--ms-ink` |
| `bg-card` | `--card` | `--ms-card` (#FFFFFF) | `--ms-card` (#161410) |
| `text-card-foreground` | `--card-foreground` | `--ms-ink` | `--ms-ink` |
| `bg-popover` | `--popover` | `--ms-card` | `--ms-card` |
| `text-popover-foreground` | `--popover-foreground` | `--ms-ink` | `--ms-ink` |
| `bg-primary` | `--primary` | `--ms-accent` (sienna #7A4B1F) | `--ms-accent` (cream #FAF7F2) |
| `text-primary-foreground` | `--primary-foreground` | `--ms-on-accent` | `--ms-on-accent` |
| `bg-secondary` | `--secondary` | `--ms-card-2` (#F4EFE6) | `--ms-card-2` |
| `bg-accent` | `--accent` | `--ms-accent-soft` (#F0E4D0) | `--ms-accent-soft` |
| `text-accent-foreground` | `--accent-foreground` | `--ms-accent` | `--ms-accent` |
| `bg-muted` | `--muted` | `--ms-card-2` | `--ms-card-2` |
| `text-muted-foreground` | `--muted-foreground` | `--ms-ink-3` (#807A6B) | `--ms-ink-3` |
| `border-border` | `--border` | `--ms-line` (#E7E0D2) | `--ms-line` |
| `bg-input` | `--input` | `--ms-line-2` (#D9CFBB) | `--ms-line-2` |
| `ring-ring` | `--ring` | `--ms-accent` | `--ms-accent` |
| `bg-destructive` | `--destructive` | `--ms-bad` | `--ms-bad` |
| `text-destructive` | (same) | (same) | (same) |
| `bg-success` | `--success` | `--ms-good` | `--ms-good` |
| Sidebar tokens | `--sidebar*` | `--ms-nav`/`--ms-accent`/`--ms-line` | (same, dark values) |

The `--semantic-*` tokens (e.g. `--semantic-bg-base`, `--semantic-fg-muted`) are also remapped to their `--ms-*` equivalents to keep shadcn components in sync.

## §3 — Brand Colors & Hardcoded-Usage Migration

### 3.1 What remains as brand color

Only **two** sites keep brand-color references:
- `src/app/globals.css` Shiki token block (`--shiki-token-keyword: var(--color-guild-green-300)`, etc.)
- `src/app/analytics/components/TrendIndicator.tsx` (`text-guild-green-500` / `text-oracle-orange-500`)

Therefore the brand palette tokens (`--color-guild-green-{50..900}`, `--color-moveus-marigold-*`, `--color-byzantine-blue-*`, `--color-protocol-pink-*`, `--color-oracle-orange-*`) and `--color-neutrals-{white,black}-alpha-*` **must remain defined** in the new `theme.css` (values unchanged from design system, identical in light/dark).

### 3.2 Migration rules for hardcoded brand-color usages (~25–30 files)

| Original pattern | Replacement | Effect (light → dark) |
|---|---|---|
| `text-guild-green-500` (CTA / link) | `text-primary` | sienna → cream |
| `hover:text-guild-green-400` | `hover:text-primary/80` | accent w/ alpha |
| `text-guild-green-500` (success icon) | `text-[var(--ms-good)]` | green → cream |
| `text-oracle-orange-500` (failure icon) | `text-destructive` | dark red → cream |
| `hover:bg-guild-green-500/10` (row hover) | `hover:bg-accent` | warm cream / soft cream |
| `bg-guild-green-500/20 blur-[120px]` (ambient glow) | `bg-[var(--ms-accent)]/20 blur-[120px]` | sienna glow / cream glow |
| `bg-guild-green-500/20 text-guild-green-300` (pill) | `bg-accent text-accent-foreground` | cream pill / sienna text |
| `bg-guild-green-500` → `bg-oracle-orange-500` (GasUsageBar) | `bg-[var(--ms-good)]` → `bg-[var(--ms-bad)]` (light); see §3.4 for dark | green→red / cream-opacity gradient |
| `text-guild-green-500` (highlight metric) | `text-primary` | sienna highlight |
| Decorative blue/pink/marigold accents | Map to `--ms-accent` / `--ms-ink-2` / `--ms-card-2` per visual context | cohesive warm palette |

### 3.3 Chart colors (Chart.js / react-chartjs-2)

`src/app/analytics/utils.ts` currently exports hardcoded RGBA strings. Replace with a function that reads `--ms-*` at runtime:

```ts
function readVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getChartColors() {
  const accent = readVar("--ms-accent");
  const ink3 = readVar("--ms-ink-3");
  return {
    COLOR: `color-mix(in srgb, ${accent} 90%, transparent)`,
    BACKGROUND_COLOR: `color-mix(in srgb, ${accent} 40%, transparent)`,
    BACKGROUND_COLOR_END: `color-mix(in srgb, ${accent} 0%, transparent)`,
    HIGHLIGHT_COLOR: readVar("--ms-accent-2"),
    GRID_LINE_COLOR: `color-mix(in srgb, ${ink3} 25%, transparent)`,
  };
}
```

Each chart component reads via `useMemo` keyed on `useTheme().resolvedTheme` so theme switches re-render with new colors.

### 3.4 GasUsageBar dark-mode degradation

Light: `bg-[var(--ms-good)]` (low) → `bg-[var(--ms-bad)]` (high) — green→red.
Dark: both `--ms-good` and `--ms-bad` collapse to cream. Use opacity stops on `--ms-ink` to retain gauge meaning:
- `< 50%` → `bg-[var(--ms-ink-2)]` (mid cream)
- `>= 50%` → `bg-[var(--ms-ink)]` (full cream)

## §4 — Theme Switching Wiring

### 4.1 ThemeProvider config

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
```

`forcedTheme` removed. `localStorage("theme")` persists user choice.

### 4.2 SSR / FOUC

Add `suppressHydrationWarning` to the `<html>` tag in `src/app/layout.tsx`. next-themes injects an inline script that sets the initial class before hydration.

### 4.3 ThemeToggle placement

- **Desktop:** render in `Header.tsx` next to `<NetworkSelect />` (line ~105).
- **Mobile:** render in `NavMobile.tsx` (currently the import on line 17 is unused).

### 4.4 globals.css change

```diff
  @import "@movementlabsxyz/movement-design-system/component-styles";
- @import "@movementlabsxyz/movement-design-system/theme";
+ @import "../styles/theme.css";
  @import "tailwindcss";
  @import "tw-animate-css";
```

Shiki and scrollbar blocks retain their `var(--color-...)` references — these tokens still exist in our new `theme.css`.

## §5 — Risks & Known Visual Changes

| # | Risk | Scope | Mitigation |
|---|---|---|---|
| 1 | Dark-mode status icons collapse to cream — color signal lost (shape semantics retained: CircleCheck vs XCircle) | Tx tables | Accepted per D2 |
| 2 | GasUsageBar loses gauge color in dark | Single component | §3.4 opacity-stop fallback |
| 3 | shadcn components may need spot-check after sienna primary | Button / Dialog / Tabs / Input / Select | Browser verification per page |
| 4 | TrendIndicator's `dark:text-...` variants must align with `.dark` class | Single file | Already aligned with next-themes `attribute="class"` |
| 5 | Future design-system bumps may collide with our overrides | Maintenance | Document import order in `theme.css` header |
| 6 | Chart.js color reads are client-only | analytics page | Charts already client-only; no SSR concern |
| 7 | Charts must re-render on theme change | analytics page | `useMemo` deps on `useTheme().resolvedTheme` |

## §6 — Verification Plan

Each milestone must be visually confirmed in browser before proceeding.

1. **Theme file + import wired** → `pnpm dev`, open `/`. Light mode should match prototype screenshot 1.
2. **Dark mode reachable** → manually add `class="dark"` on `<html>`. Should match screenshot 3.
3. **ThemeToggle integrated** → switching among Light / Dark / System works without flash, persists in `localStorage`.
4. **Page-by-page spot check** in both themes:
   - `/` — CoreMetricsGrid, TransactionHistoryChart, LatestUserTransactions
   - `/txn/[hash]` — Tabs, DetailRow, status badge, TransactionActionCard (matches screenshots 2 & 4)
   - `/transactions` — table, status icons, "VIEW ALL" link
   - `/analytics` — chart colors recompute on theme switch
   - `/account/[address]`, `/coin/[struct]`, `/fa/[address]`, `/validator/[address]` — all tabs
   - `/developers/api-explorer` — Shiki code blocks (brand colors preserved)
   - `/not-found` — ambient glow color
5. **Contrast audit (Lighthouse / axe)** in both themes. Sienna-on-cream must hit ≥4.5:1 for body text.
6. **Build & lint** — `pnpm build`, `pnpm lint` clean.

## §7 — Effort Estimate

| Category | Files | Effort |
|---|---|---|
| New `src/styles/theme.css` | 1 | M (~300 lines, structured) |
| `globals.css` import swap | 1 | XS |
| `providers.tsx` ThemeProvider unlock | 1 | XS |
| `layout.tsx` SSR guard | 1 | XS |
| `Header.tsx` + `NavMobile.tsx` toggle render | 2 | XS |
| Hardcoded brand-color migration | ~25–30 | M (mostly mechanical, some visual judgment) |
| Chart colors function + hook integration | ~12 | M |

**Total: ~40–45 files. ~1 focused day of implementation + ~0.5 day spot-check / a11y audit.**
