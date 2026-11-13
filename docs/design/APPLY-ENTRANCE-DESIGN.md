# APPLY THE "ENTRANCE" DESIGN — execution prompt for Claude

> **Issued:** 5 November 2026 by the owner (`techyabraham`).
> **What this is:** the precise instruction set for re-skinning and re-structuring the existing Lopaworld storefront to the approved "Entrance" design. It is **Phase 2** of `docs/CLAUDE-BUILD-BRIEF.md`. The owner has asked for it now, so it runs **after Phase 0 merges and before Phase 1**. Record that reordering as an ADR.
> **Design source:** `docs/design/entrance/*.dc.html`, exported unchanged from the owner's design canvas "LopaWorld Storefront":
> - `Main.dc.html` (desktop home)
> - `Label.dc.html` (Lopa Trybe label page)
> - `Product.dc.html` (PDP)
> - `Mobile.dc.html` (390 px home)

---

## 0. PRECONDITIONS — check these before writing any code

1. `phase/0-stabilise` has been **merged into `master`**. If it has not, stop and tell the owner. Phase 0 moved every page under `apps/storefront/src/app/(site)/` and changed the layouts, so working before the merge guarantees conflicts.
2. Run `git checkout master && git pull`. Create branch **`phase/2-entrance-design`** from it.
3. Read, in this order:
   - `CLAUDE.md`
   - `AGENTS.md`
   - `docs/CLAUDE-BUILD-BRIEF.md` (especially §1 rules, §4 Phase 2, §7 quality bars, §8 gates)
   - `docs/AUDIT-2026-11.md`
   - `docs/OPEN_ITEMS.md`
   - `docs/DECISIONS.md`
   - this file
   - all four `docs/design/entrance/*.dc.html`
   - for Next.js behaviour, `apps/storefront/node_modules/next/dist/docs/`
4. Run the baseline and record it in `docs/evidence/phase-2.md` **before** changing anything:
   - `pnpm install --frozen-lockfile`
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`
   - `pnpm tokens:check`
   - `pnpm build`
   - `pnpm test:e2e`
   Take **"before" screenshots** of `/`, `/l/trybe`, `/shop`, one `/p/<handle>`, `/bag` and `/checkout`. Use Playwright at 390 and 1440 px, `deviceScaleFactor: 1`, and save them to `docs/evidence/phase-2/before/`.

---

## 1. HOW TO READ THE `.dc.html` REFERENCE FILES

They are design-canvas components, not production code. Treat them as a **visual and interaction spec**:

| In the file | Means |
|---|---|
| Inline `style="…"` | The exact visual spec: spacing, sizes, colours, type. Translate it into tokens and classes. Never copy inline styles into React. |
| `<sc-for list=…>` / `<sc-if value=…>` | Repeat / conditional rendering. |
| `{{hole}}` and `renderVals()` | **Sample data and demo state only.** Product names, sizes, stock numbers, colours and label one-liners in `renderVals()` are illustrative, **not business facts**. |
| `[BRACKETED TEXT]` | A placeholder for an owner fact. It must come from Medusa or Payload, or the element is hidden. |
| `onClick` handlers that `setState` | The intended interaction, to be implemented with real state or data. |
| Google Fonts `<link>` | Do **not** use it. Self-host (see §3). |
| `a:hover{color:#D93A1E}` | **Do not copy.** `#D93A1E` fails AA for text on paper (4.25:1). Use `--signal-text` `#B8301A` (5.59:1). |

### Never ship these from the canvas (unless real data supports them)

- Sample products, prices, stock and size runs, "3 colours", "See all 48".
- "Ships in 48h", "Arrives today if you order by…", "Lagos same-day", "free delivery…", "Pay by card, bank transfer or USSD". These are blocked by **D4** (delivery) and Paystack channel confirmation.
- "≈ $ · £ — duties shown at checkout" and the NGN/USD/GBP switcher (blocked by **D9**).
- The **fit-match** statistical sentence ("Customers your height usually take…"). Never show it. The data-backed version is Phase 3.6.
- "Ask a tailor on WhatsApp", WhatsApp links and numbers (blocked by **D5**).
- Campaign lines "Look important. / Be important." and the label one-liners ("Tradition, in motion.", etc.) (blocked by **D2**). Render them **only from Payload** (`campaignHero.headline` / `supportingCopy`, `campaigns.campaignLine`, `labels.introSummary`). If they are empty, render the label name alone.
- The Made-to-measure tab/panel, Fit Profile, "Book a fitting" and the aso-ebi "Dress the whole party" section. These features do not exist until Phases 3 and 4. Build the presentational components and show them **only in `/dev/ui`**, behind feature flags that default off (`NEXT_PUBLIC_FEATURE_MTM`, `NEXT_PUBLIC_FEATURE_GROUP_ORDERS`), read through the storefront's env module.
- "Season [AW26]", "Week 45", "● Live now", "Only N left" — unless computed from data (§5.4).

**Rule:** if a module has no real data, it does not render. No placeholder sentences reach customers. A static "coming soon" message is not allowed either.

---

## 2. DESIGN TOKENS — rewrite `packages/ui/tokens/tokens.css`

Keep every **existing variable name** that components already consume, so nothing breaks, and point them at the new values. Then add the new names.

```css
:root {
  color-scheme: light;
  /* new canonical names */
  --ink: #0F0E0D;          /* text, dark panels, primary buttons (17.8:1 on paper) */
  --paper: #F7F6F3;        /* page ground */
  --rule: #DAD6D0;         /* hairlines */
  --muted: #5E5A55;        /* secondary text (6.33:1 on paper) */
  --muted-on-ink: #C9C4BD; /* secondary text on ink (11.1:1) */
  --quiet-on-ink: #9A948C; /* tertiary text on ink (6.42:1) */
  --surface-2: #ECEAE5;    /* info strips */
  --signal: #D93A1E;       /* FILLS ONLY behind white text (4.59:1), or ≥24px type */
  --signal-text: #B8301A;  /* any red text at body size (5.59:1 on paper) */
  --success-fill: #E3ECE4;

  /* existing names, re-pointed — keep them */
  --color-canvas: var(--paper);
  --color-surface: #FFFFFF;
  --color-ink: var(--ink);
  --color-ink-muted: var(--muted);
  --color-line: var(--rule);
  --color-danger: var(--signal-text);
  --color-success: #245C3A;

  --radius-sm: 0; --radius-md: 0; --radius-lg: 0; /* square everywhere */
  --radius-pill: 999px;                           /* story rings / avatars only */
  --shadow-card: none; --shadow-sheet: 0 0 0 1px var(--rule);

  --type-display: clamp(4.5rem, 11vw, 11rem);   /* 72–176px, condensed 900 */
  --type-h1: clamp(3.5rem, 6vw, 5.5rem);
  --type-h2: clamp(2.25rem, 4vw, 4rem);         /* 36–64px */
  --type-h3: 1.875rem;                          /* 30px */
  --type-body: 1rem; --type-small: 0.8125rem; --type-label: 0.6875rem;
  --tracking-label: 0.16em; --tracking-eyebrow: 0.2em;
  --leading-display: 0.86;

  --container: 90rem; /* 1440 */
  --gutter: clamp(1rem, 2.8vw, 2.5rem); /* 16px phone, 40px desktop */
  /* keep the existing --space-* and --motion-* scales */
  --motion-hero: 600ms;
}
```

**Label tones replace label accents.**
- Replace the seven `[data-label="…"] { --accent; --accent-contrast }` rules. Each label now sets `--label-tone` (hero/section ground), `--label-photo` (placeholder or skeleton ground) and `--label-fg`, using the canvas values (`next #2E151B/#4A2530`, `trybe #18241C/#2B3A2F`, `prime #11151E/#222A3A`, `men #2A1F1A/#46342B`, `fashion #231A27/#3A2C40`, `bridal #E8E3DB/#D3CBBF` with dark fg, `lopaworld` = ink).
- Mark them `TODO_CONFIRM:` (D2) in a comment and in `OPEN_ITEMS.md`.
- Keep `--accent` defined as an alias of `--ink`, so the remaining consumers don't break. **No UI control may use a label tone.**
- **Update `packages/ui/scripts/check-contrast.mjs`** to the new model:
  - seven themes still parse
  - `--label-fg` on `--label-tone` must be ≥ 4.5:1
  - check the fixed pairs: ink/paper, muted/paper, signal-text/paper, white/signal, muted-on-ink/ink, quiet-on-ink/ink
  `pnpm tokens:check` must pass.

**Tailwind aliases.** In `apps/storefront/src/app/(site)/globals.css` `@theme inline`, add `--color-ink`, `--color-paper`, `--color-rule`, `--color-signal`, `--color-signal-text` and `--font-display` (Archivo condensed), and keep the existing aliases working.

---

## 3. TYPE — replace Bodoni Moda / DM Sans

1. Add **Archivo** (variable: `wdth` 62–125, `wght` 100–900) and **Instrument Serif** (regular and italic). Get the OFL sources from Google Fonts' GitHub releases (allowed: npm and GitHub), or from the `@fontsource-variable/archivo` / `@fontsource/instrument-serif` npm packages.
   - Put the source TTFs plus `OFL.txt` in `packages/ui/fonts/`.
   - Put the subsetted woff2 files in `apps/storefront/public/fonts/`.
   - Update `packages/ui/fonts/README.md`.
2. Extend `packages/ui/scripts/check-font-glyphs.py` to the new faces, covering the **Naira sign ₦** and Yoruba with tone marks (ẹ ọ ṣ Ẹ Ọ Ṣ, plus á à é è í ì ó ò ú ù ń and combining U+0300/U+0301/U+0323). Wherever a glyph is missing, keep **Noto Serif** as the fallback through the existing `--font-glyph-fallback` stack. Do not drop the fallback.
3. In `apps/storefront/src/app/(site)/layout.tsx`, swap the `localFont` entries:
   - `--font-interface` → Archivo variable (`weight: '100 900'`, `display: 'swap'`, `adjustFontFallback: 'Arial'`, preload).
   - `--font-editorial` → Instrument Serif (preload only the italic).
   - Keep `--font-glyph-fallback`.
   - Delete the Bodoni and DM Sans files and licences only after nothing references them (grep).
4. The display style is `font-family: var(--font-interface); font-stretch: 62%; font-weight: 900; text-transform: uppercase; line-height: var(--leading-display)`. Make it a utility/class (`.lw-display`), plus `.lw-voice` for the Instrument Serif italic second line. Eyebrows: 11–12 px, uppercase, `--tracking-eyebrow`.
5. The Payload admin has its own root layout (Phase 0). **Do not restyle `/admin`.**

---

## 4. COMPONENT STYLES — `packages/ui/styles/components.css` and `packages/ui/src/index.tsx`

Restyle the existing exports; do not fork them. Keep their props and APIs stable. Add new props only where noted.

| Export | Entrance spec |
|---|---|
| `Button` | primary = ink fill, paper text, 0 radius, min-height 48 (56 for buy CTAs), 13–15 px uppercase 700 with 0.06–0.08em tracking. secondary = 1 px ink border, transparent. quiet = underlined text. Focus: 2 px ink outline with 2 px offset (visible on every ground; on ink grounds use paper). |
| `IconButton` | 44×44, stroke icons at 1.6, `aria-label` required (already is). |
| `Chip` / `FilterChip` | 1 px ink border, min-height 44 (36 for removable chips, with a 32×32 × button). Selected = ink fill. |
| `Badge` | paper fill on imagery, 11 px 600, 4×8 padding. `variant="signal"` = signal fill with white text. |
| `SizeSelector` | 6-column grid, 48 px cells. Selected = ink fill. Unavailable = rule border, `#8C877F` text, line-through, `disabled`, and `aria-label` "Size 42, sold out". Add an optional `lowStock` map so the aria-label says ", 1 left". |
| `ColourSwatch` | 44×44, 3 px inset, 2 px ink ring when selected, `aria-pressed`. If an option value has no hex (`variant.metadata.swatch_hex` absent), render a text pill instead of inventing a colour. |
| `Accordion` | keep the `<details>` semantics; hairline borders, 700 summary, chevron. |
| `Sheet` / `Modal` | full-height right sheet ≥ 768 px, bottom sheet on phones, hairline instead of shadow. Keep focus trap, Escape and focus return; add tests if missing. |
| `Tabs` | roving tabindex, arrow keys, `aria-selected`; used by the hero label index and the PDP mode switch. |
| `Price` | `Intl.NumberFormat('en-NG', { style:'currency', currency:'NGN', maximumFractionDigits:0 })`, 600 weight. No conversions. |
| `Gallery` | see §5.5. |
| `Skeleton` | uses `--label-photo` when inside a `[data-label]`, otherwise `--surface-2`. |

Remove all card shadows and rounded corners repo-wide (grep for `border-radius` and `box-shadow` in storefront CSS).

---

## 5. PAGE-BY-PAGE MAPPING (existing files → canvas)

All paths are under `apps/storefront/src/`. Keep the data flow; change the presentation. Reuse existing CMS blocks and fields. **No Payload schema change in this phase.** If one becomes essential, stop, write it up in `DECISIONS.md` and ask, because it needs a reviewed migration under `src/migrations`.

### 5.1 Global shell — `components/site/SiteHeader.tsx`, `SiteFooter.tsx`, `app/(site)/(store)/layout.tsx`

- **Utility strip** (canvas `Main` top bar): render **only** the `announcement-bar` global message (as today, with its start/end window), restyled as a black 12 px uppercase strip. No hard-coded delivery or currency text, and no currency switcher (D9).
- **Header (≥ 1024 px):**
  - the LOPA / WORLD wordmark as text (the condensed 900 "LOPA" plus 0.42em-tracked "WORLD")
  - nav: **New in** (`/new-in`), **Labels** (`/labels`), **Occasions** (only if the homepage `occasionLinks` block has links; otherwise omit), **Journal** (`/stories`), **Shop** (`/shop`)
  - **Made to measure** and **Aso-ebi orders** only when their feature flags are on
  - right side: search IconButton → `/search`, account IconButton only once accounts exist (Phase 3; omit now), and an ink **Bag** button with a signal-fill count from the existing `CartLauncher` state
  - sticky on scroll, with a hairline bottom border
- **Mobile (< 1024 px):**
  - menu IconButton (the existing `Sheet` menu, restyled with a large condensed label list)
  - centred wordmark and search
  - **new `components/site/MobileTabBar.tsx`**: fixed bottom, five items (Home, Labels, **Saved** → `/wishlist`, **Search** → `/search` — this replaces the canvas "Stylist", which needs D5 — and **Bag · n**)
  - respect `env(safe-area-inset-bottom)`; 48 px targets; `aria-current` on the active item
  - hide the bar while an input is focused (reuse the pattern from `ProductPurchasePanel`'s `inputFocused`)
  - add bottom padding to `.store-content` so nothing hides behind it
- **Footer:**
  - an ink ground and a huge "LOPA" wordmark (clamp 72–120 px) with "WORLD" beneath
  - columns: Labels (from `LABELS` in `@lopaworld/types`, excluding the house slug pending D11), Service (`/track-order`, plus the published Payload `pages` already passed in as `pages`), and Talk to us (**only** contacts confirmed in Payload; omit the column if there are none)
  - newsletter form only when D8 is done (omit now)
  - bottom row: © the organisation name from `seo-defaults.organizationName`, plus links to the privacy/terms pages if published

### 5.2 Home — `components/storefront/HomePage.tsx`

Keep `findHomepageLayoutSafely()` and the block switch. Map each existing block type to an Entrance section:

| Payload block | Entrance section (canvas `Main`) | Data rules |
|---|---|---|
| `campaignHero` | **Entrance Hero**, a new client island `components/storefront/EntranceHero.tsx` | Server-render the first state (LCP-safe). Headline = `headline` (two lines if it contains a full stop, the second in `.lw-voice`). `supportingCopy` beneath. Image = `image` (rights-confirmed media) with `priority`; fall back to the linked `campaign.heroMedia`. CTA = `ctaLabel` / `ctaUrl` via `safeHref`. |
| `labelEntrances` | **Label index**, docked to the bottom of the hero (desktop) or a **story-ring rail** above the hero (mobile) | Uses the block's `labels` relationship (already validated to all seven). Selecting a label (Tabs, roving tabindex) changes the hero's `data-label` (tone), name, `introSummary` and `heroMedia` without navigation. The CTA becomes "Enter <Label name>" → `/l/<slug>`. Animate the background colour over 600 ms, with no animation under `prefers-reduced-motion`. If the hero block is absent, render the index as a standalone section with label tiles. |
| `newArrivals` / `featuredCollection` | **The Drop**: heading, label filter chips, product grid | The heading comes from the block. **No "Live now"/week number** unless the block heading says so. Chips: "All" plus each label present in the fetched products (computed, not hard-coded). Chip filtering is client-side over ≤ 12 fetched products, which is acceptable here; listings are Phase 1. "View all" → `/new-in` or `/shop?collection=<handle>`. |
| `occasionLinks` | **"Where are you walking in?"** tiles | Heading = block `heading` (split into two lines if it ends with "?"). One 3:4 tile per link, with its tone cycling through the label tones. Show only `label` and `url`; no "from" line or description (no data). Mobile: a horizontal scroll rail with 150×200 tiles. |
| `storyFeature` | **Journal** card | The story title in Instrument Serif at 30 px, an eyebrow from the story's label/category if present, and the image if the story has rights-confirmed media. |
| `newsletter` | Omitted until D8 | Return `null`, replacing today's internal-status text. |

- The **fallback** with no CMS blocks (`blocks.length === 0`): render the hero with the house name and the label index from `LABELS` plus published `labels` records, plus The Drop from `listStoreProductsSafely({ limit: 12, order: '-created_at' })`. Do not render the hard-coded "One house. Seven labels." / crochet copy. Phase 0 already removed internal-status copy; keep it removed.
- `InstagramEditorialProducts`: the manifest says production rights are unverified. **Do not render it on the home page in production builds.** Keep it in `/dev/ui` as a visual reference. Record this in `OPEN_ITEMS.md`.
- The MTM and aso-ebi home sections (canvas "Measured once." and "Dress the whole party.") go **only in `/dev/ui`**, behind flags, with their copy marked `TODO_CONFIRM:`.

### 5.3 Label page — `components/storefront/LabelLandingPage.tsx` (+ `app/(site)/(store)/l/[label]/…`)

- **Hero:**
  - `data-label` sets the tone
  - eyebrow "0N · A Lopaworld label" (N = position in `LABELS`; the house slug shows "The house")
  - the name in `.lw-display` at `clamp(80px,12vw,200px)`, split across two lines ("Lopa" / "Trybe")
  - `introSummary` as the `.lw-voice` line only if present
  - `intro` rich text beneath (muted-on-ink)
  - right: a 2-column mosaic from the label `heroMedia` plus the images of up to two featured products from `featuredCollectionHandle`; omit tiles without media
- **Category rail:** horizontal, scrollable, with an "All" tab plus Medusa categories present in this label's products, with counts. Links go to `/l/[label]/[category]` (that route exists). Mark the active one with `aria-current`.
- **Toolbar:**
  - the existing `FilterSheet` trigger restyled as an ink button ("Filter · n" where n = active filter count)
  - active `FilterChip`s, which already link to remove the filter (keep that)
  - "Clear all"
  - a count, from the real filtered count
  - the sort `<select>` with the existing options: Newest, Price low–high, Price high–low, Name. **Do not add "Ready soonest"**; there is no data for it.
- **Grid ⇄ Lookbook toggle:**
  - show Lookbook **only** if at least one published Payload **`campaigns`** record with `status: active` relates to this label (existing `labels` relationship) and has `heroMedia`
  - a look = campaign image (16:10) + `title` in Instrument Serif at 44 px + `campaignLine` + `body`, with CTA from `ctaLabel` / `ctaUrl`
  - there is **no shoppable-pieces list or "Add the full look"** until campaigns can reference products; propose a `products` (Medusa handle array) field in `DECISIONS.md` as a follow-up and do not add it now
  - remember the toggle state in the URL (`?view=lookbook`), not localStorage
- The footer line "Lopa Trybe is a Lopaworld label." plus the label's `instagramUrl` if present.

### 5.4 Listings and tiles — `CatalogListing.tsx`, `CatalogPage.tsx`, `FilterSheet.tsx`, `ProductGrid.tsx`

- **Restyle only. Do not change filtering, pagination or sorting logic**; Phase 1.4 replaces it with Meilisearch.
- Grid: `repeat(auto-fill, minmax(260px, 1fr))` at desktop with 36 px row and 16 px column gaps; 2 columns at < 640 px with 20/8 gaps.
- **`ProductTile`:**
  - 3:4 media
  - a second image (`images[1]`) cross-fades on hover/focus-visible, desktop only, under `@media (hover: hover)`
  - the label eyebrow (11 px, 0.16em, muted)
  - title 15–16 px 600
  - price on the right
  - swatch row (≤ 4 swatches plus "+n") only when a colour option has `swatch_hex` metadata; otherwise "n colours" in text if there is more than one value
  - keep the existing raw `<img>` with `loading="lazy"` and add `decoding="async"`; switching to `next/image` is Phase 1.3 (needs `remotePatterns`). Add a TODO referencing 1.3.
- **Badges — computed only, at most one, in this priority:**
  1. **Sold out** (all variants unavailable; existing logic)
  2. **Only N left** when it is not made-to-order, manages inventory, and the total available is 1–3. Use `variant="signal"`.
  3. **Made to order** (`metadata.made_to_order === true`)
  4. **New** when `created_at` is within 14 days. Add `created_at` to `productFields` in `lib/store.ts` if it is not already returned.
  Put this in `lib/product-badges.ts` with Vitest unit tests. **Never** show "Lagos same-day".
- `FilterSheet` becomes a bottom sheet on phones and a right sheet on desktop. Selects become chip groups for label, size and colour (keep the GET form, so it works without JS). The "Show N pieces" ink button is sticky at the sheet bottom.

### 5.5 PDP — `ProductPage.tsx`, `ProductPurchasePanel.tsx`

- **Layout:**
  - gallery `flex: 999 1 560px`; buy panel `flex: 1 1 400px; max-width: 520px`, sticky at `top: header height` on desktop
  - breadcrumb "Home / <Label> / <Category or Shop>" using the existing `Breadcrumb` export (keep the JSON-LD; update it to include the label)
- **Gallery (`Gallery` in `@lopaworld/ui`):**
  - first image full width at 4:5, the rest in a 2-column grid at 3:4
  - mobile: a horizontal snap carousel with dots and `aria-roledescription="carousel"`
  - tap to open a full-screen zoom `Modal`
  - a video only if product metadata has `video_url` (it does not today; leave the hook and render nothing)
- **Buy panel order:**
  1. Label eyebrow link (`/l/<slug>`).
  2. Title in `.lw-display` at 56 px.
  3. `product.subtitle` in `.lw-voice` at 24 px, if present. Add `subtitle` to `productFields`.
  4. Price (selected variant), with `aria-live="polite"`. No conversions.
  5. **Mode tabs: hidden.** Render RTW/MTM tabs only when the product has a `Fit` option with a "Made to measure" value **and** `NEXT_PUBLIC_FEATURE_MTM` is on (Phase 3).
  6. Colour, via `ColourSwatch` or text pills per §4, with the legend "Colour — <value>".
  7. Size, via `SizeSelector` with `lowStock`. Show the "Size guide (cm / in)" link only when `sizeGuide` exists (existing `SizeGuideSheet`, restyled as a full table with sticky first column).
  8. Made-to-order note plus the existing notes `textarea` when `made_to_order` is set (existing behaviour).
  9. Quantity: keep `QuantityStepper`, compact.
  10. **Add to bag**: 56 px ink button whose text reflects state ("Add to bag — size 44" / "Choose a size" / "Sold out" / "Adding…"). The success `role="status"` strip uses `--success-fill` with "View bag".
  11. Below it, a 2-column row: `WishlistButton` restyled as "Save for later"; the second cell (WhatsApp) only after D5. Until then the Save button spans both columns.
  12. Delivery estimator: **hidden** (D4). Payment-channel line: **hidden** until channels are confirmed.
  13. Accordions: Details (description), Fit, Fabric, Care, Delivery (`delivery_note`), each **only if present**. **Remove the "Returns" accordion's placeholder text**: show Returns only when a published Payload page with slug `returns` exists, linking to it.
  14. Remove the "WhatsApp support details will be available…" paragraph entirely.
- **Sticky mobile add-to-bag:** keep the existing IntersectionObserver bar, restyled (ink, price on the left, button on the right, safe-area padding), and hidden while the keyboard is open (existing `inputFocused`).
- **Complete the Entrance** (canvas, bottom): render only when `product.metadata.complete_the_look` is an array of Medusa handles. That is product metadata, not a schema change, and it must be validated: fetch those products and show the label-tone section with "Add all" only if every piece is available. "Add all" posts each to `/api/cart/items` in sequence, reports partial failures, and updates the bag count. Add `complete_the_look?: string[]` to `ProductEditorialMetadata` in `@lopaworld/types`.
- **Related pieces:** keep, restyled as tiles.

### 5.6 Bag, checkout, confirmation, track order, wishlist, search, stories, pages

Apply the tokens, type, buttons and form styles consistently. **Do not restructure the checkout flow or touch its API routes** (Phase 0 fixed them; payment correctness outranks looks).
- Forms: 48 px inputs with a hairline border and an ink 2 px focus border, labels above, errors in `--signal-text` with `aria-describedby`.
- The order summary is a hairline table.
- Empty states use `EmptyState` with the display type.
- Stories index and detail: Instrument Serif titles, a readable 68-character measure, rights-confirmed images only.

### 5.7 Dev gallery — `app/(site)/dev/ui` and `dev/type`

Show every component in every state:
- Hero with three labels; Drop; occasion tiles; tile badge permutations; size selector with sold-out and low-stock; swatches with and without hex; sheet; mobile tab bar
- the flagged **MTM panel** and **group-order section** with `TODO_CONFIRM` copy
- the type specimen with Yoruba diacritics and ₦

They must still return 404 in production (existing behaviour; keep the test).

---

## 6. MOTION, DATA SAVER, ACCESSIBILITY

- Motion: only the hero tone (600 ms), the tile image cross-fade (220 ms) and sheet slide (220 ms). Everything is set to 0 under `prefers-reduced-motion` (the token scale already does this; make sure new code uses the tokens).
- Data Saver: if `navigator.connection?.saveData` is true or `effectiveType` matches `/2g|3g/`, do not swap hero media on label change (keep colour and text) and skip second-image hover preloads. Read the `Save-Data` request header server-side where it is available.
- WCAG 2.2 AA:
  - all interactive elements are real `<button>` / `<a href>`
  - 44 px minimum targets (48 for primary)
  - visible focus on every ground
  - hero tabs announce the selected label
  - the bag count change is announced via `aria-live`
  - heading order h1 → h2 per page
  - no information by colour alone

---

## 7. PERFORMANCE BUDGETS (block the merge if missed)

Measure against the production build (`pnpm build && pnpm start` with the booted local stack from Phase 0), mobile emulation (Moto G Power, slow 4G):
- JS first-load ≤ **150 KB gzip** on `/`, `/l/[label]`, `/shop` and `/p/[handle]` (read from the build output).
- `EntranceHero` and `MobileTabBar` are the only new client islands on home. Keep label data serialised small: name, slug, introSummary and image URL only.
- Lighthouse performance ≥ **90**, LCP ≤ 2.0 s, CLS ≤ 0.05, TBT ≤ 200 ms on those four pages, with ≥ 12 local test products. If Lighthouse CI is not yet in CI, add it as `pnpm test:lhci` in this phase.
- Fonts: at most 2 preloaded woff2 files (Archivo variable and Instrument Serif italic), each subset, total ≤ 160 KB. Size-adjusted fallbacks mean no CLS from the font swap.

---

## 8. TESTS AND EVIDENCE

- **Unit (Vitest):** `product-badges`, swatch fallback logic, hero label-state reducer, "Add all" partial-failure handling.
- **Playwright** (`e2e/`, mobile and desktop projects):
  - the home hero label switch changes `data-label` and the CTA href; works with the keyboard (arrows + Enter)
  - the tab bar navigates and is hidden while typing in search
  - label page category rail and Lookbook toggle (when campaign fixture data exists)
  - PDP: size selection updates the CTA text; a sold-out size is disabled; add to bag updates the count
  - checkout still completes the existing happy path (regression)
  - axe: zero serious/critical violations on all of the above
- **Screenshots ("after")** at 360, 390, 768, 1280 and 1440 px for home, label, shop, PDP, bag and checkout, saved to `docs/evidence/phase-2/after/`. Also take a side-by-side of the canvas reference vs the implementation for home, label and PDP at 1440 and 390. To render a reference, open the `.dc.html` structure as a spec; a pixel match is not required, but proportions, type scale and hierarchy must match.
- Commands to record in `docs/evidence/phase-2.md`: `typecheck`, `lint`, `test`, `tokens:check`, the glyph check, `build`, `test:e2e`, Lighthouse.

---

## 9. DOCS TO UPDATE IN THE SAME PR

- `docs/DECISIONS.md`:
  - **ADR "Entrance design system"**: tokens, fonts, the label-tone model, the single-accent rule, the `#D93A1E` vs `#B8301A` contrast split
  - **ADR "Phase 2 before Phase 1"**: the owner's request, and the constraint that listings logic and images are untouched until Phase 1
  - the proposed follow-ups: a `campaigns.products` field and an `occasions` collection
- `docs/OPEN_ITEMS.md`: label tones (D2), campaign lines and label one-liners (D2), font licensing confirmation, Instagram media removed from production home pending rights, the MTM / group / WhatsApp / delivery / currency modules hidden pending D4/D5/D9 and Phases 3–4.
- `docs/ENGINEERING-HANDOFF.md`: replace the design-system section (fonts, tokens, components, new files), and add `MobileTabBar`, `EntranceHero` and `product-badges`.
- `packages/ui/fonts/README.md`.

---

## 10. STOP CONDITIONS — stop and ask

- Phase 0 is not merged, or `master` fails its baseline checks.
- Any change would need a Payload schema migration or a Medusa module change.
- A budget in §7 cannot be met without dropping a signature element. Present the trade-off.
- Archivo or Instrument Serif licensing or glyph coverage blocks use. Propose an alternative pair with the same character (e.g. Anton/Oswald-class condensed + a high-contrast italic serif), and do not swap silently.
- Anything would require inventing a business fact.

## 11. DELIVERABLE

One PR, `phase/2-entrance-design` → `master`, titled `feat(design): apply the Entrance design system (Phase 2)`, with:
- the §10 report from `CLAUDE-BUILD-BRIEF.md`
- before/after screenshots inline
- Lighthouse numbers
- the list of modules hidden pending gates

Do **not** merge it yourself; the owner reviews it on a staging or preview build.
