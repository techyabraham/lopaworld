# Self-hosted typefaces

The storefront serves WOFF2 files from `apps/storefront/public/fonts` and keeps the source OFL files here.

- Bodoni Moda: variable `opsz` and `wght` axes, subset to Basic Latin, Latin Extended, Latin Extended Additional, combining diacritics, and U+20A6 (Naira). The upstream Bodoni Moda file lacks some Yoruba/Igbo letters and the Naira sign.
- DM Sans: variable `opsz` and `wght` axes, subset to the same supported character ranges. The selected upstream DM Sans file lacks some Yoruba/Igbo letters and the Naira sign.
- Noto Serif: variable `wght` and `wdth` axes, loaded as a fallback only for glyphs unavailable in the selected display or interface face. It covers the specimen's required letters and Naira sign.

The two font files are loaded through `next/font/local`, use `font-display: swap`, and calculate metric-compatible Arial/Times New Roman fallbacks. Only the two primary font files are preloaded. Keep the SIL Open Font License files alongside the source assets when redistributing.
