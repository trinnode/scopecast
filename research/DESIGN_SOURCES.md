# SCOPECAST — Design research sources and decisions

Working note for the visual identity and design-system lead. Records what was queried, what came
back, and why the final system deviates from generic recommendations.

Date: 2026-11-25.

---

## 1. Research commands run

Skill: `ui-ux-pro-max` (base dir `/home/trinnex/.opencode/skills/ui-ux-pro-max`).

```bash
python3 /home/trinnex/.opencode/skills/ui-ux-pro-max/scripts/search.py \
  "security console dashboard fintech dark high-trust technical" \
  --design-system -p SCOPECAST -f markdown

python3 .../search.py "out-of-the-box distinctive technical display interface" --domain typography -n 12
python3 .../search.py "dark technical high-trust fintech security" --domain color -n 10
python3 .../search.py "dark mode OLED minimal serious professional" --domain style -n 10
python3 .../search.py "accessibility color contrast reduced motion focus states dashboard" --domain ux -n 12
```

---

## 2. What the searches returned

### 2.1 Design-system search
- Pattern: "Horizontal Scroll Journey" (a landing-page engagement pattern).
- Style: Dark Mode (OLED) — deep black / midnight blue, minimal glow, visible focus, WCAG AAA claim.
- Colours: primary `#F59E0B`, secondary `#FBBF24`, CTA `#8B5CF6`, background `#0F172A`, text `#F8FAFC`
  ("gold trust + purple tech").
- Typography: Fira Code (heading) + Fira Sans (body), "dashboard, data, analytics, code, technical".
- Effects: minimal glow, dark-to-light transitions, low white emission.
- Anti-patterns: light backgrounds, no security indicators.

### 2.2 Typography domain
Highest technical matches: Fira Code + Fira Sans ("Dashboard Data"), JetBrains Mono + IBM Plex Sans
("Developer Mono"), Space Mono (all-mono brutalist), Clash Display + Satoshi ("Startup Bold",
noting Clash Display is on Fontshare and Outfit is the Google alternative).

### 2.3 Colour domain
Financial dashboard / government / financial-service palettes converge on `#0F172A`–`#020617`
backgrounds, `#1E293B`–`#334155` raised surfaces, `#F8FAFC` text, and a single high-impact accent.
Fintech/crypto default was gold + purple; insurance/government was security blue + green.

### 2.4 Style domain
Useful: **Dark Mode (OLED)** (deep graphite, visible focus, high contrast) and **Minimalism & Swiss
Style** (grid-based, mathematical spacing, clear hierarchy, enterprise/dashboard fit). Also
**Trust & Authority** (security indicators, credentials, high contrast) as a semantic reminder.
Rejected: **Cyberpunk UI** (neon green/magenta, glitch, scanlines) and interactive-cursor effects —
they undermine a serious risk-operations product and add motion noise.

### 2.5 UX domain
Confirmed high-severity rules: 4.5:1 text contrast, `prefers-reduced-motion`, visible focus rings,
never colour-only status, no forced scroll effects, 1–2 animated elements per view, ease-out not
linear, skeleton/loading feedback, distinct hover/active/disabled states.

---

## 3. Decisions and rationale

| Decision | Why |
| --- | --- |
| **Reject the "Horizontal Scroll Journey" pattern** | It is a marketing-landing structure. SCOPECAST is a 10-screen operational console with persistent navigation; see MASTER.md §7. |
| **Reject gold + purple fintech palette** | The brief fixes the semantic grammar: cyan = active propagation, amber = pending, vermilion = revoked/blocked, fog = unknown. Purple CTA would add a fifth unaccounted signal and read as consumer fintech. |
| **Reject Fira Code + Fira Sans** | Functional but too common in dashboards. The brief explicitly asks for distinctive, non-default families. |
| **Choose Space Grotesk for display** | Distinctive technical grotesque with character, still restrained and serious; independent of Inter/Roboto/Arial/Open Sans; SIL OFL 1.1; renders the wordmark well at bold weight. |
| **Choose Satoshi for interface** | Highly legible at dense table sizes (13–15px), more character than default grotesques, clean numerals, free ITF licence via Fontshare. |
| **Add JetBrains Mono as a third, data-only face** | Wallet addresses, chain IDs and hashes need unambiguous glyphs (slashed zero). Not used for prose or headings. |
| **Adopt Dark Mode (OLED) + Swiss grid** | Deep graphite surfaces, mathematical 4/8pt spacing, clear hierarchy, visible focus. Avoid pure black and avoid neon glow. |
| **Four-state grammar instead of three** | "Unknown" is essential in cross-chain delegation (unreachable agent, stale attestation). Without it, missing data would be misread as revoked. |
| **Token tuning from measured contrast** | Initial vermilion `#F0543B` fell to 3.86:1 on the elevated surface; lifted to `#F86B4F` (≥4.61:1 everywhere). Decorative borders kept low-contrast but an interactive border token `#6B7F94` was added at ≥3.26:1 for WCAG non-text AA. |

---

## 4. Font sourcing record

All files were fetched at build time and written to `apps/web/public/fonts/`. Every file was
verified with `file` and by checking the `wOF2` magic bytes.

### Space Grotesk — technical display
- CSS endpoint: `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap`
- Binary host: `fonts.gstatic.com` — `V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2` (latin subset, variable)
- Local file: `apps/web/public/fonts/space-grotesk-latin-variable.woff2` (22,288 B)
- Designer/project: Florian Karsten — https://github.com/floriankarsten/space-grotesk
- Specimen: https://fonts.google.com/specimen/Space+Grotesk
- Licence: SIL Open Font License 1.1 — verified text at
  https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/OFL.txt

### Satoshi — interface
- CSS endpoint: `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`
- Binary host: `cdn.fontshare.com` (static weight files)
- Local files: `apps/web/public/fonts/satoshi-latin-{400,500,700,900}.woff2`
- Foundry: Indian Type Foundry — https://www.fontshare.com/fonts/satoshi
- Licence: ITF Free Font License (free for personal and commercial use) — https://www.fontshare.com/licenses/itf-ffl

### JetBrains Mono — data / addresses
- CSS endpoint: `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..800&display=swap`
- Binary host: `fonts.gstatic.com` — `...BYRbKPxDcwg.woff2` (latin subset, variable)
- Local file: `apps/web/public/fonts/jetbrains-mono-latin-variable.woff2` (31,432 B)
- Project: https://github.com/JetBrains/JetBrainsMono
- Licence: SIL Open Font License 1.1 — verified text at
  https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/OFL.txt

No runtime font requests are made by the product.

---

## 5. Brand asset construction

- Mark geometry is original: two compact permission nodes (delegator = filled square, agent =
  outlined square) joined by a single signal line ending at a closed vertical gate; the channel
  beyond the gate is cut. No shield, chain-link, padlock or globe cliché.
- The wordmark is set in Space Grotesk Bold and **converted to static vector outlines** with
  `fontTools` (`SVGPathPen`) so the SVG is portable and does not depend on an installed font.
- Mark, wordmark and lockup inherit `currentColor`. The favicon uses explicit colours
  (`#0B1016`, `#E2E8F0`, `#22D3EE`) because SVG favicons render outside the app's CSS cascade.
- All SVGs were XML-validated, rendered via Inkscape at full and 16px sizes, and checked for
  byte-identical copies in `public/brand/` and `apps/web/public/brand/`.


## Addendum — implemented system (2026-11-26)

The final shipped UI replaced the fonts explored above with **Unbounded**, **Archivo** and
**Space Mono** (all SIL OFL 1.1, downloaded locally). The implemented palette and effects are
authoritative in `apps/web/tailwind.config.ts`, `apps/web/app/globals.css` and
`design-system/MASTER.md`. Earlier Space Grotesk / Satoshi / JetBrains Mono notes remain as research
history only.
