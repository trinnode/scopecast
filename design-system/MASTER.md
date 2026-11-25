# SCOPECAST — Master Design System

> Source of truth for the visual identity and interaction language of the SCOPECAST console.
> Scope: a high-trust security console for cross-chain **delegated DeFi agent permissions**.
> Promise: **"Revoke once. Enforce everywhere."**
>
> This is a **risk-operations platform, not a trading terminal**. No tickers, no candlesticks,
> no price flashing, no neon spectacle. Calm, dense, legible, audit-ready.
>
> Research basis and rejected alternatives: [`research/DESIGN_SOURCES.md`](../research/DESIGN_SOURCES.md).

---

## 0. Non-negotiable rules

1. **Never encode state with colour alone.** Every status carries an icon, an uppercase text
   label, and a distinct edge/line pattern. All four states must survive greyscale printing.
2. **No white backgrounds.** Deep graphite surfaces only. Pure `#000` is also avoided — the
   canvas is a blue-tinted graphite so panels can be separated by value, not by blackness.
3. **No default fonts.** Inter, Roboto, Arial, Open Sans and `system-ui` are banned from product UI.
4. **No emoji as icons.** Icons are consistent 24×24 stroke SVGs.
5. **Respect `prefers-reduced-motion`.** See §5.
6. **All fonts and brand assets are served locally.** No runtime calls to Google Fonts or Fontshare.

---

## 1. Typography

### 1.1 Chosen families

| Role | Family | Licence | Why it fits the brief |
| --- | --- | --- | --- |
| Technical display | **Space Grotesk** | SIL Open Font License 1.1 | A distinctive, slightly idiosyncratic grotesque — angular terminals and quirky curves — that reads as engineered without becoming cyberpunk. Clearly not Inter/Roboto/Arial/Open Sans. Used for screen titles, section headings, the wordmark and large metrics. |
| Interface / body | **Satoshi** | ITF Free Font License (Fontshare) | Highly legible geometric-humanist sans with a large x-height and clean numeral shapes. More character than the default grotesques but neutral enough for dense permission tables at 13–15px. Used for all UI text, labels, buttons and table cells. |
| Data / addresses (optional third) | **JetBrains Mono** | SIL Open Font License 1.1 | Distinctive, highly readable monospace with slash-zero and unambiguous `O`/`0`. Used for wallet addresses, chain IDs, hashes, token IDs and signed permission payloads. |

Font files (all local, `woff2`, verified magic bytes `wOF2`):

```
apps/web/public/fonts/space-grotesk-latin-variable.woff2   (wght 300–700, 22,288 B)
apps/web/public/fonts/satoshi-latin-400.woff2              (25,516 B)
apps/web/public/fonts/satoshi-latin-500.woff2              (25,596 B)
apps/web/public/fonts/satoshi-latin-700.woff2              (25,328 B)
apps/web/public/fonts/satoshi-latin-900.woff2              (23,484 B)
apps/web/public/fonts/jetbrains-mono-latin-variable.woff2  (wght 400–800, 31,432 B)
```

### 1.2 `@font-face` snippet

Place in the web app's global stylesheet. Next.js serves `apps/web/public/fonts/*` at `/fonts/*`.

```css
@font-face {
  font-family: "Space Grotesk";
  src: url("/fonts/space-grotesk-latin-variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 300 700;
  font-display: swap;
}
@font-face {
  font-family: "Satoshi";
  src: url("/fonts/satoshi-latin-400.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Satoshi";
  src: url("/fonts/satoshi-latin-500.woff2") format("woff2");
  font-style: normal;
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: "Satoshi";
  src: url("/fonts/satoshi-latin-700.woff2") format("woff2");
  font-style: normal;
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: "Satoshi";
  src: url("/fonts/satoshi-latin-900.woff2") format("woff2");
  font-style: normal;
  font-weight: 900;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/jetbrains-mono-latin-variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 400 800;
  font-display: swap;
}

:root {
  --sc-font-display: "Space Grotesk", "Arial Narrow", sans-serif;
  --sc-font-ui: "Satoshi", "Segoe UI", sans-serif;
  --sc-font-mono: "JetBrains Mono", "Courier New", monospace;
}
```

> Fallbacks exist only for the flash-before-load window; they are never the intended rendering.

### 1.3 Type scale

| Token | Family / weight | Size / line-height | Tracking | Use |
| --- | --- | --- | --- | --- |
| `type/display` | Space Grotesk 700 | 32 / 40 px | −0.02em | Screen title, hero metric |
| `type/h1` | Space Grotesk 700 | 28 / 36 px | −0.02em | Page heading |
| `type/h2` | Space Grotesk 600 | 22 / 30 px | −0.01em | Section heading |
| `type/h3` | Space Grotesk 600 | 18 / 26 px | −0.01em | Card title, panel heading |
| `type/body` | Satoshi 400 | 15 / 24 px | 0 | Default body copy |
| `type/body-sm` | Satoshi 400 | 13 / 20 px | 0 | Table cells, dense rows |
| `type/label` | Satoshi 700 | 11 / 16 px | 0.08em, uppercase | Overlines, status labels, column headers |
| `type/mono` | JetBrains Mono 500 | 13 / 20 px | 0, tabular-nums | Addresses, hashes, chain IDs |
| `type/metric` | Space Grotesk 700 | 36 / 44 px | −0.02em, tabular-nums | Counts, totals, risk scores |

Rules:
- Body copy never below 13px. Overlines never below 11px and always uppercase + tracked.
- All numeric data uses `font-variant-numeric: tabular-nums` so columns do not jitter.
- Sentence case for everything except status labels, table headers and overlines.
- Max line length for prose: 68ch.

---

## 2. Colour tokens

### 2.1 Surfaces and text

| Token | Hex | Role | Contrast note |
| --- | --- | --- | --- |
| `--sc-bg-canvas` | `#0B1016` | App background, deepest layer | Base reference |
| `--sc-bg-surface` | `#121A24` | Panels, sidebar, top bar | +~1.09:1 vs canvas |
| `--sc-bg-surface-2` | `#1A2531` | Cards, table rows, inputs | Raised one step |
| `--sc-bg-elevated` | `#22303F` | Hover, menus, popovers, toasts | Highest surface value |
| `--sc-border` | `#2C3A48` | Decorative dividers, grid lines | Decorative only (1.2–1.6:1) — always paired with spacing or labels |
| `--sc-border-strong` | `#3C4C5C` | Panel boundaries | Decorative only (1.5–2.2:1) |
| `--sc-border-interactive` | `#6B7F94` | Inputs, control outlines | **≥3.26:1 on every surface** — WCAG non-text AA |
| `--sc-text-primary` | `#F2F6FA` | Headings, key values | 12.4–17.6:1 (AAA) |
| `--sc-text-secondary` | `#B8C4D0` | Body copy, row text | 7.6–10.8:1 (AAA) |
| `--sc-text-muted` | `#8A99A8` | Metadata, timestamps, hints | 4.6–6.6:1 (AA on all surfaces) |
| `--sc-text-inverse` | `#0B1016` | Text on solid cyan/amber/grey fills | 6.8–10.6:1 |

### 2.2 Status accents

| Token | Hex | Meaning | Contrast on canvas / surface / surface-2 / elevated |
| --- | --- | --- | --- |
| `--sc-accent-cyan` | `#22D3EE` | **Active** propagation, focus ring, current nav item | 10.56 / 9.69 / 8.59 / 7.44 : 1 (AAA) |
| `--sc-accent-amber` | `#F5B544` | **Pending** approval or in-flight propagation | 10.52 / 9.65 / 8.56 / 7.41 : 1 (AAA) |
| `--sc-accent-vermilion` | `#F86B4F` | **Revoked / blocked** — restrained vermilion | 6.55 / 6.01 / 5.33 / 4.61 : 1 (AA everywhere) |
| `--sc-status-unknown` | `#94A3B8` | **Unknown** — unreachable agent or stale attestation | 7.45 / 6.83 / 6.05 / 5.24 : 1 (AA/AAA) |
| `--sc-tint-active` | `#0E3B45` | Active chip background | primary text 11.18:1 |
| `--sc-tint-pending` | `#3A2C12` | Pending chip background | primary text 12.48:1 |
| `--sc-tint-revoked` | `#3A1A16` | Revoked chip background | primary text 14.44:1 |
| `--sc-tint-unknown` | `#24313D` | Unknown chip background | primary text 12.23:1 |
| `--sc-focus` | `#22D3EE` | 2px focus ring with 2px offset | 10.56:1 on canvas — never remove |

Colour usage rules:
- Accents are **signals, not decoration**. At most one accent-coloured element per row/card.
- Accent fills pair with `--sc-text-inverse`, never with white.
- Never place cyan/amber/vermilion text directly on a tint of a different status.
- The vermilion is deliberately not pure red: it stays legible and reads as "restrained", not "alarm".

---

## 3. Space, radius, elevation

### 3.1 Spacing scale (4pt base, 8pt rhythm)

| Token | px | Use |
| --- | --- | --- |
| `space/0` | 0 | Reset |
| `space/1` | 4 | Icon-to-label gaps, chip padding |
| `space/2` | 8 | Tight control padding |
| `space/3` | 12 | Row cell padding, inline groups |
| `space/4` | 16 | Default control padding, card inset |
| `space/6` | 24 | Card padding, grid gap, page gutter |
| `space/8` | 32 | Section spacing |
| `space/12` | 48 | Panel separation |
| `space/16` | 64 | Page top/bottom rhythm |
| `space/24` | 96 | Large empty-state spacing |

Use only these values. Do not invent 10px, 14px, 18px, etc.

### 3.2 Radius

| Token | px | Use |
| --- | --- | --- |
| `radius/xs` | 2 | Chips, small markers |
| `radius/sm` | 6 | Buttons, inputs, status labels |
| `radius/md` | 10 | Cards, table containers |
| `radius/lg` | 14 | Panels, dialogs |
| `radius/pill` | 999 | Counters, filter pills |

### 3.3 Elevation

Dark UI uses **value and border**, not heavy drop shadows.

- Flat surface: `border: 1px solid var(--sc-border)`.
- Raised card: `background: var(--sc-bg-surface-2); border: 1px solid var(--sc-border-strong)`.
- Popover/dialog: `background: var(--sc-bg-elevated); box-shadow: 0 12px 32px rgba(0,0,0,.45)`.
- Never use coloured glows. The only glow permitted is a 1px cyan focus ring, not a blur.

---

## 4. Status system — icon + label + pattern

Every status is conveyed by **four redundant channels**: hue, icon, text label, and edge/line pattern.
Greyscale or colour-blind users must get the same information.

| State | Hue | Icon (24×24 SVG) | Text label | Edge / line pattern | Chip treatment |
| --- | --- | --- | --- | --- | --- |
| **Active** | Cyan `#22D3EE` | Filled signal-burst / solid chevron (`▶`) | `ACTIVE` | **Solid** 2px left rail; propagation line drawn solid; solid node dots | Cyan text on `--sc-tint-active`, 1px cyan border |
| **Pending** | Amber `#F5B544` | Half-filled ring / hourglass (`◐`) | `PENDING` | **Dashed** 2px left rail; propagation line dashed; hollow node dots | Amber text on `--sc-tint-pending`, 1px amber border |
| **Revoked** | Vermilion `#F86B4F` | Closed-gate bar with slash (derived from the brand gate) | `REVOKED` | **Double-rule** left rail; line severed with a gap and end-caps; row gets 8% diagonal hatch | Vermilion text on `--sc-tint-revoked`, 1px vermilion border |
| **Unknown** | Fog `#94A3B8` | Hollow circle with `?` | `UNKNOWN` | **Dotted** 1px left rail; line dotted; node dots hollow | Fog text on `--sc-tint-unknown`, 1px fog border |

Additional rules:
- Tables always include a visible **Status** column with the full text label — never a dot-only glyph.
- Timeline/event diagrams use line style (solid / dashed / dotted / severed) plus terminal markers, not hue alone.
- Counters show the label, e.g. `12 ACTIVE · 3 PENDING · 2 REVOKED · 1 UNKNOWN`.
- If an icon is unavailable, fall back to the uppercase label — never to a bare colour swatch.

### Component states (generic)

| State | Visual treatment |
| --- | --- |
| Default | `--sc-bg-surface-2`, `--sc-border`, primary/secondary text |
| Hover | `--sc-bg-elevated`, `--sc-border-interactive`; `cursor: pointer`; no scale transform |
| Focus | `outline: 2px solid var(--sc-focus); outline-offset: 2px` — never `outline: none` without replacement |
| Active / selected | Cyan left rail + icon + label + tint background; not colour alone |
| Pressed | Slight value shift (`--sc-bg-canvas`) within 100ms |
| Disabled | `opacity: .45`, `cursor: not-allowed`, label retained |
| Loading | Skeleton in `--sc-bg-surface-2` with shimmer disabled under reduced motion; never a blank pane |
| Error | Vermilion icon + `ERROR` label + plain-language message; never red border alone |

---

## 5. Motion

- Animate **only** `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`.
- Durations: `120ms` micro feedback, `200ms` state change, `320ms` panel/dialog transition.
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for enter; `cubic-bezier(0.7, 0, 0.84, 0)` for exit. Never linear.
- **Maximum 1–2 animated elements per view.** The propagation animation on the map/graph is the one
  hero motion; static cards around it do not animate.
- No scroll-jacking, parallax, glitch, scanlines or pulsing price ticks.
- A propagation pulse must be a thin cyan dash travelling once along the signal line, not a glow bloom.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  /* Replace the propagation animation with a static, labelled end state. */
  .sc-propagation-pulse { display: none; }
}
```

With reduced motion on: status changes still occur, but instantly; propagation is shown by a static
solid line plus the `ACTIVE` label; no skeleton shimmer; no staggered reveals.

---

## 6. Brand assets and usage

Files (identical copies in `public/brand/` and `apps/web/public/brand/`):

| File | ViewBox | Use |
| --- | --- | --- |
| `scopecast-mark.svg` | 0 0 64 64 | Icon, empty states, inline with text |
| `scopecast-wordmark.svg` | 0 0 199.47 32 | Wordmark on its own |
| `scopecast-lockup.svg` | 0 0 243.47 32 | Headers, login, about |
| `favicon.svg` | 0 0 64 64 | Browser tab, explicit colours for standalone rendering |

Concept: two compact permission nodes (delegator filled, agent outlined) joined by a single
controlled signal line that terminates at a **closed gate**; the channel beyond the gate is cut.
This is the "revoke once, enforce everywhere" idea in one geometry — no shield, no chain link.

Rules:
- Mark, wordmark and lockup use `currentColor`; set the parent colour, do not edit the SVG.
- Minimum clear space around the mark: `0.5×` the mark height.
- Minimum rendered size: 20px for the mark, 120px wide for the wordmark, 160px wide for the lockup.
- Favicon uses explicit `#0B1016` / `#E2E8F0` / `#22D3EE` because SVG favicons render outside CSS.
- Never recolour the gate to amber or vermilion — the gate means **enforcement**, not a status state.

---

## 7. Layout and navigation — 10-screen console

### 7.1 Shell

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Top bar — 56px: breadcrumb · global search  │
│  Rail    ├──────────────────────────────────────────────┤
│  240px   │                                              │
│  (64px   │  Content — max 1440px, 24px gutters          │
│  collapsed)                                             │
│          │  Page title → controls → table/panels        │
└──────────┴──────────────────────────────────────────────┘
```

- Rail: 240px expanded, 64px collapsed. Persistent across all 10 screens.
- Top bar: 56px, sticky. Breadcrumb on the left, search, notification count and operator identity on the right.
- Content: `max-width: 1440px`, centred, 24px horizontal gutter (16px at ≤768px).
- Page order top-to-bottom: **title → description → primary controls → data → secondary detail**.

### 7.2 Navigation groups and the 10 screens

| Group | Screens |
| --- | --- |
| **OPERATE** | 1. Overview · 2. Permission Registry · 3. Agents · 4. Chains · 5. Approvals Queue |
| **GOVERN** | 6. Enforcement Log · 7. Policies · 8. Audit Trail |
| **CONFIGURE** | 9. Integrations · 10. Settings |

Navigation principles:
- Current item = cyan left rail **+** filled icon **+** bold label **+** tint background. Never colour alone.
- Rail groups are always labelled, even when collapsed (tooltip on hover/focus).
- Depth is max 2 levels. Breadcrumbs show the full path on every screen.
- Keyboard: `⌘/Ctrl+K` command palette, `g` + key to jump, arrow keys within lists, `Esc` closes overlays.
- Every destructive action (revoke, disable policy) uses a confirm dialog naming the exact scope and chain.
- Every screen has a single primary action. If two actions compete, one is demoted to a ghost button.

### 7.3 Data-display principles

- Tables: sticky header, zebra-free (use borders), status label column, right-aligned tabular numerals.
- Row height 48px compact / 64px comfortable. Never below 44px touch target.
- Detail opens in a right-side pane (480px) over the list; never a full-page navigation for a single record.
- Empty states use the mark plus a plain-language sentence and one action.
- Long hashes/addresses truncate in the middle with a copy button; full value in `title` and on focus.
- Responsive: 1440 / 1024 / 768 / 375px. At <768px the rail becomes a bottom tab bar; tables become cards. No horizontal page scroll.

---

## 8. Accessibility checklist

- [ ] Contrast verified: body ≥4.5:1, UI boundaries ≥3:1 (ratios in §2).
- [ ] Status conveyed by icon + label + pattern, never hue alone.
- [ ] Focus ring visible on every interactive element, keyboard reachable.
- [ ] `prefers-reduced-motion` honoured; no essential information only in motion.
- [ ] All icons are SVGs with accessible names; decorative SVGs `aria-hidden="true"`.
- [ ] Form inputs have persistent visible labels (not placeholder-only).
- [ ] Status changes announced via `aria-live="polite"` where async.
- [ ] No auto-dismissing critical alerts; errors persist until acknowledged.
- [ ] Target WCAG 2.2 AA across all 10 screens.

---

## 9. Anti-patterns (explicitly rejected)

- Cyberpunk glitch, scanlines, neon bloom, terminal-green on black — reads as entertainment, not risk ops.
- Gold + purple "fintech" palette from generic recommendations — conflicts with the cyan/amber/vermilion brand grammar.
- Fira Code / Fira Sans pairing — functional but too generic for a distinctive identity.
- Horizontal-scroll marketing "journey" pattern — a console is not a landing page.
- Simulated trading tickers, live price charts, countdown timers on revoke actions.
- Coloured dot-only status indicators, red/green-only semantics.
- Runtime font fetching — all assets must be local.
