# Theme Recolor — Implementation Summary

**Date completed:** 2026-05-08
**Scope:** Color system refactor from `@movementlabsxyz/movement-design-system`'s brand-color theme to a warm cream + sienna palette, with light/dark theme switching.
**Reference:** [2026-05-06-theme-recolor-design.md](2026-05-06-theme-recolor-design.md), [2026-05-06-theme-recolor.md](2026-05-06-theme-recolor.md)

## Outcome at a glance

| Metric | Value |
|---|---|
| Commits on `main` | 39 (incl. design + plan docs) |
| Files changed | 106 |
| Lines added / removed | +2426 / -412 |
| Build status | `pnpm build` clean |
| Lint delta | 0 new errors (returned to baseline 111 pre-existing) |

## Visual outcome

**Light mode** — warm cream surface (`#FAF7F2`) + sienna accent (`#7A4B1F`) + white cards. Dot pattern dropped, ambient glow near-invisible, charts in sienna with three-stop gradient and theme-aware tooltips.

**Dark mode** — near-black surface (`#0D0C0A`) + cream ink (`#FAF7F2`) following the original "cream invert" principle. Status hues kept (olive-green, red-orange, blue) for semantic legibility — every other element reads as cream-on-dark for monochrome elegance.

## Architecture

Single source of truth: [`src/styles/theme.css`](../../src/styles/theme.css).

- **Layer 1** — non-color primitives (spacing, radii, shadows, fonts) copied from design system
- **Layer 2** — brand color palettes preserved (5 colors × 10 shades) for Shiki + TrendIndicator
- **Layer 3** — `--color-*` Tailwind v4 bridge (`--color-background → var(--background)` etc.)
- **Layer 4** — `--ms-*` raw values, light + dark
- **Layer 5** — semantic token remap (`--background → var(--ms-bg)`, `--primary → var(--ms-accent)`, etc.)

The previous import `@movementlabsxyz/movement-design-system/theme` is no longer used. `component-styles` and `fonts` imports are retained.

## Brand-color policy

Two intentional exceptions keep the original brand palette:
- [`src/app/analytics/components/TrendIndicator.tsx`](../../src/app/analytics/components/TrendIndicator.tsx) — finance up/down semantics
- [`src/app/globals.css`](../../src/app/globals.css) Shiki block — code syntax highlighting

Everything else is mapped to `--ms-*` semantic tokens.

## Commit log (chronological)

### Phase 0 — Documentation
- `0d2518d` — Add theme recolor design doc (warm cream / sienna with dark mode)
- `ee30413` — Add theme recolor implementation plan

### Phase 1 — Foundation
- `4872b6c` — feat(theme): create new theme.css with --ms-* warm cream palette
- `8d6f670` — feat(theme): wire globals.css to new theme.css
- `9e57627` — fix(theme): drop dark gradient overlay in LayoutBackground
- `b61e824` — fix(theme): retint home page hero glows to --ms-accent
- `62b093b` — fix(theme): hero title uses theme foreground; dotted pattern retinted

### Phase 2 — Theme switching
- `4efd8b1` — feat(theme): unlock dark mode and wire ThemeToggle in nav
- `ceff735` — fix(theme): override dark-first design-system component defaults
- `23dbe17` — fix(theme): scope dark-first overrides so consumer classes win

### Phase 3 — Hardcoded brand-color migration (~50 files)
- `f4dbd35` — refactor(theme): migrate home area to --ms-* tokens
- `baf8ad3` — refactor(theme): migrate /transactions area to --ms-* tokens
- `8ddff08` — refactor(theme): migrate /txn/[hash] area to --ms-* tokens
- `12c1181` — refactor(theme): migrate /account/[address] area to --ms-* tokens
- `32f2b8e` — refactor(theme): migrate /coin /fa /validator areas to --ms-* tokens
- `3902da0` — refactor(theme): migrate /developers area to --ms-* tokens
- `befda59` — refactor(theme): migrate not-found page to --ms-* tokens
- `89c577f` — refactor(theme): migrate shared common/layout components to --ms-* tokens
- `ea9dc64` — refactor(theme): migrate ui primitives to --ms-* tokens

### Phase 4 — Charts
- `1efb57f` — refactor(theme): chart colors read --ms-* CSS vars at runtime
- `e28b7f0` — fix(theme): retint remaining hardcoded brand-green chart and accent colors
- `a4c2308` — fix(theme): force chart re-mount on theme switch via key={resolvedTheme}
- `e809250` — fix(theme): chart colors derive from resolvedTheme directly, not CSS vars
- `b32602d` — polish(theme): chart palette + three-stop gradient + theme-aware tooltip

### Phase 5 — Visual polish + design-system override fixes
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

## Key technical decisions

### Decisions made during brainstorm
| # | Question | Choice |
|---|---|---|
| 1 | Status colors in dark | First D2 (collapse to cream), later reverted — kept proper hue for legibility |
| 2 | Token plumbing | Replace design-system theme.css with our own |
| 3 | Decoupling scope | Only colors — keep `component-styles`, `fonts`, components, and copy non-color tokens |
| 4 | Selector | `.dark` class via next-themes `attribute="class"` |
| 5 | Default theme | `defaultTheme="system"` + `enableSystem` |
| 6 | New theme file | `src/styles/theme.css` |
| 7 | ThemeToggle placement | Header (desktop) + NavMobile (mobile) |
| 8 | Charts | Resolved via `useTheme().resolvedTheme` parameter, not `getComputedStyle` (avoids React render timing race) |

### Decisions made during implementation
- **Card component rewritten locally** — design-system Card shipped a `glass-background` recipe (translucent black gradient + 21px backdrop-blur) that overrode `bg-card`. Replaced with plain shadcn primitives.
- **Dark mode cream invert held, with one exception** — status colors (`--ms-good` / `--ms-bad` / `--ms-info`) keep proper hue in dark for semantic clarity (success/failure must be distinguishable). Other elements stay monochrome cream.
- **Olive-green for `--ms-good`** — `#5C8E2C` (light) / `#A8D466` (dark). Forest green felt grey on cream; olive ties to the warm palette.
- **Dot pattern dropped entirely** in both modes — clean surfaces read better than patterned ones for the warm cream aesthetic.
- **Ambient glow near-invisible** (`/4` alpha + `160px` blur) — atmosphere without competing with content.
- **Map land colors inverted per theme** — dark warm brown on cream (light), warm cream on near-black (dark).

## Files NOT touched (intentional)

- The `@movementlabsxyz/movement-design-system` npm package — only colors swapped, components/fonts/styles still consumed.
- Brand color tokens (`--color-guild-green-*` etc.) — preserved in our theme.css for Shiki + TrendIndicator.
- All 1113 Tailwind semantic class usages (`bg-background`, `text-foreground`, etc.) auto-recolored via the token remap, not edited.

## Known minor visual deviations from prototype

- "Cream invert" was loosened: status colors keep hue in dark (per usability vs. strict aesthetic trade-off).
- Map markers use a hardcoded sienna that doesn't theme-switch (Leaflet/Mapbox-style props can't read CSS vars).
- `<NextTopLoader>` progress bar uses hardcoded sienna (`#7A4B1F`); same prop limitation.

## Verification

- ✅ `pnpm build` clean
- ✅ `pnpm lint` baseline preserved (111 pre-existing errors, 0 new)
- ✅ Browser spot-check across home, /txn, /transactions, /analytics, /account, /coin, /fa, /validator, /developers, /not-found, /validators
- ✅ Light/Dark/System toggle works in desktop header + mobile sheet
- ✅ Theme persists in `localStorage("theme")`
- ⏭️ Lighthouse a11y audit — not run; sienna-on-cream contrast measured ~7:1 (passes WCAG AA)
