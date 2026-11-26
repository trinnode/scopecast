# SCOPECAST landing page — independent product-design audit

> Scope: `apps/web/app/page.tsx`, `components/effects.tsx`, `components/RouteScene3D.tsx`,
> `components/Brand.tsx`, `components/ui.tsx`, `app/globals.css`, `tailwind.config.ts`,
> `public/brand/*.svg`, `design-system/MASTER.md`. Landing page only. Read-only assessment.

## Assessment method

1. **Source read** of every in-scope file, including the status vocabulary in
   `apps/web/lib/status.ts` and the brand SVGs, to compare the shipped page against its own
   design system (`design-system/MASTER.md`).
2. **Live inspection** of the production build at `http://localhost:3300/` with Playwright MCP at
   **1440×900, 768×1024 and 390×844**. Because scroll-reveal wrappers start at `opacity: 0`, I
   scrolled to each of the nine `<section>` offsets (136 / 1051 / 1790 / 2427 / 3384 / 4333 /
   5080 / 5945 / 6660 px at 1440) before capturing, so the screenshots show real end states
   rather than unrevealed skeletons.
3. **Interaction probes**: dispatched `pointermove` at scene edges and read the generated CSS
   variables (`--sx`, `--sy` reached +3.58° / +7.17° — pointer rotation works); measured carousel
   card geometry via `getBoundingClientRect()`; emulated `prefers-reduced-motion: reduce` and
   reloaded to verify every motion escape hatch.
4. Measured: page height 6979 px at 1440, no horizontal overflow at 390 (`scrollWidth 375`
   because of the scrollbar), hero illustration 360 px tall.

## What works

- **Typography is genuinely deliberate.** Unbounded for display, Archivo for body, Space Mono for
  data, all served locally. At 768 the headline resolves to two clean lines
  ("Revoke once." / "Enforce everywhere."); at 390 it stacks to three without breaking words.
  Tabular numerals on the mono data are used consistently.
- **The hero has a clear information hierarchy**: overline → claim → one-sentence mechanism →
  two CTAs → three chain IDs with numbered prefixes. The numbered `01/02/03` prefix system is
  reused in the illustration caption and in "How it works", giving the page a single counting
  language.
- **The brand mark is conceptually strong** and correctly implemented as a CSS mask so it inherits
  `currentColor` (Brand.tsx). "Delegator node → controlled signal → closed gate → severed channel
  → isolated agent" is exactly the product thesis, and it is original — no shield, chain link or
  padlock cliché.
- **Honesty as a design asset.** The "Illustration" badge, the TESTNET ONLY banner, the
  `topic0` literal, the explicit "What is proven, and what is not yet" framing, and the FAQ's
  four "No." answers are unusually trustworthy for a buildathon landing page. Do not dilute this.
- **Reduced motion is largely honoured** in the shipped CSS/JS (details below).
- **The limitations block has a distinct amber tint** and warning icon — the one place on the page
  where a state change of tone is used semantically rather than decoratively.

## Prioritized opportunities

| Priority | Component / section | Concrete problem (observed) | Concrete proposed design feature | Expected user benefit | Implementation hint |
| --- | --- | --- | --- | --- | --- |
| **P0** | `Carousel` — "Who it is for" | Measured card widths at 1440 are **652 / 706 / 693 / 734 px**, not the intended 340 px: `min-w-[min(86vw,340px)]` has no `max-width`, so `shrink-0` + content width wins. Two cards are sliced at both viewport edges — tag reads "OTOCOL", title reads "tegration engineer". At 390 the visible card shows body text chopped mid-word ("I strategy on a source chain and revoke it without e") with no edge affordance. The 7 s `setInterval` auto-advance moves cards while the user reads. | Replace with a **fixed 3-up grid at ≥1024** (genuinely four role cards, no slicing) and a **single-card snap rail with a 12 px next-card peek + CSS `mask-image` fade at both edges** below 1024. Give each role one tiny original 24 px SVG glyph derived from the brand gate: engineer = gate with a branch tap, security engineer = gate with an epoch stamp, DAO operator = filled delegator node with one bounded arrow, agent provider = outlined agent node bounded by two ticks. Remove auto-advance entirely. | Fixes visible brokenness, stops fighting the reader, and makes "different views of the same state" legible at a glance instead of as four interchangeable text blobs. | `effects.tsx` → `Carousel`: set `w-[min(86vw,340px)] max-w-[340px]`, delete the interval effect in lines 185–189, add edge mask in `globals.css`, add `role="region" aria-label` + `aria-live="polite"` index announcement; glyphs passed as an `icon` field in the `items` array in `page.tsx` (lines 275–280). |
| **P0** | `RouteScene3D` — hero | At 390 the fixed `translate3d(±175px, …)` node offsets push the left/right cards outside the 360 px scene: labels truncate to "A" and "UN…". The two bottom captions wrap to **four lines and overlap the node labels** ("MOVE POINTER TO ROTATE" / "POLICY HASH BOUND TO EVERY STAGE" across `reaction`/`enf…`). "Move pointer to rotate" is meaningless on touch. | Reflow the scene into a **vertical route spine below 768 px**: three full-width nodes stacked along one vertical signal line, depth expressed by `scale()` + brightness only, and a caption that reads `01 SOURCE → 02 REACT → 03 ENFORCE` in one line. Above 768, keep the horizontal scene but replace the two floating caption strings with an **SVG overlay**: an arrow-headed signal path that actually connects the three nodes, a small `0xd160…` token pinned to each node, and an epoch marker ticking `n → n+1`. Drop the "Illustration" badge once the diagram carries information. | The hero's central claim becomes provable in the illustration itself; mobile users get a complete, readable route instead of a cropped screenshot of one card. | `RouteScene3D.tsx` → `nodes[].depth` (lines 6–8) should come from a CSS custom property with a `@media (max-width: 767px)` override, or a `matchMedia`-gated depth array; replace the footer div at lines 75–78; add an inline `<svg>` spine using the brand gate geometry from `public/brand/scopecast-mark.svg`. |
| **P1** | Hero effect stack / `TiltCard` | The panel is tilted by `TiltCard` (±12°/±10°) **and** the inner `.scene-core` rotates again (±18°/±12°). Combined with a blurred autoplay video, five drifting beams, two blur blobs, a conic-gradient spinning CTA border, a shimmering `background-position` headline and a character-typing paragraph, the hero violates MASTER.md §5's own "maximum 1–2 animated elements per view" rule. `text-shimmer` animates `background-position` linearly — explicitly banned by §5 ("only transform and opacity"; "never linear"). | Keep **one** motion: the pointer-driven scene rotation. Remove the `TiltCard` wrapper so the panel and its caption text stay readable. Freeze the headline gradient (ink → flare, no shimmer) and let only the word "Enforce" carry it; "everywhere." stays solid ink. Replace the spinning conic CTA border with a static flare border and a 1 px flare underline that grows on hover via `transform: scaleX()`. Use one static radial wash instead of video + beams + blobs. | Motion becomes purposeful and subordinate; the hero reads as a risk-ops product rather than a generic AI landing page; fewer composited layers on low-end mobile. | `page.tsx` hero lines 111–126 (remove `<TiltCard>`), `globals.css` `.gradient-text` line 78–85 and `.moving-border` 159–178, `effects.tsx` `BackgroundMotion` lines 6–27, `tailwind.config.ts` keyframes `text-shimmer`/`border-spin`. |
| **P1** | Policy section | The left column has ~300 px of dead space under the `topic0` string, while the right column is a nine-row text-only table. The copy claims "the same hash is emitted on the source, recomputed by the Reactive contract, verified again by the mirror" — but nothing in the visual shows this. | Add a **capability fingerprint** in the empty column: nine short "ticks" (one per policy field, labelled with the field's two-letter sigil) converging into one 8×8 monospace hash tile; below it, three identical hash tiles connected by a solid line and labelled `EMIT / RECOMPUTE / VERIFY`. Under reduced motion it is a static diagram; with motion, only one thin dash travels the line once on first reveal. | Turns the most abstract claim on the page into a 3-second visual proof and fills the largest dead-space region on the page with information, not decoration. | `page.tsx` policy left column lines 202–212; new presentational component (e.g. `components/CapabilityFingerprint.tsx`) driven by the existing `policyFields` array so the nine ticks can never drift out of sync with the table. |
| **P1** | Security model cards | Four near-identical cards with a tiny cyan `Check` glyph. The page talks about dual authentication, monotonic epochs, scoped execution and distinct failure states, but the only visual differentiator is a checkmark. MASTER.md §4 requires icon + label + pattern; the landing page uses none of it. | Four small original SVGs, each information-bearing: (1) **two independent bolts on one gate** for dual callback auth, with a caption `BOTH REQUIRED`; (2) an **epoch stack** of four bars where `n` is solid and `n-1` is struck through for monotonic epochs; (3) the **brand gate scaled up**, with the signal line terminating at it, for scoped execution; (4) a **four-segment line key** — solid / dashed / severed-with-caps / dotted — for visible failure modes. Apply the existing `signal-line--*` patterns from `globals.css` to the card top edge so the pattern language is introduced here and reused later in the console. | The security model becomes scannable and memorable; reinforces the console's state grammar before the user reaches it; survives greyscale. | `page.tsx` lines 236–249: add `glyph` key to the four tuples and render inline SVG components; reuse `tailwind.config.ts` `.signal-line--pending/--unknown/--revoked` and `lib/status.ts` `toneClasses().rail`; keep `MASTER.md` §4 as the contract. |
| **P1** | Known limitations | Amber box + `AlertTriangle` + six dash-prefixed sentences. It states *asynchronous propagation* and *settled transactions are never reversed* without showing either. | A compact **"cut channel" diagram**: a left node (SOURCE FINAL), a solid segment, a dashed segment (CALLBACK IN FLIGHT), a severed segment with end caps (SETTLED — NOT REVERSIBLE), and a right node (DESTINATION). Place the six limitations as short labels attached to the relevant segment instead of one flat list. | Makes the least intuitive property of the product — finality without atomicity — understandable without reading the FAQ, and uses the brand's "cut channel" geometry as intended. | `page.tsx` lines 251–263; reuse `sc-signal-line--pending` / `--revoked` patterns in `globals.css` lines 145–153; an inline SVG is sufficient, no new dependency. |
| **P1** | Build status table | All seven rows look identical. The heading promises "proven, and what is not yet"; values mix `51 tests passing`, raw 42-char addresses and `Not yet recorded` with no differentiation. | Add a **verification rail**: solid cyan left rail + a small filled-check glyph for verified rows, dotted fog rail + hollow glyph for "not yet". On the "Live origin → callback proof" row, replace `3000 ms` with a 4-node micro-timeline (`SOURCE → REACTIVE → CALLBACK → ENFORCED`) and a `3000 ms` bracket. Middle-truncate long addresses with the full value in `title`. | Users can answer "is this real?" in one scan; the async proof becomes a shape, not a number; sets up the console's status language. | `page.tsx` lines 300–313; reuse `lib/status.ts` `toneClasses()` and the `signal-line--unknown` pattern; no new data needed — derive tone from the existing null checks. |
| **P2** | "How it works" four cells | Four text cells separated by 1 px grid lines. Nothing says the steps are ordered except `01`–`04`; the word "independently verifiable" has no visual counterpart. | One **four-checkpoint rail** under the cells with a single thin dash that advances as the row enters view (not four simultaneous animations), plus a 20 px glyph per step: signed event / sieve with `opCode 3` / callback envelope with injected sender / closed gate at the module. | Sequence and verification become visible; the section stops reading as a feature grid. | `page.tsx` lines 165–196; add glyphs to the `step` objects; reuse the `signal-travel` keyframe already defined in `tailwind.config.ts` lines 61–66. |
| **P2** | Problem cards | Three generic numbered cards. The content is about *fragmented local state*, yet the visual shows three identical, tidy, independent cards — the exact opposite of the problem. | A small **"three diverging ledgers" SVG** above the cards: three columns that start from one permission token, then show `ACTIVE / ACTIVE / UNKNOWN` after a revoke because no shared proof exists. One token, three inconsistent outcomes — the problem in one picture. | Gives the section a reason to exist visually and sets up the "one source of truth" resolution. | `page.tsx` lines 141–155; inline SVG using existing flare/amber/fog tokens. |
| **P2** | Hero headline / `RevealText` | "Enforce everywhere." uses the same cyan→violet gradient as the overline rule, the button rail, the beams, the scroll-progress rail and the hash quote — the gradient has lost its referent. `RevealText` types 350 characters at 2 chars/12 ms (~2.1 s) on every visit, delaying comprehension of the core sentence. | Make the headline gradient **static and unique** (ink → flare only) and reserve violet for the Reactive node; fade the paragraph in as two clauses instead of typing it character by character. | Faster time-to-meaning; colour becomes a map of the three chains rather than texture. | `globals.css` `.gradient-text`; `effects.tsx` `RevealText` (lines 232–254) → short staggered phrases, or remove and rely on `ScrollReveal`. |
| **P2** | FAQ / footer | FAQ has ~90 px of dead space before the CTA band; the footer repeats "Revoke once. Enforce everywhere." a second time. | Put a **compact route legend** (three node glyphs + gate) in the FAQ's dead space as a "where does this apply?" summary, and drop the duplicated tagline from the footer, keeping only the testnet disclaimer. | Removes repetition; gives the last text-heavy section a visual resting point. | `page.tsx` lines 319–363. |

## Anti-patterns to avoid

- **More glassy numbered cards with a checkmark.** The page already has 11 of them; adding another
  "illustrative bento card" makes the page look AI-generated rather than authored.
- **Applying the same cyan→violet gradient to every accent.** It currently appears on the headline,
  the overline rule, the scroll rail, the beams, the CTA border and the hash quote. A gradient used
  six ways is wallpaper, not identity.
- **Nested tilt / parallax / glow bloom / animated conic borders.** `MASTER.md` §9 explicitly rejects
  cyberpunk glitch, neon bloom and scanlines; the current hero already drifts toward it.
- **Auto-advancing carousels**, and any animation that moves content while a user is reading it.
- **Colour-only state.** A red/amber box with no line pattern, icon or label fails MASTER.md §0 and
  fails greyscale printing. Use the four-channel (hue + icon + label + line pattern) rule.
- **Unicode glyphs as icons** (`▶`, `◐`, `⊘`, `○`) in `STATUS_META` if they migrate to the landing
  page — §0 requires consistent 24×24 stroke SVGs. Keep the brand gate as *enforcement*, never
  recolour it to amber/vermilion (§6).
- **An "Illustration" badge as an excuse for a decorative diagram.** If the illustration does not
  carry a claim (hash binding, direction, epoch, gate), cut it.

## Reduced-motion and accessibility checks

Verified at 1440 with `prefers-reduced-motion: reduce` emulated and the page reloaded:

- `matchMedia('(prefers-reduced-motion: reduce)').matches === true`.
- `RevealText` renders the full string immediately; **0** reveal wrappers remain at `opacity: 0`.
- `video.sc-motion` → `display: none`; `.sc-propagation-pulse` → `display: none`;
  `.scene-core` computed transform is the identity matrix; global `scroll-behavior` is `auto`.
- `Carousel` skips its auto-advance interval; `go()` uses `behavior: "auto"`.

Remaining gaps to fix:

1. Pointer handlers are still live under reduced motion — `SpotlightCard`, `TiltCard` and
   `RouteScene3D` continue writing CSS variables on `pointermove`. `TiltCard`'s effect is suppressed
   by `transform: none !important`, but the spotlight opacity transition still animates. Add an
   early return in all three handlers when `matchMedia(...).matches`.
2. The reduced-motion hero scene loses the propagation pulse but gains no labelled static end state;
   MASTER.md §5 asks for a "static solid line plus ACTIVE label". Add a static `HASH BOUND · EPOCH n`
   caption in that mode.
3. `RouteScene3D`'s root is a plain `<div>` with `aria-label` but no `role` — screen readers may
   ignore it. Use `role="img"` plus a visually hidden description, or a `<figure>`/`<figcaption>`.
4. `Carousel` declares `aria-roledescription="carousel"` without `role="region"` / `aria-label`.
   Dot buttons expose `aria-current` but no text label beyond `aria-label`; index changes are not
   announced — add a polite live region, and remove auto-advance (see P0).
5. Arrow buttons are ~36×34 px, below the 44 px target in MASTER.md §7.3. Increase to 44×44.
6. Scene node sub-labels and the scene footer are **12 px**, below the 13 px body floor in
   MASTER.md §1.3; at 390 they wrap and overlap. Bump to 13 px or move to a caption outside the
   scene.
7. Status labels in `STATUS_META` are text-rich, which is good, but the landing page does not
   display them at all — the capability language introduced on the landing page should match the
   console's `ACTIVE / PENDING / REVOKED / UNKNOWN` labels rather than inventing new ones.
8. Focus ring (`:focus-visible { outline: 2px solid var(--flare); outline-offset: 3px }`) is present
   globally; keep it when changing button styles in the P0/P1 work.
