# Self-hosted typefaces

The storefront serves WOFF2 files from `apps/storefront/public/fonts`. The source files and their SIL Open Font License 1.1 texts live here. Keep each `*-OFL.txt` beside its source when redistributing.

| Face | Source (here) | Served file | Role | Preloaded |
|---|---|---|---|---|
| Archivo, variable `wght` 100–900, `wdth` 62–125 | `Archivo.ttf`, `Archivo-OFL.txt` (google/fonts `ofl/archivo`) | `archivo.woff2` (114.7 KB), `wdth` limited to 62–100 | `--font-interface`: interface text, and the condensed display style (`.lw-display`: `font-stretch: 62%`, weight 900) | yes |
| Instrument Serif Italic | `InstrumentSerif-Italic.ttf`, `Instrument-Serif-OFL.txt` (google/fonts `ofl/instrumentserif`) | `instrument-serif-italic.woff2` (26.3 KB) | `--font-voice`: the italic second line (`.lw-voice`) | yes |
| Instrument Serif Regular | `InstrumentSerif-Regular.ttf` | `instrument-serif-regular.woff2` (25.7 KB) | `--font-editorial`: journal and look titles | no |
| Noto Serif, variable `wght`, `wdth` | `NotoSerif.ttf`, `Noto-Serif-OFL.txt` | `noto-serif.woff2` | `--font-glyph-fallback`: only glyphs a primary face lacks | no |

**Subsetting** (fontTools 4.66, 6 November 2026): Archivo was first limited to `wdth=62:100` with `fontTools.varLib.instancer` (the design uses 62–100%). Every face was then subset with `fontTools.subset --layout-features='*' --flavor=woff2` to `U+0000-00FF, U+0100-024F, U+0300-036F, U+1E00-1EFF, U+2000-206F, U+20A6, U+2122, U+2190-2193, U+2212, U+FEFF`.

**Glyph coverage** (`packages/ui/scripts/check-font-glyphs.py`, run in CI): Archivo covers the Naira sign (U+20A6) and the Yoruba letters with tone marks and dot below. Instrument Serif lacks ₦, ẹ ọ ṣ Ẹ Ọ Ṣ and combining U+0323; those fall back to Noto Serif through the `--font-glyph-fallback` stack. The script fails if Noto Serif stops covering any glyph a primary face lacks.

The fonts load through `next/font/local` in `apps/storefront/src/app/(site)/layout.tsx` with `font-display: swap` and metric-adjusted Arial / Times New Roman fallbacks, so the swap causes no layout shift. The two preloaded files total 141 KB (budget 160 KB, design brief §7). Bodoni Moda and DM Sans were removed in Phase 2.

**Performance (Phase 2, §7):** only Archivo and Instrument Serif Italic are preloaded. Their fallbacks are metric-adjusted, so CLS measured 0.000 on `/`, `/l/trybe`, `/shop` and the PDP (Lighthouse CI, ADR-015). Limiting Archivo to the weights in use (400–900) saves only 3 KB; dropping Latin Extended-A/B as well would reach 83 KB, but that drops glyphs, so it is not done. Re-check the preload total if a face or subset changes: `pnpm test:lhci` gates LCP, not font bytes.
