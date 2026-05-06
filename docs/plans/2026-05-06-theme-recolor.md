# Theme Recolor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the brand-color theme with a warm cream / sienna palette and add light/dark theme switching, matching the prototype in `docs/theme/`.

**Architecture:** Introduce a single new file `src/styles/theme.css` that owns all color tokens. It re-defines the semantic Tailwind tokens (`--background`, `--card`, `--primary`, etc.) so that every existing `bg-*` / `text-*` class auto-recolors. Brand color palettes (guild-green / oracle-orange / etc.) are kept defined for two intentional sites only: Shiki syntax highlighting and `TrendIndicator`. All other ~50 files that hardcode brand colors are migrated to `--ms-*` semantic tokens. Dark mode uses the `.dark` class via `next-themes` with `defaultTheme="system"`.

**Tech Stack:** Tailwind CSS v4, next-themes, Next.js 14 App Router, pnpm. Verification is browser-based (no unit tests for CSS).

**Verification model:** Each task ends with one of: (a) `pnpm build` clean, (b) `pnpm lint` clean, or (c) browser spot-check at `http://localhost:3000` against the prototype screenshots in `docs/theme/`. Pre-existing test suites (if any) must continue to pass unchanged — this is a styling refactor, not a logic change.

**Reference:** [docs/plans/2026-05-06-theme-recolor-design.md](2026-05-06-theme-recolor-design.md) (full design doc), [docs/movescan-wc-vars.css](../movescan-wc-vars.css) (raw `--ms-*` values), [docs/theme/](../theme/) (prototype screenshots).

---

## Phase 0 — Preflight

### Task 0: Confirm clean baseline

**Step 1: Confirm working tree clean**

```bash
git status
```
Expected: working tree clean on `main`.

**Step 2: Start dev server in background**

```bash
pnpm dev
```
Expected: server up at `http://localhost:3000`. Open `/` in browser. Confirm current visual state (brand-color theme, locked light mode) so post-refactor changes are recognizable.

**Step 3: Run baseline build**

```bash
pnpm build
```
Expected: clean build. If it fails, stop — fix before starting the refactor.

---

## Phase 1 — Foundation: New theme.css

### Task 1: Create the new theme stylesheet

**Files:**
- Create: `src/styles/theme.css`

**Step 1: Create directory**

```bash
mkdir -p src/styles
```

**Step 2: Write the theme.css file**

Write the complete file. Structure:

```css
/* src/styles/theme.css
 *
 * SINGLE SOURCE OF TRUTH for color tokens.
 * Replaces @movementlabsxyz/movement-design-system/theme.
 *
 * Layer 1: Non-color primitives (copied verbatim from design system)
 * Layer 2: Brand color palettes (kept for Shiki + TrendIndicator)
 * Layer 3: --color-* semantic refs (Tailwind v4 bridge)
 * Layer 4: --ms-* raw values (light + dark)
 * Layer 5: Semantic token remap (--background -> --ms-bg, etc.)
 *
 * Import order in globals.css MUST be: component-styles -> theme.css -> tailwindcss
 */

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* === LAYER 1: Spacing (copied from design system) === */
  --spacing-0: 0px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-7: 28px;
  --spacing-8: 32px;
  --spacing-9: 36px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-14: 56px;
  --spacing-16: 64px;
  --spacing-20: 80px;
  --spacing-24: 96px;
  --spacing-28: 112px;
  --spacing-32: 128px;
  --spacing-36: 144px;
  --spacing-40: 160px;
  --spacing-44: 176px;
  --spacing-48: 192px;
  --spacing-52: 208px;
  --spacing-56: 224px;
  --spacing-60: 240px;
  --spacing-64: 256px;
  --spacing-72: 288px;
  --spacing-80: 320px;
  --spacing-96: 384px;
  --spacing-100: 400px;
  --spacing-px: 1px;

  /* Sizes (copy of spacing scale plus semantic) */
  --size-0: 0px;
  --size-1: 4px;
  --size-2: 8px;
  --size-3: 12px;
  --size-4: 16px;
  --size-5: 20px;
  --size-6: 24px;
  --size-7: 28px;
  --size-8: 32px;
  --size-9: 36px;
  --size-10: 40px;
  --size-12: 48px;
  --size-14: 56px;
  --size-16: 64px;
  --size-20: 80px;
  --size-24: 96px;
  --size-28: 112px;
  --size-32: 128px;
  --size-36: 144px;
  --size-40: 160px;
  --size-44: 176px;
  --size-48: 192px;
  --size-52: 208px;
  --size-56: 224px;
  --size-60: 240px;
  --size-64: 256px;
  --size-72: 288px;
  --size-80: 320px;
  --size-96: 384px;
  --size-100: 400px;
  --size-px: 1px;
  --size-prose: 65ch;
  --size-full: 100%;
  --size-min: min-content;
  --size-max: max-content;
  --size-fit: fit-content;

  /* Radii */
  --radius-sm: 2px;
  --radius-base: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-3xl: 24px;
  --radius-full: 9999px;
  --radius: var(--radius-md);

  /* Border widths */
  --border-width-0: 0px;
  --border-width-1: 1px;
  --border-width-2: 2px;
  --border-width-3: 3px;
  --border-width-4: 4px;
  --border-width-5: 5px;
  --border-width-6: 6px;
  --border-width-7: 7px;
  --border-width-8: 8px;

  /* Shadows */
  --shadow-xs: 0 0 0 1px #0000000d;
  --shadow-sm: 0 1px 2px 0 #0000000d;
  --shadow-base: 0 1px 2px 0 #0000000d, 0 1px 3px 0 #0000000d;
  --shadow-md: 0 2px 4px -1px #00000005, 0 4px 6px -1px #00000014;
  --shadow-lg: 0 4px 6px -2px #00000005, 0 10px 15px -3px #0000000d;
  --shadow-xl: 0 10px 10px -5px #00000005, 0 20px 25px -5px #0000000d;
  --shadow-2xl: 0 25px 50px -12px #00000040;
  --shadow-inner: inset 0 2px 4px 0 #00000006;
  --shadow-none: none;

  /* Z-index scale */
  --z-index-hide: -1;
  --z-index-auto: auto;
  --z-index-base: 0;
  --z-index-docked: 10;
  --z-index-dropdown: 1000;
  --z-index-sticky: 1100;
  --z-index-banner: 1200;
  --z-index-overlay: 1300;
  --z-index-modal: 1400;
  --z-index-popover: 1500;
  --z-index-skip-link: 1600;
  --z-index-toast: 1700;
  --z-index-tooltip: 1800;

  /* Font families */
  --font-heading: "TWK Everett", sans-serif;
  --font-body: var(--font-inter, "Inter"), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "TWK Everett Mono", "Consolas", "Menlo", monospace;

  /* Container */
  --container-center: true;
  --container-padding: 2rem;
  --container-2xl: 1400px;

  /* === LAYER 2: Brand color palettes (kept for Shiki + TrendIndicator) === */
  /* Moveus Marigold */
  --color-moveus-marigold-50: #fffbeb;
  --color-moveus-marigold-100: #fff2bd;
  --color-moveus-marigold-200: #ffea90;
  --color-moveus-marigold-300: #ffe162;
  --color-moveus-marigold-400: #ffd935;
  --color-moveus-marigold-500: #ddba22;
  --color-moveus-marigold-600: #bb9b13;
  --color-moveus-marigold-700: #997e08;
  --color-moveus-marigold-800: #776100;
  --color-moveus-marigold-900: #554500;

  /* Guild Green */
  --color-guild-green-50: #f2fff8;
  --color-guild-green-100: #ccffe3;
  --color-guild-green-200: #a7ffce;
  --color-guild-green-300: #81ffba;
  --color-guild-green-400: #6ce2a1;
  --color-guild-green-500: #58c589;
  --color-guild-green-600: #47a872;
  --color-guild-green-700: #368a5c;
  --color-guild-green-800: #286d47;
  --color-guild-green-900: #1b5033;

  /* Byzantine Blue */
  --color-byzantine-blue-50: #c2ceff;
  --color-byzantine-blue-100: #859dff;
  --color-byzantine-blue-200: #5c7cff;
  --color-byzantine-blue-300: #335cff;
  --color-byzantine-blue-400: #0337ff;
  --color-byzantine-blue-500: #002cd6;
  --color-byzantine-blue-600: #0024ad;
  --color-byzantine-blue-700: #001b85;
  --color-byzantine-blue-800: #00135c;
  --color-byzantine-blue-900: #000c3d;

  /* Protocol Pink */
  --color-protocol-pink-50: #fff1fc;
  --color-protocol-pink-100: #ffc9f3;
  --color-protocol-pink-200: #ffa0eb;
  --color-protocol-pink-300: #ff77e2;
  --color-protocol-pink-400: #eb66cf;
  --color-protocol-pink-500: #ce52b4;
  --color-protocol-pink-600: #b14199;
  --color-protocol-pink-700: #94317f;
  --color-protocol-pink-800: #762365;
  --color-protocol-pink-900: #59184b;

  /* Oracle Orange */
  --color-oracle-orange-50: #ffefec;
  --color-oracle-orange-100: #ffcdc2;
  --color-oracle-orange-200: #ffab97;
  --color-oracle-orange-300: #ff886d;
  --color-oracle-orange-400: #FF6642;
  --color-oracle-orange-500: #ea5330;
  --color-oracle-orange-600: #c83e1e;
  --color-oracle-orange-700: #a62c10;
  --color-oracle-orange-800: #841d05;
  --color-oracle-orange-900: #621300;

  /* Neutrals */
  --color-neutrals-white: #ffffff;
  --color-neutrals-black: #000000;
  --color-neutrals-white-alpha-50: #ffffff0a;
  --color-neutrals-white-alpha-100: #ffffff0f;
  --color-neutrals-white-alpha-200: #ffffff14;
  --color-neutrals-white-alpha-300: #ffffff29;
  --color-neutrals-white-alpha-400: #ffffff3d;
  --color-neutrals-white-alpha-500: #ffffff5c;
  --color-neutrals-white-alpha-600: #ffffff7a;
  --color-neutrals-white-alpha-700: #ffffffa3;
  --color-neutrals-white-alpha-800: #ffffffcc;
  --color-neutrals-white-alpha-900: #ffffffeb;
  --color-neutrals-black-alpha-50: #0000000a;
  --color-neutrals-black-alpha-100: #0000000f;
  --color-neutrals-black-alpha-200: #00000014;
  --color-neutrals-black-alpha-300: #00000029;
  --color-neutrals-black-alpha-400: #0000003d;
  --color-neutrals-black-alpha-500: #0000005c;
  --color-neutrals-black-alpha-600: #0000007a;
  --color-neutrals-black-alpha-700: #000000a3;
  --color-neutrals-black-alpha-800: #000000cc;
  --color-neutrals-black-alpha-900: #000000eb;

  /* === LAYER 3: --color-* semantic refs (Tailwind v4 bridge) === */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-error: var(--error);
  --color-error-foreground: var(--error-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

/* === LAYER 4: --ms-* raw values (LIGHT) === */
:root,
.light {
  --ms-bg:            #FAF7F2;
  --ms-nav:           #FAF7F2;
  --ms-card:          #FFFFFF;
  --ms-card-2:        #F4EFE6;
  --ms-line:          #E7E0D2;
  --ms-line-2:        #D9CFBB;
  --ms-ink:           #1D1B16;
  --ms-ink-2:         #4A463C;
  --ms-ink-3:         #807A6B;
  --ms-accent:        #7A4B1F;
  --ms-accent-2:      #B06A2C;
  --ms-accent-soft:   #F0E4D0;
  --ms-accent-fill:   rgba(122, 75, 31, 0.08);
  --ms-on-accent:     #FAF7F2;
  --ms-good:          #2F6B3D;
  --ms-good-soft:     #E2ECD9;
  --ms-bad:           #8A2A1F;
  --ms-info:          #2C4A6B;
  --ms-info-soft:     #D9E2EC;

  /* === LAYER 5: Semantic token remap (LIGHT) === */
  --background:              var(--ms-bg);
  --foreground:              var(--ms-ink);
  --card:                    var(--ms-card);
  --card-foreground:         var(--ms-ink);
  --popover:                 var(--ms-card);
  --popover-foreground:      var(--ms-ink);
  --primary:                 var(--ms-accent);
  --primary-foreground:      var(--ms-on-accent);
  --secondary:               var(--ms-card-2);
  --secondary-foreground:    var(--ms-ink);
  --accent:                  var(--ms-accent-soft);
  --accent-foreground:       var(--ms-accent);
  --muted:                   var(--ms-card-2);
  --muted-foreground:        var(--ms-ink-3);
  --destructive:             var(--ms-bad);
  --destructive-foreground:  var(--ms-on-accent);
  --success:                 var(--ms-good);
  --success-foreground:      var(--ms-on-accent);
  --warning:                 var(--ms-accent-2);
  --warning-foreground:      var(--ms-on-accent);
  --error:                   var(--ms-bad);
  --error-foreground:        var(--ms-on-accent);
  --info:                    var(--ms-info);
  --info-foreground:         var(--ms-on-accent);
  --border:                  var(--ms-line);
  --input:                   var(--ms-line-2);
  --ring:                    var(--ms-accent);

  /* Charts (use --ms-* — single accent + neutral stops) */
  --chart-1: var(--ms-accent);
  --chart-2: var(--ms-accent-2);
  --chart-3: var(--ms-ink-2);
  --chart-4: var(--ms-good);
  --chart-5: var(--ms-bad);

  /* Sidebar */
  --sidebar:                    var(--ms-nav);
  --sidebar-foreground:         var(--ms-ink);
  --sidebar-primary:            var(--ms-accent);
  --sidebar-primary-foreground: var(--ms-on-accent);
  --sidebar-accent:             var(--ms-accent-soft);
  --sidebar-accent-foreground:  var(--ms-accent);
  --sidebar-border:             var(--ms-line);
  --sidebar-ring:               var(--ms-accent);

  /* Semantic-* (shadcn dependents) */
  --semantic-bg-base:        var(--ms-bg);
  --semantic-bg-alt-1:       var(--ms-card);
  --semantic-bg-alt-2:       var(--ms-card-2);
  --semantic-fg-base:        var(--ms-ink);
  --semantic-fg-muted:       var(--ms-ink-2);
  --semantic-fg-subtle:      var(--ms-ink-3);
  --semantic-border-default: var(--ms-line);
  --semantic-border-strong:  var(--ms-line-2);
}

/* === LAYER 4 + 5: DARK overrides === */
.dark {
  --ms-bg:            #0D0C0A;
  --ms-nav:           #0D0C0A;
  --ms-card:          #161410;
  --ms-card-2:        #0D0C0A;
  --ms-line:          #26221A;
  --ms-line-2:        #3A3325;
  --ms-ink:           #FAF7F2;
  --ms-ink-2:         #B4AD9C;
  --ms-ink-3:         #807A6B;
  --ms-accent:        #FAF7F2;
  --ms-accent-2:      #FFFFFF;
  --ms-accent-soft:   rgba(250, 247, 242, 0.08);
  --ms-accent-fill:   rgba(250, 247, 242, 0.06);
  --ms-on-accent:     #0D0C0A;
  --ms-good:          #FAF7F2;
  --ms-good-soft:     rgba(250, 247, 242, 0.08);
  --ms-bad:           #FAF7F2;
  --ms-info:          #FAF7F2;
  --ms-info-soft:     rgba(250, 247, 242, 0.08);
  /* All semantic tokens auto-update via var() refs above. */
}
```

**Step 3: Lint check**

```bash
pnpm lint
```
Expected: clean (CSS file is excluded but the rest of the codebase still passes).

**Step 4: Commit**

```bash
git add src/styles/theme.css
git commit -m "feat(theme): create new theme.css with --ms-* warm cream palette"
```

---

### Task 2: Switch globals.css to import the new theme

**Files:**
- Modify: `src/app/globals.css:1-10`

**Step 1: Replace the design-system theme import**

In `src/app/globals.css`, change line 4 from:
```css
@import "@movementlabsxyz/movement-design-system/theme";
```
to:
```css
@import "../styles/theme.css";
```

Keep all other lines intact (component-styles import, tailwindcss, tw-animate-css, scrollbar block, Shiki block).

**Step 2: Build to confirm CSS compiles**

```bash
pnpm build
```
Expected: clean build, no missing token errors.

**Step 3: Browser smoke check**

If `pnpm dev` is not running, start it. Open `http://localhost:3000`.

Expected:
- Page background warm cream (#FAF7F2), not white or dark
- Cards white with subtle warm borders
- Primary CTAs (e.g., search button) sienna brown
- Layout structure unchanged

If page renders dark or with broken colors → revert and inspect token mapping in `theme.css`.

**Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): wire globals.css to new theme.css"
```

---

## Phase 2 — Theme switching (light/dark)

### Task 3: Unlock ThemeProvider

**Files:**
- Modify: `src/app/providers.tsx:30-35`

**Step 1: Replace ThemeProvider config**

Change the `<ThemeProvider>` tag from:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="light"
  forcedTheme="light"
  disableTransitionOnChange
>
```
to:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
```

**Step 2: Add suppressHydrationWarning to layout**

In `src/app/layout.tsx`, find the `<html>` tag and add `suppressHydrationWarning` (no value):
```tsx
<html lang="en" suppressHydrationWarning>
```

(If the `<html>` tag is multi-line, add the attribute on its own line at the end.)

**Step 3: Browser verify dark mode reachable**

In dev tools, on `<html>`, manually add `class="dark"`. Page should switch to near-black background, cream text. Match prototype screenshot 3 visually (rough check — toggle UI not yet wired).

**Step 4: Commit**

```bash
git add src/app/providers.tsx src/app/layout.tsx
git commit -m "feat(theme): unlock dark mode in ThemeProvider"
```

---

### Task 4: Render ThemeToggle in desktop Header

**Files:**
- Modify: `src/components/layout/Header.tsx:1-122`

**Step 1: Import ThemeToggle**

Add to the imports at the top of `Header.tsx`:
```tsx
import ThemeToggle from "./ThemeToggle";
```

**Step 2: Render between NetworkSelect and WalletConnector**

Inside the right section (around line 102–115), add a `<ThemeToggle />` next to the existing desktop blocks:

```tsx
{/* Network Selector (Desktop) */}
<div className="hidden md:block">
  <NetworkSelect />
</div>

{/* Theme Toggle (Desktop) */}
<div className="hidden md:block">
  <ThemeToggle />
</div>

{/* Wallet Connector (Desktop) */}
<div className="hidden md:block">
  <WalletConnector />
</div>
```

**Step 3: Browser verify**

Reload `/`. Expected: Sun/Moon/Monitor icon button in header right side. Click → dropdown with Light/Dark/System. Select Dark → page switches with no flash. Reload → choice persists. Select System → reflects OS preference.

**Step 4: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat(theme): render ThemeToggle in desktop header"
```

---

### Task 5: Render ThemeToggle in mobile NavMobile

**Files:**
- Modify: `src/components/layout/NavMobile.tsx`

**Step 1: Read NavMobile to find an appropriate location**

```bash
cat src/components/layout/NavMobile.tsx
```
Look for the mobile nav menu / drawer body where settings-style controls live.

**Step 2: Render `<ThemeToggle />` inside the menu body**

Place near the network selector if there is one in mobile nav, or at the bottom of the nav links list. Wrap in any padding the surrounding items use for visual consistency.

**Step 3: Browser verify (mobile viewport)**

Resize the dev tools viewport to mobile width (≤768px). Open the mobile nav menu. Expected: ThemeToggle visible and functional inside.

**Step 4: Commit**

```bash
git add src/components/layout/NavMobile.tsx
git commit -m "feat(theme): render ThemeToggle in mobile nav"
```

---

## Phase 3 — Migrate hardcoded brand-color usages

Each task in this phase modifies ONE file (or a small batch of related files). Use the migration table from the design doc:

| Original | Replacement |
|---|---|
| `text-guild-green-500` (CTA / link) | `text-primary` |
| `hover:text-guild-green-400` | `hover:text-primary/80` |
| `text-guild-green-500` (success icon) | `text-[var(--ms-good)]` |
| `text-oracle-orange-500` (failure icon) | `text-destructive` |
| `hover:bg-guild-green-500/10` (row hover) | `hover:bg-accent` |
| `bg-guild-green-500/20 blur-[120px]` (glow) | `bg-[var(--ms-accent)]/20 blur-[120px]` |
| `bg-guild-green-500/20 text-guild-green-300` (pill) | `bg-accent text-accent-foreground` |
| `text-guild-green-500` (highlight) | `text-primary` |
| `border-guild-green-500/50 bg-guild-green-500/5` (card highlight) | `border-primary/50 bg-primary/5` |
| Decorative blue/pink/marigold | Map by visual context to `--ms-accent` / `--ms-ink-2` / `--ms-card-2` |

**Pattern for every Phase 3 task:** read the file, apply the table, browser-verify the affected page in BOTH light and dark, commit.

**DO NOT TOUCH** these files in this phase — they keep brand colors intentionally:
- `src/app/analytics/components/TrendIndicator.tsx`
- `src/app/globals.css` (Shiki token block)

### Task 6: Migrate (home) page area (7 files)

**Files:**
- Modify: `src/app/(home)/page.tsx` — ambient glow blurs (lines 90–91)
- Modify: `src/app/(home)/components/CoreMetricsGrid.tsx` — `border-guild-green-500/50 bg-guild-green-500/5` highlight (line 54), `text-guild-green-500` highlights (lines 92, 108)
- Modify: `src/app/(home)/components/UserTransactionRow.tsx` — status icons + row hover (lines 90, 92, 203)
- Modify: `src/app/(home)/components/MobileTransactionCard.tsx` — status icons (lines 114, 116)
- Modify: `src/app/(home)/components/LatestUserTransactions.tsx` — "VIEW ALL" link (line 193)
- Modify: `src/app/(home)/components/TransactionHistoryChart.tsx` — comment only (cosmetic)
- Modify: `src/app/(home)/components/ChartStatCard.tsx` — comment only (cosmetic)

**Step 1: Apply the migration table per file**

Use the rules above. For each file, run:
```bash
grep -n "guild-green\|moveus-marigold\|byzantine-blue\|protocol-pink\|oracle-orange" <file>
```
Then Edit each line. Keep semantic intent: success icons → `text-[var(--ms-good)]`; failure icons → `text-destructive`; CTAs → `text-primary`; glows → `bg-[var(--ms-accent)]/...`.

**Step 2: Verify nothing else got changed**

```bash
git diff src/app/\(home\)
```
Expected: only color-class string changes; no logic or structure edits.

**Step 3: Browser spot-check `/`**

Open `/` in light mode. Expected:
- Top ambient glow now sienna (was green/blue)
- CoreMetricsGrid highlighted card has sienna border/tint
- Transaction rows: ✓ icon green-ish (light) / cream (dark), ✗ icon dark-red (light) / cream (dark)
- "VIEW ALL" sienna link, lighter on hover
- Row hover: warm cream tint

Switch to dark via toggle. Confirm matches prototype screenshot 3.

**Step 4: Commit**

```bash
git add src/app/\(home\)
git commit -m "refactor(theme): migrate home area to --ms-* tokens"
```

---

### Task 7: Migrate /transactions area (3 files)

**Files:**
- Modify: `src/app/transactions/page.tsx` — multiple `text-guild-green-500 hover:text-guild-green-400` (lines 85, 112, 139, 173)
- Modify: `src/app/transactions/components/UserTransactionRow.tsx`
- Modify: `src/app/transactions/components/AllTransactionRow.tsx` (status icons lines 69, 71)
- Modify: `src/app/transactions/components/AccountNFTTransfers.tsx`

**Steps 1–4:** Same pattern as Task 6. Browser-verify on `/transactions` in both themes. Commit:
```bash
git add src/app/transactions
git commit -m "refactor(theme): migrate /transactions area to --ms-* tokens"
```

---

### Task 8: Migrate /txn/[hash] area (5 files)

**Files:**
- Modify: `src/app/txn/[hash]/components/EventsTab.tsx` — row hover (line 221)
- Modify: `src/app/txn/[hash]/components/PayloadDecoder.tsx` — link (line 465)
- Modify: `src/app/txn/[hash]/components/ChangesTab.tsx` — row hover + inline mono (lines 416, 539)
- Modify: `src/app/txn/[hash]/components/GasUsageBar.tsx` — see below ⚠️
- Modify: `src/app/txn/[hash]/components/TransactionActionCard.tsx` — extensive (1458 lines, ~15 lines with brand colors)

**GasUsageBar special handling (Task 8a):**

The existing logic returns `bg-guild-green-500` (low) → `bg-oracle-orange-500` (high). Replace with theme-aware logic that uses `--ms-good`/`--ms-bad` in light and `--ms-ink-2`/`--ms-ink` in dark. Cleanest implementation: use Tailwind dark variant.

Replace the color expression with:
```tsx
if (pct < 50) return "bg-[var(--ms-good)] dark:bg-[var(--ms-ink-2)]";
return "bg-[var(--ms-bad)] dark:bg-[var(--ms-ink)]";
```

(Adjust to whatever existing thresholds the file uses — preserve the existing percentage logic, only change the color strings.)

**Steps 1–4:** Apply migration table per file, browser-verify on `/txn/<a-known-tx-hash>` in both themes. Confirm the page matches prototype screenshots 2 (light) and 4 (dark). Commit:
```bash
git add src/app/txn
git commit -m "refactor(theme): migrate /txn/[hash] area to --ms-* tokens"
```

---

### Task 9: Migrate /account/[address] area (8 files)

**Files:**
- Modify: `src/app/account/[address]/components/AccountIcon.tsx`
- Modify: `src/app/account/[address]/components/Tabs/TransactionsTab.tsx`
- Modify: `src/app/account/[address]/components/Tabs/ResourcesTab.tsx`
- Modify: `src/app/account/[address]/components/Tabs/NFTTransfersTab.tsx`
- Modify: `src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx`
- Modify: `src/app/account/[address]/components/Tabs/NFTsTab.tsx`
- Modify: `src/app/account/[address]/components/Tabs/coins/CoinRow.tsx`
- Modify: `src/app/account/[address]/components/Tabs/ModulesTab/ContractForm.tsx`

**Steps 1–4:** Apply table; verify `/account/<known-address>` and each tab in both themes. Commit:
```bash
git add src/app/account
git commit -m "refactor(theme): migrate /account/[address] area to --ms-* tokens"
```

---

### Task 10: Migrate /coin, /fa, /validator areas (3 files)

**Files:**
- Modify: `src/app/coin/[struct]/components/InfoTab.tsx`
- Modify: `src/app/fa/[address]/components/InfoTab.tsx`
- Modify: `src/app/validator/[address]/components/StakeOperationActivities.tsx` (line 124 — link)

**Steps 1–4:** Apply table; verify each page in both themes. Commit:
```bash
git add src/app/coin src/app/fa src/app/validator
git commit -m "refactor(theme): migrate /coin /fa /validator areas to --ms-* tokens"
```

---

### Task 11: Migrate /developers area (7 files)

**Files:**
- Modify: `src/app/developers/page.tsx`
- Modify: `src/app/developers/guides/page.tsx`
- Modify: `src/app/developers/components/DevelopersSidebar.tsx`
- Modify: `src/app/developers/components/ResponseSchemaView.tsx`
- Modify: `src/app/developers/components/RequestBodyForm.tsx`
- Modify: `src/app/developers/components/CodeSnippetTabs.tsx`
- Modify: `src/app/developers/components/ParameterForm.tsx`

**Steps 1–4:** Apply table; verify `/developers` and `/developers/api-explorer/...` in both themes. **Confirm Shiki code blocks still show brand-colored syntax highlighting** (they should — Shiki tokens in globals.css are untouched and `--color-guild-green-300` etc. still resolve from theme.css Layer 2). Commit:
```bash
git add src/app/developers
git commit -m "refactor(theme): migrate /developers area to --ms-* tokens"
```

---

### Task 12: Migrate /not-found

**Files:**
- Modify: `src/app/not-found.tsx` — ambient glows (lines 30, 31), hero gradient (line 40)

For the hero gradient `bg-linear-to-b from-guild-green-400 to-guild-green-600/50`, replace with sienna gradient:
```tsx
bg-linear-to-b from-[var(--ms-accent)] to-[var(--ms-accent-2)]/50
```

**Steps:** Apply, browse `/not-found` (or any 404 URL like `/garbage`) in both themes. Commit:
```bash
git add src/app/not-found.tsx
git commit -m "refactor(theme): migrate not-found page to --ms-* tokens"
```

---

### Task 13: Migrate shared common components (~13 files)

**Files:**
- Modify: `src/components/common/CopyableAddress.tsx` (6 usages)
- Modify: `src/components/common/HeaderCopyableAddress.tsx`
- Modify: `src/components/common/AccountLabelBadge.tsx`
- Modify: `src/components/common/TimestampModeToggle.tsx`
- Modify: `src/components/common/TransactionFunction.tsx`
- Modify: `src/components/common/VerifiedAssetBadge.tsx`
- Modify: `src/components/common/SupplyIcon.tsx`
- Modify: `src/components/common/TransactionTypeTooltip.tsx`
- Modify: `src/components/transactions/TransactionTableRow.tsx`
- Modify: `src/components/search/SearchBar.tsx`
- Modify: `src/components/wallet/WalletButton.tsx`
- Modify: `src/components/layout/NetworkBadge.tsx`
- Modify: `src/components/layout/LayoutBackground.tsx`

**⚠️ Care:** these are shared components — changes ripple into many pages. After each file, do a quick spot-check of the home page in both themes to catch regressions.

**Steps 1–4:** Apply table per file; verify in both themes. Commit:
```bash
git add src/components/common src/components/transactions src/components/search src/components/wallet src/components/layout
git commit -m "refactor(theme): migrate shared common/layout components to --ms-* tokens"
```

---

### Task 14: Migrate ui primitives (3 files)

**Files:**
- Modify: `src/components/ui/badge.tsx` (1 usage)
- Modify: `src/components/ui/table.tsx` (1 usage)
- Modify: `src/components/ui/toggle-group.tsx` (1 usage)

**Steps:** Apply table; commit:
```bash
git add src/components/ui
git commit -m "refactor(theme): migrate ui primitives to --ms-* tokens"
```

---

### Task 15: Confirm remaining brand-color usage is only in TrendIndicator + Shiki

```bash
grep -rln "guild-green\|moveus-marigold\|byzantine-blue\|protocol-pink\|oracle-orange" src --include="*.tsx" --include="*.ts" --include="*.css"
```

Expected output (only these files):
```
src/app/analytics/components/TrendIndicator.tsx
src/app/globals.css
```

If anything else appears → go back to the appropriate Phase 3 task and fix it.

---

## Phase 4 — Chart colors (runtime CSS-var reading)

### Task 16: Refactor analytics utils.ts to runtime color function

**Files:**
- Modify: `src/app/analytics/utils.ts`

**Step 1: Read current file**

```bash
cat src/app/analytics/utils.ts
```
Note any code that consumes `COLOR`, `BACKGROUND_COLOR`, `BACKGROUND_COLOR_END`, `HIGHLIGHT_COLOR`, `GRID_LINE_COLOR` — those consumers will change.

**Step 2: Replace constants with a function**

Replace the hardcoded color exports with:
```ts
function readVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export type ChartColors = {
  COLOR: string;
  BACKGROUND_COLOR: string;
  BACKGROUND_COLOR_END: string;
  HIGHLIGHT_COLOR: string;
  GRID_LINE_COLOR: string;
};

export function getChartColors(): ChartColors {
  const accent = readVar("--ms-accent") || "#7A4B1F";
  const accent2 = readVar("--ms-accent-2") || "#B06A2C";
  const ink3 = readVar("--ms-ink-3") || "#807A6B";
  return {
    COLOR: `color-mix(in srgb, ${accent} 90%, transparent)`,
    BACKGROUND_COLOR: `color-mix(in srgb, ${accent} 40%, transparent)`,
    BACKGROUND_COLOR_END: `color-mix(in srgb, ${accent} 0%, transparent)`,
    HIGHLIGHT_COLOR: accent2,
    GRID_LINE_COLOR: `color-mix(in srgb, ${ink3} 25%, transparent)`,
  };
}
```

**Step 3: Build to confirm types compile**

```bash
pnpm build
```
Expected: Build will likely fail at consumer sites (BarChart, LineChart, etc.) that still import the old constants. Note the failing files for Task 17.

**Step 4: Commit**

```bash
git add src/app/analytics/utils.ts
git commit -m "refactor(theme): convert chart color constants to runtime function"
```

---

### Task 17: Update each chart component to use runtime colors

**Files (~12 chart components):**
- `src/app/analytics/components/BarChart.tsx`
- `src/app/analytics/components/StatsOverview.tsx`
- `src/app/analytics/components/charts/MonthlyActiveUserChart.tsx`
- `src/app/analytics/components/charts/DailyPeakTPSChart.tsx`
- `src/app/analytics/components/charts/DailyDeployedContractsChart.tsx`
- `src/app/analytics/components/charts/DailyActiveUserChart.tsx`
- `src/app/analytics/components/charts/DailyContractDeployersChart.tsx`
- `src/app/analytics/components/charts/DailyUserTransactionsChart.tsx`
- `src/app/analytics/components/charts/DailyNewAccountsCreatedChart.tsx`
- `src/app/analytics/components/charts/DailyGasConsumptionChart.tsx`
- `src/app/analytics/components/charts/DailyAvgGasUnitPriceChart.tsx`
- Plus any chart in `/token/[tokenId]` and `/validator/[address]` that imports the constants.

**Step 1: Find consumers**

```bash
grep -rln "BACKGROUND_COLOR\|GRID_LINE_COLOR\|HIGHLIGHT_COLOR" src --include="*.tsx" --include="*.ts"
```

**Step 2: Pattern — each consumer**

For BarChart/LineChart components that previously did:
```tsx
import { COLOR, BACKGROUND_COLOR, ... } from "../utils";
const options = { ..., backgroundColor: BACKGROUND_COLOR, ... };
```

Replace with:
```tsx
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { getChartColors } from "../utils";

export default function BarChart({ ... }) {
  const { resolvedTheme } = useTheme();
  const colors = useMemo(() => getChartColors(), [resolvedTheme]);
  const options = { ..., backgroundColor: colors.BACKGROUND_COLOR, ... };
  // use colors.COLOR, colors.GRID_LINE_COLOR, etc.
}
```

If the chart component is a server component or has no `"use client"`, add it (Chart.js is already client-only via `react-chartjs-2`).

**Step 3: Build**

```bash
pnpm build
```
Expected: clean.

**Step 4: Browser verify on `/analytics`**

In light mode, charts should render with sienna line + soft cream area fill. Toggle to dark — charts re-render with cream line on near-black ground (matches prototype 3).

**Step 5: Commit**

```bash
git add src/app/analytics src/app/token src/app/validator
git commit -m "refactor(theme): chart components consume runtime CSS-var colors"
```

---

## Phase 5 — Verification & cleanup

### Task 18: Confirm dependency on design-system theme is severed

**Step 1: Grep for any remaining design-system theme import**

```bash
grep -rn "movement-design-system/theme" src
```
Expected: no results (or only in code comments / docs).

If any source file still imports it → remove that import.

### Task 19: Confirm all Phase 3 + Shiki + TrendIndicator policy

**Step 1: Brand color usage check**

```bash
grep -rln "guild-green\|moveus-marigold\|byzantine-blue\|protocol-pink\|oracle-orange" src
```
Expected output (and ONLY these):
```
src/app/analytics/components/TrendIndicator.tsx
src/app/globals.css
```

Anything else is a Phase 3 miss — go back and fix.

### Task 20: Page-by-page browser spot check

For each page below, open in BOTH light and dark modes. Compare against prototype screenshots where applicable.

| URL | Check | Prototype |
|---|---|---|
| `/` | hero glow, CoreMetricsGrid, history chart, latest tx table | screenshot 1 (light) / 3 (dark) |
| `/txn/<known-hash>` | tabs, status badge, action card, detail rows | screenshot 2 (light) / 4 (dark) |
| `/transactions` | table, row hover, status icons, "VIEW ALL" link | — |
| `/analytics` | chart colors update on theme change | — |
| `/account/<known-address>` | each tab (Coins, NFTs, Resources, Modules, Transactions, NFT Transfers, Coin Transfers) | — |
| `/coin/<struct>` | InfoTab | — |
| `/fa/<address>` | InfoTab | — |
| `/validator/<address>` | StakeOperationActivities link | — |
| `/developers` | sidebar, request body form, parameter form | — |
| `/developers/api-explorer/<path>` | **Shiki blocks must show brand-color syntax highlighting** | — |
| `/garbage-route` | not-found hero gradient + glows | — |

For each: note any visual issue (contrast, missing color, broken component) and fix as a follow-up commit.

### Task 21: Lighthouse a11y / contrast audit

**Step 1: Run Lighthouse for both themes**

In Chrome DevTools → Lighthouse → Accessibility audit on `/` (light), then toggle to dark and re-run.

Target: contrast errors = 0. The biggest risk is sienna `--ms-accent` on cream `--ms-bg`: confirm contrast ≥4.5:1 for body text (rough check: `#7A4B1F` on `#FAF7F2` has contrast ratio ~7.2:1 — should pass).

If failures appear → adjust the offending token in `theme.css` Layer 4 only (do not touch components).

### Task 22: Final build + lint

```bash
pnpm build
pnpm lint
```
Both must be clean.

### Task 23: Final commit + summary

If any tweaks accumulated since Task 17, commit them:
```bash
git status
# review any pending tweaks
git add -p
git commit -m "polish(theme): browser-verify cleanup"
```

Push when ready (do not auto-push; ask the user).

---

## Out of scope

- Renaming the brand-color tokens (`--color-guild-green-*` etc.) to anything else
- Refactoring shadcn primitives that ship from the design system npm package
- Logo / illustration recoloring (image assets)
- Mobile-specific layout changes
- Performance work
